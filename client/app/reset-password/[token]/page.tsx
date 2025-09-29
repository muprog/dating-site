'use client'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams, useRouter } from 'next/navigation'
import { resetPasswordRequest } from '@/store/slices/authSlice'
import Button from '@/components/Button'

export default function ResetPasswordPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const params = useParams<{ token: string }>() // 👈 narrow type

  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!params?.token) {
      console.error('Token missing in URL')
      return
    }

    dispatch(resetPasswordRequest({ token: params.token, password }))
  }

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <form
        onSubmit={handleSubmit}
        className='p-6 bg-white rounded shadow w-80'
      >
        <h2 className='text-xl font-bold mb-4'>Reset Password</h2>
        <input
          type='password'
          placeholder='New Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='border p-2 w-full mb-4 rounded'
        />
        <Button
          btnType='submit'
          btnStyle='bg-pink-500 text-white p-2 rounded w-full'
          title='Reset Password'
        />
      </form>
    </div>
  )
}
