'use client'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginRequest, checkAuthRequest } from '@/store/slices/authSlice'
import { RootState } from '@/store/store'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Link from 'next/link'

export default function LoginPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { loading, error, user } = useSelector((state: RootState) => state.auth)

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear error when user starts typing again
    if (error) {
      // You might want to dispatch an action to clear the error
      // Or use a local state for form errors instead
    }
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(loginRequest(form))
  }
  // const handleSocialLogin = () => {}
  const handleGoogleLogin = () => {
    console.log('🔵 Starting Google login...')
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
  }

  // Facebook login function
  const handleFacebookLogin = () => {
    console.log('🔵 Starting Facebook login...')
    // Redirect to backend Facebook OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/facebook`
  }
  useEffect(() => {
    const checkSocialLogin = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      if (token) {
        console.log('✅ Social login token received:', token)

        // Store the token in cookies
        document.cookie = `token=${token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; samesite=lax`

        // Clear the token from URL
        window.history.replaceState({}, document.title, '/login')

        // Check authentication with the new token
        dispatch(checkAuthRequest())

        // Show success message
        alert('Social login successful! Redirecting...')
      }
    }

    checkSocialLogin()
  }, [dispatch])
  useEffect(() => {
    if (user) {
      console.log('✅ User logged in, redirecting to discovery...')
      router.push('/discovery')
    }
  }, [user, router])

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-pink-100 px-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-lg p-8'>
        {/* Heading */}
        <h2 className='text-3xl font-extrabold text-center text-gray-800 mb-2'>
          Welcome Back!
        </h2>
        <p className='text-center text-gray-500 mb-6 text-sm'>
          Log in to continue your journey
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
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
            btnType='submit'
            btnStyle='bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg shadow-md transition'
            title={`${loading ? 'Logging in...' : 'Log In'}`}
            disabled={loading}
          />

          {/* Error message - only show if not loading and there's an error */}
          {!loading && error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm text-center'>{error}</p>
            </div>
          )}
        </form>

        {/* Forgot Password */}
        <div className='w-full text-right mt-3'>
          <Link
            href='/forgot-password'
            className='text-sm text-blue-500 hover:underline'
          >
            Forgot Password?
          </Link>
        </div>

        {/* Divider */}
        <div className='flex items-center my-6'>
          <hr className='flex-grow border-gray-300' />
          <span className='px-3 text-gray-400 text-sm'>or continue with</span>
          <hr className='flex-grow border-gray-300' />
        </div>

        {/* Social Buttons */}
        {/* <div className='flex flex-col gap-3'>
          <Button
            title='Continue with Google'
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm flex justify-center items-center gap-2'
            onClick={handleSocialLogin}
          />
          <Button
            title='Continue with Facebook'
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm flex justify-center items-center gap-2'
            onClick={handleSocialLogin}
          />
        </div> */}
        <div className='flex flex-col gap-3'>
          <Button
            title={
              <div className='flex items-center justify-center gap-3'>
                <svg className='w-5 h-5' viewBox='0 0 24 24'>
                  <path
                    fill='#4285F4'
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  />
                  <path
                    fill='#34A853'
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  />
                  <path
                    fill='#EA4335'
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  />
                </svg>
                <span>Continue with Google</span>
              </div>
            }
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition hover:shadow-md active:scale-95'
            onClick={handleGoogleLogin}
            disabled={loading}
          />
          <Button
            title={
              <div className='flex items-center justify-center gap-3'>
                <svg className='w-5 h-5' fill='#1877F2' viewBox='0 0 24 24'>
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
                <span>Continue with Facebook</span>
              </div>
            }
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition hover:shadow-md active:scale-95'
            onClick={handleFacebookLogin}
            disabled={loading}
          />
        </div>

        {/* Register link */}
        <p className='mt-6 text-sm text-center text-gray-600'>
          New here?{' '}
          <Link href='/register' className='text-pink-500 hover:underline'>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
