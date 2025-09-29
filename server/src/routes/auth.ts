const express = require('express')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
import type { Request, Response } from 'express'

const User = require('../models/User')

const router = express.Router()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 min
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

// Verify OTP
router.post(
  '/verify-otp',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body
      // console.log(email)
      const user = await User.findOne({ email })
      if (!user) {
        res.status(400).json({ message: 'User not found' })
        return
      }

      if (user.otp !== otp || user.otpExpires < Date.now()) {
        res.status(400).json({ message: 'Invalid or expired OTP' })
        return
      }
      // console.log(user)
      user.verified = true
      user.otp = null
      user.otpExpires = null
      await user.save()
      // console.log('111', email)
      res.json({ message: '✅ User verified successfully' })
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message })
    }
  }
)

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    // Store token in cookie (httpOnly = cannot be accessed by JS)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only https in prod
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    })

    // You can still send user info in JSON (but not the token)
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (err) {
    console.error(err)
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    user.resetPasswordOTP = otp
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000 // valid for 10 mins
    await user.save()

    // Send OTP via email
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
      resetPasswordExpires: { $gt: Date.now() }, // not expired
    })
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }
    const hashed = await bcrypt.hash(newPassword, 10)
    user.password = hashed // hash before saving if using bcrypt
    user.resetPasswordOTP = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
