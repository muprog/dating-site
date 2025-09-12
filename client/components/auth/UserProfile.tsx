// 'use client'
// import React, { useState, useEffect } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { RootState } from '../../store'
// import {
//   getProfileRequest,
//   updateUserProfileRequest,
// } from '../../store/auth/authSlice'
// import Buttons from '../Buttons'

// const UserProfile: React.FC = () => {
//   const dispatch = useDispatch()
//   const { user, loading, error } = useSelector((state: RootState) => state.auth)

//   const [isEditing, setIsEditing] = useState(false)
//   const [formData, setFormData] = useState({
//     age: user?.age || '',
//     gender: user?.gender || 'other',
//     location: user?.location || '',
//     bio: user?.bio || '',
//     interests: user?.interests?.join(', ') || '',
//   })

//   useEffect(() => {
//     if (user?.id) {
//       dispatch(getProfileRequest(user.id))
//     }
//   }, [dispatch, user?.id])
//   console.log(user)
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value })
//   }

//   const handleSubmit = () => {
//     if (!user) return
//     dispatch(
//       updateUserProfileRequest({
//         userId: user.id,
//         updates: {
//           ...formData,
//           interests: formData.interests.split(',').map((i) => i.trim()),
//         },
//       })
//     )
//     setIsEditing(false)
//   }

//   return (
//     <div className='max-w-4xl mx-auto p-6'>
//       {/* Profile Header */}
//       <div className='flex flex-col items-center gap-4'>
//         <div className='flex gap-2 flex-wrap justify-center'>
//           {user?.photos && user.photos.length > 0 ? (
//             user.photos.map((photo, idx) => (
//               <img
//                 key={idx}
//                 src={photo}
//                 alt={`profile-${idx}`}
//                 className='w-32 h-32 rounded-lg object-cover border shadow'
//               />
//             ))
//           ) : (
//             <img
//               src={user?.picture || '/default-avatar.png'}
//               alt='profile'
//               className='w-32 h-32 rounded-full object-cover border shadow'
//             />
//           )}
//         </div>
//         <h2 className='text-2xl font-bold'>{user?.name}</h2>
//         <p className='text-gray-600'>{user?.email}</p>
//       </div>

//       {/* Profile Info */}
//       <div className='mt-6 bg-white p-6 rounded-lg shadow space-y-4'>
//         {isEditing ? (
//           <>
//             <div>
//               <label className='block text-sm font-medium'>Age</label>
//               <input
//                 type='number'
//                 name='age'
//                 value={formData.age}
//                 onChange={handleChange}
//                 className='w-full border p-2 rounded'
//               />
//             </div>
//             <div>
//               <label className='block text-sm font-medium'>Gender</label>
//               <select
//                 name='gender'
//                 value={formData.gender}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     gender:
//                       e.target.value === 'male' ||
//                       e.target.value === 'female' ||
//                       e.target.value === 'other'
//                         ? e.target.value
//                         : 'other',
//                   })
//                 }
//                 className='w-full border p-2 rounded'
//               >
//                 <option value='male'>Male</option>
//                 <option value='female'>Female</option>
//                 <option value='other'>Other</option>
//               </select>
//             </div>
//             <div>
//               <label className='block text-sm font-medium'>Location</label>
//               <input
//                 type='text'
//                 name='location'
//                 value={formData.location}
//                 onChange={handleChange}
//                 className='w-full border p-2 rounded'
//               />
//             </div>
//             <div>
//               <label className='block text-sm font-medium'>Bio</label>
//               <textarea
//                 name='bio'
//                 value={formData.bio}
//                 onChange={handleChange}
//                 className='w-full border p-2 rounded'
//               />
//             </div>
//             <div>
//               <label className='block text-sm font-medium'>Interests</label>
//               <input
//                 type='text'
//                 name='interests'
//                 value={formData.interests}
//                 onChange={handleChange}
//                 placeholder='Comma separated values'
//                 className='w-full border p-2 rounded'
//               />
//             </div>
//             <div className='flex gap-4 mt-4'>
//               <Buttons clickEvent={handleSubmit} title='Save' style='' />
//               <Buttons
//                 style='outline'
//                 clickEvent={() => setIsEditing(false)}
//                 title='Cancel'
//               />
//             </div>
//           </>
//         ) : (
//           <>
//             <p>
//               <strong>Age:</strong> {user?.age || 'Not set'}
//             </p>
//             <p>
//               <strong>Gender:</strong> {user?.gender || 'Not set'}
//             </p>
//             <p>
//               <strong>Location:</strong> {user?.location || 'Not set'}
//             </p>
//             <p>
//               <strong>Bio:</strong> {user?.bio || 'No bio yet'}
//             </p>
//             <p>
//               <strong>Interests:</strong>{' '}
//               {user?.interests?.length
//                 ? user.interests.join(', ')
//                 : 'No interests set'}
//             </p>
//             <Buttons
//               style='mt-4'
//               clickEvent={() => setIsEditing(true)}
//               title='Edit Profile'
//             />
//           </>
//         )}
//       </div>

