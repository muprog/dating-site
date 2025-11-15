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

// interface ProfileFormData {
//   name: string
//   age: string
//   bio: string
//   interests: string
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
//     interests: '',
//   })

//   // Check authentication on component mount
//   useEffect(() => {
//     console.log('🔐 Checking authentication on page load...')
//     dispatch(checkAuthRequest())
//   }, [dispatch])

//   // Handle auth check result
//   useEffect(() => {
//     if (!checkingAuth && !authUser) {
//       console.log('❌ No authenticated user, redirecting to login...')
//       router.push('/login')
//     }
//   }, [checkingAuth, authUser, router])

//   // Get the actual user ID from auth user
//   const userId = authUser?.id || authUser?._id

//   // Only load profile if user is authenticated and has an ID
//   useEffect(() => {
//     console.log('🔄 Profile load check:', {
//       hasAuthUser: !!authUser,
//       userId,
//       hasProfileUser: !!profileUser,
//       loading,
//     })

//     if (authUser && userId && !profileUser && !loading) {
//       console.log('🚀 Loading profile for user:', userId)
//       dispatch(getProfileRequest())
//     }
//   }, [authUser, userId, profileUser, loading, dispatch])

//   useEffect(() => {
//     if (profileUser) {
//       console.log('✅ Profile loaded:', profileUser)
//       setFormData({
//         name: profileUser.name || '',
//         age: profileUser.age?.toString() || '',
//         bio: profileUser.bio || '',
//         interests: profileUser.interests?.join(', ') || '',
//       })
//     }
//   }, [profileUser])

//   useEffect(() => {
//     if (message) {
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
//       console.error('❌ Profile error:', error)
//       const timer = setTimeout(() => {
//         dispatch(clearError())
//       }, 5000)
//       return () => clearTimeout(timer)
//     }
//   }, [error, dispatch])

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()

//     const updateData: Partial<RootState['profile']['user']> = {
//       name: formData.name,
//       bio: formData.bio,
//       interests: formData.interests
//         .split(',')
//         .map((i) => i.trim())
//         .filter((i) => i),
//     }

//     if (formData.age) {
//       updateData.age = parseInt(formData.age)
//     }

//     console.log('📤 Updating profile:', updateData)
//     dispatch(updateProfileRequest(updateData))
//   }

//   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files
//     if (files && files.length > 0) {
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

//   const handleInputChange = (field: keyof ProfileFormData, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }))
//   }

//   // Show loading while checking authentication
//   if (checkingAuth) {
//     return (
//       <div className='flex justify-center items-center min-h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p>Checking authentication...</p>
//           <p className='text-sm text-gray-500 mt-2'>Verifying your session</p>
//         </div>
//       </div>
//     )
//   }

//   // Show loading while profile is being fetched
//   if ((loading && !profileUser) || !authUser) {
//     return (
//       <div className='flex justify-center items-center min-h-screen'>
//         <div className='text-center'>
//           <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
//           <p>Loading your profile...</p>
//           {authUser && (
//             <>
//               <p className='text-sm text-gray-500 mt-2'>
//                 Welcome, {authUser.name}!
//               </p>
//               <p className='text-sm text-gray-500'>User ID: {userId}</p>
//             </>
//           )}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className='max-w-4xl mx-auto p-6'>
//       {/* Header */}
//       <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
//         <div className='flex justify-between items-start mb-4'>
//           <div>
//             <h1 className='text-2xl font-bold'>
//               {isEditing ? (
//                 <input
//                   type='text'
//                   value={formData.name}
//                   onChange={(e) => handleInputChange('name', e.target.value)}
//                   className='border-b-2 border-gray-300 focus:border-blue-500 outline-none mr-2'
//                   placeholder='Your name'
//                 />
//               ) : (
//                 profileUser?.name || authUser.name
//               )}
//               {isEditing ? (
//                 <input
//                   type='number'
//                   value={formData.age}
//                   onChange={(e) => handleInputChange('age', e.target.value)}
//                   className='border-b-2 border-gray-300 w-16 focus:border-blue-500 outline-none'
//                   placeholder='Age'
//                   min='18'
//                   max='100'
//                 />
//               ) : (
//                 profileUser?.age && `, ${profileUser.age}`
//               )}
//             </h1>
//             <p className='text-gray-600 mt-1'>
//               {profileUser?.geoLocation?.coordinates
//                 ? 'San Francisco, CA'
//                 : 'Add location'}
//             </p>
//           </div>
//           <button
//             onClick={() => setIsEditing(!isEditing)}
//             disabled={loading}
//             className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50'
//           >
//             {isEditing ? 'Cancel' : 'Edit Profile'}
//           </button>
//         </div>

