// 'use client'
// import React, { useEffect, useState, useMemo, useCallback } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { useRouter } from 'next/navigation'
// import { RootState, AppDispatch } from '../../store/store'
// import {
//   getRecommendationsRequest,
//   getSwipeHistoryRequest,
//   addLikedUser,
//   addPassedUser,
//   updatePassToLike,
//   updateLikeToPass,
// } from '../../store/slices/discoverySlice'
// import { createSwipeRequest } from '../../store/slices/swipeSlice'
// import { checkAuthRequest, logoutRequest } from '../../store/slices/authSlice'
// import { getProfileRequest } from '../../store/slices/profileSlice'
// import Button from '../../components/Button'

// interface UserProfile {
//   _id: string
//   name: string
//   age: number
//   bio: string
//   photos: string[]
//   gender: string
//   interests: string[]
//   location: string
//   geoLocation?: {
//     type: string
//     coordinates: [number, number]
//   }
//   distance?: number
// }

// // Fisher-Yates shuffle algorithm
// const shuffleArray = <T,>(array: T[]): T[] => {
//   const shuffled = [...array]
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1))
//     ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
//   }
//   return shuffled
// }

// // Haversine formula
// const calculateDistance = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ): number => {
//   const R = 6371
//   const dLat = (lat2 - lat1) * (Math.PI / 180)
//   const dLon = (lon2 - lon1) * (Math.PI / 180)
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) *
//       Math.cos(lat2 * (Math.PI / 180)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2)
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
//   const distance = R * c
//   return distance
// }

// // Format distance
// const formatDistance = (distance: number): string => {
//   if (distance < 1) {
//     return `<1km`
//   } else if (distance < 10) {
//     return `${distance.toFixed(1)}km`
//   } else {
//     return `${Math.round(distance)}km`
//   }
// }

// // Helper function to extract coordinates
// const getCoordinates = (
//   user: UserProfile
// ): { latitude: number; longitude: number } | null => {
//   if (
//     user.geoLocation &&
//     user.geoLocation.coordinates &&
//     user.geoLocation.coordinates.length === 2 &&
//     user.geoLocation.coordinates[0] !== 0 &&
//     user.geoLocation.coordinates[1] !== 0
//   ) {
//     return {
//       longitude: user.geoLocation.coordinates[0],
//       latitude: user.geoLocation.coordinates[1],
//     }
//   }
//   return null
// }

// // Loading Screen Component
// const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center'>
//       <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
//       <p className='text-gray-600'>{message}</p>
//     </div>
//   </div>
// )

// // Error Screen Component
// const ErrorScreen = ({
//   error,
//   onRefresh,
//   onLogout,
// }: {
//   error: string
//   onRefresh: () => void
//   onLogout?: () => void
// }) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
//       <div className='text-6xl mb-4'>😕</div>
//       <h2 className='text-2xl font-bold text-gray-900 mb-4'>
//         Something went wrong
//       </h2>
//       <p className='text-gray-600 mb-4'>{error}</p>
//       <div className='flex gap-3'>
//         <Button
//           title='Try Again'
//           onClick={onRefresh}
//           btnStyle='flex-1 bg-pink-500 text-white px-4 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//         />
//         {onLogout && (
//           <Button
//             title='Logout'
//             onClick={onLogout}
//             btnStyle='flex-1 bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors'
//           />
//         )}
//       </div>
//     </div>
//   </div>
// )

// // Empty Screen Component
// const EmptyScreen = ({
//   onRefresh,
//   onLogout,
//   showLikedOnly,
//   onToggleLikedOnly,
// }: {
//   onRefresh: () => void
//   onLogout?: () => void
//   showLikedOnly?: boolean
//   onToggleLikedOnly?: () => void
// }) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
//       <div className='text-6xl mb-4'>{showLikedOnly ? '💖' : '😢'}</div>
//       <h2 className='text-2xl font-bold text-gray-900 mb-4'>
//         {showLikedOnly ? 'No Liked Profiles Yet' : 'No profiles found'}
//       </h2>
//       <p className='text-gray-600 mb-6'>
//         {showLikedOnly
//           ? "You haven't liked any profiles yet. Start swiping to build your list!"
//           : 'No potential matches found in your area.'}
//       </p>
//       <div className='flex flex-col gap-3'>
//         {showLikedOnly && onToggleLikedOnly ? (
//           <Button
//             title='Show All Profiles'
//             onClick={onToggleLikedOnly}
//             btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//           />
//         ) : (
//           <Button
//             title='Refresh'
//             onClick={onRefresh}
//             btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//           />
//         )}
//         {onLogout && (
//           <Button
//             title='Logout'
//             onClick={onLogout}
//             btnStyle='bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors'
//           />
//         )}
//       </div>
//     </div>
//   </div>
// )

// // Match Modal Component
// const MatchModal = ({
//   lastMatch,
//   onClose,
// }: {
//   lastMatch: any
//   onClose: () => void
// }) => (
//   <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
//     <div className='bg-white rounded-3xl p-8 text-center max-w-sm w-full'>
//       <div className='text-6xl mb-4'>🎉</div>
//       <h3 className='text-2xl font-bold text-gray-900 mb-2'>It's a Match!</h3>
//       <p className='text-gray-600 mb-4'>You matched with {lastMatch.name}</p>
//       <Button
//         title='Continue Swiping'
//         onClick={onClose}
//         btnStyle='bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600 transition-colors'
//       />
//     </div>
//   </div>
// )

// // Image Modal Component
// const ImageModal = ({
//   photos,
//   currentPhotoIndex,
//   onClose,
//   onNext,
//   onPrev,
//   userName,
// }: {
//   photos: string[]
//   currentPhotoIndex: number
//   onClose: () => void
//   onNext: () => void
//   onPrev: () => void
//   userName: string
// }) => (
//   <div className='fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4'>
//     <div className='relative max-w-4xl max-h-full w-full'>
//       <Button
//         title='✕'
//         onClick={onClose}
//         btnStyle='absolute top-4 right-4 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors p-0 min-w-0'
//       />

//       {photos.length > 1 && (
//         <>
//           <Button
//             title='‹'
//             onClick={onPrev}
//             btnStyle='absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors p-0 min-w-0'
//             disabled={currentPhotoIndex === 0}
//           />
//           <Button
//             title='›'
//             onClick={onNext}
//             btnStyle='absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors p-0 min-w-0'
//             disabled={currentPhotoIndex === photos.length - 1}
//           />
//         </>
//       )}

//       <div className='flex flex-col items-center'>
//         <img
//           src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photos[currentPhotoIndex]}`}
//           alt={`${userName} - Photo ${currentPhotoIndex + 1}`}
//           className='max-w-full max-h-[80vh] object-contain rounded-lg'
//         />
//         <div className='text-white mt-4 text-center'>
//           <p>
//             {currentPhotoIndex + 1} of {photos.length}
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>
// )

// // Action Buttons Component
// const ActionButtons = ({
//   onPass,
//   onLike,
//   isLiked,
//   disabled,
//   showLikedOnly,
// }: any) => (
//   <div className='flex justify-center gap-8 mt-8 pb-8'>
//     {!showLikedOnly ? (
//       <>
//         <Button
//           title={isLiked ? '💔 Pass' : '❌ Pass'}
//           onClick={onPass}
//           disabled={disabled}
//           btnStyle={`w-24 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 font-medium text-base p-0 min-w-0 ${
//             isLiked
//               ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
//               : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
//           }`}
//         />
//         <Button
//           title={isLiked ? '💔 Unlike' : '💖 Like'}
//           onClick={onLike}
//           disabled={disabled}
//           btnStyle={`w-24 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 font-medium text-base p-0 min-w-0 ${
//             isLiked
//               ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
//               : 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600'
//           }`}
//         />
//       </>
//     ) : (
//       <Button
//         title='💔 Remove'
//         onClick={onLike}
//         disabled={disabled}
//         btnStyle='w-32 h-16 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 font-medium text-base'
//       />
//     )}
//   </div>
// )

