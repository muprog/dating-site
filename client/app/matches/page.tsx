// 'use client'
// import React, { useEffect, useState } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { useRouter } from 'next/navigation'
// import { RootState, AppDispatch } from '../../store/store'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import { getMatchesRequest } from '../../store/slices/matchSlice'
// import Button from '../../components/Button'

// interface Match {
//   _id: string
//   user: {
//     _id: string
//     name: string
//     age: number
//     photos: string[]
//     bio: string
//     gender: string
//     location: string
//   }
//   createdAt: string
// }

// const MatchesPage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>()
//   const router = useRouter()

//   const { user: authUser, loading: authLoading } = useSelector(
//     (state: RootState) => state.auth
//   )
//   const {
//     matches,
//     loading: matchesLoading,
//     error,
//   } = useSelector((state: RootState) => state.match)

//   const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
//   const [hasFetchedMatches, setHasFetchedMatches] = useState(false)

//   // Check authentication
//   useEffect(() => {
//     if (!authUser) {
//       dispatch(checkAuthRequest())
//     }
//   }, [authUser, dispatch])

//   // Fetch matches - FIXED: Removed the circular dependency
//   useEffect(() => {
//     if (authUser && !hasFetchedMatches && !matchesLoading) {
//       dispatch(getMatchesRequest())
//       setHasFetchedMatches(true)
//     }
//   }, [authUser, hasFetchedMatches, matchesLoading, dispatch])

//   const handleViewProfile = (match: Match) => {
//     setSelectedMatch(match)
//   }

//   const handleCloseProfile = () => {
//     setSelectedMatch(null)
//   }

//   const handleSendMessage = (userId: string) => {
//     // Navigate to chat page or open chat modal
//     console.log('Start chat with user:', userId)
//     router.push(`/message`)
//   }

//   const handleBackToDiscovery = () => {
//     router.push('/discovery')
//   }

//   // Refresh matches function
//   const handleRefreshMatches = () => {
//     setHasFetchedMatches(false)
//   }

//   if (!authUser || authLoading) {
//     return <LoadingScreen />
//   }

//   if (matchesLoading && !hasFetchedMatches) {
//     return <LoadingScreen message='Loading your matches...' />
//   }

//   if (error) {
//     return (
//       <ErrorScreen
//         error={error}
//         onRetry={() => {
//           setHasFetchedMatches(false)
//           dispatch(getMatchesRequest())
//         }}
//       />
//     )
//   }

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8 px-4'>
//       <div className='max-w-4xl mx-auto'>
//         {/* Header */}
//         <div className='flex justify-between items-center mb-8'>
//           <div className='flex items-center gap-4'>
//             <Button
//               title='←'
//               onClick={handleBackToDiscovery}
//               btnStyle='w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 p-0 min-w-0 text-xl'
//             />
//             <h1 className='text-3xl font-bold text-gray-900'>Your Matches</h1>
//             {matches.length > 0 && (
//               <span className='bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
//                 {matches.length} match{matches.length !== 1 ? 'es' : ''}
//               </span>
//             )}
//           </div>
//           <Button
//             title='Refresh'
//             onClick={handleRefreshMatches}
//             btnStyle='bg-white text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 font-medium'
//           />
//         </div>

//         {/* Matches Grid */}
//         {matches.length === 0 ? (
//           <EmptyMatchesScreen />
//         ) : (
//           <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
//             {matches.map((match) => (
//               <MatchCard
//                 key={match._id}
//                 match={match}
//                 onViewProfile={handleViewProfile}
//                 onSendMessage={handleSendMessage}
//               />
//             ))}
//           </div>
//         )}

//         {/* Profile Modal */}
//         {selectedMatch && (
//           <MatchProfileModal
//             match={selectedMatch}
//             onClose={handleCloseProfile}
//             onSendMessage={handleSendMessage}
//           />
//         )}
//       </div>
//     </div>
//   )
// }

// // Match Card Component
// const MatchCard = ({ match, onViewProfile, onSendMessage }: any) => (
//   <div className='bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300'>
//     <div className='relative h-64'>
//       {match.user.photos && match.user.photos.length > 0 ? (
//         <img
//           src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${match.user.photos[0]}`}
//           alt={match.user.name}
//           className='w-full h-full object-cover'
//         />
//       ) : (
//         <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg'>
//           No Photo
//         </div>
//       )}

