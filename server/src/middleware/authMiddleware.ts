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