// // User Card Component
// const UserCard = ({
//   user,
//   isLiked,
//   currentPhotoIndex,
//   hasMultiplePhotos,
//   onPhotoSwipe,
//   onPrevPhoto,
//   onNextPhoto,
//   onImageClick,
//   showLikedOnly,
// }: any) => (
//   <div className='bg-white rounded-3xl shadow-lg overflow-hidden'>
//     <div className='relative h-96'>
//       {user.photos && user.photos.length > 0 ? (
//         <>
//           <div
//             className='w-full h-full cursor-pointer relative'
//             onClick={onPhotoSwipe}
//           >
//             <img
//               src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.photos[currentPhotoIndex]}`}
//               alt={`${user.name} - Photo ${currentPhotoIndex + 1}`}
//               className='w-full h-full object-cover cursor-zoom-in'
//               onClick={(e) => {
//                 e.stopPropagation()
//                 onImageClick()
//               }}
//             />

//             {user.distance !== undefined && (
//               <div className='absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-10'>
//                 {formatDistance(user.distance)}
//               </div>
//             )}

//             {isLiked && (
//               <div className='absolute top-4 left-4 bg-pink-500 text-white px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-10'>
//                 ❤️ Liked
//               </div>
//             )}

//             {hasMultiplePhotos && (
//               <>
//                 <Button
//                   title='‹'
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onPrevPhoto()
//                   }}
//                   btnStyle='absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/10 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-opacity p-0 min-w-0'
//                 />
//                 <Button
//                   title='›'
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onNextPhoto()
//                   }}
//                   btnStyle='absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/10 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-opacity p-0 min-w-0'
//                 />
//               </>
//             )}
//           </div>
//           {hasMultiplePhotos && (
//             <>
//               <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2'>
//                 {user.photos.map((_: any, index: number) => (
//                   <div
//                     key={index}
//                     className={`w-2 h-2 rounded-full transition-all duration-300 ${
//                       index === currentPhotoIndex
//                         ? 'bg-white scale-125'
//                         : 'bg-white bg-opacity-50'
//                     }`}
//                   />
//                 ))}
//               </div>
//               <div className='absolute top-4 left-4 bg-black/10 bg-opacity-50 text-white px-2 py-1 rounded-full text-xs'>
//                 {currentPhotoIndex + 1} / {user.photos.length}
//               </div>
//             </>
//           )}
//         </>
//       ) : (
//         <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg'>
//           No Photo
//         </div>
//       )}
//     </div>
//     <div className='p-6'>
//       <div className='flex justify-between items-start mb-4'>
//         <div>
//           <h2 className='text-2xl font-bold text-gray-900'>
//             {user.name}, {user.age}
//           </h2>
//           <p className='text-gray-600'>{user.gender}</p>
//         </div>
//         {showLikedOnly && (
//           <div className='bg-green-500 text-white px-3 py-1 rounded-full text-sm'>
//             💖 Liked
//           </div>
//         )}
//       </div>
//       {user.bio && (
//         <p className='text-gray-700 mb-4 leading-relaxed'>{user.bio}</p>
//       )}
//       {user.location && (
//         <p className='text-gray-600 text-sm mb-4 flex items-center gap-1'>
//           📍 {user.location}
//         </p>
//       )}
//       {user.interests && user.interests.length > 0 && (
//         <div className='mb-2'>
//           <h3 className='text-sm font-semibold text-gray-900 mb-2'>
//             Interests
//           </h3>
//           <div className='flex flex-wrap gap-2'>
//             {user.interests
//               .slice(0, 4)
//               .map((interest: string, index: number) => (
//                 <span
//                   key={index}
//                   className='bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium'
//                 >
//                   {interest}
//                 </span>
//               ))}
//           </div>
//         </div>
//       )}
//     </div>
//   </div>
// )

// const DiscoveryPage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>()
//   const router = useRouter()

//   const {
//     user: authUser,
//     loading: authLoading,
//     checkingAuth,
//     error: authError,
//   } = useSelector((state: RootState) => state.auth)

//   const {
//     recommendedUsers,
//     loading: recommendationsLoading,
//     error: recommendationsError,
//     swipeHistory,
//     loadingSwipeHistory,
//   } = useSelector((state: RootState) => state.discovery)

//   const { loading: swipeLoading, lastMatch } = useSelector(
//     (state: RootState) => state.swipe
//   )

//   const { user: profileUser, loading: profileLoading } = useSelector(
//     (state: RootState) => state.profile
//   )

//   const [currentIndex, setCurrentIndex] = useState(0)
//   const [showMatchModal, setShowMatchModal] = useState(false)
//   const [hasFetched, setHasFetched] = useState(false)
//   const [localLikedUsers, setLocalLikedUsers] = useState<Set<string>>(new Set())
//   const [localPassedUsers, setLocalPassedUsers] = useState<Set<string>>(
//     new Set()
//   )
//   const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
//   const [shuffledUsers, setShuffledUsers] = useState<UserProfile[]>([])
//   const [showImageModal, setShowImageModal] = useState(false)
//   const [userLocation, setUserLocation] = useState<{
//     latitude: number
//     longitude: number
//   } | null>(null)
//   const [showLikedOnly, setShowLikedOnly] = useState(false)
//   const [isInitialLoad, setIsInitialLoad] = useState(true)
//   const [isRedirecting, setIsRedirecting] = useState(false)
//   const [showLogoutModal, setShowLogoutModal] = useState(false)
//   const [authCheckCompleted, setAuthCheckCompleted] = useState(false)

//   // ==================== FUNCTION DECLARATIONS (MOVED TO TOP) ====================

//   // Navigation handlers
//   const handleViewProfile = () => router.push('/profile')
//   const handleViewMatches = () => router.push('/matches')

//   // Logout handlers
//   const openLogoutModal = () => setShowLogoutModal(true)

//   const handleLogout = useCallback(() => {
//     if (window.confirm('Are you sure you want to logout?')) {
//       dispatch(logoutRequest())
//     }
//   }, [dispatch])

//   const confirmLogout = () => {
//     dispatch(logoutRequest())
//     setShowLogoutModal(false)
//   }

//   const cancelLogout = () => setShowLogoutModal(false)

//   // Optimized geolocation fetching - MOVED BEFORE handleRefresh
//   const fetchRecommendations = useCallback(
//     (latitude?: number, longitude?: number) => {
//       console.log('📍 Fetching recommendations with location:', {
//         latitude,
//         longitude,
//       })

//       if (latitude && longitude) {
//         dispatch(
//           getRecommendationsRequest({
//             latitude,
//             longitude,
//           })
//         )
//       } else {
//         dispatch(getRecommendationsRequest({}))
//       }

//       setHasFetched(true)
//     },
//     [dispatch]
//   )

//   // Optimized geolocation function - MOVED BEFORE handleRefresh
//   const getLocationAndFetch = useCallback(() => {
//     if (navigator.geolocation) {
//       console.log('📍 Attempting to get user location...')

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords
//           console.log('📍 User location captured:', { latitude, longitude })
//           setUserLocation({ latitude, longitude })
//           fetchRecommendations(latitude, longitude)
//         },
//         (error) => {
//           console.log('⚠️ Geolocation error or denied:', error.message)
//           setUserLocation(null)
//           fetchRecommendations()
//         },
//         {
//           enableHighAccuracy: false,
//           timeout: 5000,
//           maximumAge: 30000,
//         }
//       )
//     } else {
//       console.log('📍 Geolocation not supported')
//       setUserLocation(null)
//       fetchRecommendations()
//     }
//   }, [fetchRecommendations])

//   // Refresh handler - NOW IT CAN USE getLocationAndFetch
//   const handleRefresh = useCallback(() => {
//     console.log('🔄 Manual refresh triggered')
//     setHasFetched(false)
//     setIsInitialLoad(true)
//     setCurrentIndex(0)
//     setLocalLikedUsers(new Set())
//     setLocalPassedUsers(new Set())
//     setCurrentPhotoIndex(0)
//     setShuffledUsers([])
//     setShowLikedOnly(false)

//     if (authUser) {
//       dispatch(getSwipeHistoryRequest())
//       dispatch(getProfileRequest())
//       getLocationAndFetch()
//     }
//   }, [authUser, dispatch, getLocationAndFetch])

//   // Toggle liked only view
//   const toggleLikedOnly = () => setShowLikedOnly(!showLikedOnly)

//   // Get gender from profile
//   const currentUserGender = useMemo(() => {
//     if (profileUser?.gender) {
//       return profileUser.gender.toLowerCase().trim()
//     }
//     return null
//   }, [profileUser])

