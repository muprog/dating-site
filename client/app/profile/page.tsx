// 'use client'
// import React, { useEffect, useState } from 'react'
// import { useSelector, useDispatch } from 'react-redux'
// import { useRouter } from 'next/navigation'
// import { RootState, AppDispatch } from '../../store/store'
// import {
//   getProfileRequest,
//   updateProfileRequest,
//   uploadPhotosRequest,
//   deletePhotoRequest,
//   clearMessage,
//   clearError,
// } from '../../store/slices/profileSlice'
// import { checkAuthRequest } from '../../store/slices/authSlice'
// import Button from '../../components/Button' // Import your Button component

// interface ProfileFormData {
//   name: string
//   age: string
//   bio: string
//   interests: string[]
//   location: string
//   gender: string
// }

// // Reverse geocoding function
// const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
//   try {
//     const response = await fetch(
//       `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
//     )

//     if (!response.ok) {
//       throw new Error('Geocoding failed')
//     }

//     const data = await response.json()

//     const city = data.city || data.locality || ''
//     const country = data.countryName || ''

//     if (city && country) {
//       return `${city}, ${country}`
//     } else if (city) {
//       return city
//     } else if (country) {
//       return country
//     } else {
//       return 'Unknown location'
//     }
//   } catch (error) {
//     console.error('Reverse geocoding error:', error)
//     return 'Location unavailable'
//   }
// }

// const ProfilePage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>()
//   const router = useRouter()
//   const { user: authUser, checkingAuth } = useSelector(
//     (state: RootState) => state.auth
//   )
//   const {
//     user: profileUser,
//     loading,
//     error,
//     message,
//   } = useSelector((state: RootState) => state.profile)

//   const [isEditing, setIsEditing] = useState(false)
//   const [formData, setFormData] = useState<ProfileFormData>({
//     name: '',
//     age: '',
//     bio: '',
//     interests: [],
//     location: '',
//     gender: '',
//   })
//   const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
//   const [currentInterest, setCurrentInterest] = useState('')
//   const [isConvertingLocation, setIsConvertingLocation] = useState(false)
//   const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
//     null
//   )
//   const [isClosing, setIsClosing] = useState(false)
//   const [isSaving, setIsSaving] = useState(false)

//   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files
//     if (files && files.length > 0) {
//       const maxSize = 10 * 1024 * 1024
//       const oversizedFiles = Array.from(files).filter(
//         (file) => file.size > maxSize
//       )

//       if (oversizedFiles.length > 0) {
//         const oversizedFileSizes = oversizedFiles
//           .map(
//             (file) => `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
//           )
//           .join('\n')

//         alert(
//           `The following files exceed the 10MB limit:\n\n${oversizedFileSizes}\n\nPlease select smaller files.`
//         )
//         e.target.value = ''
//         return
//       }

//       const totalSize = Array.from(files).reduce(
//         (total, file) => total + file.size,
//         0
//       )
//       if (totalSize > 50 * 1024 * 1024) {
//         alert(
//           `Total files size (${(totalSize / 1024 / 1024).toFixed(
//             2
//           )}MB) exceeds the 50MB limit. Please select fewer or smaller files.`
//         )
//         e.target.value = ''
//         return
//       }

//       const formData = new FormData()
//       Array.from(files).forEach((file) => {
//         formData.append('photos', file)
//       })

//       console.log('📸 Uploading photos...')
//       dispatch(uploadPhotosRequest(formData))
//       e.target.value = ''
//     }
//   }

//   const handleDeletePhoto = (index: number) => {
//     if (window.confirm('Are you sure you want to delete this photo?')) {
//       console.log('🗑️ Deleting photo at index:', index)
//       dispatch(deletePhotoRequest(index.toString()))
//     }
//   }

//   const handleGoToDiscovery = () => {
//     router.push('/discovery')
//   }

//   useEffect(() => {
//     if (!hasCheckedAuth) {
//       dispatch(checkAuthRequest())
//       setHasCheckedAuth(true)
//     }
//   }, [dispatch, hasCheckedAuth])

//   useEffect(() => {
//     if (!checkingAuth && !authUser && hasCheckedAuth) {
//       router.push('/login')
//     }
//   }, [checkingAuth, authUser, hasCheckedAuth, router])

//   const userId = authUser?.id || authUser?._id

//   useEffect(() => {
//     if (!checkingAuth && authUser && userId && !profileUser && !loading) {
//       dispatch(getProfileRequest())
//     }
//   }, [authUser, userId, profileUser, loading, checkingAuth, dispatch])

//   useEffect(() => {
//     if (profileUser) {
//       console.log('✅ Profile loaded:', profileUser)
//       setFormData({
//         name: profileUser.name || '',
//         age: profileUser.age?.toString() || '',
//         bio: profileUser.bio || '',
//         interests: profileUser.interests || [],
//         location: profileUser.location || '',
//         gender: profileUser.gender || '',
//       })
//     }
//   }, [profileUser])

//   const getCurrentLocation = async () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords
//           console.log('📍 Current coordinates:', latitude, longitude)

//           try {
//             setIsConvertingLocation(true)
//             const locationName = await reverseGeocode(latitude, longitude)
//             console.log('✅ Location found:', locationName)

//             setFormData((prev) => ({
//               ...prev,
//               location: locationName,
//             }))

//             const updateData: any = {
//               name: formData.name.trim(),
//               bio: formData.bio.trim(),
//               interests: formData.interests.filter(
//                 (interest) => interest.trim() !== ''
//               ),
//               location: locationName.trim(),
//               gender: formData.gender,
//               latitude: latitude,
//               longitude: longitude,
//             }

