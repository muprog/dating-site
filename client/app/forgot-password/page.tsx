'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setStep('otp')
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, otp, newPassword }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-white px-4'>
      <div className='w-full max-w-md'>
        {/* Back to Login */}
        <div className='mb-6'>
          <Link
            href='/login'
            className='inline-flex items-center text-pink-500 hover:text-pink-600 transition-colors'
          >
            <FaArrowLeft className='mr-2' />
            Back to Login
          </Link>
        </div>

        {step === 'email' ? (
          <>
            <div className='text-center mb-8'>
              <div className='mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4'>
                <FaEnvelope className='text-2xl text-pink-600' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Forgot Password?
              </h2>
              <p className='text-gray-600 mt-2'>
                Enter your email address and we'll send you an OTP to reset your
                password.
              </p>
            </div>

            <form className='space-y-4' onSubmit={handleSendOTP}>
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Email Address
                </label>
                <input
                  id='email'
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300'
                />
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
                  {error}
                </div>
              )}

              {message && (
                <div className='bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg'>
                  {message}
                </div>
              )}

              <button
                type='submit'
                disabled={loading}
                className='w-full py-3 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className='text-center mb-8'>
              <div className='mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4'>
                <FaLock className='text-2xl text-pink-600' />
              </div>
              <h2 className='text-2xl font-bold text-gray-900'>
                Reset Your Password
              </h2>
              <p className='text-gray-600 mt-2'>
                Enter the OTP sent to {email} and your new password.
              </p>
            </div>

            <form className='space-y-4' onSubmit={handleResetPassword}>
              <div>
                <label
                  htmlFor='otp'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  OTP Code
                </label>
                <input
                  id='otp'
                  type='text'
                  placeholder='Enter 6-digit OTP'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  pattern='[0-9]{6}'
                  className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 text-center text-lg tracking-widest'
                />
              </div>

              <div>
                <label
                  htmlFor='newPassword'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  New Password
                </label>
                <input
                  id='newPassword'
                  type='password'
                  placeholder='Enter new password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300'
                />
              </div>

              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Confirm New Password
                </label>
                <input
                  id='confirmPassword'
                  type='password'
                  placeholder='Confirm new password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className='w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-300'
                />
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg'>
                  {error}
                </div>
              )}

              {message && (
                <div className='bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg'>
                  {message}
                  <p className='text-sm mt-1'>Redirecting to login page...</p>
                </div>
              )}

              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={handleBackToEmail}
                  className='flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors'
                >
                  Back
                </button>
                <button
                  type='submit'
                  disabled={loading}
                  className='flex-1 py-3 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </>
        )}

        <div className='mt-6 text-center'>
          <span className='text-gray-500'>Remember your password? </span>
          <Link href='/login' className='text-pink-500 hover:underline'>
            Sign in
          </Link>
        </div>

        <div className='mt-4 text-center text-sm text-gray-500'>
          <p>The OTP will expire in 10 minutes for security reasons.</p>
        </div>
      </div>
    </div>
  )
}
