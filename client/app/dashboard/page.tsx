'use client'
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState } from '@/store'
import { logout } from '@/store/user/userSlice'
import {
  FaUser,
  FaHeart,
  FaComments,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa'

export default function Dashboard() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.user)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    dispatch(logout())
    router.push('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <h1 className='text-2xl font-bold text-pink-600'>Dating Site</h1>
            <div className='flex items-center space-x-4'>
              <span className='text-gray-700'>Welcome, {user.name}!</span>
              <button
                onClick={handleLogout}
                className='flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors'
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Section */}
        <div className='bg-white rounded-lg shadow-sm p-6 mb-8'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            Welcome back, {user.name}! 👋
          </h2>
          <p className='text-gray-600'>
            Ready to find your perfect match? Explore profiles, start
            conversations, and make meaningful connections.
          </p>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer'>
            <div className='flex items-center space-x-3'>
              <div className='p-3 bg-pink-100 rounded-lg'>
                <FaHeart className='text-pink-600 text-xl' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Discover</h3>
                <p className='text-sm text-gray-600'>Find new matches</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer'>
            <div className='flex items-center space-x-3'>
              <div className='p-3 bg-blue-100 rounded-lg'>
                <FaComments className='text-blue-600 text-xl' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Messages</h3>
                <p className='text-sm text-gray-600'>View conversations</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer'>
            <div className='flex items-center space-x-3'>
              <div className='p-3 bg-green-100 rounded-lg'>
                <FaUser className='text-green-600 text-xl' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Profile</h3>
                <p className='text-sm text-gray-600'>Edit your profile</p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer'>
            <div className='flex items-center space-x-3'>
              <div className='p-3 bg-purple-100 rounded-lg'>
                <FaCog className='text-purple-600 text-xl' />
              </div>
              <div>
                <h3 className='font-semibold text-gray-900'>Settings</h3>
                <p className='text-sm text-gray-600'>Manage preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Profile Views
            </h3>
            <p className='text-3xl font-bold text-pink-600'>24</p>
            <p className='text-sm text-gray-600'>This week</p>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              New Matches
            </h3>
            <p className='text-3xl font-bold text-pink-600'>8</p>
            <p className='text-sm text-gray-600'>This month</p>
          </div>

          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Messages
            </h3>
            <p className='text-3xl font-bold text-pink-600'>12</p>
            <p className='text-sm text-gray-600'>Unread</p>
          </div>
        </div>
      </main>
    </div>
  )
}