//             if (formData.age) {
//               updateData.age = parseInt(formData.age)
//             }

//             console.log('📍 Saving profile with coordinates:', updateData)
//             dispatch(updateProfileRequest(updateData))
//           } catch (error) {
//             console.error('❌ Error reverse geocoding:', error)
//             const fallbackLocation = `${latitude.toFixed(
//               4
//             )}, ${longitude.toFixed(4)}`
//             setFormData((prev) => ({
//               ...prev,
//               location: fallbackLocation,
//             }))

//             const updateData: any = {
//               name: formData.name.trim(),
//               bio: formData.bio.trim(),
//               interests: formData.interests.filter(
//                 (interest) => interest.trim() !== ''
//               ),
//               location: fallbackLocation.trim(),
//               gender: formData.gender,
//               latitude: latitude,
//               longitude: longitude,
//             }

//             if (formData.age) {
//               updateData.age = parseInt(formData.age)
//             }

//             console.log(
//               '📍 Saving profile with fallback coordinates:',
//               updateData
//             )
//             dispatch(updateProfileRequest(updateData))

//             alert('Got your location but could not determine the place name.')
//           } finally {
//             setIsConvertingLocation(false)
//           }
//         },
//         (error) => {
//           console.error('❌ Error getting location:', error)
//           alert(
//             'Unable to get your current location. Please enter it manually.'
//           )
//         }
//       )
//     } else {
//       alert('Geolocation is not supported by your browser.')
//     }
//   }

//   useEffect(() => {
//     if (message) {
//       setIsSaving(false)
//       const timer = setTimeout(() => {
//         dispatch(clearMessage())
//         if (isEditing) {
//           setIsEditing(false)
//         }
//       }, 3000)
//       return () => clearTimeout(timer)
//     }
//   }, [message, dispatch, isEditing])

//   useEffect(() => {
//     if (error) {
//       setIsSaving(false)
//       console.error('❌ Profile error:', error)
//       const timer = setTimeout(() => {
//         dispatch(clearError())
//       }, 5000)
//       return () => clearTimeout(timer)
//     }
//   }, [error, dispatch])

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()

//     if (!formData.name.trim()) {
//       alert('Please enter your name')
//       return
//     }

//     if (
//       formData.age &&
//       (parseInt(formData.age) < 18 || parseInt(formData.age) > 100)
//     ) {
//       alert('Please enter a valid age between 18 and 100')
//       return
//     }

//     setIsSaving(true)

//     const updateData: any = {
//       name: formData.name.trim(),
//       bio: formData.bio.trim(),
//       interests: formData.interests.filter(
//         (interest) => interest.trim() !== ''
//       ),
//       location: formData.location.trim(),
//       gender: formData.gender,
//     }

//     if (formData.age) {
//       updateData.age = parseInt(formData.age)
//     }

//     console.log('📤 Updating profile:', updateData)
//     dispatch(updateProfileRequest(updateData))
//   }

