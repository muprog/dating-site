// middleware/auth.ts
import express = require('express')
const jwt = require('jsonwebtoken')

export interface AuthRequest extends Request {
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
    // Get token from cookie
    const token = req?.cookies?.token

    console.log('🔐 Auth Middleware - Cookies:', req?.cookies)
    console.log('🔐 Auth Middleware - Token present:', !!token)

    if (!token) {
      console.log('❌ No token found in cookies')
      return res.status(401).json({
        message: 'No token, authorization denied',
        debug: { cookies: req.cookies },
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
    }
    console.log('✅ Token verified for user:', decoded.email)

    req.user = decoded
    next()
  } catch (error) {
    console.error('❌ Token verification failed:', error)
    res.status(401).json({
      message: 'Token is not valid',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

module.exports = auth
