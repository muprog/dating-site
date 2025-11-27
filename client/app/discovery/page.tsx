// 'use client'
// import React, { useEffect, useState, useMemo } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { useRouter } from 'next/navigation'
// import { RootState, AppDispatch } from '../../store/store'
// import {
//   getRecommendationsRequest,
//   getSwipeHistoryRequest,
//   addLikedUser,
//   addPassedUser,
// } from '../../store/slices/discoverySlice'
// import { createSwipeRequest } from '../../store/slices/swipeSlice'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import { getProfileRequest } from '../../store/slices/profileSlice'
// import Button from '../../components/Button' // Import your Button component

// interface UserProfile {
//   _id: string
//   name: string
//   age: number
//   bio: string
//   photos: string[]
//   gender: string
//   interests: string[]
//   location: string
// }

// // Fisher-Yates shuffle algorithm for random ordering
// const shuffleArray = <T,>(array: T[]): T[] => {
//   const shuffled = [...array]
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1))
//     ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
//   }
//   return shuffled
// }

// const DiscoveryPage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>()
//   const router = useRouter()

//   const { user: authUser, loading: authLoading } = useSelector(
//     (state: RootState) => state.auth
//   )
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
//   const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
//   const [shuffledUsers, setShuffledUsers] = useState<UserProfile[]>([])
//   const [showImageModal, setShowImageModal] = useState(false)

//   // Get gender from profile
//   const currentUserGender = useMemo(() => {
//     if (profileUser?.gender) {
//       return profileUser.gender.toLowerCase().trim()
//     }
//     return null
//   }, [profileUser])

//   // Shuffle users when recommendations change
//   useEffect(() => {
//     if (recommendedUsers.length > 0) {
//       console.log('🎲 Shuffling user order...')
//       const shuffled = shuffleArray(recommendedUsers)
//       setShuffledUsers(shuffled)
//       setCurrentIndex(0) // Reset to first profile after shuffle
//       setCurrentPhotoIndex(0)
//     }
//   }, [recommendedUsers])

//   // Filter users based on gender preference from profile AND use shuffled order
//   const filteredUsers = useMemo(() => {
//     if (!currentUserGender || !shuffledUsers.length) return shuffledUsers

//     const filtered = shuffledUsers.filter((user) => {
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
//   }, [shuffledUsers, currentUserGender])

//   useEffect(() => {
//     if (!authUser) {
//       dispatch(checkAuthRequest())
//     }
//   }, [authUser, dispatch])

//   // Fetch profile when auth user is available
//   useEffect(() => {
//     if (authUser && !profileUser && !profileLoading) {
//       dispatch(getProfileRequest())
//     }
//   }, [authUser, profileUser, profileLoading, dispatch])

//   useEffect(() => {
//     setLocalLikedUsers(new Set(swipeHistory.likedUsers))
//   }, [swipeHistory.likedUsers])

//   useEffect(() => {
//     setCurrentPhotoIndex(0)
//   }, [currentIndex])

//   useEffect(() => {
//     if (
//       authUser &&
//       profileUser && // Wait for profile to be loaded
//       !hasFetched &&
//       !recommendationsLoading &&
//       !loadingSwipeHistory
//     ) {
//       setHasFetched(true)
//       dispatch(getSwipeHistoryRequest())

//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           (position) => {
//             const { latitude, longitude } = position.coords
//             dispatch(getRecommendationsRequest({ latitude, longitude }))
//           },
//           () => {
//             dispatch(getRecommendationsRequest({}))
//           }
//         )
//       } else {
//         dispatch(getRecommendationsRequest({}))
//       }
//     }
//   }, [
//     authUser,
//     profileUser,
//     hasFetched,
//     recommendationsLoading,
//     loadingSwipeHistory,
//     dispatch,
//   ])

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
//     if (filteredUsers.length > 0 && currentIndex >= filteredUsers.length) {
//       setCurrentIndex(0)
//     }
//   }, [filteredUsers, currentIndex])

//   // Navigate to next profile (circular navigation)
//   const goToNextProfile = () => {
//     if (filteredUsers.length === 0) return

//     if (currentIndex < filteredUsers.length - 1) {
//       // Go to next profile
//       setCurrentIndex((prev) => prev + 1)
//     } else {
//       // Circular navigation: go back to first profile
//       setCurrentIndex(0)
//     }
//   }

