// 'use client'

// import React, { useState } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { loginRequest } from '@/store/slices/authSlice'
// import { RootState } from '@/store/store'
// import { useRouter } from 'next/navigation'
// import Button from '@/components/Button'

// export default function LoginPage() {
//   const dispatch = useDispatch()
//   const router = useRouter()
//   const { loading, error, user } = useSelector((state: RootState) => state.auth)

//   const [form, setForm] = useState({
//     email: '',
//     password: '',
//   })

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value })
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     dispatch(loginRequest(form))
//   }

//   if (user) {
//     router.push('/dashboard')
//   }

//   return (
//     <div className='flex flex-col items-center justify-center min-h-screen'>
//       <h2 className='text-2xl font-bold mb-4'>Welcome Back!</h2>

//       <form onSubmit={handleSubmit} className='flex flex-col gap-3 w-80'>
//         <input
//           type='email'
//           name='email'
//           placeholder='Email'
//           value={form.email}
//           onChange={handleChange}
//           required
//           className='border p-2 rounded'
//         />
//         <input
//           type='password'
//           name='password'
//           placeholder='Password'
//           value={form.password}
//           onChange={handleChange}
//           required
//           className='border p-2 rounded'
//         />

//         {/* <button
//           type='submit'
//           disabled={loading}
//           className='bg-pink-500 text-white p-2 rounded'
//         >
//           {loading ? 'Logging in...' : 'Log In'}
//         </button> */}
//         <Button
//           btnType='submit'
//           btnStyle='bg-pink-500 text-white p-2 rounded'
//           title={`${loading ? 'Logging in...' : 'Log In'}`}
//           disabled={loading}
//         />

//         {error && <p className='text-red-500 text-sm'>{error}</p>}
//       </form>

//       <div className='w-80 text-right mt-2'>
//         <a href='/forgot-password' className='text-sm text-blue-500'>
//           Forgot Password?
//         </a>
//       </div>

//       <div className='flex items-center w-80 my-4'>
//         <hr className='flex-grow border-gray-300' />
//         <span className='px-2 text-gray-500 text-sm'>or</span>
//         <hr className='flex-grow border-gray-300' />
//       </div>

//       <div className='flex flex-col gap-2 w-80'>
//         <Button
//           title='Continue with Google'
//           btnType='submit'
//           btnStyle='border border-gray-200 p-2 rounded bg-gray-100 hover:bg-gray-200 font-medium'
//         />

//         <Button
//           title='Continue with Facebook'
//           btnType='submit'
//           btnStyle='border border-gray-200 p-2 rounded bg-gray-100 hover:bg-gray-200 font-medium'
//         />
//       </div>
//       {/* Register link */}
//       <div className='mt-4 text-sm'>
//         New here?{' '}
//         <a href='/register' className='text-blue-500'>
//           Create an account
//         </a>
//       </div>
//     </div>
//   )
// }

'use client'

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginRequest } from '@/store/slices/authSlice'
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
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(loginRequest(form))
  }

  if (user) {
    router.push('/dashboard')
  }

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

          {error && <p className='text-red-500 text-sm'>{error}</p>}
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
        <div className='flex flex-col gap-3'>
          <Button
            title='Continue with Google'
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm flex justify-center items-center gap-2'
          />
          <Button
            title='Continue with Facebook'
            btnType='button'
            btnStyle='border border-gray-300 p-3 rounded-lg bg-white hover:bg-gray-50 shadow-sm flex justify-center items-center gap-2'
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
