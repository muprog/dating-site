'use client'

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { verifyOtpRequest } from '@/store/slices/authSlice'
import { useRouter } from 'next/navigation'

export default function VerifyOtpPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { loading, error, verified } = useSelector(
    (state: RootState) => state.auth
  )

  const [form, setForm] = useState({
    email: '',
    otp: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(verifyOtpRequest(form))
  }
  console.log(form)
  useEffect(() => {
    if (verified) {
      router.push('/login')
    }
  }, [verified, router])

  return (
    <div className='flex flex-col items-center justify-center min-h-screen'>
      <h2 className='text-2xl font-bold mb-4'>Verify OTP</h2>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3 w-80'>
        <input
          type='email'
          name='email'
          placeholder='Email'
          value={form.email}
          onChange={handleChange}
          required
          className='border p-2 rounded'
        />
        <input
          type='text'
          name='otp'
          placeholder='Enter OTP'
          value={form.otp}
          onChange={handleChange}
          required
          className='border p-2 rounded'
        />
        <button
          type='submit'
          disabled={loading}
          className='bg-pink-500 text-white p-2 rounded'
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {error && <p className='text-red-500 text-sm'>{error}</p>}
      </form>
    </div>
  )
}