//   // Navigate to previous profile (circular navigation)
//   const goToPreviousProfile = () => {
//     if (filteredUsers.length === 0) return

//     if (currentIndex > 0) {
//       // Go to previous profile
//       setCurrentIndex((prev) => prev - 1)
//     } else {
//       // Circular navigation: go to last profile
//       setCurrentIndex(filteredUsers.length - 1)
//     }
//   }

//   // Pass button: moves to next profile with circular navigation
//   const handlePass = () => {
//     if (currentIndex >= filteredUsers.length || !authUser) return

//     const swipedUser = filteredUsers[currentIndex]
//     const currentUserId = swipedUser._id

//     // Only create pass if not already liked
//     if (!localLikedUsers.has(currentUserId)) {
//       dispatch(addPassedUser(currentUserId))
//       dispatch(
//         createSwipeRequest({
//           swipedUserId: currentUserId,
//           action: 'pass',
//         })
//       )
//     }

//     // ALWAYS move to next profile (with circular navigation)
//     goToNextProfile()
//   }

//   // Like button: ONLY toggles like/pass on current profile, doesn't move to next profile
//   const handleLike = () => {
//     if (currentIndex >= filteredUsers.length || !authUser) return

//     const swipedUser = filteredUsers[currentIndex]
//     const currentUserId = swipedUser._id
//     const isCurrentlyLiked = localLikedUsers.has(currentUserId)

//     if (isCurrentlyLiked) {
//       // Change from like to pass
//       setLocalLikedUsers((prev) => {
//         const newSet = new Set(prev)
//         newSet.delete(currentUserId)
//         return newSet
//       })
//       dispatch(addPassedUser(currentUserId))
//       dispatch(
//         createSwipeRequest({
//           swipedUserId: currentUserId,
//           action: 'pass',
//         })
//       )
//     } else {
//       // Change from pass to like
//       setLocalLikedUsers((prev) => new Set([...prev, currentUserId]))
//       dispatch(addLikedUser(currentUserId))
//       dispatch(
//         createSwipeRequest({
//           swipedUserId: currentUserId,
//           action: 'like',
//         })
//       )
//     }
//     // DO NOT move to next profile
//   }

//   // Photo gallery functions
//   const nextPhoto = () => {
//     if (
//       currentIndex < filteredUsers.length &&
//       currentUser.photos &&
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
//     if (currentUser.photos && currentUser.photos.length > 0) {
//       setShowImageModal(true)
//     }
//   }

//   const handleCloseImageModal = () => {
//     setShowImageModal(false)
//   }

//   const handleModalNextPhoto = () => {
//     if (currentPhotoIndex < currentUser.photos.length - 1) {
//       setCurrentPhotoIndex((prev) => prev + 1)
//     }
//   }

//   const handleModalPrevPhoto = () => {
//     if (currentPhotoIndex > 0) {
//       setCurrentPhotoIndex((prev) => prev - 1)
//     }
//   }

//   const handleViewProfile = () => router.push('/profile')
//   const handleViewMatches = () => router.push('/matches')
//   const handleRefresh = () => {
//     setHasFetched(false)
//     setCurrentIndex(0)
//     setLocalLikedUsers(new Set())
//     setCurrentPhotoIndex(0)
//     // Refresh profile data
//     if (authUser) {
//       dispatch(getProfileRequest())
//     }
//     // Re-shuffle users on refresh
//     if (recommendedUsers.length > 0) {
//       const reshuffled = shuffleArray(recommendedUsers)
//       setShuffledUsers(reshuffled)
//     }
//   }

//   const isCurrentUserLiked = () => {
//     if (currentIndex >= filteredUsers.length) return false
//     return localLikedUsers.has(filteredUsers[currentIndex]._id)
//   }

//   const isLiked = isCurrentUserLiked()
//   const isLoading =
//     authLoading ||
//     recommendationsLoading ||
//     loadingSwipeHistory ||
//     profileLoading

//   if (!authUser || isLoading) {
//     return <LoadingScreen />
//   }

//   if (recommendationsError) {
//     return (
//       <ErrorScreen error={recommendationsError} onRefresh={handleRefresh} />
//     )
//   }