//         {/* About Me */}
//         <div className='mb-6'>
//           <h2 className='text-xl font-semibold mb-2'>About Me</h2>
//           {isEditing ? (
//             <textarea
//               value={formData.bio}
//               onChange={(e) => handleInputChange('bio', e.target.value)}
//               className='w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none resize-none'
//               rows={3}
//               placeholder='Tell us about yourself...'
//               maxLength={500}
//             />
//           ) : (
//             <p className='text-gray-700'>
//               {profileUser?.bio ||
//                 "I'm a creative soul with a passion for art, music, and exploring new cultures. Let's connect and share our stories!"}
//             </p>
//           )}
//         </div>

//         {/* Interests */}
//         <div className='mb-6'>
//           <h3 className='text-lg font-semibold mb-2'>Interests</h3>
//           {isEditing ? (
//             <input
//               type='text'
//               value={formData.interests}
//               onChange={(e) => handleInputChange('interests', e.target.value)}
//               className='w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none'
//               placeholder='Enter interests separated by commas (e.g., Art, Music, Travel)'
//             />
//           ) : (
//             <div className='flex flex-wrap gap-2'>
//               {profileUser?.interests?.map(
//                 (interest: string, index: number) => (
//                   <span
//                     key={index}
//                     className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'
//                   >
//                     {interest}
//                   </span>
//                 )
//               )}
//               {(!profileUser?.interests ||
//                 profileUser.interests.length === 0) && (
//                 <>
//                   <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
//                     Art
//                   </span>
//                   <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
//                     Music
//                   </span>
//                   <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
//                     Travel
//                   </span>
//                   <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
//                     Foodie
//                   </span>
//                 </>
//               )}
//             </div>
//           )}
//         </div>

//         {isEditing && (
//           <div className='flex gap-4'>
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className='bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50'
//             >
//               {loading ? 'Saving...' : 'Save Changes'}
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Photos Section */}
//       <div className='bg-white rounded-lg shadow-md p-6'>
//         <div className='flex justify-between items-center mb-4'>
//           <h3 className='text-lg font-semibold'>Photos</h3>
//           <label className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50'>
//             {loading ? 'Uploading...' : 'Upload Photos'}
//             <input
//               type='file'
//               multiple
//               accept='image/*'
//               onChange={handlePhotoUpload}
//               disabled={loading}
//               className='hidden'
//             />
//           </label>
//         </div>

//         <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
//           {profileUser?.photos?.map((photo: string, index: number) => (
//             <div key={index} className='relative group'>
//               <img
//                 src={photo}
//                 alt={`Profile ${index + 1}`}
//                 className='w-full h-32 object-cover rounded-lg'
//               />
//               <button
//                 onClick={() => handleDeletePhoto(index)}
//                 disabled={loading}
//                 className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50'
//                 title='Delete photo'
//               >
//                 ×
//               </button>
//             </div>
//           ))}

//           {/* Placeholder photos when no photos exist */}
//           {(!profileUser?.photos || profileUser.photos.length === 0) && (
//             <>
//               <div className='bg-gray-200 h-32 rounded-lg flex items-center justify-center'>
//                 <span className='text-gray-500'>Hiking</span>
//               </div>
//               <div className='bg-gray-200 h-32 rounded-lg flex items-center justify-center'>
//                 <span className='text-gray-500'>Photography</span>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Messages and Errors */}
//       {message && (
//         <div className='fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'>
//           {message}
//         </div>
//       )}

//       {error && (
//         <div className='fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'>
//           {error}
//         </div>
//       )}
//     </div>
//   )
// }