//       {/* Match Date Badge */}
//       <div className='absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs'>
//         {new Date(match.createdAt).toLocaleDateString()}
//       </div>
//     </div>

//     <div className='p-4'>
//       <div className='flex justify-between items-start mb-3'>
//         <div>
//           <h3 className='text-xl font-bold text-gray-900'>
//             {match.user.name}, {match.user.age}
//           </h3>
//           <p className='text-gray-600 text-sm'>{match.user.gender}</p>
//         </div>
//         <div className='text-2xl'>💖</div>
//       </div>

//       {match.user.bio && (
//         <p className='text-gray-700 text-sm mb-3 line-clamp-2'>
//           {match.user.bio}
//         </p>
//       )}

//       {match.user.location && (
//         <p className='text-gray-600 text-sm mb-4 flex items-center gap-1'>
//           📍 {match.user.location}
//         </p>
//       )}

//       <div className='flex gap-2'>
//         <Button
//           title='View Profile'
//           onClick={() => onViewProfile(match)}
//           btnStyle='flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium'
//         />
//         <Button
//           title='💬 Chat'
//           onClick={() => onSendMessage(match.user._id)}
//           btnStyle='flex-1 bg-pink-500 text-white px-4 py-2 rounded-xl hover:bg-pink-600 transition-colors text-sm font-medium'
//         />
//       </div>
//     </div>
//   </div>
// )

// // Match Profile Modal Component
// const MatchProfileModal = ({ match, onClose, onSendMessage }: any) => (
//   <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
//     <div className='bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
//       {/* Header */}
//       <div className='flex justify-between items-center p-6 border-b border-gray-200'>
//         <h2 className='text-2xl font-bold text-gray-900'>Match Profile</h2>
//         <Button
//           title='✕'
//           onClick={onClose}
//           btnStyle='w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors p-0 min-w-0'
//         />
//       </div>

//       {/* Content */}
//       <div className='p-6'>
//         {/* Photo */}
//         <div className='relative h-80 rounded-xl overflow-hidden mb-6'>
//           {match.user.photos && match.user.photos.length > 0 ? (
//             <img
//               src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${match.user.photos[0]}`}
//               alt={match.user.name}
//               className='w-full h-full object-cover'
//             />
//           ) : (
//             <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl'>
//               No Photo
//             </div>
//           )}
//         </div>

//         {/* Basic Info */}
//         <div className='text-center mb-6'>
//           <h3 className='text-3xl font-bold text-gray-900 mb-2'>
//             {match.user.name}, {match.user.age}
//           </h3>
//           <p className='text-gray-600 text-lg mb-4'>{match.user.gender}</p>
//           {match.user.location && (
//             <p className='text-gray-600 flex items-center justify-center gap-2'>
//               📍 {match.user.location}
//             </p>
//           )}
//         </div>

//         {/* Bio */}
//         {match.user.bio && (
//           <div className='mb-6'>
//             <h4 className='text-lg font-semibold text-gray-900 mb-2'>About</h4>
//             <p className='text-gray-700 leading-relaxed'>{match.user.bio}</p>
//           </div>
//         )}

//         {/* Match Date */}
//         <div className='bg-pink-50 rounded-xl p-4 mb-6'>
//           <div className='flex items-center justify-center gap-2 text-pink-800'>
//             <span className='text-2xl'>💖</span>
//             <span className='font-medium'>
//               Matched on {new Date(match.createdAt).toLocaleDateString()}
//             </span>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className='flex gap-3'>
//           <Button
//             title='Close'
//             onClick={onClose}
//             btnStyle='flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium'
//           />
//           <Button
//             title='Start Chat 💬'
//             onClick={() => onSendMessage(match.user._id)}
//             btnStyle='flex-1 bg-pink-500 text-white px-4 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium'
//           />
//         </div>
//       </div>
//     </div>
//   </div>
// )

