'use client'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState, AppDispatch } from '../../store/store'
import { checkAuthRequest } from '../../store/slices/authSlice'
import { getMatchesRequest } from '../../store/slices/matchSlice'
import Button from '../../components/Button'

interface Match {
  _id: string
  user: {
    _id: string
    name: string
    age: number
    photos: string[]
    bio: string
    gender: string
    location: string
  }
  createdAt: string
}

const MatchesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const { user: authUser, loading: authLoading } = useSelector(
    (state: RootState) => state.auth
  )
  const {
    matches,
    loading: matchesLoading,
    error,
  } = useSelector((state: RootState) => state.match)

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [hasFetchedMatches, setHasFetchedMatches] = useState(false)

  // Check authentication
  useEffect(() => {
    if (!authUser) {
      dispatch(checkAuthRequest())
    }
  }, [authUser, dispatch])

  // Fetch matches - FIXED: Removed the circular dependency
  useEffect(() => {
    if (authUser && !hasFetchedMatches && !matchesLoading) {
      dispatch(getMatchesRequest())
      setHasFetchedMatches(true)
    }
  }, [authUser, hasFetchedMatches, matchesLoading, dispatch])

  const handleViewProfile = (match: Match) => {
    setSelectedMatch(match)
  }

  const handleCloseProfile = () => {
    setSelectedMatch(null)
  }

  const handleSendMessage = (userId: string) => {
    // Navigate to chat page or open chat modal
    console.log('Start chat with user:', userId)
    router.push(`/message`)
  }

  const handleBackToDiscovery = () => {
    router.push('/discovery')
  }

  // Refresh matches function
  const handleRefreshMatches = () => {
    setHasFetchedMatches(false)
  }

  if (!authUser || authLoading) {
    return <LoadingScreen />
  }

  if (matchesLoading && !hasFetchedMatches) {
    return <LoadingScreen message='Loading your matches...' />
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => {
          setHasFetchedMatches(false)
          dispatch(getMatchesRequest())
        }}
      />
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div className='flex items-center gap-4'>
            <Button
              title='←'
              onClick={handleBackToDiscovery}
              btnStyle='w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 p-0 min-w-0 text-xl'
            />
            <h1 className='text-3xl font-bold text-gray-900'>Your Matches</h1>
            {matches.length > 0 && (
              <span className='bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <Button
            title='Refresh'
            onClick={handleRefreshMatches}
            btnStyle='bg-white text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 font-medium'
          />
        </div>

        {/* Matches Grid */}
        {matches.length === 0 ? (
          <EmptyMatchesScreen />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {matches.map((match) => (
              <MatchCard
                key={match._id}
                match={match}
                onViewProfile={handleViewProfile}
                onSendMessage={handleSendMessage}
              />
            ))}
          </div>
        )}

        {/* Profile Modal */}
        {selectedMatch && (
          <MatchProfileModal
            match={selectedMatch}
            onClose={handleCloseProfile}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  )
}

// Match Card Component
const MatchCard = ({ match, onViewProfile, onSendMessage }: any) => (
  <div className='bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300'>
    <div className='relative h-64'>
      {match.user.photos && match.user.photos.length > 0 ? (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${match.user.photos[0]}`}
          alt={match.user.name}
          className='w-full h-full object-cover'
        />
      ) : (
        <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg'>
          No Photo
        </div>
      )}

      {/* Match Date Badge */}
      <div className='absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs'>
        {new Date(match.createdAt).toLocaleDateString()}
      </div>
    </div>

    <div className='p-4'>
      <div className='flex justify-between items-start mb-3'>
        <div>
          <h3 className='text-xl font-bold text-gray-900'>
            {match.user.name}, {match.user.age}
          </h3>
          <p className='text-gray-600 text-sm'>{match.user.gender}</p>
        </div>
        <div className='text-2xl'>💖</div>
      </div>

      {match.user.bio && (
        <p className='text-gray-700 text-sm mb-3 line-clamp-2'>
          {match.user.bio}
        </p>
      )}

      {match.user.location && (
        <p className='text-gray-600 text-sm mb-4 flex items-center gap-1'>
          📍 {match.user.location}
        </p>
      )}

      <div className='flex gap-2'>
        <Button
          title='View Profile'
          onClick={() => onViewProfile(match)}
          btnStyle='flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium'
        />
        <Button
          title='💬 Chat'
          onClick={() => onSendMessage(match.user._id)}
          btnStyle='flex-1 bg-pink-500 text-white px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors text-sm font-medium'
        />
      </div>
    </div>
  </div>
)

// Match Profile Modal Component
const MatchProfileModal = ({ match, onClose, onSendMessage }: any) => (
  <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
    <div className='bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
      {/* Header */}
      <div className='flex justify-between items-center p-6 border-b border-gray-200'>
        <h2 className='text-2xl font-bold text-gray-900'>Match Profile</h2>
        <Button
          title='✕'
          onClick={onClose}
          btnStyle='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors p-0 min-w-0'
        />
      </div>

      {/* Content */}
      <div className='p-6'>
        {/* Photo */}
        <div className='relative h-80 rounded-xl overflow-hidden mb-6'>
          {match.user.photos && match.user.photos.length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${match.user.photos[0]}`}
              alt={match.user.name}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl'>
              No Photo
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className='text-center mb-6'>
          <h3 className='text-3xl font-bold text-gray-900 mb-2'>
            {match.user.name}, {match.user.age}
          </h3>
          <p className='text-gray-600 text-lg mb-4'>{match.user.gender}</p>
          {match.user.location && (
            <p className='text-gray-600 flex items-center justify-center gap-2'>
              📍 {match.user.location}
            </p>
          )}
        </div>

        {/* Bio */}
        {match.user.bio && (
          <div className='mb-6'>
            <h4 className='text-lg font-semibold text-gray-900 mb-2'>About</h4>
            <p className='text-gray-700 leading-relaxed'>{match.user.bio}</p>
          </div>
        )}

        {/* Match Date */}
        <div className='bg-pink-50 rounded-xl p-4 mb-6'>
          <div className='flex items-center justify-center gap-2 text-pink-800'>
            <span className='text-2xl'>💖</span>
            <span className='font-medium'>
              Matched on {new Date(match.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <Button
            title='Close'
            onClick={onClose}
            btnStyle='flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium'
          />
          <Button
            title='Start Chat 💬'
            onClick={() => onSendMessage(match.user._id)}
            btnStyle='flex-1 bg-pink-500 text-white px-4 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium'
          />
        </div>
      </div>
    </div>
  </div>
)

// Empty State Component
const EmptyMatchesScreen = () => (
  <div className='text-center bg-white rounded-2xl p-12 shadow-lg'>
    <div className='text-6xl mb-6'>💔</div>
    <h2 className='text-2xl font-bold text-gray-900 mb-4'>No Matches Yet</h2>
    <p className='text-gray-600 mb-8 max-w-md mx-auto'>
      You haven't matched with anyone yet. Keep swiping to find your perfect
      match!
    </p>
    <Button
      title='Start Swiping'
      onClick={() => (window.location.href = '/discovery')}
      btnStyle='bg-pink-500 text-white px-8 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium'
    />
  </div>
)

// Loading Screen Component
const LoadingScreen = ({ message = 'Loading...' }) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
      <p className='text-gray-600'>{message}</p>
    </div>
  </div>
)

// Error Screen Component
const ErrorScreen = ({ error, onRetry }: any) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4'>
      <div className='text-6xl mb-4'>😕</div>
      <h2 className='text-2xl font-bold text-gray-900 mb-4'>
        Something went wrong
      </h2>
      <p className='text-gray-600 mb-4'>{error}</p>
      <Button
        title='Try Again'
        onClick={onRetry}
        btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
      />
    </div>
  </div>
)

export default MatchesPage