//   // Calculate distances for users when location data is available
//   const usersWithDistance = useMemo(() => {
//     if (!userLocation || !shuffledUsers.length) return shuffledUsers

//     return shuffledUsers.map((user) => {
//       const userCoords = getCoordinates(user)
//       if (userCoords) {
//         const distance = calculateDistance(
//           userLocation.latitude,
//           userLocation.longitude,
//           userCoords.latitude,
//           userCoords.longitude
//         )
//         return { ...user, distance }
//       }
//       return user
//     })
//   }, [shuffledUsers, userLocation])

//   // Filter users based on gender preference from profile AND use shuffled order
//   const filteredUsers = useMemo(() => {
//     if (!currentUserGender || !usersWithDistance.length)
//       return usersWithDistance

//     const filtered = usersWithDistance.filter((user) => {
//       const userGender = user.gender?.toLowerCase().trim()

//       // Male users see only females
//       if (currentUserGender === 'male') {
//         return userGender === 'female'
//       }
//       // Female users see only males
//       else if (currentUserGender === 'female') {
//         return userGender === 'male'
//       }
//       // For 'other' or any other gender, show all profiles
//       return true
//     })

//     return filtered
//   }, [usersWithDistance, currentUserGender])

//   // Filter to show only liked users when showLikedOnly is true
//   const displayUsers = useMemo(() => {
//     if (!showLikedOnly) return filteredUsers

//     // Filter to only show users that have been liked
//     const likedUsers = filteredUsers.filter((user) =>
//       localLikedUsers.has(user._id)
//     )

//     return likedUsers
//   }, [filteredUsers, showLikedOnly, localLikedUsers])

//   // Get the count of liked users for the button badge
//   const likedUsersCount = useMemo(() => {
//     return filteredUsers.filter((user) => localLikedUsers.has(user._id)).length
//   }, [filteredUsers, localLikedUsers])

//   // ==================== FIXED AUTHENTICATION LOGIC ====================

//   // DEBUG: Check cookies and localStorage
//   useEffect(() => {
//     console.log('🍪 Debug: Checking authentication state...')
//     console.log('🍪 Cookies:', document.cookie)
//     console.log('📦 Redux authUser:', authUser)
//     console.log('🔄 CheckingAuth:', checkingAuth)
//     console.log('⏳ AuthLoading:', authLoading)
//     console.log('✅ AuthCheckCompleted:', authCheckCompleted)
//     console.log('➡️ IsRedirecting:', isRedirecting)
//   }, [authUser, checkingAuth, authLoading, authCheckCompleted, isRedirecting])

//   // Main authentication effect - runs once on mount
//   useEffect(() => {
//     console.log('🔐 DiscoveryPage mounted, starting auth check...')

//     // If auth check already completed, return
//     if (authCheckCompleted) {
//       console.log('✅ Auth check already completed')
//       return
//     }

//     // If already checking or loading, return
//     if (checkingAuth || authLoading) {
//       console.log('⏳ Auth check already in progress...')
//       return
//     }

//     // If we already have a user in Redux store, mark as completed
//     if (authUser) {
//       console.log('✅ User already authenticated in Redux')
//       setAuthCheckCompleted(true)
//       return
//     }

//     // Start the auth check
//     console.log('🔄 Starting new auth check...')
//     dispatch(checkAuthRequest())
//   }, [dispatch, checkingAuth, authLoading, authUser, authCheckCompleted])

//   // Track when auth check is complete
//   useEffect(() => {
//     // Auth check is complete when:
//     // 1. We're not checking auth anymore
//     // 2. We're not loading auth
//     // 3. We haven't marked it as completed yet
//     if (!checkingAuth && !authLoading && !authCheckCompleted) {
//       console.log('✅ Auth check process completed')
//       console.log('👤 User after check:', authUser ? 'Exists' : 'Null')
//       setAuthCheckCompleted(true)
//     }
//   }, [checkingAuth, authLoading, authCheckCompleted, authUser])

//   // Handle redirect only after auth check is complete
//   useEffect(() => {
//     // Only consider redirecting after auth check is complete
//     if (!authCheckCompleted) {
//       console.log(
//         '⏳ Waiting for auth check to complete before redirect check...'
//       )
//       return
//     }

//     // Don't redirect if still checking or loading
//     if (checkingAuth || authLoading) {
//       console.log('⏳ Still checking/loading, skipping redirect check...')
//       return
//     }

//     console.log('🔄 Evaluating redirect after auth check:', {
//       hasUser: !!authUser,
//       checkingAuth,
//       authLoading,
//       authCheckCompleted,
//       isRedirecting,
//     })

//     // If we have a user, fetch profile and continue
//     if (authUser) {
//       console.log('✅ User authenticated, proceeding with app...')

//       // Fetch profile if needed
//       if (!profileUser && !profileLoading) {
//         console.log('👤 Fetching profile for authenticated user')
//         dispatch(getProfileRequest())
//       }
//       return
//     }

//     // If no user after auth check AND we're not already redirecting
//     if (!authUser && !isRedirecting) {
//       console.log(
//         '❌ No authenticated user after check, will redirect to login...'
//       )
//       setIsRedirecting(true)

//       // Give a small delay to show the redirecting message
//       const redirectTimer = setTimeout(() => {
//         console.log('➡️ Redirecting to login page')
//         router.replace('/login')
//       }, 500)

//       return () => clearTimeout(redirectTimer)
//     }
//   }, [
//     authUser,
//     checkingAuth,
//     authLoading,
//     authCheckCompleted,
//     isRedirecting,
//     router,
//     profileUser,
//     profileLoading,
//     dispatch,
//   ])

//   // Initialize swipe history when data is available
//   useEffect(() => {
//     if (swipeHistory.likedUsers || swipeHistory.passedUsers) {
//       setLocalLikedUsers(new Set(swipeHistory.likedUsers || []))
//       setLocalPassedUsers(new Set(swipeHistory.passedUsers || []))
//     }
//   }, [swipeHistory.likedUsers, swipeHistory.passedUsers])

//   // Reset photo index when current index changes
//   useEffect(() => {
//     setCurrentPhotoIndex(0)
//   }, [currentIndex])

//   // Reset to first profile when switching between modes
//   useEffect(() => {
//     setCurrentIndex(0)
//     setCurrentPhotoIndex(0)
//   }, [showLikedOnly])

//   // Main data fetching logic - only run when user is authenticated and has profile
//   useEffect(() => {
//     if (authUser && profileUser && !hasFetched && isInitialLoad) {
//       console.log('🔄 Starting data fetch process...')

//       // Fetch swipe history immediately
//       dispatch(getSwipeHistoryRequest())

//       // Start geolocation and recommendations
//       getLocationAndFetch()
//     }
//   }, [
//     authUser,
//     profileUser,
//     hasFetched,
//     isInitialLoad,
//     dispatch,
//     getLocationAndFetch,
//   ])

//   // Shuffle users when recommendations are loaded
//   useEffect(() => {
//     if (recommendedUsers.length > 0 && isInitialLoad) {
//       console.log('🎲 Shuffling recommended users:', recommendedUsers.length)
//       const shuffled = shuffleArray(recommendedUsers as UserProfile[])
//       setShuffledUsers(shuffled)
//       setIsInitialLoad(false)
//     }
//   }, [recommendedUsers, isInitialLoad])

//   // Handle match modal
//   useEffect(() => {
//     if (lastMatch) {
//       setShowMatchModal(true)
//       const timer = setTimeout(() => {
//         setShowMatchModal(false)
//       }, 3000)
//       return () => clearTimeout(timer)
//     }
//   }, [lastMatch])

//   // Reset current index when filtered users change
//   useEffect(() => {
//     if (displayUsers.length > 0 && currentIndex >= displayUsers.length) {
//       setCurrentIndex(0)
//     }
//   }, [displayUsers, currentIndex])

//   // ==================== EVENT HANDLERS (CONTINUED) ====================

//   // Navigation functions
//   const goToNextProfile = () => {
//     if (displayUsers.length === 0) return

//     if (currentIndex < displayUsers.length - 1) {
//       setCurrentIndex((prev) => prev + 1)
//     } else {
//       setCurrentIndex(0)
//     }
//   }

//   const goToPreviousProfile = () => {
//     if (displayUsers.length === 0) return

