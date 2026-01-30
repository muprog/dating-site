import express = require('express')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
import type { Request, Response } from 'express'
import passport = require('passport')
import User from '../models/User'
const auth = require('../middleware/auth')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

router.post('/logout', auth, async (req, res) => {
  try {
    const allKnownCookies = [
      'token',
      'connect.sid',
      'rl_page_init_referrer',
      'rl_page_init_referring_domain',
      'rl_anonymous_id',
      'rl_user_id',
      'rl_trait',
      'rl_session',
      'ph_phc_4URIAm1uYfJO7j8kWSe0J8lc8IqnstRLS7Jx8NcakHo_posthog',
    ]
    allKnownCookies.forEach((cookieName) => {
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      })
    })
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err)
        }
      })
    }

    res.json({
      message: 'Logout successful',
      logout: true,
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    res.status(500).json({
      message: 'Logout failed',
      error: error.message,
    })
  }
})
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as any
    const token = jwt.sign(
      { id: user._id?.toString(), email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )
    res.redirect(`${process.env.FRONTEND_URL}/social-success?token=${token}`)
  }
)

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }))

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login',
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as any
    const token = jwt.sign(
      { id: user._id?.toString(), email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )
    res.redirect(`${process.env.FRONTEND_URL}/social-success?token=${token}`)
  }
)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      res.status(400).json({ message: 'User already exists' })
      return
    }

    const hashed = await bcrypt.hash(password, 10)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const newUser = new User({
      name,
      email,
      password: hashed,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      verified: false,
    })

    await newUser.save()
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Verify your account',
      text: `Your OTP code is ${otp}`,
    })
    res.status(201).json({ message: 'OTP sent to email' })
  } catch (err: any) {
    console.log('Register error', err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

router.post(
  '/verify-otp',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        res.status(400).json({ message: 'User not found' })
        return
      }

      if (
        user.otp !== otp ||
        !user.otpExpires ||
        user.otpExpires.getTime() < Date.now()
      ) {
        res.status(400).json({ message: 'Invalid or expired OTP' })
        return
      }
      user.verified = true
      user.otp = null
      user.otpExpires = null
      await user.save()
      res.json({ message: '✅ User verified successfully' })
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message })
    }
  }
)

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'Please log in with Google or Facebook',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    })

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    user.resetPasswordOTP = otp
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000) // valid for 10 mins
    await user.save()

    await transporter.sendMail({
      to: user.email,
      subject: 'Your Password Reset OTP',
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    })

    res.json({ message: 'OTP sent to your email' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }
    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed
    user.resetPasswordOTP = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: any,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, 'uploads/')
  },
  filename: (
    req: Request,
    file: any,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req: Request, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'))
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
})

const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB.',
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum is 10.',
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field.',
      })
    }
  }

  if (error) {
    return res.status(400).json({
      message: error.message,
    })
  }

  next()
}

router.get('/profile', auth, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user.id).select(
      '-password -otp -resetPasswordOTP'
    )
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/profile', auth, async (req: any, res: any) => {
  try {
    const { name, age, bio, interests, location, gender, latitude, longitude } =
      req.body
    console.log('🔄 Updating profile with data:', req.body)

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Name is required',
      })
    }

    const updateData: any = {
      name: name.trim(),
    }

    if (age) {
      const ageNum = parseInt(age)
      if (ageNum < 18 || ageNum > 100) {
        return res.status(400).json({
          message: 'Age must be between 18 and 100',
        })
      }
      updateData.age = ageNum
    }

    if (bio !== undefined) updateData.bio = bio.trim()
    if (interests) updateData.interests = interests
    if (gender) updateData.gender = gender

    if (location !== undefined) {
      updateData.location = location.trim()
      console.log('📍 Location to store:', location)
    }

    if (latitude !== undefined && longitude !== undefined) {
      console.log('🗺️ Updating coordinates:', { latitude, longitude })
      updateData.geoLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      }
    }

    console.log('📝 Final update data:', updateData)

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp -resetPasswordOTP')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    console.log('✅ Profile updated successfully')
    res.json(user)
  } catch (error: any) {
    console.error('❌ Profile update error:', error)

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        message: 'Validation error',
        errors,
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Email already exists',
      })
    }

    res.status(500).json({
      message: 'Server error',
      error: error.message,
    })
  }
})

router.post(
  '/profile/photos',
  auth,
  upload.array('photos', 10),
  handleMulterError,
  async (req: any, res: any) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
      }

      const photoUrls = req.files.map((file: any) => {
        return `${file.filename}`
      })

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $push: { photos: { $each: photoUrls } } },
        { new: true }
      ).select('-password -otp -resetPasswordOTP')
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      console.log('✅ Photos uploaded successfully')
      res.json({
        ...user.toObject(),
        message: `Successfully uploaded ${req.files.length} photo(s)`,
      })
    } catch (error: any) {
      console.error('❌ Photo upload error:', error)
      res.status(500).json({
        message: 'Server error',
        error: error.message,
      })
    }
  }
)

router.delete(
  '/profile/photos/:photoIndex',
  auth,
  async (req: any, res: any) => {
    try {
      const photoIndex = parseInt(req.params.photoIndex)

      console.log(
        '🗑️ Deleting photo at index:',
        photoIndex,
        'for user:',
        req.user.id
      )

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      if (!user.photos || !Array.isArray(user.photos)) {
        user.photos = []
        await user.save()
      }
      if (photoIndex < 0 || photoIndex >= user.photos.length) {
        return res.status(400).json({ message: 'Invalid photo index' })
      }

      user.photos.splice(photoIndex, 1)
      await user.save()

      console.log('✅ Photo deleted successfully')
      res.json({
        ...user.toObject(),
        message: 'Photo deleted successfully',
      })
    } catch (error) {
      console.error('❌ Photo delete error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  }
)
router.get('/test-cookies', (req: express.Request, res: express.Response) => {
  const cookies = req?.cookies
  const token = req.cookies?.token

  console.log('All cookies:', cookies)
  console.log('Token cookie:', token)

  res.json({
    success: true,
    message: 'Cookie test endpoint',
    cookies: cookies,
    token: token,
    hasToken: !!token,
  })
})

router.get('/check', auth, async (req: any, res) => {
  try {
    const user = await User.findById(req.user?.id).select(
      '-password -otp -resetPasswordOTP -__v'
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.lastActive = new Date()
    await user.save()

    res.json({
      user,
      authenticated: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Auth check error:', error)
    res.status(500).json({
      message: 'Auth check failed',
      error: error.message,
    })
  }
})

module.exports = router