//   const handleInputChange = (
//     field: keyof Omit<ProfileFormData, 'interests'>,
//     value: string
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   const addInterest = () => {
//     if (
//       currentInterest.trim() &&
//       !formData.interests.includes(currentInterest.trim())
//     ) {
//       setFormData((prev) => ({
//         ...prev,
//         interests: [...prev.interests, currentInterest.trim()],
//       }))
//       setCurrentInterest('')
//     }
//   }

//   const removeInterest = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       interests: prev.interests.filter((_, i) => i !== index),
//     }))
//   }

//   const handleInterestKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       e.preventDefault()
//       addInterest()
//     }
//   }

//   const openGallery = (index: number) => {
//     setSelectedPhotoIndex(index)
//     setIsClosing(false)
//     document.body.style.overflow = 'hidden'
//   }

//   const closeGallery = () => {
//     setIsClosing(true)
//     setTimeout(() => {
//       setSelectedPhotoIndex(null)
//       setIsClosing(false)
//       document.body.style.overflow = 'unset'
//     }, 300)
//   }

//   const navigateGallery = (direction: 'prev' | 'next') => {
//     if (selectedPhotoIndex === null || !profileUser?.photos) return

//     const totalPhotos = profileUser.photos.length
//     let newIndex: number

//     if (direction === 'prev') {
//       newIndex =
//         selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : totalPhotos - 1
//     } else {
//       newIndex =
//         selectedPhotoIndex < totalPhotos - 1 ? selectedPhotoIndex + 1 : 0
//     }

//     setSelectedPhotoIndex(newIndex)
//   }

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (selectedPhotoIndex === null) return

//       switch (e.key) {
//         case 'Escape':
//           closeGallery()
//           break
//         case 'ArrowLeft':
//           navigateGallery('prev')
//           break
//         case 'ArrowRight':
//           navigateGallery('next')
//           break
//       }
//     }

//     window.addEventListener('keydown', handleKeyDown)
//     return () => window.removeEventListener('keydown', handleKeyDown)
//   }, [selectedPhotoIndex, profileUser?.photos])

//   if (checkingAuth) {
//     return (
//       <div className='flex justify-center items-center min-h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p>Checking authentication...</p>
//         </div>
//       </div>
//     )
//   }

//   if ((loading && !profileUser) || (authUser && !profileUser)) {
//     return (
//       <div className='flex justify-center items-center min-h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p>Loading your profile...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-4 px-3 sm:py-8 sm:px-4'>
//       <div className='max-w-4xl mx-auto'>
//         {/* Header Section */}
//         <div className='bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-6 sm:mb-8'>
//           <div className='bg-gradient-to-r from-pink-500 to-purple-600 h-24 sm:h-32 relative'>
//             <div className='absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8'>
//               <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden'>
//                 {profileUser?.photos && profileUser.photos.length > 0 ? (
//                   <img
//                     src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[0]}`}
//                     alt='Profile'
//                     className='w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300'
//                     onClick={() => openGallery(0)}
//                   />
//                 ) : (
//                   <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
//                     <span className='text-gray-500 text-xs sm:text-sm font-medium'>
//                       Add Photo
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className='pt-16 sm:pt-20 px-4 sm:px-8 pb-6 sm:pb-8'>
//             <div className='flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6'>
//               <div className='flex-1 min-w-0'>
//                 <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2'>
//                   <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 break-words'>
//                     {isEditing ? (
//                       <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center'>
//                         <input
//                           type='text'
//                           value={formData.name}
//                           onChange={(e) =>
//                             handleInputChange('name', e.target.value)
//                           }
//                           className='border-b-2 border-gray-300 focus:border-pink-500 outline-none text-xl sm:text-3xl font-bold bg-transparent w-full sm:w-auto min-w-[120px]'
//                           placeholder='Your name'
//                           disabled={isSaving}
//                         />
//                         {isEditing && (
//                           <input
//                             type='number'
//                             value={formData.age}
//                             onChange={(e) =>
//                               handleInputChange('age', e.target.value)
//                             }
//                             className='border-b-2 border-gray-300 w-16 focus:border-pink-500 outline-none bg-transparent'
//                             placeholder='Age'
//                             min='18'
//                             max='100'
//                             disabled={isSaving}
//                           />
//                         )}
//                       </div>
//                     ) : (
//                       <>
//                         {profileUser?.name || authUser?.name || 'User'}
//                         {profileUser?.age && (
//                           <span className='text-gray-600'>
//                             , {profileUser.age}
//                           </span>
//                         )}
//                       </>
//                     )}
//                   </h1>
//                 </div>
//                 <p className='text-gray-500 text-base sm:text-lg flex items-center gap-2 break-words'>
//                   📍{' '}
//                   {formData.location || profileUser?.location || 'Add location'}
//                 </p>
//               </div>

//               {/* Action Buttons using Button component */}
//               <div className='flex flex-row justify-stretch sm:justify-start md:justify-end gap-3 w-full md:w-auto'>
//                 <Button
//                   title='🔍 Discover'
//                   onClick={handleGoToDiscovery}
//                   btnStyle='bg-blue-500 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium shadow-sm text-sm sm:text-base flex-1 md:flex-none text-center min-w-[100px]'
//                 />
//                 <Button
//                   title={isEditing ? 'Cancel' : 'Edit Profile'}
//                   onClick={() => setIsEditing(!isEditing)}
//                   disabled={isSaving || loading}
//                   btnStyle='bg-pink-500 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium shadow-sm text-sm sm:text-base flex-1 md:flex-none text-center min-w-[100px]'
//                 />
//               </div>
//             </div>

//             {/* Gender Section */}
//             <div className='mb-6 sm:mb-8'>
//               <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-3'>
//                 Gender
//               </h3>
//               {isEditing ? (
//                 <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
//                   {['Male', 'Female', 'Other'].map((genderOption) => (
//                     <label
//                       key={genderOption}
//                       className='flex items-center gap-2 cursor-pointer'
//                     >
//                       <input
//                         type='radio'
//                         name='gender'
//                         value={genderOption}
//                         checked={formData.gender === genderOption}
//                         onChange={(e) =>
//                           handleInputChange('gender', e.target.value)
//                         }
//                         disabled={isSaving}
//                         className='w-4 h-4 text-pink-500 focus:ring-pink-500'
//                       />
//                       <span className='text-gray-700 text-sm sm:text-base'>
//                         {genderOption}
//                       </span>
//                     </label>
//                   ))}
//                 </div>
//               ) : (
//                 <p className='text-gray-700 text-base sm:text-lg'>
//                   {formData.gender || profileUser?.gender || 'Not specified'}
//                 </p>
//               )}
//             </div>

//             {/* About Me Section */}
//             <div className='mb-6 sm:mb-8'>
//               <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
//                 About Me
//               </h2>
//               {isEditing ? (
//                 <textarea
//                   value={formData.bio}
//                   onChange={(e) => handleInputChange('bio', e.target.value)}
//                   className='w-full border border-gray-200 rounded-xl p-3 sm:p-4 focus:border-pink-500 outline-none resize-none bg-gray-50 text-sm sm:text-base'
//                   rows={3}
//                   placeholder='Tell us about yourself...'
//                   maxLength={500}
//                   disabled={isSaving}
//                 />
//               ) : (
//                 <p className='text-gray-700 text-base sm:text-lg leading-relaxed'>
//                   {profileUser?.bio ||
//                     "I'm a creative soul with a passion for art, music, and exploring new cultures. Let's connect and share our stories!"}
//                 </p>
//               )}
//             </div>

//             {/* Location Section */}
//             {isEditing && (
//               <div className='mb-6 sm:mb-8'>
//                 <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-3'>
//                   Location
//                 </h3>
//                 <div className='space-y-3'>
//                   <div className='flex flex-col sm:flex-row gap-3'>
//                     <input
//                       type='text'
//                       value={formData.location}
//                       onChange={(e) =>
//                         handleInputChange('location', e.target.value)
//                       }
//                       className='flex-1 border border-gray-200 rounded-xl p-3 focus:border-pink-500 outline-none bg-gray-50 text-sm sm:text-base'
//                       placeholder='Enter your location (e.g., San Francisco, CA)'
//                       disabled={isSaving}
//                     />
//                     <Button
//                       title={
//                         isConvertingLocation ? (
//                           <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto'></div>
//                         ) : (
//                           'Use Current'
//                         )
//                       }
//                       onClick={getCurrentLocation}
//                       disabled={isConvertingLocation || isSaving}
//                       btnStyle='bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50 font-medium text-sm sm:text-base'
//                     />
//                   </div>
//                   <p className='text-xs sm:text-sm text-gray-500'>
//                     Using "Use Current" will save your GPS coordinates for
//                     accurate distance calculations in Discovery.
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Interests Section */}
//             <div className='mb-6 sm:mb-8'>
//               <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4'>
//                 Interests
//               </h3>
//               {isEditing ? (
//                 <div className='space-y-4'>
//                   <div className='flex flex-col sm:flex-row gap-3'>
//                     <input
//                       type='text'
//                       value={currentInterest}
//                       onChange={(e) => setCurrentInterest(e.target.value)}
//                       onKeyPress={handleInterestKeyPress}
//                       className='flex-1 border border-gray-200 rounded-xl p-3 focus:border-pink-500 outline-none bg-gray-50 text-sm sm:text-base'
//                       placeholder='Add an interest'
//                       disabled={isSaving}
//                     />
//                     <Button
//                       title='Add'
//                       onClick={addInterest}
//                       disabled={isSaving}
//                       btnStyle='bg-pink-500 text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base'
//                     />
//                   </div>

