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
import React, { useState } from 'react'

type Gender = 'male' | 'female' | 'other'

interface UserProfile {
  name: string
  age?: number
  location?: string
  bio?: string
  gender?: Gender
  interests: string[]
  picture: string
  photos: string[]
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    name: 'Sophia',
    age: 24,
    location: 'San Francisco, CA',
    bio: "I'm a creative soul with a passion for art, music, and exploring new cultures. Let's connect and share our stories!",
    gender: 'female',
    interests: ['Art', 'Music', 'Travel', 'Foodie', 'Hiking', 'Photography'],
    picture: '/images/profile.png',
    photos: [
      '/images/profile.png',
      '/images/profile2.png',
      '/images/profile3.png',
      '/images/profile4.png',
    ],
  })

  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<UserProfile>(user)

  const handleSave = () => {
    setUser(formData)
    setEditing(false)
    // TODO: Send updated profile to backend with Axios
  }

  return (
    <div className='max-w-md mx-auto p-4 font-sans'>
      {/* Profile Header */}
      <div className='flex flex-col items-center'>
        <img
          src={user.picture}
          alt='Profile'
          className='w-32 h-32 rounded-full object-cover border'
        />
        <h2 className='mt-3 text-2xl font-bold'>
          {user.name}
          {user.age ? `, ${user.age}` : ''}
        </h2>
        <p className='text-gray-500'>{user.location}</p>

        <button
          className='mt-4 px-4 py-2 bg-gray-100 rounded-md shadow-sm hover:bg-gray-200'
          onClick={() => setEditing(true)}
        >
          Edit Profile
        </button>
      </div>

      {/* About Me */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold'>About Me</h3>
        <p className='text-gray-700 mt-1'>{user.bio}</p>
      </div>

      {/* Interests */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold'>Interests</h3>
        <div className='flex flex-wrap gap-2 mt-2'>
          {user.interests.map((interest, idx) => (
            <span
              key={idx}
              className='px-3 py-1 bg-gray-100 rounded-full text-sm'
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className='mt-6'>
        <h3 className='text-lg font-semibold'>Photos</h3>
        <div className='grid grid-cols-2 gap-3 mt-3'>
          {user.photos.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt={`Photo ${idx}`}
              className='w-full h-40 object-cover rounded-lg'
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-xl shadow-md w-96'>
            <h3 className='text-lg font-semibold mb-4'>Edit Profile</h3>

            {/* Name */}
            <input
              type='text'
              className='w-full mb-3 border p-2 rounded'
              placeholder='Name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            {/* Age */}
            <input
              type='number'
              className='w-full mb-3 border p-2 rounded'
              placeholder='Age'
              value={formData.age ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />

            {/* Location */}
            <input
              type='text'
              className='w-full mb-3 border p-2 rounded'
              placeholder='Location'
              value={formData.location ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />

            {/* Bio */}
            <textarea
              className='w-full mb-3 border p-2 rounded'
              placeholder='About me'
              value={formData.bio ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />

            <div className='flex justify-end gap-2'>
              <button
                className='px-4 py-2 bg-gray-200 rounded'
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                className='px-4 py-2 bg-blue-500 text-white rounded'
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
