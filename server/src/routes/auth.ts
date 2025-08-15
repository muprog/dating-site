import { Router, Request, Response } from 'express'
import passport from '../config/auth'
import {
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
} from '../controllers/authController'
import bcrypt from 'bcrypt'
import User from '../model/User'

const router = Router()

// Traditional Authentication Routes
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, age, gender, location } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email' })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      age,
      gender,
      location,
      provider: 'local',
      providerId: email, // Use email as providerId for local users
    })

    await newUser.save()

    // Log in the user after successful signup
    req.login(newUser, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Auto-login failed after signup' })
      }
      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          age: newUser.age,
          gender: newUser.gender,
          location: newUser.location,
          provider: newUser.provider,
        },
      })
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Internal server error during signup' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check if user has a password (local user)
    if (!user.password) {
      return res
        .status(401)
        .json({
          message:
            'This account was created with social login. Please use social login instead.',
        })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Log in the user
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' })
      }
      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          location: user.location,
          provider: user.provider,
        },
      })
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error during login' })
  }
})

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as any
    if (user) {
      // Redirect to frontend with user data
      const redirectUrl =
        `${process.env.CLIENT_URL}/auth/callback?` +
        `email=${encodeURIComponent(user.email)}` +
        `&name=${encodeURIComponent(user.name)}` +
        `&picture=${encodeURIComponent(user.picture || '')}` +
        `&provider=google` +
        `&providerId=${encodeURIComponent(user.providerId)}`
      res.redirect(redirectUrl)
    } else {
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`)
    }
  }
)

// Facebook OAuth routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }))
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as any
    if (user) {
      // Redirect to frontend with user data
      const redirectUrl =
        `${process.env.CLIENT_URL}/auth/callback?` +
        `email=${encodeURIComponent(user.email)}` +
        `&name=${encodeURIComponent(user.name)}` +
        `&picture=${encodeURIComponent(user.picture || '')}` +
        `&provider=facebook` +
        `&providerId=${encodeURIComponent(user.providerId)}`
      res.redirect(redirectUrl)
    } else {
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`)
    }
  }
)

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  ;(req as any).logout((err: any) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Logout failed', error: err.message })
    }
    ;(req as any).session.destroy((err: any) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Session destruction failed', error: err.message })
      }
      res.clearCookie('connect.sid')
      res.json({ message: 'Logged out successfully' })
    })
  })
})

// Get current user session
router.get('/session', (req: Request, res: Response) => {
  if ((req as any).isAuthenticated()) {
    res.json({
      user: {
        id: (req as any).user?._id,
        email: (req as any).user?.email,
        name: (req as any).user?.name,
        picture: (req as any).user?.picture,
        provider: (req as any).user?.provider,
      },
      isAuthenticated: true,
    })
  } else {
    res.status(401).json({
      message: 'Not authenticated',
      isAuthenticated: false,
    })
  }
})

// Get user profile
router.get('/profile', (req: Request, res: Response) => {
  if (!(req as any).isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' })
  }
  res.json({
    user: {
      id: (req as any).user?._id,
      email: (req as any).user?.email,
      name: (req as any).user?.name,
      picture: (req as any).user?.picture,
      provider: (req as any).user?.provider,
    },
  })
})

// User profile management routes
router.post('/user', createOrUpdateUser)
router.get('/user/:id', getUserProfile)
router.put('/user/:id', updateUserProfile)

export default router
