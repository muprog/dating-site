'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuthRequest } from '@/store/user/userSlice'
import { RootState } from '@/store'

export default function AuthCheck() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state: RootState) => state.user)

  useEffect(() => {
    // Check if user is not already authenticated and there's a token
    if (!user && typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        dispatch(checkAuthRequest())
      }
    }
  }, [dispatch, user])

  // This component doesn't render anything, it just handles auth checking
  return null
}