//       {loading && <p className='text-center text-gray-500'>Loading...</p>}
//       {error && <p className='text-center text-red-500'>{error}</p>}
//     </div>
//   )
// }

// export default UserProfile

'use client'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import {
  getProfileRequest,
  updateUserProfileRequest,
} from '../../store/auth/authSlice'
import Buttons from '../Buttons'

const UserProfile: React.FC = () => {
  const dispatch = useDispatch()
  const { user, loading, error } = useSelector((state: RootState) => state.auth)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    age: user?.age || '',
    gender: user?.gender || 'other',
    location: user?.location || '',
    bio: user?.bio || '',
    interests: user?.interests?.join(', ') || '',
  })

  useEffect(() => {
    if (user?.id) {
      dispatch(getProfileRequest(user.id))
    }
  }, [dispatch, user?.id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    if (!user) return
    dispatch(
      updateUserProfileRequest({
        userId: user.id,
        updates: {
          ...formData,
          interests: formData.interests.split(',').map((i) => i.trim()),
        },
      })
    )
    setIsEditing(false)
  }

  return (
    <div className='max-w-md mx-auto p-6'>
      {/* Profile Header */}
      <div className='flex flex-col items-center'>
        <img
          src={user?.photos?.[0] || user?.picture || '/default-avatar.png'}
          alt='profile'
          className='w-28 h-28 rounded-full object-cover border'
        />
        <h2 className='mt-3 text-xl font-bold'>
          {user?.name}, {user?.age || 'N/A'}
        </h2>
        <p className='text-gray-500'>{user?.location || 'Unknown Location'}</p>
        <Buttons
          style='mt-4 w-full bg-gray-100 text-gray-700'
          clickEvent={() => setIsEditing(true)}
          title='Edit Profile'
        />
      </div>

      {/* About Me */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold mb-1'>About Me</h3>
        <p className='text-gray-700'>
          {user?.bio || "You haven't written about yourself yet."}
        </p>
      </div>

      {/* Interests */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold mb-2'>Interests</h3>
        <div className='flex flex-wrap gap-2'>
          {user?.interests?.length ? (
            user.interests.map((interest, idx) => (
              <span
                key={idx}
                className='px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700'
              >
                {interest}
              </span>
            ))
          ) : (
            <p className='text-gray-500'>No interests added yet</p>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold mb-2'>Photos</h3>
        <div className='grid grid-cols-2 gap-3'>
          {user?.photos?.length ? (
            user.photos.map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`user-photo-${idx}`}
                className='w-full h-40 rounded-lg object-cover'
              />
            ))
          ) : (
            <p className='text-gray-500'>No photos uploaded</p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className='fixed inset-0 bg-black/40 flex justify-center items-center'>
          <div className='bg-white p-6 rounded-lg shadow max-w-md w-full'>
            <h3 className='text-lg font-semibold mb-4'>Edit Profile</h3>
            <div className='space-y-3'>
              <input
                type='number'
                name='age'
                value={formData.age}
                onChange={handleChange}
                className='w-full border p-2 rounded'
                placeholder='Age'
              />
              <select
                name='gender'
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender:
                      e.target.value === 'male' ||
                      e.target.value === 'female' ||
                      e.target.value === 'other'
                        ? e.target.value
                        : 'other',
                  })
                }
                className='w-full border p-2 rounded'
              >
                <option value='male'>Male</option>
                <option value='female'>Female</option>
                <option value='other'>Other</option>
              </select>
              <input
                type='text'
                name='location'
                value={formData.location}
                onChange={handleChange}
                className='w-full border p-2 rounded'
                placeholder='Location'
              />
              <textarea
                name='bio'
                value={formData.bio}
                onChange={handleChange}
                className='w-full border p-2 rounded'
                placeholder='About Me'
              />
              <input
                type='text'
                name='interests'
                value={formData.interests}
                onChange={handleChange}
                className='w-full border p-2 rounded'
                placeholder='Comma separated interests'
              />
            </div>
            <div className='flex justify-end gap-3 mt-4'>
              <Buttons clickEvent={handleSubmit} title='Save' style='' />
              <Buttons
                style='outline'
                clickEvent={() => setIsEditing(false)}
                title='Cancel'
              />
            </div>
          </div>
        </div>
      )}

      {loading && <p className='text-center text-gray-500 mt-3'>Loading...</p>}
      {error && <p className='text-center text-red-500 mt-3'>{error}</p>}
    </div>
  )
}

export default UserProfile