//   if (filteredUsers.length === 0 && recommendedUsers.length > 0) {
//     return (
//       <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//         <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
//           <div className='text-6xl mb-4'>🔍</div>
//           <h2 className='text-2xl font-bold text-gray-900 mb-4'>
//             No {currentUserGender === 'male' ? 'Female' : 'Male'} Profiles Found
//           </h2>
//           <p className='text-gray-600 mb-6'>
//             {currentUserGender === 'male'
//               ? 'No female profiles found in your area. Try refreshing or adjusting your location.'
//               : 'No male profiles found in your area. Try refreshing or adjusting your location.'}
//           </p>
//           <Button
//             title='Refresh'
//             onClick={handleRefresh}
//             btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//           />
//         </div>
//       </div>
//     )
//   }

//   if (filteredUsers.length === 0) {
//     return <EmptyScreen onRefresh={handleRefresh} />
//   }

//   const currentUser = filteredUsers[currentIndex]
//   const hasMultiplePhotos = currentUser.photos && currentUser.photos.length > 1

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
//           photos={currentUser.photos}
//           currentPhotoIndex={currentPhotoIndex}
//           onClose={handleCloseImageModal}
//           onNext={handleModalNextPhoto}
//           onPrev={handleModalPrevPhoto}
//           userName={currentUser.name}
//         />
//       )}

//       <Header
//         onViewProfile={handleViewProfile}
//         onViewMatches={handleViewMatches}
//         disabled={swipeLoading}
//       />

//       <div className='max-w-md mx-auto pt-8 px-4'>
//         {/* Navigation arrows for manual navigation */}
//         {filteredUsers.length > 1 && (
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
//         />

//         <ActionButtons
//           onPass={handlePass}
//           onLike={handleLike}
//           isLiked={isLiked}
//           disabled={swipeLoading}
//         />
//       </div>
//     </div>
//   )
// }

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

// // ActionButtons without circular indicator
// const ActionButtons = ({ onPass, onLike, isLiked, disabled }: any) => (
//   <div className='flex justify-center gap-8 mt-8 pb-8'>
//     <Button
//       title='❌'
//       onClick={onPass}
//       disabled={disabled}
//       btnStyle='w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 p-0 min-w-0 text-2xl'
//     />
//     <Button
//       title={isLiked ? '💔' : '💖'}
//       onClick={onLike}
//       disabled={disabled}
//       btnStyle={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 p-0 min-w-0 text-2xl ${
//         isLiked
//           ? 'bg-pink-500 border-pink-500 text-white'
//           : 'bg-white border-gray-200 hover:bg-pink-50 hover:border-pink-300'
//       }`}
//     />
//   </div>
// )

// // Updated UserCard with image click functionality
// const UserCard = ({
//   user,
//   isLiked,
//   currentPhotoIndex,
//   hasMultiplePhotos,
//   onPhotoSwipe,
//   onPrevPhoto,
//   onNextPhoto,
//   onImageClick,
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
//               <div className='absolute top-4 right-4 bg-black/10 bg-opacity-50 text-white px-2 py-1 rounded-full text-xs'>
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
//         {isLiked && (
//           <div className='bg-pink-500 text-white px-3 py-1 rounded-full text-sm'>
//             ❤️ Liked
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

// // Keep all other components the same
// const LoadingScreen = () => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center'>
//       <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
//       <p className='text-gray-600'>Loading your matches...</p>
//     </div>
//   </div>
// )

// const ErrorScreen = ({
//   error,
//   onRefresh,
// }: {
//   error: string
//   onRefresh: () => void
// }) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
//       <div className='text-6xl mb-4'>😕</div>
//       <h2 className='text-2xl font-bold text-gray-900 mb-4'>
//         Something went wrong
//       </h2>
//       <p className='text-gray-600 mb-4'>{error}</p>
//       <Button
//         title='Try Again'
//         onClick={onRefresh}
//         btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//       />
//     </div>
//   </div>
// )

