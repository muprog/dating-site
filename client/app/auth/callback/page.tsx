'use client'

import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createOrUpdateUserRequest } from '../../../store/auth/authSlice'
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'

export default function AuthCallback() {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get user data from URL parameters or session
        const userData = {
          email: searchParams.get('email') || '',
          name: searchParams.get('name') || '',
          picture: searchParams.get('picture') || '',
          provider:
            (searchParams.get('provider') as 'google' | 'facebook') || 'google',
          providerId: searchParams.get('providerId') || '',
        }

        if (userData.email && userData.name && userData.providerId) {
          // Create or update user in our database
          dispatch(createOrUpdateUserRequest(userData))
          setStatus('success')
          setMessage(
            'Authentication successful! Redirecting to your profile...'
          )

          // Redirect to profile page after a short delay
          setTimeout(() => {
            router.push('/profile')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Missing user information. Please try logging in again.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Authentication failed. Please try again.')
        console.error('Auth callback error:', error)
      }
    }

    handleCallback()
  }, [dispatch, router, searchParams])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4'
      >
        {status === 'loading' && (
          <div>
            <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4'></div>
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>
              Processing...
            </h2>
            <p className='text-gray-600'>
              Please wait while we complete your authentication.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <FaCheckCircle className='text-6xl text-green-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>Welcome!</h2>
            <p className='text-gray-600'>{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <FaExclamationCircle className='text-6xl text-red-500 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>Oops!</h2>
            <p className='text-gray-600 mb-4'>{message}</p>
            <button
              onClick={() => router.push('/login')}
              className='bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200'
            >
              Try Again
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
