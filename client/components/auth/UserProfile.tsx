'use client'

import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa'
import { RootReducer } from '../../store/rootReducer'
import { updateUserProfileRequest } from '../../store/auth/authSlice'

const UserProfile: React.FC = () => {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state: RootReducer) => state.auth)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    if (user) {
      dispatch(
        updateUserProfileRequest({
          userId: user.id,
          updates: formData,
        })
      )
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            User not found
          </h2>
          <p className='text-gray-600'>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 py-12 px-4'>
      <div className='max-w-4xl mx-auto'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='bg-white rounded-2xl shadow-2xl overflow-hidden'
        >
          {/* Header */}
          <div className='bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-white text-center'>
            <div className='w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg'>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full bg-white/20 flex items-center justify-center text-4xl font-bold'>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className='text-4xl font-bold mb-2'>{user.name}</h1>
            <p className='text-purple-100 text-lg'>
              Signed in with {user.provider}
            </p>
          </div>

          {/* Profile Content */}
          <div className='p-8'>
            <div className='flex justify-between items-center mb-8'>
              <h2 className='text-2xl font-bold text-gray-800'>
                Profile Information
              </h2>
              {!isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className='flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200'
                >
                  <FaEdit />
                  Edit Profile
                </motion.button>
              ) : (
                <div className='flex gap-2'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={loading}
                    className='flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50'
                  >
                    <FaSave />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className='flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200'
                  >
                    <FaTimes />
                    Cancel
                  </motion.button>
                </div>
              )}
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  />
                ) : (
                  <p className='text-lg text-gray-800'>{user.name}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                  />
                ) : (
                  <p className='text-lg text-gray-800'>{user.email}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Authentication Provider
                </label>
                <div className='flex items-center gap-2'>
                  {user.provider === 'google' ? (
                    <span className='inline-flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium'>
                      <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                      Google
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium'>
                      <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                      Facebook
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Member Since
                </label>
                <p className='text-lg text-gray-800'>
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default UserProfile