//                   <div className='flex flex-wrap gap-2'>
//                     {formData.interests.map((interest, index) => (
//                       <div
//                         key={index}
//                         className='bg-pink-100 text-pink-800 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm flex items-center gap-2 font-medium'
//                       >
//                         {interest}
//                         <Button
//                           title='×'
//                           onClick={() => removeInterest(index)}
//                           btnStyle='text-pink-600 hover:text-pink-800 text-xs sm:text-sm disabled:opacity-50 bg-transparent p-0 min-w-0 h-auto hover:bg-transparent'
//                           disabled={isSaving}
//                         />
//                       </div>
//                     ))}
//                     {formData.interests.length === 0 && (
//                       <p className='text-gray-500 text-xs sm:text-sm'>
//                         No interests added yet
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className='flex flex-wrap gap-2 sm:gap-3'>
//                   {profileUser?.interests?.map(
//                     (interest: string, index: number) => (
//                       <span
//                         key={index}
//                         className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'
//                       >
//                         {interest}
//                       </span>
//                     )
//                   )}
//                   {(!profileUser?.interests ||
//                     profileUser.interests.length === 0) && (
//                     <div className='flex flex-wrap gap-2 sm:gap-3'>
//                       <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
//                         Art
//                       </span>
//                       <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
//                         Music
//                       </span>
//                       <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
//                         Travel
//                       </span>
//                       <span className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
//                         Foodie
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Save Changes Button */}
//             {isEditing && (
//               <div className='flex gap-4'>
//                 <Button
//                   title={
//                     isSaving ? (
//                       <div className='flex items-center justify-center gap-2'>
//                         <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
//                         Saving...
//                       </div>
//                     ) : (
//                       'Save Changes'
//                     )
//                   }
//                   onClick={handleSubmit}
//                   disabled={isSaving || loading}
//                   btnStyle='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium text-base sm:text-lg shadow-lg min-w-[120px] sm:min-w-[140px]'
//                 />
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Photos Section */}
//         <div className='bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-8'>
//           <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
//             <h3 className='text-lg sm:text-xl font-semibold text-gray-900'>
//               Photos
//             </h3>
//             <label className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all cursor-pointer disabled:opacity-50 font-medium shadow-sm text-sm sm:text-base text-center'>
//               {loading ? 'Uploading...' : 'Upload Photos'}
//               <input
//                 type='file'
//                 multiple
//                 accept='image/*'
//                 onChange={handlePhotoUpload}
//                 disabled={loading || isSaving}
//                 className='hidden'
//               />
//             </label>
//           </div>

//           <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
//             {profileUser?.photos?.map((photo: string, index: number) => (
//               <div key={index} className='relative group'>
//                 <div
//                   className='w-full h-24 sm:h-32 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer shadow-md'
//                   onClick={() => openGallery(index)}
//                 >
//                   <img
//                     src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
//                     alt={`Profile ${index + 1}`}
//                     className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
//                   />
//                 </div>
//                 <Button
//                   title='×'
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     handleDeletePhoto(index)
//                   }}
//                   disabled={loading || isSaving}
//                   btnStyle='absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md text-xs sm:text-base hover:bg-red-600 p-0 min-w-0'
//                 />
//               </div>
//             ))}

//             {(!profileUser?.photos || profileUser.photos.length === 0) && (
//               <>
//                 <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
//                   <span className='text-gray-600 text-xs sm:text-sm font-medium'>
//                     Hiking
//                   </span>
//                 </div>
//                 <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
//                   <span className='text-gray-600 text-xs sm:text-sm font-medium'>
//                     Photography
//                   </span>
//                 </div>
//                 <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
//                   <span className='text-gray-600 text-xs sm:text-sm font-medium'>
//                     Travel
//                   </span>
//                 </div>
//                 <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
//                   <span className='text-gray-600 text-xs sm:text-sm font-medium'>
//                     Food
//                   </span>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Professional Gallery Modal */}
//       {selectedPhotoIndex !== null && profileUser?.photos && (
//         <div
//           className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${
//             isClosing ? 'bg-black bg-opacity-0' : 'bg-black bg-opacity-95'
//           }`}
//           onClick={closeGallery}
//         >
//           <div
//             className={`relative max-w-6xl max-h-full w-full h-full flex items-center justify-center transition-transform duration-300 ${
//               isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
//             }`}
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Main Image */}
//             <div className='relative flex-1 flex items-center justify-center h-full'>
//               <img
//                 src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[selectedPhotoIndex]}`}
//                 alt='Gallery view'
//                 className='max-w-full max-h-full object-contain rounded-lg'
//               />
//             </div>

