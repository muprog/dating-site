'use client'

import React, { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { FaFacebook, FaEye, FaEyeSlash } from 'react-icons/fa'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { checkAuthStatusRequest } from '../../store/auth/authSlice'
import { useRouter } from 'next/navigation'

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`
    window.location.href = url
  }

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (response.ok) {
        // Login successful
        dispatch(checkAuthStatusRequest())
        router.push('/profile')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4'
      >
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>
            Welcome Back
          </h1>
          <p className='text-gray-600'>Sign in to your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm'
          >
            {error}
          </motion.div>
        )}

        {/* Traditional Login Form */}
        <form onSubmit={handleTraditionalLogin} className='mb-6'>
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                placeholder='Enter your email'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Password
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className='relative mb-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-white text-gray-500'>
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className='space-y-4'>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className='w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50'
          >
            <FcGoogle className='text-xl' />
            Continue with Google
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className='w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50'
          >
            <FaFacebook className='text-xl' />
            Continue with Facebook
          </motion.button>
        </div>

        {/* Links */}
        <div className='mt-8 text-center space-y-3'>
          <Link
            href='/forgot-password'
            className='block text-pink-600 hover:text-pink-700 text-sm font-medium'
          >
            Forgot your password?
          </Link>

          <p className='text-gray-600 text-sm'>
            Don't have an account?{' '}
            <Link
              href='/register'
              className='text-pink-600 hover:text-pink-700 font-medium'
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className='mt-6 text-center'>
          <p className='text-gray-500 text-xs'>
            By signing in, you agree to our{' '}
            <a href='#' className='text-pink-600 hover:underline'>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href='#' className='text-pink-600 hover:underline'>
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