// export default ProfilePage

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
  interests: string
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
    interests: '',
  })
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Check authentication on component mount - only once
  useEffect(() => {
    if (!hasCheckedAuth) {
      console.log('🔐 Checking authentication on page load...')
      dispatch(checkAuthRequest())
      setHasCheckedAuth(true)
    }
  }, [dispatch, hasCheckedAuth])

  // Handle auth check result - only redirect after auth check is complete
  useEffect(() => {
    // Only redirect if we've finished checking auth AND there's no user
    if (!checkingAuth && !authUser && hasCheckedAuth) {
      console.log(
        '❌ No authenticated user after check, redirecting to login...'
      )
      router.push('/login')
    }
  }, [checkingAuth, authUser, hasCheckedAuth, router])

  // Get the actual user ID from auth user
  const userId = authUser?.id || authUser?._id

  // Only load profile if user is authenticated and has an ID
  useEffect(() => {
    console.log('🔄 Profile load check:', {
      hasAuthUser: !!authUser,
      userId,
      hasProfileUser: !!profileUser,
      loading,
      checkingAuth,
    })

    // Wait until auth check is complete AND we have a user
    if (!checkingAuth && authUser && userId && !profileUser && !loading) {
      console.log('🚀 Loading profile for user:', userId)
      dispatch(getProfileRequest())
    }
  }, [authUser, userId, profileUser, loading, checkingAuth, dispatch])

  useEffect(() => {
    if (profileUser) {
      console.log('✅ Profile loaded:', profileUser)
      setFormData({
        name: profileUser.name || '',
        age: profileUser.age?.toString() || '',
        bio: profileUser.bio || '',
        interests: profileUser.interests?.join(', ') || '',
      })
    }
  }, [profileUser])

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

    const updateData: Partial<RootState['profile']['user']> = {
      name: formData.name,
      bio: formData.bio,
      interests: formData.interests
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i),
    }

    if (formData.age) {
      updateData.age = parseInt(formData.age)
    }

    console.log('📤 Updating profile:', updateData)
    dispatch(updateProfileRequest(updateData))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
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

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p>Checking authentication...</p>
          <p className='text-sm text-gray-500 mt-2'>Verifying your session</p>
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
          {authUser && (
            <>
              <p className='text-sm text-gray-500 mt-2'>
                Welcome, {authUser.name}!
              </p>
              <p className='text-sm text-gray-500'>User ID: {userId}</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      {/* Header */}
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h1 className='text-2xl font-bold'>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className='border-b-2 border-gray-300 focus:border-blue-500 outline-none mr-2'
                  placeholder='Your name'
                />
              ) : (
                profileUser?.name || authUser?.name || 'User'
              )}
              {isEditing ? (
                <input
                  type='number'
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className='border-b-2 border-gray-300 w-16 focus:border-blue-500 outline-none'
                  placeholder='Age'
                  min='18'
                  max='100'
                />
              ) : (
                profileUser?.age && `, ${profileUser.age}`
              )}
            </h1>
            <p className='text-gray-600 mt-1'>
              {profileUser?.geoLocation?.coordinates
                ? 'San Francisco, CA'
                : 'Add location'}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={loading}
            className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50'
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* About Me */}
        <div className='mb-6'>
          <h2 className='text-xl font-semibold mb-2'>About Me</h2>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className='w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none resize-none'
              rows={3}
              placeholder='Tell us about yourself...'
              maxLength={500}
            />
          ) : (
            <p className='text-gray-700'>
              {profileUser?.bio ||
                "I'm a creative soul with a passion for art, music, and exploring new cultures. Let's connect and share our stories!"}
            </p>
          )}
        </div>

        {/* Interests */}
        <div className='mb-6'>
          <h3 className='text-lg font-semibold mb-2'>Interests</h3>
          {isEditing ? (
            <input
              type='text'
              value={formData.interests}
              onChange={(e) => handleInputChange('interests', e.target.value)}
              className='w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none'
              placeholder='Enter interests separated by commas (e.g., Art, Music, Travel)'
            />
          ) : (
            <div className='flex flex-wrap gap-2'>
              {profileUser?.interests?.map(
                (interest: string, index: number) => (
                  <span
                    key={index}
                    className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'
                  >
                    {interest}
                  </span>
                )
              )}
              {(!profileUser?.interests ||
                profileUser.interests.length === 0) && (
                <>
                  <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
                    Art
                  </span>
                  <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
                    Music
                  </span>
                  <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
                    Travel
                  </span>
                  <span className='bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'>
                    Foodie
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <div className='flex gap-4'>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className='bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50'
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Photos Section */}
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>Photos</h3>
          <label className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50'>
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
              <img
                src={photo}
                alt={`Profile ${index + 1}`}
                className='w-full h-32 object-cover rounded-lg'
              />
              <button
                onClick={() => handleDeletePhoto(index)}
                disabled={loading}
                className='absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50'
                title='Delete photo'
              >
                ×
              </button>
            </div>
          ))}

          {/* Placeholder photos when no photos exist */}
          {(!profileUser?.photos || profileUser.photos.length === 0) && (
            <>
              <div className='bg-gray-200 h-32 rounded-lg flex items-center justify-center'>
                <span className='text-gray-500'>Hiking</span>
              </div>
              <div className='bg-gray-200 h-32 rounded-lg flex items-center justify-center'>
                <span className='text-gray-500'>Photography</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages and Errors */}
      {message && (
        <div className='fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'>
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