// const EmptyScreen = ({ onRefresh }: { onRefresh: () => void }) => (
//   <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
//     <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
//       <div className='text-6xl mb-4'>😢</div>
//       <h2 className='text-2xl font-bold text-gray-900 mb-4'>
//         No profiles found
//       </h2>
//       <p className='text-gray-600 mb-6'>
//         No potential matches found in your area.
//       </p>
//       <Button
//         title='Refresh'
//         onClick={onRefresh}
//         btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//       />
//     </div>
//   </div>
// )

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

// const Header = ({ onViewProfile, onViewMatches, disabled }: any) => (
//   <header className='bg-white shadow-sm py-4 px-6'>
//     <div className='max-w-2xl mx-auto flex justify-between items-center'>
//       <Button
//         title='👤'
//         onClick={onViewProfile}
//         disabled={disabled}
//         btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
//       />
//       <h1 className='text-xl font-bold text-gray-900'>Discover</h1>
//       <Button
//         title='💌'
//         onClick={onViewMatches}
//         disabled={disabled}
//         btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
//       />
//     </div>
//   </header>
// )

// export default DiscoveryPage

'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState, AppDispatch } from '../../store/store'
import {
  getRecommendationsRequest,
  getSwipeHistoryRequest,
  addLikedUser,
  addPassedUser,
} from '../../store/slices/discoverySlice'
import { createSwipeRequest } from '../../store/slices/swipeSlice'
import { checkAuthRequest } from '../../store/slices/authSlice'
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
    coordinates: [number, number] // [longitude, latitude]
  }
  distance?: number
}

// Fisher-Yates shuffle algorithm for random ordering
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
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

// Format distance for display - only km, no meters
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `<1km` // Show <1km for distances less than 1km
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km` // Show 1 decimal for short distances
  } else {
    return `${Math.round(distance)}km` // Round for longer distances
  }
}

// Helper function to extract coordinates from geoLocation
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
    // geoLocation.coordinates is [longitude, latitude]
    return {
      longitude: user.geoLocation.coordinates[0],
      latitude: user.geoLocation.coordinates[1],
    }
  }
  return null
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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [shuffledUsers, setShuffledUsers] = useState<UserProfile[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

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

  // Shuffle users when recommendations change
  useEffect(() => {
    if (recommendedUsers.length > 0) {
      console.log('🎲 Shuffling user order...')
      const shuffled = shuffleArray(recommendedUsers as UserProfile[])
      setShuffledUsers(shuffled)
      setCurrentIndex(0) // Reset to first profile after shuffle
      setCurrentPhotoIndex(0)
    }
  }, [recommendedUsers])

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

  useEffect(() => {
    if (!authUser) {
      dispatch(checkAuthRequest())
    }
  }, [authUser, dispatch])

  // Fetch profile when auth user is available
  useEffect(() => {
    if (authUser && !profileUser && !profileLoading) {
      dispatch(getProfileRequest())
    }
  }, [authUser, profileUser, profileLoading, dispatch])

  useEffect(() => {
    setLocalLikedUsers(new Set(swipeHistory.likedUsers))
  }, [swipeHistory.likedUsers])

  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [currentIndex])

  useEffect(() => {
    if (
      authUser &&
      profileUser && // Wait for profile to be loaded
      !hasFetched &&
      !recommendationsLoading &&
      !loadingSwipeHistory
    ) {
      setHasFetched(true)
      dispatch(getSwipeHistoryRequest())

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setUserLocation({ latitude, longitude })
            console.log('📍 User location captured:', { latitude, longitude })
            dispatch(getRecommendationsRequest({ latitude, longitude }))
          },
          (error) => {
            console.error('❌ Error getting user location:', error)
            setUserLocation(null)
            dispatch(getRecommendationsRequest({}))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        )
      } else {
        console.log('📍 Geolocation not supported')
        setUserLocation(null)
        dispatch(getRecommendationsRequest({}))
      }
    }
  }, [
    authUser,
    profileUser,
    hasFetched,
    recommendationsLoading,
    loadingSwipeHistory,
    dispatch,
  ])

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
    if (filteredUsers.length > 0 && currentIndex >= filteredUsers.length) {
      setCurrentIndex(0)
    }
  }, [filteredUsers, currentIndex])

  // Navigate to next profile (circular navigation)
  const goToNextProfile = () => {
    if (filteredUsers.length === 0) return

    if (currentIndex < filteredUsers.length - 1) {
      // Go to next profile
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Circular navigation: go back to first profile
      setCurrentIndex(0)
    }
  }

  // Navigate to previous profile (circular navigation)
  const goToPreviousProfile = () => {
    if (filteredUsers.length === 0) return

    if (currentIndex > 0) {
      // Go to previous profile
      setCurrentIndex((prev) => prev - 1)
    } else {
      // Circular navigation: go to last profile
      setCurrentIndex(filteredUsers.length - 1)
    }
  }

  // Pass button: moves to next profile with circular navigation
  const handlePass = () => {
    if (currentIndex >= filteredUsers.length || !authUser) return

    const swipedUser = filteredUsers[currentIndex]
    const currentUserId = swipedUser._id

    // Only create pass if not already liked
    if (!localLikedUsers.has(currentUserId)) {
      dispatch(addPassedUser(currentUserId))
      dispatch(
        createSwipeRequest({
          swipedUserId: currentUserId,
          action: 'pass',
        })
      )
    }

    // ALWAYS move to next profile (with circular navigation)
    goToNextProfile()
  }

  // Like button: ONLY toggles like/pass on current profile, doesn't move to next profile
  const handleLike = () => {
    if (currentIndex >= filteredUsers.length || !authUser) return

    const swipedUser = filteredUsers[currentIndex]
    const currentUserId = swipedUser._id
    const isCurrentlyLiked = localLikedUsers.has(currentUserId)

    if (isCurrentlyLiked) {
      // Change from like to pass
      setLocalLikedUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentUserId)
        return newSet
      })
      dispatch(addPassedUser(currentUserId))
      dispatch(
        createSwipeRequest({
          swipedUserId: currentUserId,
          action: 'pass',
        })
      )
    } else {
      // Change from pass to like
      setLocalLikedUsers((prev) => new Set([...prev, currentUserId]))
      dispatch(addLikedUser(currentUserId))
      dispatch(
        createSwipeRequest({
          swipedUserId: currentUserId,
          action: 'like',
        })
      )
    }
    // DO NOT move to next profile
  }

  // Photo gallery functions
  const nextPhoto = () => {
    if (
      currentIndex < filteredUsers.length &&
      currentUser.photos &&
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
    if (currentUser.photos && currentUser.photos.length > 0) {
      setShowImageModal(true)
    }
  }

  const handleCloseImageModal = () => {
    setShowImageModal(false)
  }

  const handleModalNextPhoto = () => {
    if (currentPhotoIndex < currentUser.photos.length - 1) {
      setCurrentPhotoIndex((prev) => prev + 1)
    }
  }

  const handleModalPrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => prev - 1)
    }
  }

  const handleViewProfile = () => router.push('/profile')
  const handleViewMatches = () => router.push('/matches')
  const handleRefresh = () => {
    setHasFetched(false)
    setCurrentIndex(0)
    setLocalLikedUsers(new Set())
    setCurrentPhotoIndex(0)
    // Refresh profile data
    if (authUser) {
      dispatch(getProfileRequest())
    }
    // Re-shuffle users on refresh
    if (recommendedUsers.length > 0) {
      const reshuffled = shuffleArray(recommendedUsers as UserProfile[])
      setShuffledUsers(reshuffled)
    }
  }

  const isCurrentUserLiked = () => {
    if (currentIndex >= filteredUsers.length) return false
    return localLikedUsers.has(filteredUsers[currentIndex]._id)
  }

  const isLiked = isCurrentUserLiked()
  const isLoading =
    authLoading ||
    recommendationsLoading ||
    loadingSwipeHistory ||
    profileLoading

  if (!authUser || isLoading) {
    return <LoadingScreen />
  }

  if (recommendationsError) {
    return (
      <ErrorScreen error={recommendationsError} onRefresh={handleRefresh} />
    )
  }

  if (filteredUsers.length === 0 && recommendedUsers.length > 0) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
        <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
          <div className='text-6xl mb-4'>🔍</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            No {currentUserGender === 'male' ? 'Female' : 'Male'} Profiles Found
          </h2>
          <p className='text-gray-600 mb-6'>
            {currentUserGender === 'male'
              ? 'No female profiles found in your area. Try refreshing or adjusting your location.'
              : 'No male profiles found in your area. Try refreshing or adjusting your location.'}
          </p>
          <Button
            title='Refresh'
            onClick={handleRefresh}
            btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
          />
        </div>
      </div>
    )
  }

  if (filteredUsers.length === 0) {
    return <EmptyScreen onRefresh={handleRefresh} />
  }

  const currentUser = filteredUsers[currentIndex]
  const hasMultiplePhotos = currentUser.photos && currentUser.photos.length > 1

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
          photos={currentUser.photos}
          currentPhotoIndex={currentPhotoIndex}
          onClose={handleCloseImageModal}
          onNext={handleModalNextPhoto}
          onPrev={handleModalPrevPhoto}
          userName={currentUser.name}
        />
      )}

      <Header
        onViewProfile={handleViewProfile}
        onViewMatches={handleViewMatches}
        disabled={swipeLoading}
      />

      <div className='max-w-md mx-auto pt-8 px-4'>
        {/* Navigation arrows for manual navigation */}
        {filteredUsers.length > 1 && (
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
        />

        <ActionButtons
          onPass={handlePass}
          onLike={handleLike}
          isLiked={isLiked}
          disabled={swipeLoading}
        />
      </div>
    </div>
  )
}

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

// ActionButtons without circular indicator
const ActionButtons = ({ onPass, onLike, isLiked, disabled }: any) => (
  <div className='flex justify-center gap-8 mt-8 pb-8'>
    <Button
      title='❌'
      onClick={onPass}
      disabled={disabled}
      btnStyle='w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50 p-0 min-w-0 text-2xl'
    />
    <Button
      title={isLiked ? '💔' : '💖'}
      onClick={onLike}
      disabled={disabled}
      btnStyle={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 p-0 min-w-0 text-2xl ${
        isLiked
          ? 'bg-pink-500 border-pink-500 text-white'
          : 'bg-white border-gray-200 hover:bg-pink-50 hover:border-pink-300'
      }`}
    />
  </div>
)

// Updated UserCard with distance display in top right corner
const UserCard = ({
  user,
  isLiked,
  currentPhotoIndex,
  hasMultiplePhotos,
  onPhotoSwipe,
  onPrevPhoto,
  onNextPhoto,
  onImageClick,
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

            {/* Distance Display - Top right corner, clean format */}
            {user.distance !== undefined && (
              <div className='absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-10'>
                {formatDistance(user.distance)}
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
        {isLiked && (
          <div className='bg-pink-500 text-white px-3 py-1 rounded-full text-sm'>
            ❤️ Liked
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

// Keep all other components the same
const LoadingScreen = () => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
      <p className='text-gray-600'>Loading your matches...</p>
    </div>
  </div>
)

const ErrorScreen = ({
  error,
  onRefresh,
}: {
  error: string
  onRefresh: () => void
}) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
      <div className='text-6xl mb-4'>😕</div>
      <h2 className='text-2xl font-bold text-gray-900 mb-4'>
        Something went wrong
      </h2>
      <p className='text-gray-600 mb-4'>{error}</p>
      <Button
        title='Try Again'
        onClick={onRefresh}
        btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
      />
    </div>
  </div>
)

const EmptyScreen = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center bg-white rounded-3xl p-8 shadow-lg max-w-md mx-4'>
      <div className='text-6xl mb-4'>😢</div>
      <h2 className='text-2xl font-bold text-gray-900 mb-4'>
        No profiles found
      </h2>
      <p className='text-gray-600 mb-6'>
        No potential matches found in your area.
      </p>
      <Button
        title='Refresh'
        onClick={onRefresh}
        btnStyle='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
      />
    </div>
  </div>
)

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

const Header = ({ onViewProfile, onViewMatches, disabled }: any) => (
  <header className='bg-white shadow-sm py-4 px-6'>
    <div className='max-w-2xl mx-auto flex justify-between items-center'>
      <Button
        title='👤'
        onClick={onViewProfile}
        disabled={disabled}
        btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
      />
      <h1 className='text-xl font-bold text-gray-900'>Discover</h1>
      <Button
        title='💌'
        onClick={onViewMatches}
        disabled={disabled}
        btnStyle='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 p-0 min-w-0 text-lg'
      />
    </div>
  </header>
)

export default DiscoveryPage
