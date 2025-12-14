// 'use client'

// import { useEffect } from 'react'
// import { useDispatch } from 'react-redux'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { loginSuccess } from '@/store/slices/authSlice'

// export default function SocialSuccessPage() {
//   const dispatch = useDispatch()
//   const router = useRouter()
//   const searchParams = useSearchParams()

//   useEffect(() => {
//     const token = searchParams.get('token')
//     if (token) {
//       // save token (localStorage or cookie)
//       localStorage.setItem('token', token)

//       // decode or just save raw token to redux
//       dispatch(loginSuccess({ token }))

//       // redirect to home or dashboard
//       router.push('/')
//     } else {
//       router.push('/login')
//     }
//   }, [dispatch, router, searchParams])

//   return (
//     <div className='flex items-center justify-center h-screen'>
//       <p className='text-gray-600'>Finishing login...</p>
//     </div>
//   )
// }

'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { checkAuthRequest } from '@/store/slices/authSlice'

export default function SocialSuccessPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleSocialSuccess = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token')

        if (!token) {
          console.error('No token found in URL')
          router.push('/login?error=No authentication token received')
          return
        }

        console.log('✅ Social login token received')

        // Store token in cookie
        document.cookie = `token=${token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; samesite=lax`

        // Clear URL parameters
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, '/social-success')
        }

        // Dispatch check auth to verify token and get user data
        dispatch(checkAuthRequest())

        // Add a small delay to ensure Redux state updates
        setTimeout(() => {
          router.push('/discovery')
        }, 500)
      } catch (error) {
        console.error('Social success error:', error)
        router.push('/login?error=Authentication failed')
      }
    }

    handleSocialSuccess()
  }, [searchParams, router, dispatch])

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-pink-100'>
      <div className='text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-6'></div>
        <h2 className='text-2xl font-bold text-gray-800 mb-3'>
          Completing Login
        </h2>
        <p className='text-gray-600 mb-2'>Your social login was successful!</p>
        <p className='text-gray-500 text-sm'>Redirecting you to the app...</p>
      </div>
    </div>
  )
}