//     if (currentIndex > 0) {
//       setCurrentIndex((prev) => prev - 1)
//     } else {
//       setCurrentIndex(displayUsers.length - 1)
//     }
//   }

//   // Pass button handler
//   const handlePass = () => {
//     if (currentIndex >= displayUsers.length || !authUser) return

//     const swipedUser = displayUsers[currentIndex]
//     const currentUserId = swipedUser._id
//     const isCurrentlyLiked = localLikedUsers.has(currentUserId)

//     if (isCurrentlyLiked) {
//       // Pass on liked profile - just move to next
//       goToNextProfile()
//     } else {
//       // Pass on non-liked profile
//       if (!localPassedUsers.has(currentUserId)) {
//         setLocalPassedUsers((prev) => new Set([...prev, currentUserId]))
//         dispatch(addPassedUser(currentUserId))
//         dispatch(
//           createSwipeRequest({
//             swipedUserId: currentUserId,
//             action: 'pass',
//           })
//         )
//       }
//       goToNextProfile()
//     }
//   }

//   // Like button handler
//   const handleLike = () => {
//     if (currentIndex >= displayUsers.length || !authUser) return

//     const swipedUser = displayUsers[currentIndex]
//     const currentUserId = swipedUser._id
//     const isCurrentlyLiked = localLikedUsers.has(currentUserId)

//     if (isCurrentlyLiked) {
//       // Unlike
//       setLocalLikedUsers((prev) => {
//         const newSet = new Set(prev)
//         newSet.delete(currentUserId)
//         return newSet
//       })
//       setLocalPassedUsers((prev) => new Set([...prev, currentUserId]))

//       if (updateLikeToPass) {
//         dispatch(updateLikeToPass(currentUserId))
//       } else {
//         dispatch(addPassedUser(currentUserId))
//       }

//       dispatch(
//         createSwipeRequest({
//           swipedUserId: currentUserId,
//           action: 'pass',
//         })
//       )
//     } else {
//       // Like
//       setLocalLikedUsers((prev) => new Set([...prev, currentUserId]))
//       setLocalPassedUsers((prev) => {
//         const newSet = new Set(prev)
//         newSet.delete(currentUserId)
//         return newSet
//       })

//       dispatch(addLikedUser(currentUserId))

//       dispatch(
//         createSwipeRequest({
//           swipedUserId: currentUserId,
//           action: 'like',
//         })
//       )
//     }
//   }

//   // Photo gallery functions
//   const nextPhoto = () => {
//     const currentUser = displayUsers[currentIndex]
//     if (
//       currentUser?.photos &&
//       currentPhotoIndex < currentUser.photos.length - 1
//     ) {
//       setCurrentPhotoIndex((prev) => prev + 1)
//     }
//   }

//   const prevPhoto = () => {
//     if (currentPhotoIndex > 0) {
//       setCurrentPhotoIndex((prev) => prev - 1)
//     }
//   }

//   const handlePhotoSwipe = (e: React.MouseEvent) => {
//     const cardWidth = e.currentTarget.clientWidth
//     const clickX = e.nativeEvent.offsetX
//     if (clickX < cardWidth / 2) prevPhoto()
//     else nextPhoto()
//   }

//   // Image modal functions
//   const handleImageClick = () => {
//     const currentUser = displayUsers[currentIndex]
//     if (currentUser?.photos && currentUser.photos.length > 0) {
//       setShowImageModal(true)
//     }
//   }

//   const handleCloseImageModal = () => {
//     setShowImageModal(false)
//   }

//   const handleModalNextPhoto = () => {
//     const currentUser = displayUsers[currentIndex]
//     if (
//       currentUser?.photos &&
//       currentPhotoIndex < currentUser.photos.length - 1
//     ) {
//       setCurrentPhotoIndex((prev) => prev + 1)
//     }
//   }

//   const handleModalPrevPhoto = () => {
//     if (currentPhotoIndex > 0) {
//       setCurrentPhotoIndex((prev) => prev - 1)
//     }
//   }

//   // ==================== RENDER LOGIC ====================

//   // Show loading during initial auth check
//   if (checkingAuth || authLoading) {
//     return <LoadingScreen message='Checking authentication...' />
//   }

//   // Show loading if redirecting (but only after auth check is complete)

//   if (isRedirecting && authCheckCompleted) {
//     return <LoadingScreen message='Redirecting to login...' />
//   }

//   // Show error if auth check failed
//   if (authError && !authUser && authCheckCompleted) {
//     return (
//       <ErrorScreen
//         error='Authentication failed. Please login again.'
//         onRefresh={() => router.refresh()}
//         onLogout={handleLogout}
//       />
//     )
//   }

//   // Show loading while fetching profile and initial data
//   const showDataLoading =
//     (authUser && !profileUser && profileLoading) ||
//     (isInitialLoad && recommendationsLoading) ||
//     (isInitialLoad && loadingSwipeHistory)

//   if (showDataLoading) {
//     return <LoadingScreen message='Loading discovery...' />
//   }

//   if (recommendationsError) {
//     return (
//       <ErrorScreen
//         error={recommendationsError}
//         onRefresh={handleRefresh}
//         onLogout={handleLogout}
//       />
//     )
//   }

//   // Show empty states only after initial load is complete
//   if (!isInitialLoad) {
//     if (
//       displayUsers.length === 0 &&
//       recommendedUsers.length > 0 &&
//       showLikedOnly
//     ) {
//       return (
//         <EmptyScreen
//           onRefresh={handleRefresh}
//           onLogout={handleLogout}
//           showLikedOnly={showLikedOnly}
//           onToggleLikedOnly={toggleLikedOnly}
//         />
//       )
//     }

//     if (displayUsers.length === 0 && recommendedUsers.length > 0) {
//       return <EmptyScreen onRefresh={handleRefresh} onLogout={handleLogout} />
//     }

//     if (displayUsers.length === 0) {
//       return <EmptyScreen onRefresh={handleRefresh} onLogout={handleLogout} />
//     }
//   }

//   // Header Component
//   const Header = ({
//     onViewProfile,
//     onViewMatches,
//     disabled,
//     showLikedOnly,
//     onToggleLikedOnly,
//     likedUsersCount,
//     onRefresh,
//   }: any) => (
//     <header className='bg-white shadow-sm py-4 px-6'>
//       <div className='max-w-2xl mx-auto flex justify-between items-center'>
//         <Button
//           title='👤'
//           onClick={onViewProfile}
//           disabled={disabled}
//           btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
//         />

//         <div className='flex items-center gap-4'>
//           <Button
//             title='🔄'
//             onClick={onRefresh}
//             disabled={disabled}
//             btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
//           />

//           <Button
//             title={
//               <div className='flex items-center gap-2'>
//                 {showLikedOnly ? '💖' : '💕'}
//                 {likedUsersCount > 0 && (
//                   <span className='bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
//                     {likedUsersCount}
//                   </span>
//                 )}
//               </div>
//             }
//             onClick={onToggleLikedOnly}
//             disabled={disabled}
//             btnStyle={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 p-0 min-w-0 text-lg ${
//               showLikedOnly
//                 ? 'bg-pink-500 text-white'
//                 : 'bg-gray-100 hover:bg-gray-200'
//             }`}
//           />

//           <h1 className='text-xl font-bold text-gray-900'>
//             {showLikedOnly ? 'Liked Profiles' : 'Discover'}
//           </h1>
//         </div>

//         <div className='flex items-center gap-2'>
//           <Button
//             title='💌'
//             onClick={onViewMatches}
//             disabled={disabled}
//             btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
//           />

//           <Button
//             title='🚪'
//             onClick={openLogoutModal}
//             disabled={disabled}
//             btnStyle='w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
//           />
//         </div>
//       </div>
//     </header>
//   )

//   // Safe access to current user
//   const currentUser = displayUsers[currentIndex]
//   if (!currentUser) {
//     return <LoadingScreen message='Loading profile...' />
//   }

//   const hasMultiplePhotos = currentUser.photos && currentUser.photos.length > 1
//   const isLiked = localLikedUsers.has(currentUser._id)

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50'>
//       {showMatchModal && lastMatch && (
//         <MatchModal
//           lastMatch={lastMatch}
//           onClose={() => setShowMatchModal(false)}
//         />
//       )}

