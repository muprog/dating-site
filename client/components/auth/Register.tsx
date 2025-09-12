'use client'

import React, { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import {
  FaFacebook,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaBirthdayCake,
  FaMapMarkerAlt,
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { checkAuthStatusRequest } from '../../store/auth/authSlice'
import { useRouter } from 'next/navigation'
import { registerInitiateRequest } from '../../store/auth/authSlice'
const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    location: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const router = useRouter()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError('')
  }

  const handleSocialSignup = (provider: 'google' | 'facebook') => {
    setIsLoading(true)
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${provider}`
    window.location.href = url
  }

  const handleTraditionalSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long!')
      return
    }
    if (Number(formData.age) < 18) {
      setError('You must be at least 18 years old to register!')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Build FormData
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('email', formData.email)
      fd.append('password', formData.password)
      fd.append('age', formData.age)
      fd.append('gender', formData.gender)
      fd.append('location', formData.location)
      console.log(fd)
      // if you later add a profile photo
      // if (profilePhotoFile) fd.append('profilePhoto', profilePhotoFile)

      // dispatch(registerInitiateRequest(fd))
      // Register.tsx
      dispatch(
        registerInitiateRequest({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: formData.age,
          gender: formData.gender,
          location: formData.location,
          // don’t pass File or FormData here
        })
      )

      router.push('/verify-otp')
    } catch (err) {
      console.error('Signup error:', err)
      setError('Something went wrong. Please try again.')
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
            Create Account
          </h1>
          <p className='text-gray-600'>
            Join thousands finding real connections
          </p>
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

        {/* Traditional Signup Form */}
        <form onSubmit={handleTraditionalSignup} className='mb-6'>
          <div className='space-y-4'>
            {/* Name */}
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Full Name
              </label>
              <div className='relative'>
                <FaUser className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                  placeholder='Enter your full name'
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email Address
              </label>
              <div className='relative'>
                <FaEnvelope className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                  placeholder='Enter your email'
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Password
              </label>
              <div className='relative'>
                <FaLock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                  placeholder='Create a password'
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Confirm Password
              </label>
              <div className='relative'>
                <FaLock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                  placeholder='Confirm your password'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Age and Gender Row */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='age'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Age
                </label>
                <div className='relative'>
                  <FaBirthdayCake className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                  <input
                    type='number'
                    id='age'
                    name='age'
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min='18'
                    max='100'
                    className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                    placeholder='Age'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='gender'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Gender
                </label>
                <select
                  id='gender'
                  name='gender'
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                >
                  <option value=''>Select gender</option>
                  <option value='male'>Male</option>
                  <option value='female'>Female</option>
                  <option value='other'>Other</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor='location'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Location
              </label>
              <div className='relative'>
                <FaMapMarkerAlt className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  id='location'
                  name='location'
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors'
                  placeholder='Enter your city/location'
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
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

        {/* Social Signup Buttons */}
        <div className='space-y-4'>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialSignup('google')}
            disabled={isLoading}
            className='w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50'
          >
            <FcGoogle className='text-xl' />
            Continue with Google
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSocialSignup('facebook')}
            disabled={isLoading}
            className='w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50'
          >
            <FaFacebook className='text-xl' />
            Continue with Facebook
          </motion.button>
        </div>

        {/* Links */}
        <div className='mt-8 text-center'>
          <p className='text-gray-600 text-sm'>
            Already have an account?{' '}
            <Link
              href='/login'
              className='text-pink-600 hover:text-pink-700 font-medium'
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className='mt-6 text-center'>
          <p className='text-gray-500 text-xs'>
            By creating an account, you agree to our{' '}
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

export default Register
