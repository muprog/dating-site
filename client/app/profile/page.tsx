'use client'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState, AppDispatch } from '../../store/store'
import {
  getProfileRequest,
  updateProfileRequest,
  uploadPhotosRequest,
  deletePhotoRequest,
  clearMessage,
  clearError,
} from '../../store/slices/profileSlice'
import { checkAuthRequest } from '../../store/slices/authSlice'

interface ProfileFormData {
  name: string
  age: string
  bio: string
  interests: string[]
  location: string
}

// Reverse geocoding function
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()

    const city = data.city || data.locality || ''
    const country = data.countryName || ''

    if (city && country) {
      return `${city}, ${country}`
    } else if (city) {
      return city
    } else if (country) {
      return country
    } else {
      return 'Unknown location'
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return 'Location unavailable'
  }
}

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { user: authUser, checkingAuth } = useSelector(
    (state: RootState) => state.auth
  )
  const {
    user: profileUser,
    loading,
    error,
    message,
  } = useSelector((state: RootState) => state.profile)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    age: '',
    bio: '',
    interests: [],
    location: '',
  })
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [currentInterest, setCurrentInterest] = useState('')
  const [isConvertingLocation, setIsConvertingLocation] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  )
  const [isClosing, setIsClosing] = useState(false)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Check file sizes before uploading
      const maxSize = 10 * 1024 * 1024 // 10MB in bytes
      const oversizedFiles = Array.from(files).filter(
        (file) => file.size > maxSize
      )

      if (oversizedFiles.length > 0) {
        const oversizedFileSizes = oversizedFiles
          .map(
            (file) => `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
          )
          .join('\n')

        alert(
          `The following files exceed the 10MB limit:\n\n${oversizedFileSizes}\n\nPlease select smaller files.`
        )
        e.target.value = ''
        return
      }

      const totalSize = Array.from(files).reduce(
        (total, file) => total + file.size,
        0
      )
      if (totalSize > 50 * 1024 * 1024) {
        alert(
          `Total files size (${(totalSize / 1024 / 1024).toFixed(
            2
          )}MB) exceeds the 50MB limit. Please select fewer or smaller files.`
        )
        e.target.value = ''
        return
      }

      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('photos', file)
      })

      console.log('📸 Uploading photos...')
      dispatch(uploadPhotosRequest(formData))
      e.target.value = ''
    }
  }

  const handleDeletePhoto = (index: number) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      console.log('🗑️ Deleting photo at index:', index)
      dispatch(deletePhotoRequest(index.toString()))
    }
  }

  // Check authentication
  useEffect(() => {
    if (!hasCheckedAuth) {
      dispatch(checkAuthRequest())
      setHasCheckedAuth(true)
    }
  }, [dispatch, hasCheckedAuth])

  // Handle auth check result
  useEffect(() => {
    if (!checkingAuth && !authUser && hasCheckedAuth) {
      router.push('/login')
    }
  }, [checkingAuth, authUser, hasCheckedAuth, router])

  const userId = authUser?.id || authUser?._id

  // Load profile if user is authenticated
  useEffect(() => {
    if (!checkingAuth && authUser && userId && !profileUser && !loading) {
      dispatch(getProfileRequest())
    }
  }, [authUser, userId, profileUser, loading, checkingAuth, dispatch])

  // Set form data when profile loads
  useEffect(() => {
    if (profileUser) {
      console.log('✅ Profile loaded:', profileUser)
      setFormData({
        name: profileUser.name || '',
        age: profileUser.age?.toString() || '',
        bio: profileUser.bio || '',
        interests: profileUser.interests || [],
        location: profileUser.location || '',
      })
    }
  }, [profileUser])

  // Get current location and convert to place name
  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          console.log('📍 Current coordinates:', latitude, longitude)

          try {
            setIsConvertingLocation(true)
            const locationName = await reverseGeocode(latitude, longitude)
            console.log('✅ Location found:', locationName)

            setFormData((prev) => ({
              ...prev,
              location: locationName,
            }))
          } catch (error) {
            console.error('❌ Error reverse geocoding:', error)
            const fallbackLocation = `${latitude.toFixed(
              4
            )}, ${longitude.toFixed(4)}`
            setFormData((prev) => ({
              ...prev,
              location: fallbackLocation,
            }))
            alert('Got your location but could not determine the place name.')
          } finally {
            setIsConvertingLocation(false)
          }
        },
        (error) => {
          console.error('❌ Error getting location:', error)
          alert(
            'Unable to get your current location. Please enter it manually.'
          )
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearMessage())
        if (isEditing) {
          setIsEditing(false)
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message, dispatch, isEditing])

  useEffect(() => {
    if (error) {
      console.error('❌ Profile error:', error)
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updateData: any = {
      name: formData.name,
      bio: formData.bio,
      interests: formData.interests.filter(
        (interest) => interest.trim() !== ''
      ),
      location: formData.location,
    }

    if (formData.age) {
      updateData.age = parseInt(formData.age)
    }

    console.log('📤 Updating profile:', updateData)
    dispatch(updateProfileRequest(updateData))
  }

  const handleInputChange = (
    field: keyof Omit<ProfileFormData, 'interests'>,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Interest management functions
  const addInterest = () => {
    if (
      currentInterest.trim() &&
      !formData.interests.includes(currentInterest.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, currentInterest.trim()],
      }))
      setCurrentInterest('')
    }
  }

  const removeInterest = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index),
    }))
  }

  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInterest()
    }
  }

  // Gallery functions
  const openGallery = (index: number) => {
    setSelectedPhotoIndex(index)
    setIsClosing(false)
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  const closeGallery = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedPhotoIndex(null)
      setIsClosing(false)
      document.body.style.overflow = 'unset'
    }, 300)
  }

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null || !profileUser?.photos) return

    const totalPhotos = profileUser.photos.length
    let newIndex: number

    if (direction === 'prev') {
      newIndex =
        selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : totalPhotos - 1
    } else {
      newIndex =
        selectedPhotoIndex < totalPhotos - 1 ? selectedPhotoIndex + 1 : 0
    }

    setSelectedPhotoIndex(newIndex)
  }

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return

      switch (e.key) {
        case 'Escape':
          closeGallery()
          break
        case 'ArrowLeft':
          navigateGallery('prev')
          break
        case 'ArrowRight':
          navigateGallery('next')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhotoIndex, profileUser?.photos])

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show loading while profile is being fetched
  if ((loading && !profileUser) || (authUser && !profileUser)) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header Section */}
        <div className='bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-8'>
          {/* Profile Header with Background */}
          <div className='bg-gradient-to-r from-pink-500 to-purple-600 h-32 relative'>
            <div className='absolute -bottom-16 left-8'>
              {/* Circular Profile Photo */}
              <div className='w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden'>
                {profileUser?.photos && profileUser.photos.length > 0 ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[0]}`}
                    alt='Profile'
                    className='w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300'
                    onClick={() => openGallery(0)}
                  />
                ) : (
                  <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                    <span className='text-gray-500 text-sm font-medium'>
                      Add Photo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className='pt-20 px-8 pb-8'>
            <div className='flex justify-between items-start mb-6'>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    {isEditing ? (
                      <div className='flex items-center gap-3'>
                        <input
                          type='text'
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange('name', e.target.value)
                          }
                          className='border-b-2 border-gray-300 focus:border-pink-500 outline-none text-3xl font-bold bg-transparent'
                          placeholder='Your name'
                        />
                        {isEditing && (
                          <input
                            type='number'
                            value={formData.age}
                            onChange={(e) =>
                              handleInputChange('age', e.target.value)
                            }
                            className='border-b-2 border-gray-300 w-16 focus:border-pink-500 outline-none bg-transparent'
                            placeholder='Age'
                            min='18'
                            max='100'
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        {profileUser?.name || authUser?.name || 'User'}
                        {profileUser?.age && (
                          <span className='text-gray-600'>
                            , {profileUser.age}
                          </span>
                        )}
                      </>
                    )}
                  </h1>
                </div>
                <p className='text-gray-500 text-lg flex items-center gap-2'>
                  📍{' '}
                  {formData.location || profileUser?.location || 'Add location'}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
                className='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium shadow-sm'
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {/* About Me Section */}
            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                About Me
              </h2>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className='w-full border border-gray-200 rounded-xl p-4 focus:border-pink-500 outline-none resize-none bg-gray-50'
                  rows={4}
                  placeholder='Tell us about yourself...'
                  maxLength={500}
                />
              ) : (
                <p className='text-gray-700 text-lg leading-relaxed'>
                  {profileUser?.bio ||
                    "I'm a creative soul with a passion for art, music, and exploring new cultures. Let's connect and share our stories!"}
                </p>
              )}
            </div>

            {/* Location Section */}
            {isEditing && (
              <div className='mb-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-3'>
                  Location
                </h3>
                <div className='space-y-3'>
                  <div className='flex gap-3'>
                    <input
                      type='text'
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange('location', e.target.value)
                      }
                      className='flex-1 border border-gray-200 rounded-xl p-3 focus:border-pink-500 outline-none bg-gray-50'
                      placeholder='Enter your location (e.g., San Francisco, CA)'
                    />
                    <button
                      type='button'
                      onClick={getCurrentLocation}
                      disabled={isConvertingLocation}
                      className='bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50 font-medium'
                    >
                      {isConvertingLocation ? (
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto'></div>
                      ) : (
                        'Use Current'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Interests Section */}
            <div className='mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Interests
              </h3>
              {isEditing ? (
                <div className='space-y-4'>
                  <div className='flex gap-3'>
                    <input
                      type='text'
                      value={currentInterest}
                      onChange={(e) => setCurrentInterest(e.target.value)}
                      onKeyPress={handleInterestKeyPress}
                      className='flex-1 border border-gray-200 rounded-xl p-3 focus:border-pink-500 outline-none bg-gray-50'
                      placeholder='Add an interest'
                    />
                    <button
                      type='button'
                      onClick={addInterest}
                      className='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium'
                    >
                      Add
                    </button>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {formData.interests.map((interest, index) => (
                      <div
                        key={index}
                        className='bg-pink-100 text-pink-800 px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium'
                      >
                        {interest}
                        <button
                          type='button'
                          onClick={() => removeInterest(index)}
                          className='text-pink-600 hover:text-pink-800 text-sm'
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.interests.length === 0 && (
                      <p className='text-gray-500 text-sm'>
                        No interests added yet
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className='flex flex-wrap gap-3'>
                  {profileUser?.interests?.map(
                    (interest: string, index: number) => (
                      <span
                        key={index}
                        className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm'
                      >
                        {interest}
                      </span>
                    )
                  )}
                  {(!profileUser?.interests ||
                    profileUser.interests.length === 0) && (
                    <div className='flex flex-wrap gap-3'>
                      <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm'>
                        Art
                      </span>
                      <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm'>
                        Music
                      </span>
                      <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm'>
                        Travel
                      </span>
                      <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm'>
                        Foodie
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Changes Button */}
            {isEditing && (
              <div className='flex gap-4'>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium text-lg shadow-lg'
                >
                  {loading ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      Saving...
                    </div>
                  ) : (
                    `${message ? 'Loading...' : 'Save Changes'}`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Photos Section */}
        <div className='bg-white rounded-3xl shadow-lg border border-gray-100 p-8'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-xl font-semibold text-gray-900'>Photos</h3>
            <label className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all cursor-pointer disabled:opacity-50 font-medium shadow-sm'>
              {loading ? 'Uploading...' : 'Upload Photos'}
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={handlePhotoUpload}
                disabled={loading}
                className='hidden'
              />
            </label>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {profileUser?.photos?.map((photo: string, index: number) => (
              <div key={index} className='relative group'>
                <div
                  className='w-full h-32 rounded-xl overflow-hidden cursor-pointer shadow-md'
                  onClick={() => openGallery(index)}
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
                    alt={`Profile ${index + 1}`}
                    className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(index)
                  }}
                  disabled={loading}
                  className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md'
                  title='Delete photo'
                >
                  ×
                </button>
              </div>
            ))}

            {(!profileUser?.photos || profileUser.photos.length === 0) && (
              <>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-32 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 font-medium'>Hiking</span>
                </div>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-32 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 font-medium'>Photography</span>
                </div>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-32 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 font-medium'>Travel</span>
                </div>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-32 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 font-medium'>Food</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Professional Gallery Modal */}
      {selectedPhotoIndex !== null && profileUser?.photos && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
            isClosing ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-95'
          }`}
          onClick={closeGallery}
        >
          <div
            className={`relative max-w-6xl max-h-full w-full h-full flex items-center justify-center transition-transform duration-300 ${
              isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Image */}
            <div className='relative flex-1 flex items-center justify-center h-full'>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[selectedPhotoIndex]}`}
                alt='Gallery view'
                className='max-w-full max-h-full object-contain rounded-lg'
              />
            </div>

            {/* Navigation Arrows */}
            {profileUser.photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateGallery('prev')
                  }}
                  className='absolute left-4  bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 19l-7-7 7-7'
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateGallery('next')
                  }}
                  className='absolute right-4  bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20'
                >
                  <svg
                    className='w-6 h-6'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={closeGallery}
              className='absolute top-4 right-4 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>

            {/* Image Counter */}
            <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm'>
              {selectedPhotoIndex + 1} / {profileUser.photos.length}
            </div>

            {/* Thumbnail Strip */}
            <div className='absolute bottom-4 left-4 right-4 flex justify-center'>
              <div className='flex gap-2 max-w-full overflow-x-auto py-2 px-4 bg-black bg-opacity-30 rounded-2xl backdrop-blur-sm'>
                {profileUser.photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                      index === selectedPhotoIndex
                        ? 'border-white border-opacity-80'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhotoIndex(index)
                    }}
                  >
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
                      alt={`Thumbnail ${index + 1}`}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const link = document.createElement('a')
                link.href = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[selectedPhotoIndex]}`
                link.download = `photo-${selectedPhotoIndex + 1}.jpg`
                link.click()
              }}
              className='absolute top-4 left-4 bg-whit bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 text-sm font-medium'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              Download
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {message && (
        <div className='fixed top-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'>
          {message}
        </div>
      )}

      {error && (
        <div className='fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'>
          {error}
        </div>
      )}
    </div>
  )
}

export default ProfilePage
