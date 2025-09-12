'use client'

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RootState } from '../../store'
import { verifyOtpRequest } from '../../store/auth/authSlice'

const VerifyOtp: React.FC = () => {
  const dispatch = useDispatch()
  const router = useRouter()

  const { loading, error, otpPending, user } = useSelector(
    (state: RootState) => state.auth
  )

  const [formData, setFormData] = useState({
    email: '',
    otp: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.otp) return

    dispatch(
      verifyOtpRequest({
        email: formData.email,
        otp: formData.otp,
      })
    )
  }

  // Redirect to login after successful OTP verification
  useEffect(() => {
    if (!loading && user) {
      router.push('/login')
    }
  }, [loading, user, router])

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 py-8'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4'
      >
        <h1 className='text-2xl font-bold text-gray-800 mb-4 text-center'>
          Verify Your OTP
        </h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm'
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email
            </label>
            <input
              type='email'
              id='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              placeholder='Enter your email'
            />
          </div>

          <div>
            <label
              htmlFor='otp'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              OTP
            </label>
            <input
              type='text'
              id='otp'
              name='otp'
              value={formData.otp}
              onChange={handleChange}
              required
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              placeholder='Enter the OTP'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <p className='text-sm text-gray-500 mt-4 text-center'>
          Didn’t receive an OTP? Check your email or request again.
        </p>
      </motion.div>
    </div>
  )
}

export default VerifyOtp