//       {showImageModal && (
//         <ImageModal
//           photos={currentUser.photos || []}
//           currentPhotoIndex={currentPhotoIndex}
//           onClose={handleCloseImageModal}
//           onNext={handleModalNextPhoto}
//           onPrev={handleModalPrevPhoto}
//           userName={currentUser.name}
//         />
//       )}

//       {/* Logout Confirmation Modal */}
//       {showLogoutModal && (
//         <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
//           <div className='bg-white rounded-2xl p-6 max-w-sm w-full'>
//             <h3 className='text-xl font-bold text-gray-900 mb-2'>
//               Confirm Logout
//             </h3>
//             <p className='text-gray-600 mb-6'>
//               Are you sure you want to logout?
//             </p>
//             <div className='flex gap-3'>
//               <Button
//                 title='Cancel'
//                 onClick={cancelLogout}
//                 btnStyle='flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium'
//               />
//               <Button
//                 title='Logout'
//                 onClick={confirmLogout}
//                 btnStyle='flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium'
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       <Header
//         onViewProfile={handleViewProfile}
//         onViewMatches={handleViewMatches}
//         disabled={swipeLoading || showDataLoading}
//         showLikedOnly={showLikedOnly}
//         onToggleLikedOnly={toggleLikedOnly}
//         likedUsersCount={likedUsersCount}
//         onRefresh={handleRefresh}
//       />

//       <div className='max-w-md mx-auto pt-8 px-4'>
//         {displayUsers.length > 1 && (
//           <div className='flex justify-between items-center mb-4'>
//             <Button
//               title='←'
//               onClick={goToPreviousProfile}
//               disabled={swipeLoading}
//               btnStyle='w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 p-0 min-w-0 text-xl'
//             />

//             <Button
//               title='→'
//               onClick={goToNextProfile}
//               disabled={swipeLoading}
//               btnStyle='w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 p-0 min-w-0 text-xl'
//             />
//           </div>
//         )}

//         <UserCard
//           user={currentUser}
//           isLiked={isLiked}
//           currentPhotoIndex={currentPhotoIndex}
//           hasMultiplePhotos={hasMultiplePhotos}
//           onPhotoSwipe={handlePhotoSwipe}
//           onPrevPhoto={prevPhoto}
//           onNextPhoto={nextPhoto}
//           onImageClick={handleImageClick}
//           showLikedOnly={showLikedOnly}
//         />

//         <ActionButtons
//           onPass={handlePass}
//           onLike={handleLike}
//           isLiked={isLiked}
//           disabled={swipeLoading}
//           showLikedOnly={showLikedOnly}
//         />
//       </div>
//     </div>
//   )
// }

// export default DiscoveryPage

'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState, AppDispatch } from '../../store/store'
import {
  getRecommendationsRequest,
  getSwipeHistoryRequest,
  addLikedUser,
  addPassedUser,
  updatePassToLike,
  updateLikeToPass,
} from '../../store/slices/discoverySlice'
import { createSwipeRequest } from '../../store/slices/swipeSlice'
import { checkAuthRequest, logoutRequest } from '../../store/slices/authSlice'
import { getProfileRequest } from '../../store/slices/profileSlice'
import Button from '../../components/Button'

interface UserProfile {
  _id: string
  name: string
  age: number
  bio: string
  photos: string[]
  gender: string
  interests: string[]
  location: string
  geoLocation?: {
    type: string
    coordinates: [number, number]
  }
  distance?: number
}

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

// Format distance
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `<1km`
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`
  } else {
    return `${Math.round(distance)}km`
  }
}

// Helper function to extract coordinates
const getCoordinates = (
  user: UserProfile
): { latitude: number; longitude: number } | null => {
  if (
    user.geoLocation &&
    user.geoLocation.coordinates &&
    user.geoLocation.coordinates.length === 2 &&
    user.geoLocation.coordinates[0] !== 0 &&
    user.geoLocation.coordinates[1] !== 0
  ) {
    return {
      longitude: user.geoLocation.coordinates[0],
      latitude: user.geoLocation.coordinates[1],
    }
  }
  return null
}

// Loading Screen Component
const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
      <p className='text-gray-600'>{message}</p>
    </div>
  </div>
)

// Error Screen Component
const ErrorScreen = ({
  error,
  onRefresh,
  onLogout,
}: {
  error: string
  onRefresh: () => void
  onLogout?: () => void
}) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
      <div className='text-6xl mb-4'>😕</div>
      <h2 className='text-2xl font-bold text-gray-900 mb-4'>
        Something went wrong
      </h2>
      <p className='text-gray-600 mb-4'>{error}</p>
      <div className='flex gap-3'>
        <Button
          title='Try Again'
          onClick={onRefresh}
          btnStyle='flex-1 bg-pink-500 text-white px-4 py-3 rounded-xl hover:bg-pink-600 transition-colors'
        />
        {onLogout && (
          <Button
            title='Logout'
            onClick={onLogout}
            btnStyle='flex-1 bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors'
          />
        )}
      </div>
    </div>
  </div>
)

// Empty Screen Component
const EmptyScreen = ({
  onRefresh,
  onLogout,
  showLikedOnly,
  onToggleLikedOnly,
}: {
  onRefresh: () => void
  onLogout?: () => void
  showLikedOnly?: boolean
  onToggleLikedOnly?: () => void
}) => {
  const router = useRouter()
  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
      <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
        <div className='text-6xl mb-4'>{showLikedOnly ? '💖' : '😢'}</div>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>
          {showLikedOnly ? 'No Liked Profiles Yet' : 'No profiles found'}
        </h2>
        <p className='text-gray-600 mb-6'>
          {showLikedOnly
            ? "You haven't liked any profiles yet. Start swiping to build your list!"
            : "No potential matches found in your area. If you don't fill your profile fill may be that is the problem "}
        </p>
        <div className='flex flex-col gap-3'>
          {showLikedOnly && onToggleLikedOnly ? (
            <Button
              title='Show All Profiles'
              onClick={onToggleLikedOnly}
              btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
            />
          ) : (
            <Button
              title='Refresh'
              onClick={onRefresh}
              btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
            />
          )}
          {onLogout && (
            <Button
              title='profile'
              onClick={() => router.push('/profile')}
              btnStyle='bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors'
            />
          )}
          {onLogout && (
            <Button
              title='Logout'
              onClick={onLogout}
              btnStyle='bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors'
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Match Modal Component
const MatchModal = ({
  lastMatch,
  onClose,
}: {
  lastMatch: any
  onClose: () => void
}) => (
  <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
    <div className='bg-white rounded-3xl p-8 text-center max-w-sm w-full'>
      <div className='text-6xl mb-4'>🎉</div>
      <h3 className='text-2xl font-bold text-gray-900 mb-2'>It's a Match!</h3>
      <p className='text-gray-600 mb-4'>You matched with {lastMatch.name}</p>
      <Button
        title='Continue Swiping'
        onClick={onClose}
        btnStyle='bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600 transition-colors'
      />
    </div>
  </div>
)

// Image Modal Component
const ImageModal = ({
  photos,
  currentPhotoIndex,
  onClose,
  onNext,
  onPrev,
  userName,
}: {
  photos: string[]
  currentPhotoIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  userName: string
}) => (
  <div className='fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4'>
    <div className='relative max-w-4xl max-h-full w-full'>
      <Button
        title='✕'
        onClick={onClose}
        btnStyle='absolute top-4 right-4 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors p-0 min-w-0'
      />

      {photos.length > 1 && (
        <>
          <Button
            title='‹'
            onClick={onPrev}
            btnStyle='absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors p-0 min-w-0'
            disabled={currentPhotoIndex === 0}
          />
          <Button
            title='›'
            onClick={onNext}
            btnStyle='absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors p-0 min-w-0'
            disabled={currentPhotoIndex === photos.length - 1}
          />
        </>
      )}

      <div className='flex flex-col items-center'>
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photos[currentPhotoIndex]}`}
          alt={`${userName} - Photo ${currentPhotoIndex + 1}`}
          className='max-w-full max-h-[80vh] object-contain rounded-lg'
        />
        <div className='text-white mt-4 text-center'>
          <p>
            {currentPhotoIndex + 1} of {photos.length}
          </p>
        </div>
      </div>
    </div>
  </div>
)

