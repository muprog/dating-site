'use client'

import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import dynamic from 'next/dynamic'
import { RootReducer } from '../store/rootReducer'
import Link from 'next/link'
import { FaHeart, FaUsers, FaSearch } from 'react-icons/fa'
import Image from 'next/image'

const Carousel = dynamic(
  () => import('react-responsive-carousel').then((m) => m.Carousel as any),
  { ssr: false }
) as any

export default function HomePage() {
  const { isAuthenticated, user } = useSelector(
    (state: RootReducer) => state.auth
  )
  const { ref: featuresRef, inView: featuresInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  })
  const { ref: socialRef, inView: socialInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  })

  const [usersCount, setUsersCount] = useState(0)
  const [matchesCount, setMatchesCount] = useState(0)
  const [satisfaction, setSatisfaction] = useState(0)

  useEffect(() => {
    if (!socialInView) return
    let startUsers = 0
    let startMatches = 0
    let startSatisfaction = 0
    const duration = 2000
    const stepTime = 20

    const incrementUsers = Math.ceil(10000 / (duration / stepTime))
    const incrementMatches = Math.ceil(500000 / (duration / stepTime))
    const incrementSatisfaction = Math.ceil(95 / (duration / stepTime))

    const interval = setInterval(() => {
      startUsers += incrementUsers
      startMatches += incrementMatches
      startSatisfaction += incrementSatisfaction

      setUsersCount(Math.min(startUsers, 10000))
      setMatchesCount(Math.min(startMatches, 500000))
      setSatisfaction(Math.min(startSatisfaction, 95))

      if (
        startUsers >= 10000 &&
        startMatches >= 500000 &&
        startSatisfaction >= 95
      ) {
        clearInterval(interval)
      }
    }, stepTime)

    return () => clearInterval(interval)
  }, [socialInView])

  const features = [
    {
      title: 'Smart Match',
      description: 'Our algorithm finds compatible partners',
      lottieUrl: 'heart.svg',
    },
    {
      title: 'Verified Users',
      description: 'Profiles are verified for authenticity',
      lottieUrl: 'verified.svg',
    },
    {
      title: 'Private Chat',
      description: 'Enjoy secure, private conversations',
      lottieUrl: 'message.svg',
    },
  ]

  const testimonials = [
    {
      image: 'girl.webp',
      quote: '"I met my soulmate here!"',
      name: 'Sarah, 28',
    },
    {
      image: 'man.webp',
      quote: '"Found my perfect match"',
      name: 'Mark, 32',
    },
  ]

  return (
    <div className='relative w-full min-h-screen bg-gradient-to-b from-pink-100 to-pink-50'>
      <style>{`
        @keyframes gradientMove {
          0% {background-position: 0% 50%;}
          50% {background-position: 100% 50%;}
          100% {background-position: 0% 50%;}
        }
        .animated-bg {
          background: linear-gradient(270deg, #fbc7d4, #f7749c, #ff91a4, #fbc7d4);
          background-size: 800% 800%;
          animation: gradientMove 15s ease infinite;
        }
        .button-animated:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 15px rgba(251, 114, 172, 0.4);
          transition: all 0.3s ease;
        }
      `}</style>

      {/* Hero Section with Top Image */}
      <section className='relative h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden animated-bg'>
        <Image
          src='/landing_page/top_image.webp'
          alt='Couple'
          fill
          priority
          className='object-cover'
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className='relative z-10 max-w-4xl px-6 text-center text-white'
        >
          <h1 className='text-4xl md:text-6xl font-extrabold drop-shadow-lg mb-4'>
            Find Love That Lasts
          </h1>
          <p className='text-lg md:text-2xl opacity-90 max-w-xl mx-auto mb-8'>
            Join thousands finding real connections
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            {isAuthenticated ? (
              <Link
                href='/profile'
                className='px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 transition shadow-lg text-white font-semibold text-lg cursor-pointer button-animated'
              >
                View Profile
              </Link>
            ) : (
              <Link
                href='/register'
                className='px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 transition shadow-lg text-white font-semibold text-lg cursor-pointer button-animated'
              >
                Get Started
              </Link>
            )}

            <Link
              href='/matches'
              className='px-6 py-3 rounded-full bg-white hover:bg-gray-100 transition shadow-lg text-pink-600 font-semibold text-lg cursor-pointer button-animated'
            >
              Browse Matches
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section
        ref={socialRef}
        className='flex flex-wrap justify-center gap-12 my-16 text-center max-w-6xl mx-auto px-4'
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={socialInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
          className='flex flex-col items-center'
        >
          <span className='text-5xl font-extrabold text-pink-600'>
            {usersCount.toLocaleString()}
          </span>
          <p className='text-gray-700 font-semibold'>Happy Members</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={socialInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className='flex flex-col items-center'
        >
          <span className='text-5xl font-extrabold text-pink-600'>
            {matchesCount.toLocaleString()}
          </span>
          <p className='text-gray-700 font-semibold'>Matches Made</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={socialInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className='flex flex-col items-center'
        >
          <span className='text-5xl font-extrabold text-pink-600'>
            {satisfaction}%
          </span>
          <p className='text-gray-700 font-semibold'>Satisfaction Rate</p>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className='max-w-6xl mx-auto p-8 md:p-16 bg-white rounded-xl shadow-lg mb-16'
      >
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className='text-3xl font-bold text-center mb-12'
        >
          Core Features
        </motion.h2>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-12'>
          {features.map(({ title, description, lottieUrl }) => (
            <motion.div
              key={title}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 15px 30px rgba(251, 114, 172, 0.4)',
              }}
              transition={{ type: 'spring', stiffness: 300 }}
              className='flex flex-col items-center text-center cursor-pointer rounded-lg p-4'
            >
              <Image
                src={`/landing_page/${lottieUrl}`}
                alt={title}
                width={48}
                height={48}
                className='mb-4 mx-auto'
              />

              <h3 className='mt-4 text-xl font-semibold text-pink-600'>
                {title}
              </h3>
              <p className='mt-2 text-gray-600'>{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* User Success Stories Section */}
      <section className='max-w-5xl mx-auto mb-16 px-4'>
        <h2 className='text-3xl font-bold text-center mb-8'>Success Stories</h2>

        <Carousel
          showThumbs={false}
          infiniteLoop
          autoPlay
          interval={8000}
          showStatus={false}
          swipeable
          emulateTouch
          dynamicHeight={false}
          className='rounded-lg shadow-lg bg-white p-6'
        >
          {testimonials.map(({ image, quote, name }, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className='flex flex-col items-center gap-4'
            >
              <div className='rounded-full overflow-hidden w-24 h-24'>
                <Image
                  src={`/landing_page/${image}`}
                  alt={name}
                  width={96}
                  height={96}
                  className='object-cover'
                />
              </div>
              <blockquote className='italic text-gray-700 text-lg max-w-xl text-center'>
                {quote}
              </blockquote>
              <p className='font-semibold text-pink-600'>{name}</p>
            </motion.div>
          ))}
        </Carousel>
      </section>

      {/* CTA Section */}
      <div className='py-24 bg-gradient-to-r from-pink-500 to-purple-600'>
        <div className='max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='text-4xl font-bold text-white mb-4'
          >
            Ready to Find Love?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='text-xl text-pink-100 mb-8'
          >
            Join thousands of happy couples who found their perfect match on our
            platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {!isAuthenticated && (
              <Link
                href='/login'
                className='bg-white text-purple-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-block font-semibold text-lg'
              >
                Start Your Journey
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      <footer className='bg-pink-600 text-white text-center py-6'>
        <p className='text-sm'>
          &copy; {new Date().getFullYear()} LoveConnect. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
