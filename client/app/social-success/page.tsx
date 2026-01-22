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

// 'use client'

// import { useEffect } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { useDispatch } from 'react-redux'
// import { checkAuthRequest } from '@/store/slices/authSlice'

// export default function SocialSuccessPage() {
//   const router = useRouter()
//   const dispatch = useDispatch()
//   const searchParams = useSearchParams()

//   useEffect(() => {
//     const handleSocialSuccess = async () => {
//       try {
//         // Get token from URL
//         const token = searchParams.get('token')

//         if (!token) {
//           console.error('No token found in URL')
//           router.push('/login?error=No authentication token received')
//           return
//         }

//         console.log('✅ Social login token received')

//         // Store token in cookie
//         document.cookie = `token=${token}; path=/; max-age=${
//           7 * 24 * 60 * 60
//         }; samesite=lax`

//         // Clear URL parameters
//         if (typeof window !== 'undefined') {
//           window.history.replaceState({}, document.title, '/social-success')
//         }

//         // Dispatch check auth to verify token and get user data
//         dispatch(checkAuthRequest())

//         // Add a small delay to ensure Redux state updates
//         setTimeout(() => {
//           router.push('/discovery')
//         }, 500)
//       } catch (error) {
//         console.error('Social success error:', error)
//         router.push('/login?error=Authentication failed')
//       }
//     }

//     handleSocialSuccess()
//   }, [searchParams, router, dispatch])

//   return (
//     <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-pink-100'>
//       <div className='text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4'>
//         <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-6'></div>
//         <h2 className='text-2xl font-bold text-gray-800 mb-3'>
//           Completing Login
//         </h2>
//         <p className='text-gray-600 mb-2'>Your social login was successful!</p>
//         <p className='text-gray-500 text-sm'>Redirecting you to the app...</p>
//       </div>
//     </div>
//   )
// }

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { checkAuthRequest } from '@/store/slices/authSlice'

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-pink-100'>
      <div className='text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-6'></div>
        <h2 className='text-2xl font-bold text-gray-800 mb-3'>
          Processing Login
        </h2>
        <p className='text-gray-600 mb-2'>Please wait...</p>
      </div>
    </div>
  )
}

// Main component content
function SocialSuccessContent() {
  const router = useRouter()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    // Only process once
    if (hasProcessed) return

    const handleSocialSuccess = async () => {
      try {
        // Get token from URL
        const token = searchParams.get('token')
        const error = searchParams.get('error')

        // If there's an error in the URL, redirect to login with error
        if (error) {
          console.error('Social login error:', error)
          router.push(`/login?error=${encodeURIComponent(error)}`)
          return
        }

        // Check if we're on the client side
        if (typeof window === 'undefined') {
          console.log('Server-side rendering, waiting for client...')
          return
        }

        // Check if token exists
        if (!token) {
          console.log('No token in URL, checking if already logged in...')

          // Check if user already has a token in cookies
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            acc[key] = value
            return acc
          }, {} as Record<string, string>)

          if (cookies.token) {
            console.log('Token found in cookies, redirecting to discovery...')
            router.push('/discovery')
            return
          }

          // No token anywhere, redirect to login
          console.error('No authentication token found')
          router.push('/login?error=No authentication token received')
          return
        }

        console.log('✅ Social login token received')

        // Store token in cookie
        document.cookie = `token=${token}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; samesite=lax`

        // Clear URL parameters (but keep the page URL)
        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
        }

        // Mark as processed
        setHasProcessed(true)

        // Dispatch check auth to verify token and get user data
        dispatch(checkAuthRequest())

        // Add a small delay to ensure Redux state updates
        setTimeout(() => {
          console.log('Redirecting to discovery...')
          router.push('/discovery')
        }, 500)
      } catch (error) {
        console.error('Social success error:', error)
        router.push('/login?error=Authentication failed')
      }
    }

    handleSocialSuccess()
  }, [searchParams, router, dispatch, hasProcessed])

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

// Export the wrapped component
export default function SocialSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SocialSuccessContent />
    </Suspense>
  )
}
