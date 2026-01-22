// 'use client'
// import { useState, useEffect } from 'react'

// const testimonials = [
//   { name: 'Sarah', text: 'This platform changed my life!' },
//   { name: 'Mark', text: 'Amazing experience, I highly recommend it.' },
// ]

// export default function LandingPage() {
//   const [index, setIndex] = useState(0)

//   // Auto-slide every 5 seconds
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % testimonials.length)
//     }, 5000)
//     return () => clearInterval(timer)
//   }, [])

//   const nextSlide = () => setIndex((prev) => (prev + 1) % testimonials.length)
//   const prevSlide = () =>
//     setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

//   return (
//     <section className='relative w-full h-screen bg-gradient-to-r from-pink-400 to-purple-500 flex flex-col justify-center items-center text-white'>
//       {/* Hero content */}
//       <div className='text-center max-w-2xl px-4'>
//         <h1 className='text-4xl md:text-6xl font-bold mb-4'>
//           Welcome to Our Platform
//         </h1>
//         <p className='text-lg md:text-xl mb-6'>
//           Connecting people, empowering ideas.
//         </p>
//         <div className='flex gap-4 justify-center'>
//           <button className='bg-white text-pink-500 px-6 py-2 rounded-lg font-semibold'>
//             Sign Up
//           </button>
//           <button className='bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold'>
//             Login
//           </button>
//         </div>
//       </div>

//       {/* Testimonials */}
//       <div className='absolute bottom-6 w-full flex flex-col items-center'>
//         <div className='bg-white text-black p-4 rounded-xl shadow-lg max-w-md text-center'>
//           <p className='italic'>"{testimonials[index].text}"</p>
//           <span className='font-bold mt-2 block'>
//             - {testimonials[index].name}
//           </span>
//         </div>
//         {/* Navigation */}
//         <div className='flex gap-4 mt-2'>
//           <button
//             onClick={prevSlide}
//             className='bg-gray-800 text-white p-2 rounded-full'
//           >
//             ◀
//           </button>
//           <button
//             onClick={nextSlide}
//             className='bg-gray-800 text-white p-2 rounded-full'
//           >
//             ▶
//           </button>
//         </div>
//       </div>
//     </section>
//   )
// }

'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/Button'
import { useRouter } from 'next/navigation'
const testimonials = [
  { name: 'Sarah', text: 'This platform changed my life!' },
  { name: 'Mark', text: 'Amazing experience, I highly recommend it.' },
]

export default function LandingPage() {
  const [index, setIndex] = useState(0)
  const router = useRouter()
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length)
    }, 100000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setIndex((prev) => (prev + 1) % testimonials.length)
  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section className='relative w-full h-screen flex flex-col justify-center items-center text-white bg-pink-500 overflow-hidden'>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className='text-center max-w-2xl px-4'
      >
        <h1 className='text-4xl md:text-6xl font-extrabold mb-4 leading-tight'>
          Find Love with <span className='text-yellow-300'>ATAKY</span>
        </h1>
        <p className='text-lg md:text-xl mb-8 opacity-90'>
          Join thousands of singles and start your journey to meaningful
          connections.
        </p>

        <div className='flex gap-4 justify-center'>
          <Button
            btnStyle='bg-white text-pink-600 px-6 py-3 rounded-2xl font-semibold shadow-md hover:scale-105 transition'
            title='Sign Up'
            onClick={() => router.push('/register')}
          />

          <Button
            btnStyle='bg-pink-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-md hover:scale-105 transition'
            title='login'
            onClick={() => router.push('/login')}
          />
        </div>
      </motion.div>

      <div className='absolute bottom-10 w-full flex flex-col items-center'>
        <div className='relative max-w-md w-full'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className='bg-white text-gray-900 p-6 rounded-2xl shadow-xl text-center'
            >
              <p className='italic text-lg'>“{testimonials[index].text}”</p>
              <span className='font-bold block mt-4'>
                - {testimonials[index].name}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className='flex gap-4 mt-4'>
          <button
            onClick={prevSlide}
            className='bg-gray-800/70 hover:bg-gray-900 text-white p-2 rounded-full shadow-lg transition'
          >
            ◀
          </button>
          <button
            onClick={nextSlide}
            className='bg-gray-800/70 hover:bg-gray-900 text-white p-2 rounded-full shadow-lg transition'
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  )
}
