'use client'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState, AppDispatch } from '../../store/store'
import { getRecommendationsRequest } from '../../store/slices/discoverySlice'
import { createSwipeRequest } from '../../store/slices/swipeSlice'
import { checkAuthRequest } from '../../store/slices/authSlice'

interface UserProfile {
  _id: string
  name: string
  age: number
  bio: string
  photos: string[]
  gender: string
  interests: string[]
  location: string
  geoLocation: {
    type: string
    coordinates: [number, number]
  }
}

const DiscoveryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const { user: authUser, loading: authLoading } = useSelector(
    (state: RootState) => state.auth
  )
  const {
    recommendedUsers,
    loading: recommendationsLoading,
    error: recommendationsError,
  } = useSelector((state: RootState) => state.discovery)
  const { loading: swipeLoading, lastMatch } = useSelector(
    (state: RootState) => state.swipe
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatchModal, setShowMatchModal] = useState(false)

  useEffect(() => {
    // Check authentication
    if (!authUser) {
      dispatch(checkAuthRequest())
    }
  }, [authUser, dispatch])

  useEffect(() => {
    if (authUser && !recommendationsLoading && recommendedUsers.length === 0) {
      // Get user location and fetch recommendations
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            dispatch(getRecommendationsRequest({ latitude, longitude }))
          },
          () => {
            // If location fails, proceed without it
            dispatch(getRecommendationsRequest({}))
          }
        )
      } else {
        dispatch(getRecommendationsRequest({}))
      }
    }
  }, [authUser, dispatch, recommendationsLoading, recommendedUsers.length])

  useEffect(() => {
    if (lastMatch) {
      setShowMatchModal(true)
      const timer = setTimeout(() => {
        setShowMatchModal(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastMatch])

  const handleSwipe = (action: 'like' | 'pass') => {
    if (currentIndex >= recommendedUsers.length || !authUser) return

    const swipedUser = recommendedUsers[currentIndex]

    dispatch(
      createSwipeRequest({
        swipedUserId: swipedUser._id,
        action: action,
      })
    )

    setCurrentIndex((prev) => prev + 1)
  }

  const handleViewProfile = () => {
    router.push('/profile')
  }

  const handleViewMatches = () => {
    router.push('/matches')
  }

  // Loading states
  if (!authUser || authLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  if (recommendationsLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-gray-600'>Finding people near you...</p>
        </div>
      </div>
    )
  }

  if (recommendationsError) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
        <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
          <div className='text-6xl mb-4'>😕</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Something went wrong
          </h2>
          <p className='text-gray-600 mb-4'>{recommendationsError}</p>
          <button
            onClick={() => window.location.reload()}
            className='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (
    currentIndex >= recommendedUsers.length ||
    recommendedUsers.length === 0
  ) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
        <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
          <div className='text-6xl mb-4'>😢</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            {recommendedUsers.length === 0
              ? 'No profiles found'
              : 'No more profiles'}
          </h2>
          <p className='text-gray-600 mb-6'>
            {recommendedUsers.length === 0
              ? 'No potential matches found in your area.'
              : "You've seen all potential matches in your area."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  const currentUser = recommendedUsers[currentIndex]

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50'>
      {/* Match Modal */}
      {showMatchModal && lastMatch && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-3xl p-8 text-center max-w-sm w-full'>
            <div className='text-6xl mb-4'>🎉</div>
            <h3 className='text-2xl font-bold text-gray-900 mb-2'>
              It's a Match!
            </h3>
            <p className='text-gray-600 mb-4'>
              You matched with {lastMatch.name}
            </p>
            <button
              onClick={() => setShowMatchModal(false)}
              className='bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600 transition-colors'
            >
              Continue Swiping
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className='bg-white shadow-sm py-4 px-6'>
        <div className='max-w-2xl mx-auto flex justify-between items-center'>
          <button
            onClick={handleViewProfile}
            className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors'
            disabled={swipeLoading}
          >
            <span className='text-lg'>👤</span>
          </button>

          <h1 className='text-xl font-bold text-gray-900'>Discover</h1>

          <button
            onClick={handleViewMatches}
            className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative'
            disabled={swipeLoading}
          >
            <span className='text-lg'>💌</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <div className='max-w-md mx-auto pt-8 px-4'>
        <div className='bg-white rounded-3xl shadow-lg overflow-hidden'>
          {/* Photo */}
          <div className='relative h-96'>
            {currentUser.photos && currentUser.photos.length > 0 ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${currentUser.photos[0]}`}
                alt={currentUser.name}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg'>
                No Photo
              </div>
            )}
          </div>

          {/* User Information */}
          <div className='p-6'>
            <div className='flex justify-between items-start mb-4'>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>
                  {currentUser.name}, {currentUser.age}
                </h2>
                <p className='text-gray-600'>{currentUser.gender}</p>
              </div>
            </div>

            {currentUser.bio && (
              <p className='text-gray-700 mb-4 leading-relaxed'>
                {currentUser.bio}
              </p>
            )}

            {currentUser.location && (
              <p className='text-gray-600 text-sm mb-4 flex items-center gap-1'>
                📍 {currentUser.location}
              </p>
            )}

            {currentUser.interests && currentUser.interests.length > 0 && (
              <div className='mb-2'>
                <h3 className='text-sm font-semibold text-gray-900 mb-2'>
                  Interests
                </h3>
                <div className='flex flex-wrap gap-2'>
                  {currentUser.interests.slice(0, 4).map((interest, index) => (
                    <span
                      key={index}
                      className='bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium'
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-center gap-8 mt-8 pb-8'>
          <button
            onClick={() => handleSwipe('pass')}
            disabled={swipeLoading}
            className='w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50'
          >
            <span className='text-2xl'>❌</span>
          </button>

          <button
            onClick={() => handleSwipe('like')}
            disabled={swipeLoading}
            className='w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50'
          >
            <span className='text-2xl'>💖</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiscoveryPage
