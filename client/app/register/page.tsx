'use client'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { registerRequest } from '@/store/slices/authSlice'
import { RootState } from '@/store/store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/Button'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { loading, error, otpSent } = useSelector(
    (state: RootState) => state.auth
  )

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(registerRequest(form))
  }
  useEffect(() => {
    if (otpSent) {
      router.push('/verify-otp')
    }
  }, [otpSent, router])
  // const handleSocialSignUp = () => {}
  const handleSocialSignUp = (provider: 'google' | 'facebook') => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/${provider}`
    // alert('hi')
  }
  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 px-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-lg p-8'>
        {/* Heading */}
        <h2 className='text-3xl font-extrabold text-center text-gray-800 mb-2'>
          Create Your Account
        </h2>
        <p className='text-center text-gray-500 mb-6 text-sm'>
          Join us and start your journey today
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input
            type='text'
            name='name'
            placeholder='Full Name'
            value={form.name}
            onChange={handleChange}
            required
            className='border border-gray-300 focus:border-pink-400 focus:ring focus:ring-pink-200 outline-none p-3 rounded-lg transition'
          />
          <input
            type='email'
            name='email'
            placeholder='Email'
            value={form.email}
            onChange={handleChange}
            required
            className='border border-gray-300 focus:border-pink-400 focus:ring focus:ring-pink-200 outline-none p-3 rounded-lg transition'
          />
          <input
            type='password'
            name='password'
            placeholder='Password'
            value={form.password}
            onChange={handleChange}
            required
            className='border border-gray-300 focus:border-pink-400 focus:ring focus:ring-pink-200 outline-none p-3 rounded-lg transition'
          />

          <Button
            title={`${loading ? 'Signing Up...' : 'Sign Up'}`}
            btnType='submit'
            btnStyle='bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg shadow-md transition'
            disabled={loading}
          />
          {error && <p className='text-red-500 text-sm'>{error}</p>}
        </form>

        {/* Divider */}
        <div className='flex items-center my-6'>
          <hr className='flex-grow border-gray-300' />
          <span className='px-3 text-gray-400 text-sm'>or continue with</span>
          <hr className='flex-grow border-gray-300' />
        </div>

        {/* Social Buttons */}
        <div className='flex flex-col gap-3'>
          <Button
            title='Continue with Google'
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm flex justify-center items-center gap-2'
            onClick={() => handleSocialSignUp('google')}
          />
          <Button
            title='Continue with Facebook'
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm flex justify-center items-center gap-2'
            onClick={() => handleSocialSignUp('facebook')}
          />
        </div>

        {/* Footer */}
        <p className='mt-6 text-sm text-center text-gray-600'>
          Already have an account?{' '}
          <Link href='/login' className='text-pink-500 hover:underline'>
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