// // Empty State Component
// const EmptyMatchesScreen = () => (
//   <div className='text-center bg-white rounded-2xl p-12 shadow-lg'>
//     <div className='text-6xl mb-6'>💔</div>
//     <h2 className='text-2xl font-bold text-gray-900 mb-4'>No Matches Yet</h2>
//     <p className='text-gray-600 mb-8 max-w-md mx-auto'>
//       You haven't matched with anyone yet. Keep swiping to find your perfect
//       match!
//     </p>
//     <Button
//       title='Start Swiping'
//       onClick={() => (window.location.href = '/discovery')}
//       btnStyle='bg-pink-500 text-white px-8 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium'
//     />
//   </div>
// )

// // Loading Screen Component
// const LoadingScreen = ({ message = 'Loading...' }) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center'>
//       <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
//       <p className='text-gray-600'>{message}</p>
//     </div>
//   </div>
// )

// // Error Screen Component
// const ErrorScreen = ({ error, onRetry }: any) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center bg-white rounded-2xl p-8 shadow-lg max-w-md mx-4'>
//       <div className='text-6xl mb-4'>😕</div>
//       <h2 className='text-2xl font-bold text-gray-900 mb-4'>
//         Something went wrong
//       </h2>
//       <p className='text-gray-600 mb-4'>{error}</p>
//       <Button
//         title='Try Again'
//         onClick={onRetry}
//         btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//       />
//     </div>
//   </div>
// )

// export default MatchesPage

