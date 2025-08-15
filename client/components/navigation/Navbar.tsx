'use client'

import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { FaUser, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa'
import { RootReducer } from '../../store/rootReducer'
import { logoutRequest } from '../../store/auth/authSlice'
import Link from 'next/link'

const Navbar: React.FC = () => {
  const dispatch = useDispatch()
  const { user, isAuthenticated } = useSelector(
    (state: RootReducer) => state.auth
  )

  const handleLogout = () => {
    dispatch(logoutRequest())
  }

  return (
    <nav className='bg-white shadow-lg border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} className='flex-shrink-0'>
            <Link href='/' className='text-2xl font-bold text-purple-600'>
              DatingSite
            </Link>
          </motion.div>

          {/* Navigation Links */}
          <div className='hidden md:block'>
            <div className='ml-10 flex items-baseline space-x-4'>
              <Link
                href='/'
                className='text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200'
              >
                Home
              </Link>
              <Link
                href='/matches'
                className='text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200'
              >
                Matches
              </Link>
              <Link
                href='/profile'
                className='text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200'
              >
                Profile
              </Link>
            </div>
          </div>

          {/* Auth Section */}
          <div className='flex items-center space-x-4'>
            {isAuthenticated && user ? (
              <div className='flex items-center space-x-4'>
                {/* User Avatar */}
                <motion.div whileHover={{ scale: 1.05 }} className='relative'>
                  <Link href='/profile' className='flex items-center space-x-2'>
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className='w-8 h-8 rounded-full border-2 border-purple-200'
                      />
                    ) : (
                      <div className='w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold'>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className='hidden md:block text-sm font-medium text-gray-700'>
                      {user.name}
                    </span>
                  </Link>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className='flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium'
                >
                  <FaSignOutAlt />
                  <span className='hidden md:block'>Logout</span>
                </motion.button>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href='/login'
                  className='flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium'
                >
                  <FaSignInAlt />
                  <span className='hidden md:block'>Sign In</span>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