//             {/* Navigation Arrows */}
//             {profileUser.photos.length > 1 && (
//               <>
//                 <Button
//                   title={
//                     <svg
//                       className='w-4 h-4 sm:w-6 sm:h-6'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M15 19l-7-7 7-7'
//                       />
//                     </svg>
//                   }
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     navigateGallery('prev')
//                   }}
//                   btnStyle='absolute left-2 sm:left-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 p-0 min-w-0'
//                 />
//                 <Button
//                   title={
//                     <svg
//                       className='w-4 h-4 sm:w-6 sm:h-6'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M9 5l7 7-7 7'
//                       />
//                     </svg>
//                   }
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     navigateGallery('next')
//                   }}
//                   btnStyle='absolute right-2 sm:right-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 p-0 min-w-0'
//                 />
//               </>
//             )}

//             {/* Close Button */}
//             <Button
//               title={
//                 <svg
//                   className='w-4 h-4 sm:w-5 sm:h-5'
//                   fill='none'
//                   stroke='currentColor'
//                   viewBox='0 0 24 24'
//                 >
//                   <path
//                     strokeLinecap='round'
//                     strokeLinejoin='round'
//                     strokeWidth={2}
//                     d='M6 18L18 6M6 6l12 12'
//                   />
//                 </svg>
//               }
//               onClick={closeGallery}
//               btnStyle='absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 p-0 min-w-0'
//             />

//             {/* Image Counter */}
//             <div className='absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm'>
//               {selectedPhotoIndex + 1} / {profileUser.photos.length}
//             </div>

//             {/* Thumbnail Strip */}
//             <div className='absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-center'>
//               <div className='flex gap-1 sm:gap-2 max-w-full overflow-x-auto py-1 sm:py-2 px-2 sm:px-4 bg-black bg-opacity-30 rounded-xl sm:rounded-2xl backdrop-blur-sm'>
//                 {profileUser.photos.map((photo, index) => (
//                   <div
//                     key={index}
//                     className={`w-10 h-10 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
//                       index === selectedPhotoIndex
//                         ? 'border-white border-opacity-80'
//                         : 'border-transparent opacity-60 hover:opacity-100'
//                     }`}
//                     onClick={(e) => {
//                       e.stopPropagation()
//                       setSelectedPhotoIndex(index)
//                     }}
//                   >
//                     <img
//                       src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
//                       alt={`Thumbnail ${index + 1}`}
//                       className='w-full h-full object-cover'
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Download Button */}
//             <Button
//               title={
//                 <>
//                   <svg
//                     className='w-3 h-3 sm:w-4 sm:h-4'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={2}
//                       d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
//                     />
//                   </svg>
//                   Download
//                 </>
//               }
//               onClick={(e) => {
//                 e.stopPropagation()
//                 const link = document.createElement('a')
//                 link.href = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[selectedPhotoIndex]}`
//                 link.download = `photo-${selectedPhotoIndex + 1}.jpg`
//                 link.click()
//               }}
//               btnStyle='absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1 sm:gap-2 transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 text-xs sm:text-sm font-medium'
//             />
//           </div>
//         </div>
//       )}

//       {/* Success/Error Messages */}
//       {message && (
//         <div className='fixed top-2 sm:top-4 right-2 sm:right-4 bg-pink-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-50 max-w-xs sm:max-w-sm text-sm sm:text-base'>
//           {message}
//         </div>
//       )}

//       {error && (
//         <div className='fixed top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-50 max-w-xs sm:max-w-sm text-sm sm:text-base'>
//           {error}
//         </div>
//       )}
//     </div>
//   )
// }

// export default ProfilePage

'use client'
import React, {
  useEffect,
  useState,
  // useMemo,
  // useCallback,
  Suspense,
} from 'react'
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
import { useCallback } from 'react'
import { checkAuthRequest } from '../../store/slices/authSlice'
import Button from '../../components/Button'
import Image from 'next/image'
interface updatedDataPros {
  name: string
  bio: string
  interests: string[]
  location: string
  gender?: 'male' | 'female' | 'other' | undefined
  latitude?: number
  longitude?: number
  age?: number
}
interface ProfileFormData {
  name: string
  age: string
  bio: string
  interests: string[]
  location: string
  gender: 'male' | 'female' | 'other' | undefined
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

// Loading Screen Component
const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
  <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4'></div>
      <p className='text-gray-600'>{message}</p>
    </div>
  </div>
)