// Action Buttons Component
const ActionButtons = ({
  onPass,
  onLike,
  isLiked,
  disabled,
  showLikedOnly,
}: any) => (
  <div className='flex justify-center gap-8 mt-8 pb-8'>
    {!showLikedOnly ? (
      <>
        <Button
          title={isLiked ? '💔 Pass' : '❌ Pass'}
          onClick={onPass}
          disabled={disabled}
          btnStyle={`w-24 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 font-medium text-base p-0 min-w-0 ${
            isLiked
              ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
          }`}
        />
        <Button
          title={isLiked ? '💔 Unlike' : '💖 Like'}
          onClick={onLike}
          disabled={disabled}
          btnStyle={`w-24 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 font-medium text-base p-0 min-w-0 ${
            isLiked
              ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
              : 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600'
          }`}
        />
      </>
    ) : (
      <Button
        title='💔 Remove'
        onClick={onLike}
        disabled={disabled}
        btnStyle='w-32 h-16 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 font-medium text-base'
      />
    )}
  </div>
)

// User Card Component
const UserCard = ({
  user,
  isLiked,
  currentPhotoIndex,
  hasMultiplePhotos,
  onPhotoSwipe,
  onPrevPhoto,
  onNextPhoto,
  onImageClick,
  showLikedOnly,
}: any) => (
  <div className='bg-white rounded-3xl shadow-lg overflow-hidden'>
    <div className='relative h-96'>
      {user.photos && user.photos.length > 0 ? (
        <>
          <div
            className='w-full h-full cursor-pointer relative'
            onClick={onPhotoSwipe}
          >
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.photos[currentPhotoIndex]}`}
              alt={`${user.name} - Photo ${currentPhotoIndex + 1}`}
              className='w-full h-full object-cover cursor-zoom-in'
              onClick={(e) => {
                e.stopPropagation()
                onImageClick()
              }}
            />

            {user.distance !== undefined && (
              <div className='absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-10'>
                {formatDistance(user.distance)}
              </div>
            )}

            {isLiked && (
              <div className='absolute top-4 left-4 bg-pink-500 text-white px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-10'>
                ❤️ Liked
              </div>
            )}

            {hasMultiplePhotos && (
              <>
                <Button
                  title='‹'
                  onClick={(e) => {
                    e.stopPropagation()
                    onPrevPhoto()
                  }}
                  btnStyle='absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/10 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-opacity p-0 min-w-0'
                />
                <Button
                  title='›'
                  onClick={(e) => {
                    e.stopPropagation()
                    onNextPhoto()
                  }}
                  btnStyle='absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/10 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-opacity p-0 min-w-0'
                />
              </>
            )}
          </div>
          {hasMultiplePhotos && (
            <>
              <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2'>
                {user.photos.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentPhotoIndex
                        ? 'bg-white scale-125'
                        : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
              <div className='absolute top-4 left-4 bg-black/10 bg-opacity-50 text-white px-2 py-1 rounded-full text-xs'>
                {currentPhotoIndex + 1} / {user.photos.length}
              </div>
            </>
          )}
        </>
      ) : (
        <div className='w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg'>
          No Photo
        </div>
      )}
    </div>
    <div className='p-6'>
      <div className='flex justify-between items-start mb-4'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            {user.name}, {user.age}
          </h2>
          <p className='text-gray-600'>{user.gender}</p>
        </div>
        {showLikedOnly && (
          <div className='bg-green-500 text-white px-3 py-1 rounded-full text-sm'>
            💖 Liked
          </div>
        )}
      </div>
      {user.bio && (
        <p className='text-gray-700 mb-4 leading-relaxed'>{user.bio}</p>
      )}
      {user.location && (
        <p className='text-gray-600 text-sm mb-4 flex items-center gap-1'>
          📍 {user.location}
        </p>
      )}
      {user.interests && user.interests.length > 0 && (
        <div className='mb-2'>
          <h3 className='text-sm font-semibold text-gray-900 mb-2'>
            Interests
          </h3>
          <div className='flex flex-wrap gap-2'>
            {user.interests
              .slice(0, 4)
              .map((interest: string, index: number) => (
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
)

const DiscoveryPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const {
    user: authUser,
    loading: authLoading,
    checkingAuth,
    error: authError,
  } = useSelector((state: RootState) => state.auth)

  const {
    recommendedUsers,
    loading: recommendationsLoading,
    error: recommendationsError,
    swipeHistory,
    loadingSwipeHistory,
  } = useSelector((state: RootState) => state.discovery)

  const { loading: swipeLoading, lastMatch } = useSelector(
    (state: RootState) => state.swipe
  )

  const { user: profileUser, loading: profileLoading } = useSelector(
    (state: RootState) => state.profile
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [localLikedUsers, setLocalLikedUsers] = useState<Set<string>>(new Set())
  const [localPassedUsers, setLocalPassedUsers] = useState<Set<string>>(
    new Set()
  )
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [shuffledUsers, setShuffledUsers] = useState<UserProfile[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [showLikedOnly, setShowLikedOnly] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false)

  // ==================== FUNCTION DECLARATIONS (MOVED TO TOP) ====================

  // Navigation handlers
  const handleViewProfile = () => router.push('/profile')
  const handleViewMatches = () => router.push('/matches')

  // Logout handlers
  const openLogoutModal = () => setShowLogoutModal(true)

  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      dispatch(logoutRequest())
    }
  }, [dispatch])

  const confirmLogout = () => {
    dispatch(logoutRequest())
    setShowLogoutModal(false)
  }

  const cancelLogout = () => setShowLogoutModal(false)

  // Optimized geolocation fetching - MOVED BEFORE handleRefresh
  const fetchRecommendations = useCallback(
    (latitude?: number, longitude?: number) => {
      console.log('📍 Fetching recommendations with location:', {
        latitude,
        longitude,
      })

      if (latitude && longitude) {
        dispatch(
          getRecommendationsRequest({
            latitude,
            longitude,
          })
        )
      } else {
        dispatch(getRecommendationsRequest({}))
      }

      setHasFetched(true)
    },
    [dispatch]
  )

  // Optimized geolocation function - MOVED BEFORE handleRefresh
  const getLocationAndFetch = useCallback(() => {
    if (navigator.geolocation) {
      console.log('📍 Attempting to get user location...')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('📍 User location captured:', { latitude, longitude })
          setUserLocation({ latitude, longitude })
          fetchRecommendations(latitude, longitude)
        },
        (error) => {
          console.log('⚠️ Geolocation error or denied:', error.message)
          setUserLocation(null)
          fetchRecommendations()
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 30000,
        }
      )
    } else {
      console.log('📍 Geolocation not supported')
      setUserLocation(null)
      fetchRecommendations()
    }
  }, [fetchRecommendations])

  // Refresh handler - NOW IT CAN USE getLocationAndFetch
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered')
    setHasFetched(false)
    setIsInitialLoad(true)
    setCurrentIndex(0)
    setLocalLikedUsers(new Set())
    setLocalPassedUsers(new Set())
    setCurrentPhotoIndex(0)
    setShuffledUsers([])
    setShowLikedOnly(false)

    if (authUser) {
      dispatch(getSwipeHistoryRequest())
      dispatch(getProfileRequest())
      getLocationAndFetch()
    }
  }, [authUser, dispatch, getLocationAndFetch])

  // Toggle liked only view
  const toggleLikedOnly = () => setShowLikedOnly(!showLikedOnly)

  // Get gender from profile
  const currentUserGender = useMemo(() => {
    if (profileUser?.gender) {
      return profileUser.gender.toLowerCase().trim()
    }
    return null
  }, [profileUser])

  // Calculate distances for users when location data is available
  const usersWithDistance = useMemo(() => {
    if (!userLocation || !shuffledUsers.length) return shuffledUsers

    return shuffledUsers.map((user) => {
      const userCoords = getCoordinates(user)
      if (userCoords) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          userCoords.latitude,
          userCoords.longitude
        )
        return { ...user, distance }
      }
      return user
    })
  }, [shuffledUsers, userLocation])

  // Filter users based on gender preference from profile AND use shuffled order
  const filteredUsers = useMemo(() => {
    if (!currentUserGender || !usersWithDistance.length)
      return usersWithDistance

    const filtered = usersWithDistance.filter((user) => {
      const userGender = user.gender?.toLowerCase().trim()

      // Male users see only females
      if (currentUserGender === 'male') {
        return userGender === 'female'
      }
      // Female users see only males
      else if (currentUserGender === 'female') {
        return userGender === 'male'
      }
      // For 'other' or any other gender, show all profiles
      return true
    })

    return filtered
  }, [usersWithDistance, currentUserGender])

  // Filter to show only liked users when showLikedOnly is true
  const displayUsers = useMemo(() => {
    if (!showLikedOnly) return filteredUsers

    // Filter to only show users that have been liked
    const likedUsers = filteredUsers.filter((user) =>
      localLikedUsers.has(user._id)
    )

    return likedUsers
  }, [filteredUsers, showLikedOnly, localLikedUsers])

  // Get the count of liked users for the button badge
  const likedUsersCount = useMemo(() => {
    return filteredUsers.filter((user) => localLikedUsers.has(user._id)).length
  }, [filteredUsers, localLikedUsers])

  // ==================== FIXED AUTHENTICATION LOGIC ====================

  // DEBUG: Check cookies and localStorage
  useEffect(() => {
    console.log('🍪 Debug: Checking authentication state...')
    console.log('🍪 Cookies:', document.cookie)
    console.log('📦 Redux authUser:', authUser)
    console.log('🔄 CheckingAuth:', checkingAuth)
    console.log('⏳ AuthLoading:', authLoading)
    console.log('✅ AuthCheckCompleted:', authCheckCompleted)
    console.log('➡️ IsRedirecting:', isRedirecting)
  }, [authUser, checkingAuth, authLoading, authCheckCompleted, isRedirecting])

  // Main authentication effect - runs once on mount
  useEffect(() => {
    console.log('🔐 DiscoveryPage mounted, starting auth check...')

    // If auth check already completed, return
    if (authCheckCompleted) {
      console.log('✅ Auth check already completed')
      return
    }

    // If already checking or loading, return
    if (checkingAuth || authLoading) {
      console.log('⏳ Auth check already in progress...')
      return
    }

    // If we already have a user in Redux store, mark as completed
    if (authUser) {
      console.log('✅ User already authenticated in Redux')
      setAuthCheckCompleted(true)
      return
    }

    // Start the auth check
    console.log('🔄 Starting new auth check...')
    dispatch(checkAuthRequest())
  }, [dispatch, checkingAuth, authLoading, authUser, authCheckCompleted])

  // Track when auth check is complete
  useEffect(() => {
    // Auth check is complete when:
    // 1. We're not checking auth anymore
    // 2. We're not loading auth
    // 3. We haven't marked it as completed yet
    if (!checkingAuth && !authLoading && !authCheckCompleted) {
      console.log('✅ Auth check process completed')
      console.log('👤 User after check:', authUser ? 'Exists' : 'Null')
      setAuthCheckCompleted(true)
    }
  }, [checkingAuth, authLoading, authCheckCompleted, authUser])

  // Handle redirect only after auth check is complete
  useEffect(() => {
    // Only consider redirecting after auth check is complete
    if (!authCheckCompleted) {
      console.log(
        '⏳ Waiting for auth check to complete before redirect check...'
      )
      return
    }

    // Don't redirect if still checking or loading
    if (checkingAuth || authLoading) {
      console.log('⏳ Still checking/loading, skipping redirect check...')
      return
    }

    console.log('🔄 Evaluating redirect after auth check:', {
      hasUser: !!authUser,
      checkingAuth,
      authLoading,
      authCheckCompleted,
      isRedirecting,
    })

    // If we have a user, fetch profile and continue
    if (authUser) {
      console.log('✅ User authenticated, proceeding with app...')

      // Fetch profile if needed
      if (!profileUser && !profileLoading) {
        console.log('👤 Fetching profile for authenticated user')
        dispatch(getProfileRequest())
      }
      return
    }

    // If no user after auth check AND we're not already redirecting
    if (!authUser && !isRedirecting) {
      console.log(
        '❌ No authenticated user after check, will redirect to login...'
      )
      setIsRedirecting(true)

      // Give a small delay to show the redirecting message
      const redirectTimer = setTimeout(() => {
        console.log('➡️ Redirecting to login page')
        router.replace('/login')
      }, 500)

      return () => clearTimeout(redirectTimer)
    }
  }, [
    authUser,
    checkingAuth,
    authLoading,
    authCheckCompleted,
    isRedirecting,
    router,
    profileUser,
    profileLoading,
    dispatch,
  ])

  // Initialize swipe history when data is available
  useEffect(() => {
    if (swipeHistory.likedUsers || swipeHistory.passedUsers) {
      setLocalLikedUsers(new Set(swipeHistory.likedUsers || []))
      setLocalPassedUsers(new Set(swipeHistory.passedUsers || []))
    }
  }, [swipeHistory.likedUsers, swipeHistory.passedUsers])

  // Reset photo index when current index changes
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [currentIndex])

  // Reset to first profile when switching between modes
  useEffect(() => {
    setCurrentIndex(0)
    setCurrentPhotoIndex(0)
  }, [showLikedOnly])

  // Main data fetching logic - only run when user is authenticated and has profile
  useEffect(() => {
    if (authUser && profileUser && !hasFetched && isInitialLoad) {
      console.log('🔄 Starting data fetch process...')

      // Fetch swipe history immediately
      dispatch(getSwipeHistoryRequest())

      // Start geolocation and recommendations
      getLocationAndFetch()
    }
  }, [
    authUser,
    profileUser,
    hasFetched,
    isInitialLoad,
    dispatch,
    getLocationAndFetch,
  ])

  // Shuffle users when recommendations are loaded - FIXED: Handle empty recommendations
  useEffect(() => {
    if (recommendedUsers.length > 0 && isInitialLoad) {
      console.log('🎲 Shuffling recommended users:', recommendedUsers.length)
      const shuffled = shuffleArray(recommendedUsers as UserProfile[])
      setShuffledUsers(shuffled)
      setIsInitialLoad(false)
    } else if (recommendedUsers.length === 0 && isInitialLoad) {
      // FIX: Handle empty recommendations case
      console.log('📭 No recommendations received, showing empty state')
      setShuffledUsers([])
      setIsInitialLoad(false)
    }
  }, [recommendedUsers, isInitialLoad])

  // Handle match modal
  useEffect(() => {
    if (lastMatch) {
      setShowMatchModal(true)
      const timer = setTimeout(() => {
        setShowMatchModal(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastMatch])

  // Reset current index when filtered users change
  useEffect(() => {
    if (displayUsers.length > 0 && currentIndex >= displayUsers.length) {
      setCurrentIndex(0)
    }
  }, [displayUsers, currentIndex])

  // ==================== EVENT HANDLERS (CONTINUED) ====================

  // Navigation functions
  const goToNextProfile = () => {
    if (displayUsers.length === 0) return

    if (currentIndex < displayUsers.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const goToPreviousProfile = () => {
    if (displayUsers.length === 0) return

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    } else {
      setCurrentIndex(displayUsers.length - 1)
    }
  }

  // Pass button handler
  const handlePass = () => {
    if (currentIndex >= displayUsers.length || !authUser) return

    const swipedUser = displayUsers[currentIndex]
    const currentUserId = swipedUser._id
    const isCurrentlyLiked = localLikedUsers.has(currentUserId)

    if (isCurrentlyLiked) {
      // Pass on liked profile - just move to next
      goToNextProfile()
    } else {
      // Pass on non-liked profile
      if (!localPassedUsers.has(currentUserId)) {
        setLocalPassedUsers((prev) => new Set([...prev, currentUserId]))
        dispatch(addPassedUser(currentUserId))
        dispatch(
          createSwipeRequest({
            swipedUserId: currentUserId,
            action: 'pass',
          })
        )
      }
      goToNextProfile()
    }
  }

  // Like button handler
  const handleLike = () => {
    if (currentIndex >= displayUsers.length || !authUser) return

    const swipedUser = displayUsers[currentIndex]
    const currentUserId = swipedUser._id
    const isCurrentlyLiked = localLikedUsers.has(currentUserId)

    if (isCurrentlyLiked) {
      // Unlike
      setLocalLikedUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentUserId)
        return newSet
      })
      setLocalPassedUsers((prev) => new Set([...prev, currentUserId]))

      if (updateLikeToPass) {
        dispatch(updateLikeToPass(currentUserId))
      } else {
        dispatch(addPassedUser(currentUserId))
      }

      dispatch(
        createSwipeRequest({
          swipedUserId: currentUserId,
          action: 'pass',
        })
      )
    } else {
      // Like
      setLocalLikedUsers((prev) => new Set([...prev, currentUserId]))
      setLocalPassedUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentUserId)
        return newSet
      })

      dispatch(addLikedUser(currentUserId))

      dispatch(
        createSwipeRequest({
          swipedUserId: currentUserId,
          action: 'like',
        })
      )
    }
  }

  // Photo gallery functions
  const nextPhoto = () => {
    const currentUser = displayUsers[currentIndex]
    if (
      currentUser?.photos &&
      currentPhotoIndex < currentUser.photos.length - 1
    ) {
      setCurrentPhotoIndex((prev) => prev + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => prev - 1)
    }
  }

  const handlePhotoSwipe = (e: React.MouseEvent) => {
    const cardWidth = e.currentTarget.clientWidth
    const clickX = e.nativeEvent.offsetX
    if (clickX < cardWidth / 2) prevPhoto()
    else nextPhoto()
  }

  // Image modal functions
  const handleImageClick = () => {
    const currentUser = displayUsers[currentIndex]
    if (currentUser?.photos && currentUser.photos.length > 0) {
      setShowImageModal(true)
    }
  }

  const handleCloseImageModal = () => {
    setShowImageModal(false)
  }

  const handleModalNextPhoto = () => {
    const currentUser = displayUsers[currentIndex]
    if (
      currentUser?.photos &&
      currentPhotoIndex < currentUser.photos.length - 1
    ) {
      setCurrentPhotoIndex((prev) => prev + 1)
    }
  }

  const handleModalPrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => prev - 1)
    }
  }

  // ==================== RENDER LOGIC ====================

  // Show loading during initial auth check
  if (checkingAuth || authLoading) {
    return <LoadingScreen message='Checking authentication...' />
  }

  // Show loading if redirecting (but only after auth check is complete)
  if (isRedirecting && authCheckCompleted) {
    return <LoadingScreen message='Redirecting to login...' />
  }

  // Show error if auth check failed
  if (authError && !authUser && authCheckCompleted) {
    return (
      <ErrorScreen
        error='Authentication failed. Please login again.'
        onRefresh={() => router.refresh()}
        onLogout={handleLogout}
      />
    )
  }

  // Show loading while fetching profile and initial data
  const showDataLoading =
    (authUser && !profileUser && profileLoading) ||
    (isInitialLoad && recommendationsLoading) ||
    (isInitialLoad && loadingSwipeHistory)

  if (showDataLoading) {
    return <LoadingScreen message='Loading discovery...' />
  }

  if (recommendationsError) {
    return (
      <ErrorScreen
        error={recommendationsError}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
      />
    )
  }

  // FIXED: Show empty states when there are no users to display
  // This check happens regardless of isInitialLoad, but we need to ensure
  // we're not showing empty state while still loading
  if (!recommendationsLoading && !loadingSwipeHistory && !isInitialLoad) {
    // Check if we should show empty liked screen
    if (displayUsers.length === 0 && showLikedOnly) {
      return (
        <EmptyScreen
          onRefresh={handleRefresh}
          onLogout={handleLogout}
          showLikedOnly={showLikedOnly}
          onToggleLikedOnly={toggleLikedOnly}
        />
      )
    }

    // Check if we should show regular empty screen
    if (displayUsers.length === 0) {
      return <EmptyScreen onRefresh={handleRefresh} onLogout={handleLogout} />
    }
  }

  // FIXED: Safe access to current user - only if we have displayUsers
  const currentUser =
    displayUsers.length > 0 ? displayUsers[currentIndex] : null

  // If we're done loading but have no users, show empty state (fallback)
  if (!isInitialLoad && !currentUser && displayUsers.length === 0) {
    return <EmptyScreen onRefresh={handleRefresh} onLogout={handleLogout} />
  }

  // If we're still waiting for currentUser but not in initial load, show loading
  if (!currentUser && !isInitialLoad) {
    return <LoadingScreen message='Loading profile...' />
  }

  // If we have no currentUser at this point, something went wrong
  if (!currentUser) {
    return <LoadingScreen message='Preparing discovery...' />
  }

  const hasMultiplePhotos = currentUser.photos && currentUser.photos.length > 1
  const isLiked = localLikedUsers.has(currentUser._id)

  // Header Component
  const Header = ({
    onViewProfile,
    onViewMatches,
    disabled,
    showLikedOnly,
    onToggleLikedOnly,
    likedUsersCount,
    onRefresh,
  }: any) => (
    <header className='bg-white shadow-sm py-4 px-6'>
      <div className='max-w-2xl mx-auto flex justify-between items-center'>
        <Button
          title='👤'
          onClick={onViewProfile}
          disabled={disabled}
          btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
        />

        <div className='flex items-center gap-4'>
          <Button
            title='🔄'
            onClick={onRefresh}
            disabled={disabled}
            btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
          />

          <Button
            title={
              <div className='flex items-center gap-2'>
                {showLikedOnly ? '💖' : '💕'}
                {likedUsersCount > 0 && (
                  <span className='bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                    {likedUsersCount}
                  </span>
                )}
              </div>
            }
            onClick={onToggleLikedOnly}
            disabled={disabled}
            btnStyle={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 p-0 min-w-0 text-lg ${
              showLikedOnly
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          />

          <h1 className='text-xl font-bold text-gray-900'>
            {showLikedOnly ? 'Liked Profiles' : 'Discover'}
          </h1>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            title='💌'
            onClick={onViewMatches}
            disabled={disabled}
            btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
          />

          <Button
            title='🚪'
            onClick={openLogoutModal}
            disabled={disabled}
            btnStyle='w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
          />
        </div>
      </div>
    </header>
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50'>
      {showMatchModal && lastMatch && (
        <MatchModal
          lastMatch={lastMatch}
          onClose={() => setShowMatchModal(false)}
        />
      )}

      {showImageModal && (
        <ImageModal
          photos={currentUser.photos || []}
          currentPhotoIndex={currentPhotoIndex}
          onClose={handleCloseImageModal}
          onNext={handleModalNextPhoto}
          onPrev={handleModalPrevPhoto}
          userName={currentUser.name}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl p-6 max-w-sm w-full'>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>
              Confirm Logout
            </h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to logout?
            </p>
            <div className='flex gap-3'>
              <Button
                title='Cancel'
                onClick={cancelLogout}
                btnStyle='flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium'
              />
              <Button
                title='Logout'
                onClick={confirmLogout}
                btnStyle='flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium'
              />
            </div>
          </div>
        </div>
      )}

      <Header
        onViewProfile={handleViewProfile}
        onViewMatches={handleViewMatches}
        disabled={swipeLoading || showDataLoading}
        showLikedOnly={showLikedOnly}
        onToggleLikedOnly={toggleLikedOnly}
        likedUsersCount={likedUsersCount}
        onRefresh={handleRefresh}
      />

      <div className='max-w-md mx-auto pt-8 px-4'>
        {displayUsers.length > 1 && (
          <div className='flex justify-between items-center mb-4'>
            <Button
              title='←'
              onClick={goToPreviousProfile}
              disabled={swipeLoading}
              btnStyle='w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 p-0 min-w-0 text-xl'
            />

            <Button
              title='→'
              onClick={goToNextProfile}
              disabled={swipeLoading}
              btnStyle='w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 p-0 min-w-0 text-xl'
            />
          </div>
        )}

        <UserCard
          user={currentUser}
          isLiked={isLiked}
          currentPhotoIndex={currentPhotoIndex}
          hasMultiplePhotos={hasMultiplePhotos}
          onPhotoSwipe={handlePhotoSwipe}
          onPrevPhoto={prevPhoto}
          onNextPhoto={nextPhoto}
          onImageClick={handleImageClick}
          showLikedOnly={showLikedOnly}
        />

        <ActionButtons
          onPass={handlePass}
          onLike={handleLike}
          isLiked={isLiked}
          disabled={swipeLoading}
          showLikedOnly={showLikedOnly}
        />
      </div>
    </div>
  )
}

export default DiscoveryPage
