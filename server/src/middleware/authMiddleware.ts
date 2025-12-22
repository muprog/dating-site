// // middleware/auth.ts
// import express = require('express')
// const jwt = require('jsonwebtoken')
// const User = require('../models/User')

// const auth = async (
//   req: any,
//   res: express.Response,
//   next: express.NextFunction
// ) => {
//   try {
//     // Get token from cookie or Authorization header
//     const token =
//       req?.cookies?.token || req.header('Authorization')?.replace('Bearer ', '')

//     console.log('🔐 Auth Middleware - Token present:', !!token)

//     if (!token) {
//       console.log('❌ No token found')
//       return res.status(401).json({
//         success: false,
//         message: 'No token, authorization denied',
//       })
//     }

//     // Verify token - NOTE: looking for 'id' not 'userId'
//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
//       id: string // Changed from userId to id
//       email?: string
//     }

//     console.log('✅ Token verified. Decoded payload:', decoded)
//     console.log('✅ User ID from token (decoded.id):', decoded.id)

//     if (!decoded.id) {
//       console.error('❌ Token does not contain user id')
//       return res.status(401).json({
//         success: false,
//         message: 'Token does not contain user information',
//       })
//     }

//     // Find user in database
//     const user = await User.findById(decoded.id).select('-password')

//     if (!user) {
//       console.log('❌ User not found in database for id:', decoded.id)
//       return res.status(401).json({
//         success: false,
//         message: 'User not found',
//       })
//     }

//     console.log('✅ User found:', {
//       _id: user._id,
//       email: user.email,
//       name: user.name,
//     })

//     // Attach full user object to request
//     req.user = user
//     next()
//   } catch (error: any) {
//     console.error('❌ Token verification failed:', error)
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({
//         success: false,
//         message: 'Token expired',
//       })
//     }
//     res.status(401).json({
//       success: false,
//       message: 'Token is not valid',
//       error: error.message,
//     })
//   }
// }

// module.exports = auth

// middleware/auth.ts - UPDATED VERSION
import express = require('express')
const jwt = require('jsonwebtoken')

export interface AuthRequest extends express.Request {
  user?: {
    id: string
    email: string
  }
  cookies: any
}

const auth = async (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    // IMPORTANT: Make sure we're accessing cookies correctly
    // Use optional chaining to avoid undefined errors
    const token =
      req.cookies?.token ||
      req.headers?.cookie
        ?.split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1]

    console.log('🔐 Auth Middleware - Token check:')
    console.log('- Full cookies:', req.cookies)
    console.log('- Headers cookie:', req.headers?.cookie)
    console.log('- Extracted token:', token ? 'Present' : 'Missing')

    if (!token) {
      console.log('❌ No token found')
      return res.status(401).json({
        message: 'No authentication token found',
        authenticated: false,
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
    }

    console.log('✅ Token verified for user ID:', decoded.id)

    // Make sure we have a proper user object
    if (!decoded.id) {
      console.log('❌ No user ID in token')
      return res.status(401).json({
        message: 'Invalid token: No user ID',
        authenticated: false,
      })
    }

    // Add user to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
    }

    console.log('✅ User added to request:', req.user.id)
    next()
  } catch (error: any) {
    console.error('❌ Auth middleware error:', error.message)

    // Clear invalid cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })

    res.status(401).json({
      message: 'Authentication failed',
      error: error.message,
      authenticated: false,
    })
  }
}

module.exports = auth
