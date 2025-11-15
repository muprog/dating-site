'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import { loginSuccess } from '@/store/slices/authSlice'

export default function SocialSuccessPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // save token (localStorage or cookie)
      localStorage.setItem('token', token)

      // decode or just save raw token to redux
      dispatch(loginSuccess({ token }))

      // redirect to home or dashboard
      router.push('/')
    } else {
      router.push('/login')
    }
  }, [dispatch, router, searchParams])

  return (
    <div className='flex items-center justify-center h-screen'>
      <p className='text-gray-600'>Finishing login...</p>
    </div>
  )
}