'use client'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState, AppDispatch } from '../../store/store'
import { checkAuthRequest } from '../../store/slices/authSlice'
import { getMatchesRequest } from '../../store/slices/matchSlice'
import Button from '../../components/Button'
import Image from 'next/image'

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

  // Fetch matches
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

  const handleSendMessage = () => {
    router.push(`/message`)
  }

  const handleBackToDiscovery = () => {
    router.push('/discovery')
  }

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
    <div className='min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white'>
      {/* Animated Background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none z-0'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000'></div>
      </div>

      <div className='relative z-10'>
        <div className='max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8'>
            <div className='flex items-center gap-4'>
              <Button
                title={<span className='text-xl'>←</span>}
                onClick={handleBackToDiscovery}
                btnStyle='w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-x-1 flex items-center justify-center border border-gray-200 hover:bg-gray-50'
              />
              <div>
                <h1 className='text-3xl font-bold bg-gradient-to-r bg-pink-500 bg-clip-text text-transparent'>
                  Your Matches
                </h1>
                {matches.length > 0 && (
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='bg-gradient-to-r  bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium'>
                      {matches.length} match{matches.length !== 1 ? 'es' : ''}
                    </span>
                    <span className='text-gray-500 text-sm'>•</span>
                    <span className='text-sm text-gray-600'>
                      {matches.length} amazing{' '}
                      {matches.length === 1 ? 'connection' : 'connections'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              title={
                <div className='flex items-center gap-2'>
                  <span className='text-lg'>↻</span>
                  <span className='hidden sm:inline'>Refresh</span>
                </div>
              }
              onClick={handleRefreshMatches}
              btnStyle='px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
            />
          </div>

          {/* Matches Grid */}
          {matches.length === 0 ? (
            <EmptyMatchesScreen />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
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
    </div>
  )
}
interface MatchCardProps {
  match: Match
  onViewProfile: (match: Match) => void
  onSendMessage: (userId: string) => void
}
// Enhanced Match Card Component
const MatchCard = ({ match, onViewProfile, onSendMessage }: MatchCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className='group'>
      <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-white/20 h-full flex flex-col'>
        {/* Photo Container */}
        <div className='relative aspect-[4/5] overflow-hidden'>
          {match.user.photos && match.user.photos.length > 0 ? (
            <>
              {!imageLoaded && (
                <div className='absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
              )}
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${match.user.photos[0]}`}
                alt={match.user.name}
                fill
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading='lazy'
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjIwMCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5Qcm9maWxlPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg=='
                }}
              />
              {/* Gradient Overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
            </>
          ) : (
            <div className='w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 flex items-center justify-center'>
              <div className='text-5xl'>👤</div>
            </div>
          )}

          {/* Match Badge */}
          <div className='absolute top-4 right-4'>
            <div className='relative'>
              <div className='absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur animate-pulse'></div>
              <div className='relative bg-gradient-to-r  bg-pink-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5'>
                <span className='text-xs'>💖</span>
                <span className='tracking-wide'>MATCH</span>
              </div>
            </div>
          </div>

          {/* Match Date Badge */}
          <div className='absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium'>
            {new Date(match.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className='p-5 flex-1 flex flex-col'>
          <div className='flex items-start justify-between mb-3'>
            <div className='flex-1 min-w-0'>
              <h3 className='text-xl font-bold text-gray-900 truncate'>
                {match.user.name}, {match.user.age}
              </h3>
              <div className='flex items-center gap-2 text-gray-600 text-sm mt-1'>
                <span className='text-xs'>📍</span>
                <span className='truncate'>
                  {match.user.location || 'Location not set'}
                </span>
              </div>
            </div>
            <div className='text-2xl ml-2'>💖</div>
          </div>

          {match.user.bio && (
            <p className='text-gray-600 text-sm line-clamp-2 mb-4 flex-grow italic'>
              &quot;{match.user.bio}&quot;
            </p>
          )}

          <div className='flex gap-2 mt-auto pt-4 border-t border-gray-100'>
            <Button
              title={
                <div className='flex items-center justify-center gap-2'>
                  <span className='text-base'>👤</span>
                  <span>Profile</span>
                </div>
              }
              onClick={() => onViewProfile(match)}
              btnStyle='flex-1 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 px-4 py-2.5 rounded-xl transition-all duration-300 hover:shadow-md text-sm font-medium'
            />
            <Button
              title={
                <div className='flex items-center justify-center gap-2'>
                  <span className='text-base'>💬</span>
                  <span>Message</span>
                </div>
              }
              onClick={() => onSendMessage(match.user._id)}
              btnStyle='flex-1 bg-gradient-to-r  bg-pink-600  hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg text-sm font-medium'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
interface MatchProfileModalProps {
  match: Match
  onClose: () => void
  onSendMessage: (userId: string) => void
}
// Enhanced Profile Modal
const MatchProfileModal = ({
  match,
  onClose,
  onSendMessage,
}: MatchProfileModalProps) => (
  <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
    <div className='bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl'>
      {/* Header */}
      <div className='sticky top-0  bg-pink-600 text-white p-6 rounded-t-2xl'>
        <div className='flex justify-between items-center'>
          <div>
            <h2 className='text-2xl font-bold'>Match Profile</h2>
            <p className='text-purple-100 opacity-90'>Your connection</p>
          </div>
          <button
            onClick={onClose}
            className='w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-xl'
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='p-6'>
        {/* Photo */}
        <div className='relative h-72 rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-gray-900 to-gray-700'>
          {match.user.photos && match.user.photos.length > 0 ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${match.user.photos[0]}`}
              alt={match.user.name}
              fill
              className='w-full h-full object-cover'
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5Qcm9maWxlPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMjMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg=='
              }}
            />
          ) : (
            <div className='w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 flex items-center justify-center'>
              <div className='text-7xl'>👤</div>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className='text-center mb-6'>
          <h3 className='text-3xl font-bold text-gray-900 mb-2'>
            {match.user.name}, {match.user.age}
          </h3>
          <div className='flex items-center justify-center gap-4 text-gray-600 mb-4'>
            <div className='flex items-center gap-1.5'>
              <span className='text-sm'>👤</span>
              <span>{match.user.gender}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-sm'>📍</span>
              <span>{match.user.location}</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='text-sm'>📅</span>
              <span>
                Matched {new Date(match.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {match.user.bio && (
          <div className='mb-6'>
            <h4 className='text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2'>
              <span className='text-lg'>📝</span>
              About
            </h4>
            <p className='text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100'>
              {match.user.bio}
            </p>
          </div>
        )}

        {/* Match Date Highlight */}
        <div className='bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-100'>
          <div className='flex items-center justify-center gap-3 text-purple-800'>
            <span className='text-2xl'>💖</span>
            <div className='text-center'>
              <div className='font-semibold'>Matched Connection</div>
              <div className='text-sm opacity-80'>
                Since {new Date(match.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <Button
            title={
              <div className='flex items-center justify-center gap-2'>
                <span>✕</span>
                <span>Close</span>
              </div>
            }
            onClick={onClose}
            btnStyle='flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl transition-colors font-medium'
          />
          <Button
            title={
              <div className='flex items-center justify-center gap-2'>
                <span className='text-lg'>💬</span>
                <span>Start Chat</span>
              </div>
            }
            onClick={() => onSendMessage(match.user._id)}
            btnStyle='flex-1 bg-pink-600  hover:bg-pink-700 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-lg font-medium'
          />
        </div>
      </div>
    </div>
  </div>
)

// Enhanced Empty State
const EmptyMatchesScreen = () => (
  <div className='text-center py-16'>
    <div className='relative inline-block mb-6'>
      <div className='w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center'>
        <div className='text-5xl'>💔</div>
      </div>
      <div className='absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce'>
        <div className='text-xl'>✨</div>
      </div>
    </div>

    <h2 className='text-3xl font-bold text-gray-900 mb-4'>No Matches Yet</h2>

    <p className='text-gray-600 max-w-md mx-auto mb-8 text-lg'>
      Great connections are waiting! Start swiping to find people who share your
      interests.
    </p>

    <div className='flex flex-col sm:flex-row gap-4 justify-center'>
      <Button
        title={
          <div className='flex items-center justify-center gap-2'>
            <span className='text-lg'>✨</span>
            <span>Start Swiping</span>
          </div>
        }
        onClick={() => (window.location.href = '/discovery')}
        btnStyle='px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg'
      />
      <Button
        title={
          <div className='flex items-center justify-center gap-2'>
            <span className='text-lg'>📝</span>
            <span>Improve Profile</span>
          </div>
        }
        onClick={() => (window.location.href = '/profile/edit')}
        btnStyle='px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium border border-gray-200 transition-colors'
      />
    </div>
  </div>
)

// Enhanced Loading Screen
const LoadingScreen = ({ message = 'Loading...' }) => (
  <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-pink-50 to-white'>
    <div className='text-center'>
      <div className='relative inline-block mb-6'>
        <div className='w-20 h-20 border-4 border-purple-200 rounded-full'></div>
        <div className='absolute top-0 left-0 w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-pulse'>
          💖
        </div>
      </div>
      <p className='text-gray-600 font-medium text-lg'>{message}</p>
      <p className='text-gray-400 text-sm mt-2'>
        Finding amazing people for you...
      </p>
    </div>
  </div>
)
interface ErrorScreenProps {
  error: string
  onRetry: () => void
}
// Enhanced Error Screen
const ErrorScreen = ({ error, onRetry }: ErrorScreenProps) => (
  <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-pink-50 to-white'>
    <div className='text-center bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4'>
      <div className='w-20 h-20 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6'>
        <div className='text-3xl'>😕</div>
      </div>
      <h2 className='text-2xl font-bold text-gray-900 mb-4'>
        Oops! Something went wrong
      </h2>
      <p className='text-gray-600 mb-6'>{error}</p>
      <div className='flex gap-3'>
        <Button
          title={
            <div className='flex items-center justify-center gap-2'>
              <span className='text-lg'>↻</span>
              <span>Try Again</span>
            </div>
          }
          onClick={onRetry}
          btnStyle='flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg'
        />
        <Button
          title={
            <div className='flex items-center justify-center gap-2'>
              <span className='text-lg'>🏠</span>
              <span>Go Home</span>
            </div>
          }
          onClick={() => (window.location.href = '/')}
          btnStyle='flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors'
        />
      </div>
    </div>
  </div>
)

// // Add CSS for animations
// const extraStyles = `
// @keyframes blob {
//   0% { transform: translate(0px, 0px) scale(1); }
//   33% { transform: translate(30px, -50px) scale(1.1); }
//   66% { transform: translate(-20px, 20px) scale(0.9); }
//   100% { transform: translate(0px, 0px) scale(1); }
// }

// .animation-delay-2000 {
//   animation-delay: 2s;
// }

// .group:hover .group-hover\\:scale-110 {
//   transform: scale(1.1);
// }

// .group:hover .group-hover\\:-translate-y-2 {
//   transform: translateY(-0.5rem);
// }
// `

export default MatchesPage
