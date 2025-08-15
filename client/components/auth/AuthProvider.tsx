'use client'

import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { RootReducer } from '../../store/rootReducer'
import { checkAuthStatusRequest } from '../../store/auth/authSlice'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useSelector(
    (state: RootReducer) => state.auth
  )

  // Protected routes that require authentication
  const protectedRoutes = ['/profile', '/dashboard', '/matches']
  const authRoutes = ['/login', '/register']

  useEffect(() => {
    // Check authentication status on mount
    dispatch(checkAuthStatusRequest())
  }, [dispatch])

  useEffect(() => {
    if (!loading) {
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      )
      const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

      if (isProtectedRoute && !isAuthenticated) {
        // Redirect to login if trying to access protected route without authentication
        router.push('/login')
      } else if (isAuthRoute && isAuthenticated) {
        // Redirect to profile if trying to access auth routes while authenticated
        router.push('/profile')
      }
    }
  }, [isAuthenticated, loading, pathname, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600'></div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthProvider
