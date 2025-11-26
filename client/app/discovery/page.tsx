// 'use client'
// import React, { useEffect, useState } from 'react'
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

//   const [currentIndex, setCurrentIndex] = useState(0)
//   const [showMatchModal, setShowMatchModal] = useState(false)
//   const [hasFetched, setHasFetched] = useState(false)
//   const [localLikedUsers, setLocalLikedUsers] = useState<Set<string>>(new Set())
//   const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

//   useEffect(() => {
//     if (!authUser) {
//       dispatch(checkAuthRequest())
//     }
//   }, [authUser, dispatch])

//   useEffect(() => {
//     setLocalLikedUsers(new Set(swipeHistory.likedUsers))
//   }, [swipeHistory.likedUsers])

//   useEffect(() => {
//     setCurrentPhotoIndex(0)
//   }, [currentIndex])

//   useEffect(() => {
//     if (
//       authUser &&
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

//   // Pass button: ONLY moves to next profile, doesn't change like status
//   const handlePass = () => {
//     if (currentIndex >= recommendedUsers.length || !authUser) return

//     const swipedUser = recommendedUsers[currentIndex]
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

//     // ALWAYS move to next profile
//     if (currentIndex < recommendedUsers.length - 1) {
//       setCurrentIndex((prev) => prev + 1)
//     }
//   }

//   // Like button: ONLY toggles like/pass on current profile, doesn't move to next profile
//   const handleLike = () => {
//     if (currentIndex >= recommendedUsers.length || !authUser) return

//     const swipedUser = recommendedUsers[currentIndex]
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

//   const handleViewProfile = () => router.push('/profile')
//   const handleViewMatches = () => router.push('/matches')
//   const handleRefresh = () => {
//     setHasFetched(false)
//     setCurrentIndex(0)
//     setLocalLikedUsers(new Set())
//     setCurrentPhotoIndex(0)
//   }

//   const isCurrentUserLiked = () => {
//     if (currentIndex >= recommendedUsers.length) return false
//     return localLikedUsers.has(recommendedUsers[currentIndex]._id)
//   }

//   const isLiked = isCurrentUserLiked()
//   const isLoading = authLoading || recommendationsLoading || loadingSwipeHistory

//   if (!authUser || isLoading) {
//     return <LoadingScreen />
//   }

//   if (recommendationsError) {
//     return (
//       <ErrorScreen error={recommendationsError} onRefresh={handleRefresh} />
//     )
//   }

//   if (recommendedUsers.length === 0) {
//     return <EmptyScreen onRefresh={handleRefresh} />
//   }

//   const currentUser = recommendedUsers[currentIndex]
//   const hasMultiplePhotos = currentUser.photos && currentUser.photos.length > 1

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50'>
//       {showMatchModal && lastMatch && (
//         <MatchModal
//           lastMatch={lastMatch}
//           onClose={() => setShowMatchModal(false)}
//         />
//       )}

//       <Header
//         onViewProfile={handleViewProfile}
//         onViewMatches={handleViewMatches}
//         disabled={swipeLoading}
//       />

//       <div className='max-w-md mx-auto pt-8 px-4'>
//         <UserCard
//           user={currentUser}
//           isLiked={isLiked}
//           currentPhotoIndex={currentPhotoIndex}
//           hasMultiplePhotos={hasMultiplePhotos}
//           onPhotoSwipe={handlePhotoSwipe}
//           onPrevPhoto={prevPhoto}
//           onNextPhoto={nextPhoto}
//         />

//         <ActionButtons
//           onPass={handlePass}
//           onLike={handleLike}
//           isLiked={isLiked}
//           disabled={swipeLoading}
//         />

//         <ProgressIndicator
//           current={currentIndex + 1}
//           total={recommendedUsers.length}
//         />
//       </div>
//     </div>
//   )
// }

// // Component pieces for better organization
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
//       <button
//         onClick={onRefresh}
//         className='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//       >
//         Try Again
//       </button>
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
//       <button
//         onClick={onRefresh}
//         className='bg-pink-500 text-white px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors'
//       >
//         Refresh
//       </button>
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
//       <button
//         onClick={onClose}
//         className='bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600 transition-colors'
//       >
//         Continue Swiping
//       </button>
//     </div>
//   </div>
// )

// const Header = ({ onViewProfile, onViewMatches, disabled }: any) => (
//   <header className='bg-white shadow-sm py-4 px-6'>
//     <div className='max-w-2xl mx-auto flex justify-between items-center'>
//       <button
//         onClick={onViewProfile}
//         disabled={disabled}
//         className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50'
//       >
//         <span className='text-lg'>👤</span>
//       </button>
//       <h1 className='text-xl font-bold text-gray-900'>Discover</h1>
//       <button
//         onClick={onViewMatches}
//         disabled={disabled}
//         className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50'
//       >
//         <span className='text-lg'>💌</span>
//       </button>
//     </div>
//   </header>
// )

// const UserCard = ({
//   user,
//   isLiked,
//   currentPhotoIndex,
//   hasMultiplePhotos,
//   onPhotoSwipe,
//   onPrevPhoto,
//   onNextPhoto,
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
//               className='w-full h-full object-cover'
//             />
//             {hasMultiplePhotos && (
//               <>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onPrevPhoto()
//                   }}
//                   className='absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/10 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-opacity'
//                 >
//                   ‹
//                 </button>
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     onNextPhoto()
//                   }}
//                   className='absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/10 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-opacity'
//                 >
//                   ›
//                 </button>
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

// const ActionButtons = ({ onPass, onLike, isLiked, disabled }: any) => (
//   <div className='flex justify-center gap-8 mt-8 pb-8'>
//     <button
//       onClick={onPass}
//       disabled={disabled}
//       className='w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 disabled:opacity-50'
//     >
//       <span className='text-2xl'>❌</span>
//     </button>
//     <button
//       onClick={onLike}
//       disabled={disabled}
//       className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 border-2 disabled:opacity-50 ${
//         isLiked
//           ? 'bg-pink-500 border-pink-500 text-white'
//           : 'bg-white border-gray-200 hover:bg-pink-50 hover:border-pink-300'
//       }`}
//     >
//       <span className='text-2xl transition-all duration-200'>
//         {isLiked ? '💔' : '💖'}
//       </span>
//     </button>
//   </div>
// )

// const ProgressIndicator = ({
//   current,
//   total,
// }: {
//   current: number
//   total: number
// }) => (
//   <div className='text-center mb-4'>
//     <p className='text-sm text-gray-500'>
//       {current} of {total}
//     </p>
//   </div>
// )

// export default DiscoveryPage