// Profile Content Component (only shown when authenticated)
const ProfileContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const { user: authUser } = useSelector((state: RootState) => state.auth)
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
    gender: undefined,
  })
  const [currentInterest, setCurrentInterest] = useState('')
  const [isConvertingLocation, setIsConvertingLocation] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  )
  const [isClosing, setIsClosing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const maxSize = 10 * 1024 * 1024
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

  const handleGoToDiscovery = () => {
    router.push('/discovery')
  }

  const userId = authUser?.id || authUser?._id

  // Fetch profile when component mounts (only for authenticated users)
  useEffect(() => {
    if (authUser && userId && !profileUser && !loading) {
      console.log('👤 Fetching profile for authenticated user:', authUser.email)
      dispatch(getProfileRequest())
    }
  }, [authUser, userId, profileUser, loading, dispatch])

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (profileUser) {
      console.log('✅ Profile loaded:', profileUser)
      setFormData({
        name: profileUser.name || '',
        age: profileUser.age?.toString() || '',
        bio: profileUser.bio || '',
        interests: profileUser.interests || [],
        location: profileUser.location || '',
        gender: profileUser.gender,
      })
    }
  }, [profileUser])

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

            const updateData: updatedDataPros = {
              name: formData.name.trim(),
              bio: formData.bio.trim(),
              interests: formData.interests.filter(
                (interest) => interest.trim() !== ''
              ),
              location: locationName.trim(),
              gender: formData.gender,
              latitude: latitude,
              longitude: longitude,
            }

            if (formData.age) {
              updateData.age = parseInt(formData.age)
            }

            console.log('📍 Saving profile with coordinates:', updateData)
            dispatch(updateProfileRequest(updateData))
          } catch (error) {
            console.error('❌ Error reverse geocoding:', error)
            const fallbackLocation = `${latitude.toFixed(
              4
            )}, ${longitude.toFixed(4)}`
            setFormData((prev) => ({
              ...prev,
              location: fallbackLocation,
            }))

            const updateData: updatedDataPros = {
              name: formData.name.trim(),
              bio: formData.bio.trim(),
              interests: formData.interests.filter(
                (interest) => interest.trim() !== ''
              ),
              location: fallbackLocation.trim(),
              gender: formData.gender,
              latitude: latitude,
              longitude: longitude,
            }

            if (formData.age) {
              updateData.age = parseInt(formData.age)
            }

            console.log(
              '📍 Saving profile with fallback coordinates:',
              updateData
            )
            dispatch(updateProfileRequest(updateData))

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
      setIsSaving(false)
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
      setIsSaving(false)
      console.error('❌ Profile error:', error)
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Please enter your name')
      return
    }

    if (
      formData.age &&
      (parseInt(formData.age) < 18 || parseInt(formData.age) > 100)
    ) {
      alert('Please enter a valid age between 18 and 100')
      return
    }

    setIsSaving(true)

    const updateData: updatedDataPros = {
      name: formData.name.trim(),
      bio: formData.bio.trim(),
      interests: formData.interests.filter(
        (interest) => interest.trim() !== ''
      ),
      location: formData.location.trim(),
      gender: formData.gender,
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

  const openGallery = (index: number) => {
    setSelectedPhotoIndex(index)
    setIsClosing(false)
    document.body.style.overflow = 'hidden'
  }

  const closeGallery = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedPhotoIndex(null)
      setIsClosing(false)
      document.body.style.overflow = 'unset'
    }, 300)
  }

  const navigateGallery = useCallback(
    (direction: 'prev' | 'next') => {
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
    },
    [selectedPhotoIndex, profileUser?.photos]
  )

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
  }, [selectedPhotoIndex, navigateGallery])

  // Show loading while fetching profile
  if (loading && !profileUser) {
    return <LoadingScreen message='Loading your profile...' />
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-4 px-3 sm:py-8 sm:px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Header Section */}
        <div className='bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-6 sm:mb-8'>
          <div className=' bg-pink-500 h-24 sm:h-32 relative'>
            <div className='absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8'>
              <div className='w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden'>
                {profileUser?.photos && profileUser.photos.length > 0 ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[0]}`}
                    alt='Profile'
                    fill
                    className='w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300'
                    onClick={() => openGallery(0)}
                  />
                ) : (
                  <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                    <span className='text-gray-500 text-xs sm:text-sm font-medium'>
                      Add Photo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='pt-16 sm:pt-20 px-4 sm:px-8 pb-6 sm:pb-8'>
            <div className='flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6'>
              <div className='flex-1 min-w-0'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 break-words'>
                    {isEditing ? (
                      <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center'>
                        <input
                          type='text'
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange('name', e.target.value)
                          }
                          className='border-b-2 border-gray-300 focus:border-pink-500 outline-none text-xl sm:text-3xl font-bold bg-transparent w-full sm:w-auto min-w-[120px]'
                          placeholder='Your name'
                          disabled={isSaving}
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
                            disabled={isSaving}
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
                <p className='text-gray-500 text-base sm:text-lg flex items-center gap-2 break-words'>
                  📍{' '}
                  {formData.location || profileUser?.location || 'Add location'}
                </p>
              </div>

              {/* Action Buttons using Button component */}
              <div className='flex flex-row justify-stretch sm:justify-start md:justify-end gap-3 w-full md:w-auto'>
                <Button
                  title='🔍 Discover'
                  onClick={handleGoToDiscovery}
                  btnStyle='bg-blue-500 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium shadow-sm text-sm sm:text-base flex-1 md:flex-none text-center min-w-[100px]'
                />
                <Button
                  title={isEditing ? 'Cancel' : 'Edit Profile'}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving || loading}
                  btnStyle='bg-pink-500 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 font-medium shadow-sm text-sm sm:text-base flex-1 md:flex-none text-center min-w-[100px]'
                />
              </div>
            </div>

            {/* Gender Section */}
            <div className='mb-6 sm:mb-8'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-3'>
                Gender
              </h3>
              {isEditing ? (
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                  {['Male', 'Female', 'Other'].map((genderOption) => (
                    <label
                      key={genderOption}
                      className='flex items-center gap-2 cursor-pointer'
                    >
                      <input
                        type='radio'
                        name='gender'
                        value={genderOption}
                        checked={formData.gender === genderOption}
                        onChange={(e) =>
                          handleInputChange('gender', e.target.value)
                        }
                        disabled={isSaving}
                        className='w-4 h-4 text-pink-500 focus:ring-pink-500'
                      />
                      <span className='text-gray-700 text-sm sm:text-base'>
                        {genderOption}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className='text-gray-700 text-base sm:text-lg'>
                  {formData.gender || profileUser?.gender || 'Not specified'}
                </p>
              )}
            </div>

            {/* About Me Section */}
            <div className='mb-6 sm:mb-8'>
              <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
                About Me
              </h2>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className='w-full border border-gray-200 rounded-xl p-3 sm:p-4 focus:border-pink-500 outline-none resize-none bg-gray-50 text-sm sm:text-base'
                  rows={3}
                  placeholder='Tell us about yourself...'
                  maxLength={500}
                  disabled={isSaving}
                />
              ) : (
                <p className='text-gray-700 text-base sm:text-lg leading-relaxed'>
                  {profileUser?.bio ||
                    "I'm a creative soul with a passion for art, music, and exploring new cultures. Let's connect and share our stories!"}
                </p>
              )}
            </div>

            {/* Location Section */}
            {isEditing && (
              <div className='mb-6 sm:mb-8'>
                <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-3'>
                  Location
                </h3>
                <div className='space-y-3'>
                  <div className='flex flex-col sm:flex-row gap-3'>
                    <input
                      type='text'
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange('location', e.target.value)
                      }
                      className='flex-1 border border-gray-200 rounded-xl p-3 focus:border-pink-500 outline-none bg-gray-50 text-sm sm:text-base'
                      placeholder='Enter your location (e.g., San Francisco, CA)'
                      disabled={isSaving}
                    />
                    <Button
                      title={
                        isConvertingLocation ? (
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto'></div>
                        ) : (
                          'Use Current'
                        )
                      }
                      onClick={getCurrentLocation}
                      disabled={isConvertingLocation || isSaving}
                      btnStyle='bg-gray-500 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50 font-medium text-sm sm:text-base'
                    />
                  </div>
                  <p className='text-xs sm:text-sm text-gray-500'>
                    Using &quot;Use Current&quot; will save your GPS coordinates
                    for accurate distance calculations in Discovery.
                  </p>
                </div>
              </div>
            )}

            {/* Interests Section */}
            <div className='mb-6 sm:mb-8'>
              <h3 className='text-base sm:text-lg font-semibold text-gray-900 mb-4'>
                Interests
              </h3>
              {isEditing ? (
                <div className='space-y-4'>
                  <div className='flex flex-col sm:flex-row gap-3'>
                    <input
                      type='text'
                      value={currentInterest}
                      onChange={(e) => setCurrentInterest(e.target.value)}
                      onKeyPress={handleInterestKeyPress}
                      className='flex-1 border border-gray-200 rounded-xl p-3 focus:border-pink-500 outline-none bg-gray-50 text-sm sm:text-base'
                      placeholder='Add an interest'
                      disabled={isSaving}
                    />
                    <Button
                      title='Add'
                      onClick={addInterest}
                      disabled={isSaving}
                      btnStyle='bg-pink-500 text-white px-4 sm:px-6 py-3 rounded-xl hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base'
                    />
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {formData.interests.map((interest, index) => (
                      <div
                        key={index}
                        className='bg-pink-100 text-pink-800 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm flex items-center gap-2 font-medium'
                      >
                        {interest}
                        <Button
                          title='×'
                          onClick={() => removeInterest(index)}
                          btnStyle='text-pink-600 hover:text-pink-800 text-xs sm:text-sm disabled:opacity-50 bg-transparent p-0 min-w-0 h-auto hover:bg-transparent'
                          disabled={isSaving}
                        />
                      </div>
                    ))}
                    {formData.interests.length === 0 && (
                      <p className='text-gray-500 text-xs sm:text-sm'>
                        No interests added yet
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className='flex flex-wrap gap-2 sm:gap-3'>
                  {profileUser?.interests?.map(
                    (interest: string, index: number) => (
                      <span
                        key={index}
                        className=' bg-pink-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'
                      >
                        {interest}
                      </span>
                    )
                  )}
                  {(!profileUser?.interests ||
                    profileUser.interests.length === 0) && (
                    <div className='flex flex-wrap gap-2 sm:gap-3'>
                      <span className=' bg-pink-500  text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
                        Art
                      </span>
                      <span className=' bg-pink-500  text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
                        Music
                      </span>
                      <span className=' bg-pink-500  text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
                        Travel
                      </span>
                      <span className=' bg-pink-500  text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm'>
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
                <Button
                  title={
                    isSaving ? (
                      <div className='flex items-center justify-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Saving...
                      </div>
                    ) : (
                      'Save Changes'
                    )
                  }
                  onClick={handleSubmit}
                  disabled={isSaving || loading}
                  btnStyle=' bg-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium text-base sm:text-lg shadow-lg min-w-[120px] sm:min-w-[140px]'
                />
              </div>
            )}
          </div>
        </div>

        {/* Photos Section */}
        <div className='bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-8'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6'>
            <h3 className='text-lg sm:text-xl font-semibold text-gray-900'>
              Photos
            </h3>
            <label className=' bg-pink-500  text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all cursor-pointer disabled:opacity-50 font-medium shadow-sm text-sm sm:text-base text-center'>
              {loading ? 'Uploading...' : 'Upload Photos'}
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={handlePhotoUpload}
                disabled={loading || isSaving}
                className='hidden'
              />
            </label>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
            {profileUser?.photos?.map((photo: string, index: number) => (
              <div key={index} className='relative group'>
                <div
                  className='w-full h-24 sm:h-32 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer shadow-md'
                  onClick={() => openGallery(index)}
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
                    alt={`Profile ${index + 1}`}
                    fill
                    className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                  />
                </div>
                <Button
                  title='×'
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(index)
                  }}
                  disabled={loading || isSaving}
                  btnStyle='absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shadow-md text-xs sm:text-base hover:bg-red-600 p-0 min-w-0'
                />
              </div>
            ))}

            {(!profileUser?.photos || profileUser.photos.length === 0) && (
              <>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 text-xs sm:text-sm font-medium'>
                    Hiking
                  </span>
                </div>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 text-xs sm:text-sm font-medium'>
                    Photography
                  </span>
                </div>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 text-xs sm:text-sm font-medium'>
                    Travel
                  </span>
                </div>
                <div className='bg-gradient-to-br from-pink-100 to-purple-100 h-24 sm:h-32 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 shadow-sm'>
                  <span className='text-gray-600 text-xs sm:text-sm font-medium'>
                    Food
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Professional Gallery Modal */}
      {selectedPhotoIndex !== null && profileUser?.photos && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300 ${
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
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[selectedPhotoIndex]}`}
                alt='Gallery view'
                fill
                className='max-w-full max-h-full object-contain rounded-lg'
              />
            </div>

            {/* Navigation Arrows */}
            {profileUser.photos.length > 1 && (
              <>
                <Button
                  title={
                    <svg
                      className='w-4 h-4 sm:w-6 sm:h-6'
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
                  }
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateGallery('prev')
                  }}
                  btnStyle='absolute left-2 sm:left-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 p-0 min-w-0'
                />
                <Button
                  title={
                    <svg
                      className='w-4 h-4 sm:w-6 sm:h-6'
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
                  }
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateGallery('next')
                  }}
                  btnStyle='absolute right-2 sm:right-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 p-0 min-w-0'
                />
              </>
            )}

            {/* Close Button */}
            <Button
              title={
                <svg
                  className='w-4 h-4 sm:w-5 sm:h-5'
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
              }
              onClick={closeGallery}
              btnStyle='absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 p-0 min-w-0'
            />

            {/* Image Counter */}
            <div className='absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm'>
              {selectedPhotoIndex + 1} / {profileUser.photos.length}
            </div>

            {/* Thumbnail Strip */}
            <div className='absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-center'>
              <div className='flex gap-1 sm:gap-2 max-w-full overflow-x-auto py-1 sm:py-2 px-2 sm:px-4 bg-black bg-opacity-30 rounded-xl sm:rounded-2xl backdrop-blur-sm'>
                {profileUser.photos.map((photo, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 sm:w-16 sm:h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                      index === selectedPhotoIndex
                        ? 'border-white border-opacity-80'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPhotoIndex(index)
                    }}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className='w-full h-full object-cover'
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <Button
              title={
                <>
                  <svg
                    className='w-3 h-3 sm:w-4 sm:h-4'
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
                </>
              }
              onClick={(e) => {
                e.stopPropagation()
                const link = document.createElement('a')
                link.href = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${profileUser.photos[selectedPhotoIndex]}`
                link.download = `photo-${selectedPhotoIndex + 1}.jpg`
                link.click()
              }}
              btnStyle='absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1 sm:gap-2 transition-all duration-200 backdrop-blur-sm border border-white border-opacity-20 text-xs sm:text-sm font-medium'
            />
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {message && (
        <div className='fixed top-2 sm:top-4 right-2 sm:right-4 bg-pink-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-50 max-w-xs sm:max-w-sm text-sm sm:text-base'>
          {message}
        </div>
      )}

      {error && (
        <div className='fixed top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-50 max-w-xs sm:max-w-sm text-sm sm:text-base'>
          {error}
        </div>
      )}
    </div>
  )
}

// Main Profile Page Component with Auth Guard
const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const {
    user: authUser,
    loading: authLoading,
    checkingAuth,
    error: authError,
  } = useSelector((state: RootState) => state.auth)

  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false)

  // Check authentication ONCE when component mounts
  useEffect(() => {
    if (!initialCheckDone) {
      console.log('🔐 ProfilePage: Initial auth check...')
      dispatch(checkAuthRequest())
      setInitialCheckDone(true)
    }
  }, [dispatch, initialCheckDone])

  // Track when auth check is complete
  useEffect(() => {
    if (!checkingAuth && !authLoading) {
      console.log('✅ Auth check completed:', {
        checkingAuth,
        authLoading,
        authUser,
        authError,
      })
      setAuthCheckCompleted(true)
    }
  }, [checkingAuth, authLoading, authUser, authError])

  // Handle redirect after auth check is complete
  useEffect(() => {
    // Only redirect if auth check is complete and no user
    if (authCheckCompleted && !authUser && !authLoading && !checkingAuth) {
      console.log('❌ No authenticated user, redirecting to login...')
      // Use replace to prevent back button issues
      router.replace('/login')
    }
  }, [authCheckCompleted, authUser, authLoading, checkingAuth, router])

  // Show loading while checking auth
  if (checkingAuth || (authLoading && !authUser)) {
    return <LoadingScreen message='Checking authentication...' />
  }

  // Show content only if authenticated
  if (authUser) {
    return <ProfileContent />
  }

  // If auth check is complete but no user, show redirect message
  if (authCheckCompleted && !authUser) {
    return <LoadingScreen message='Redirecting to login...' />
  }

  // Fallback - show loading
  return <LoadingScreen message='Loading...' />
}

// Wrap in Suspense for useSearchParams (if needed)
const ProfilePageWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={<LoadingScreen message='Loading...' />}>
      <ProfilePage />
    </Suspense>
  )
}

export default ProfilePageWithSuspense
