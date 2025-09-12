import multer from 'multer'
import bcrypt from 'bcryptjs'
import User, { IUser } from '../model/User'
import PendingUser from '../model/PendingUser'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import authMiddleware from '../middleWare/authMiddleware'
const express = require('express')
const router = express.Router()
const { test, registerUser } = require('../controllers/controller')
const upload = multer({ dest: 'uploads/' })
const cors = require('cors')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

router.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

// Create mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

router.get('/', test)

// Old immediate registration endpoint (kept for compatibility)
router.post(
  '/register',
  upload.single('profilePhoto'),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, age, gender, location } = req.body

      if (Number(age) < 0)
        return res.status(400).json({ message: 'Age cannot be below zero' })

      const existing = await User.findOne({ email })
      if (existing)
        return res.status(400).json({ message: 'Email already registered' })

      const hashed = await bcrypt.hash(password, 10)

      const user = new User({
        name,
        email,
        password: hashed,
        age: Number(age),
        gender,
        location,
        profilePhoto: req.file ? req.file.path : undefined,
      })

      await user.save()

      res.status(201).json({ user })
    } catch (err: any) {
      console.error(err)
      res.status(500).json({ message: err.message || 'Server error' })
    }
  }
)

// New: initiate registration -> generate OTP and send email
// router.post(
//   'api/auth/register/initiate',
//   upload.single('profilePhoto'),
//   async (req: Request, res: Response) => {
//     try {
//       const { name, email, password, age, gender, location } = req.body

//       if (Number(age) < 0)
//         return res.status(400).json({ message: 'Age cannot be below zero' })

//       const existing = await User.findOne({ email })
//       if (existing)
//         return res.status(400).json({ message: 'Email already registered' })

//       // Generate 6-digit OTP and expiry
//       const otp = Math.floor(100000 + Math.random() * 900000).toString()
//       const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

//       const hashed = await bcrypt.hash(password, 10)

//       // Upsert pending user for this email
//       const pending = await PendingUser.findOneAndUpdate(
//         { email },
//         {
//           name,
//           email,
//           password: hashed,
//           age: Number(age),
//           gender,
//           location,
//           profilePhoto: req.file ? req.file.path : undefined,
//           otp,
//           otpExpiresAt,
//         },
//         { upsert: true, new: true }
//       )

//       // Send OTP email
//       const mailFrom = process.env.SMTP_USER
//       await transporter.sendMail({
//         from: mailFrom,
//         to: email,
//         subject: 'Your verification code',
//         text: `Your OTP is ${otp}. It expires in 10 minutes.`,
//         html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
//       })
//       if (!pending) {
//         return res.status(500).json({ message: 'Failed to createpending' })
//       }
//       res.status(200).json({
//         message: 'OTP sent to your email',
//         pendingUser: {
//           id: pending._id,
//           email: pending.email,
//           name: pending.name,
//         },
//       })
//     } catch (err: any) {
//       console.error(err)
//       res.status(500).json({ message: err.message || 'Server error' })
//     }
//   }
// )
router.post(
  '/api/auth/register/initiate', // 🔥 make sure to start with a leading slash
  upload.single('profilePhoto'),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, age, gender, location } = req.body

      if (Number(age) < 0) {
        return res.status(400).json({ message: 'Age cannot be below zero' })
      }

      const existing = await User.findOne({ email })
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' })
      }

      // ❌ optional: check if a pending user already exists
      const existingPending = await PendingUser.findOne({ email })
      if (existingPending) {
        await PendingUser.deleteOne({ email }) // remove old pending if you want strict "always fresh"
      }

      // Generate 6-digit OTP and expiry
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

      const hashed = await bcrypt.hash(password, 10)

      // ✅ Create new pending user
      const pending = await PendingUser.create({
        name,
        email,
        password: hashed,
        age: Number(age),
        gender,
        location,
        profilePhoto: req.file ? req.file.path : undefined,
        otp,
        otpExpiresAt,
      })

      // Send OTP email
      const mailFrom = process.env.SMTP_USER
      await transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: 'Your verification code',
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
      })

      res.status(201).json({
        message: 'OTP sent to your email',
        pendingUser: {
          id: pending._id,
          email: pending.email,
          name: pending.name,
        },
      })
    } catch (err: any) {
      console.error(err)
      res.status(500).json({ message: err.message || 'Server error' })
    }
  }
)

// New: verify OTP and create user
router.post(
  '/api/auth/register/verify',
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body as { email: string; otp: string }

      const pending = await PendingUser.findOne({ email })
      if (!pending)
        return res
          .status(400)
          .json({ message: 'No pending registration found' })

      if (pending.otp !== otp)
        return res.status(400).json({ message: 'Invalid OTP' })

      if (pending.otpExpiresAt.getTime() < Date.now())
        return res.status(400).json({ message: 'OTP expired' })

      const user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        age: pending.age,
        gender: pending.gender,
        location: pending.location,
        profilePhoto: pending.profilePhoto,
        provider: 'local',
        providerId: '',
      })
      await user.save()
      await PendingUser.deleteOne({ _id: pending._id })

      res.status(201).json({ user: { name: user.name, email: user.email } })
    } catch (err: any) {
      console.error(err)
      res.status(500).json({ message: err.message || 'Server error' })
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
    if (user.provider !== 'local' || !user.password) {
      return res.status(400).json({
        message:
          'This account uses social login. Please log in with Google or Facebook.',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // JWT token (optional but recommended)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    )

    res.json({
      user: { name: user.name, email: user.email },
      token,
    })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        message:
          'If an account with that email exists, a password reset OTP has been sent.',
      })
    }

    // Generate 6-digit OTP and expiry
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString()
    const resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save reset OTP to user
    user.resetPasswordOTP = resetOTP
    user.resetPasswordOTPExpires = resetOTPExpiry
    await user.save()

    // Send email with OTP
    const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER
    await transporter.sendMail({
      from: mailFrom,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your password reset OTP is ${resetOTP}. It expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4899;">Password Reset OTP</h2>
          <p>You requested a password reset. Use the following OTP to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #ec4899; letter-spacing: 4px;">${resetOTP}</span>
            </div>
          </div>
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 6px; color: #92400e;">
            <strong>Security Tip:</strong> Never share this OTP with anyone. Our team will never ask for it.
          </p>
        </div>
      `,
    })

    res.status(200).json({
      message:
        'If an account with that email exists, a password reset OTP has been sent.',
    })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
})

// Reset password with OTP
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Email, OTP, and new password are required' })
    }

    // Find user with valid reset OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password and clear reset OTP
    user.password = hashedPassword
    user.resetPasswordOTP = null
    user.resetPasswordOTPExpires = null
    await user.save()

    res.status(200).json({ message: 'Password has been reset successfully' })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
})
// ✅ GET profile
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// ✅ UPDATE profile
router.put(
  '/users/:id',
  upload.array('picture', 5),
  async (req: Request, res: Response) => {
    try {
      const { name, age, gender, location, bio, interests } = req.body
      const updateData: any = {
        name,
        age,
        gender,
        location,
        bio,
        interests: interests ? JSON.parse(interests) : [],
      }

      // Handle uploaded photos
      if (req.files) {
        const files = req.files as Express.Multer.File[]
        updateData.photos = files.map((f) => `/uploads/${f.filename}`)
      }

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      }).select('-password')

      res.json({ user })
    } catch (err) {
      res.status(500).json({ message: 'Profile update failed' })
    }
  }
)
module.exports = router
