'use client'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import {
  forgotPasswordRequest,
  resetPasswordRequest,
} from '@/store/slices/authSlice'
import { RootState } from '@/store/store'
import Button from '@/components/Button'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { loading, error, message } = useSelector((s: RootState) => s.auth)

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(forgotPasswordRequest({ email }))
    setStep('otp')
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(resetPasswordRequest({ email, otp, password }))
  }
  useEffect(() => {
    if (message === 'Password reset successfully') {
      // Wait a bit then redirect
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }, [message, router])

  return (
    <div className='flex justify-center items-center min-h-screen bg-gray-100'>
      <div className='bg-white p-8 rounded shadow w-full max-w-md'>
        {step === 'email' && (
          <>
            <h2 className='text-xl font-bold mb-4'>Forgot Password</h2>
            <form onSubmit={handleSendOtp} className='flex flex-col gap-4'>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                required
                className='border p-2 rounded'
              />
              <Button
                btnType='submit'
                btnStyle='bg-blue-500 text-white p-2 rounded'
                title={loading ? 'Sending...' : 'Send OTP'}
              />
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className='text-xl font-bold mb-4'>Reset Password</h2>
            <form onSubmit={handleReset} className='flex flex-col gap-4'>
              <input
                type='text'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder='Enter OTP'
                required
                className='border p-2 rounded'
              />
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='New Password'
                required
                className='border p-2 rounded'
              />
              <Button
                btnType='submit'
                btnStyle='bg-green-500 text-white p-2 rounded'
                title={loading ? 'Resetting...' : 'Reset Password'}
              />
            </form>
          </>
        )}

        {message && <p className='text-green-600 mt-2'>{message}</p>}
        {error && <p className='text-red-600 mt-2'>{error}</p>}
      </div>
    </div>
  )
}
