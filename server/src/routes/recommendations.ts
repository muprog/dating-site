// const express = require('express')
// const router = express.Router()
// const User = require('../models/User')
// const Swipe = require('../models/Swipe')
// const auth = require('../middleware/auth')

// interface UserProfile {
//   _id: string
//   name: string
//   age: number
//   bio: string
//   photos: string[]
//   gender: string
//   interests: string[]
//   location: string
//   geoLocation: {
//     type: string
//     coordinates: [number, number]
//   }
//   distance?: number
// }

// interface RecommendationQuery {
//   latitude?: string
//   longitude?: string
//   maxDistance?: string
// }

// // GET /api/users/recommendations - Get recommended users
// router.get('/recommendations', auth, async (req: any, res: any) => {
//   try {
//     const { latitude, longitude, maxDistance }: RecommendationQuery = req.query

//     // Get full user from database using the ID from auth middleware
//     const currentUser = await User.findById(req.user.id)

//     if (!currentUser) {
//       console.error('❌ User not found in database')
//       return res.status(404).json({
//         message: 'User not found',
//       })
//     }

//     console.log('🔄 Getting recommendations for:', currentUser.name)
//     console.log('📍 Location params:', { latitude, longitude })
//     console.log('👤 Current user preferences:', currentUser.preferences)

//     // Build base query
//     let query: any = {
//       _id: { $ne: currentUser._id },
//       verified: true,
//     }

//     // Add gender preference filter with proper fallbacks
//     let preferredGenders: string[]

//     // Check if user has preferences and genders array
//     if (
//       currentUser.preferences &&
//       currentUser.preferences.genders &&
//       Array.isArray(currentUser.preferences.genders)
//     ) {
//       // Convert to proper case to match gender field in database
//       preferredGenders = currentUser.preferences.genders.map((g: string) => {
//         if (g === 'male') return 'Male'
//         if (g === 'female') return 'Female'
//         return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
//       })
//       console.log('🎯 Using user gender preferences:', preferredGenders)
//     } else {
//       // Default to all genders if preferences not set
//       preferredGenders = ['Male', 'Female', 'Other']
//       console.log('ℹ️ Using default gender preferences:', preferredGenders)
//     }
//     query.gender = { $in: preferredGenders }

//     // Add age range filter with proper fallbacks
//     let minAge = 18
//     let maxAge = 99

//     if (
//       currentUser.preferences &&
//       currentUser.preferences.ageRange &&
//       Array.isArray(currentUser.preferences.ageRange) &&
//       currentUser.preferences.ageRange.length === 2
//     ) {
//       minAge = currentUser.preferences.ageRange[0] || 18
//       maxAge = currentUser.preferences.ageRange[1] || 99
//       console.log('🎯 Using user age range:', { minAge, maxAge })
//     } else {
//       console.log('ℹ️ Using default age range:', { minAge, maxAge })
//     }

//     query.age = {
//       $gte: minAge,
//       $lte: maxAge,
//     }

//     // Get users that current user hasn't swiped on
//     const swipedUsers = await Swipe.find({
//       swiper: currentUser._id,
//     }).select('swiped')

//     const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//     query._id.$nin = swipedUserIds

//     console.log('🚫 Excluding swiped users:', swipedUserIds.length)

//     let users: UserProfile[]

//     // If location is provided, use geospatial query
//     if (latitude && longitude) {
//       const userLat = parseFloat(latitude)
//       const userLng = parseFloat(longitude)

//       // Get max distance with fallback
//       let distance = 50
//       if (maxDistance) {
//         distance = parseInt(maxDistance)
//       } else if (
//         currentUser.preferences &&
//         currentUser.preferences.maxDistance
//       ) {
//         distance = currentUser.preferences.maxDistance
//       }

//       console.log('🗺️ Using geospatial query with distance:', distance, 'km')

//       users = await User.aggregate([
//         {
//           $geoNear: {
//             near: {
//               type: 'Point',
//               coordinates: [userLng, userLat],
//             },
//             distanceField: 'distance',
//             maxDistance: distance * 1000, // Convert km to meters
//             spherical: true,
//             query: query,
//           },
//         },
//         {
//           $project: {
//             password: 0,
//             otp: 0,
//             resetPasswordOTP: 0,
//             __v: 0,
//             preferences: 0,
//           },
//         },
//         {
//           $sort: { distance: 1 },
//         },
//         {
//           $limit: 50,
//         },
//       ])
//     } else {
//       // Fallback: get users without location
//       console.log('🌐 Using non-location based query')
//       users = await User.find(query)
//         .select('-password -otp -resetPasswordOTP -__v -preferences')
//         .limit(50)
//         .lean()
//     }

//     console.log(`✅ Found ${users.length} potential matches`)

//     // Calculate match scores and sort
//     const scoredUsers = users.map((user) => ({
//       ...user,
//       matchScore: calculateMatchScore(currentUser, user),
//     }))

//     scoredUsers.sort((a: any, b: any) => b.matchScore - a.matchScore)

//     // Filter out users with invalid data
//     const validUsers = scoredUsers.filter(
//       (user) => user && user.name && user.age && user.gender
//     )

//     console.log(`📊 After filtering: ${validUsers.length} valid users`)

//     res.json({
//       users: validUsers.slice(0, 20), // Return top 20
//       count: validUsers.length,
//     })
//   } catch (error: any) {
//     console.error('❌ Recommendation error:', error)
//     console.error('❌ Error stack:', error.stack)
//     res.status(500).json({
//       message: 'Failed to get recommendations',
//       error: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//     })
//   }
// })

// // Calculate match score between two users
// function calculateMatchScore(user1: any, user2: UserProfile): number {
//   let score = 0

//   // Age compatibility (closer age = higher score)
//   const user1Age = user1.age || 25
//   const user2Age = user2.age || 25
//   const ageDiff = Math.abs(user1Age - user2Age)
//   score += Math.max(0, 100 - ageDiff * 2)

//   // Interest matching
//   if (
//     user1.interests &&
//     Array.isArray(user1.interests) &&
//     user2.interests &&
//     Array.isArray(user2.interests)
//   ) {
//     const commonInterests = user1.interests.filter((interest: string) =>
//       user2.interests.includes(interest)
//     )
//     score += commonInterests.length * 15
//   }

//   // Location score (if available)
//   if (user2.distance) {
//     score += Math.max(0, 100 - user2.distance * 1.5)
//   }

//   // Bio length bonus (users with bios are more engaged)
//   if (user2.bio && user2.bio.length > 10) {
//     score += 10
//   }

//   // Photo bonus (users with photos get higher score)
//   if (user2.photos && Array.isArray(user2.photos) && user2.photos.length > 0) {
//     score += user2.photos.length * 5
//   }

//   return Math.min(score, 200) // Cap at 200
// }

// module.exports = router

// const express = require('express')
// const router = express.Router()
// const User = require('../models/User')
// const Swipe = require('../models/Swipe')
// const auth = require('../middleware/auth')

// // Type definitions
// interface UserProfile {
//   _id: any
//   name: string
//   age: number
//   bio: string
//   photos: string[]
//   gender: string
//   interests: string[]
//   location: string
//   geoLocation: {
//     type: string
//     coordinates: [number, number]
//   }
//   distance?: number
//   lastActive?: Date
//   createdAt?: Date
//   verified?: boolean
//   matchScore?: number
//   toObject?: () => any
// }

// interface BadgeUser extends UserProfile {
//   badge: {
//     type: 'new' | 'popular' | 'online' | 'compatible' | 'recycled'
//     label: string
//     color: string
//   }
// }

// interface FeedSources {
//   newUsers: BadgeUser[]
//   popularUsers: BadgeUser[]
//   onlineUsers: BadgeUser[]
//   highCompatibilityUsers: BadgeUser[]
//   recycledUsers: BadgeUser[]
// }

// interface UserPreferences {
//   genders?: string[]
//   ageRange?: [number, number]
//   maxDistance?: number
// }

// interface CurrentUser {
//   _id: any
//   name: string
//   age: number
//   interests: string[]
//   preferences?: UserPreferences
// }

// // GET /api/users/recommendations - Get mixed feed with badges
// router.get('/recommendations', auth, async (req: any, res: any) => {
//   try {
//     const { latitude, longitude, maxDistance } = req.query
//     const currentUserId = req.user.id

//     // Get full user from database
//     const currentUser = await User.findById(currentUserId)
//     if (!currentUser) {
//       return res.status(404).json({ message: 'User not found' })
//     }

//     console.log('🔄 Getting mixed feed recommendations for:', currentUser.name)

//     // Get all necessary data in parallel for efficiency
//     const [
//       newUsers,
//       popularUsers,
//       onlineUsers,
//       highCompatibilityUsers,
//       recycledUsers
//     ] = await Promise.all([
//       getNewUsers(currentUser),
//       getPopularUsers(currentUser),
//       getOnlineUsers(currentUser),
//       getHighCompatibilityUsers(currentUser, latitude, longitude, maxDistance),
//       getRecycledUsers(currentUser)
//     ])

//     // Mix all sources with limits
//     const mixedFeed = mixFeedSources({
//       newUsers,
//       popularUsers,
//       onlineUsers,
//       highCompatibilityUsers,
//       recycledUsers
//     })

//     console.log(`🎯 Mixed feed created: ${mixedFeed.length} users`)

//     res.json({
//       users: mixedFeed,
//       count: mixedFeed.length,
//       sources: {
//         new: newUsers.length,
//         popular: popularUsers.length,
//         online: onlineUsers.length,
//         compatible: highCompatibilityUsers.length,
//         recycled: recycledUsers.length
//       }
//     })

//   } catch (error: any) {
//     console.error('❌ Recommendation error:', error)
//     res.status(500).json({
//       message: 'Failed to get recommendations',
//       error: error.message
//     })
//   }
// })

// // 1. 🆕 New Users - Joined in last 7 days
// async function getNewUsers(currentUser: CurrentUser): Promise<BadgeUser[]> {
//   const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

//   const newUsers = await User.find({
//     _id: { $ne: currentUser._id },
//     verified: true,
//     createdAt: { $gte: oneWeekAgo },
//     ...getBasePreferences(currentUser)
//   })
//   .select('-password -otp -resetPasswordOTP -__v -preferences')
//   .limit(15)
//   .lean()

//   return newUsers.map((user: UserProfile) => ({
//     ...user,
//     badge: { type: 'new' as const, label: '🆕 New in area', color: 'green' }
//   }))
// }

// // 2. 🔥 Popular Users - Most liked users
// async function getPopularUsers(currentUser: CurrentUser): Promise<BadgeUser[]> {
//   const popularUserIds = await Swipe.aggregate([
//     {
//       $match: {
//         action: 'like',
//         swiped: { $ne: currentUser._id }
//       }
//     },
//     {
//       $group: {
//         _id: '$swiped',
//         likeCount: { $sum: 1 }
//       }
//     },
//     {
//       $match: {
//         likeCount: { $gte: 3 } // At least 3 likes to be considered "popular"
//       }
//     },
//     { $sort: { likeCount: -1 } },
//     { $limit: 15 }
//   ])

//   if (popularUserIds.length === 0) return []

//   const popularUsers = await User.find({
//     _id: { $in: popularUserIds.map((p: any) => p._id) },
//     verified: true,
//     ...getBasePreferences(currentUser)
//   })
//   .select('-password -otp -resetPasswordOTP -__v -preferences')
//   .lean()

//   return popularUsers.map((user: UserProfile) => ({
//     ...user,
//     badge: { type: 'popular' as const, label: '🔥 Popular', color: 'orange' }
//   }))
// }

// // 3. ⚡ Online Recently - Active in last 24 hours
// async function getOnlineUsers(currentUser: CurrentUser): Promise<BadgeUser[]> {
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

//   const onlineUsers = await User.find({
//     _id: { $ne: currentUser._id },
//     verified: true,
//     lastActive: { $gte: oneDayAgo },
//     ...getBasePreferences(currentUser)
//   })
//   .select('-password -otp -resetPasswordOTP -__v -preferences')
//   .limit(15)
//   .lean()

//   return onlineUsers.map((user: UserProfile) => ({
//     ...user,
//     badge: { type: 'online' as const, label: '⚡ Online recently', color: 'blue' }
//   }))
// }

// // 4. 🎯 High Compatibility - Your existing algorithm enhanced
// async function getHighCompatibilityUsers(
//   currentUser: CurrentUser,
//   latitude: string,
//   longitude: string,
//   maxDistanceParam: string
// ): Promise<BadgeUser[]> {
//   let baseQuery: any = {
//     _id: { $ne: currentUser._id },
//     verified: true,
//     ...getBasePreferences(currentUser)
//   }

//   // Get users that current user hasn't swiped on
//   const swipedUsers = await Swipe.find({
//     swiper: currentUser._id,
//   }).select('swiped')

//   const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//   baseQuery._id.$nin = swipedUserIds

//   let users: UserProfile[] = []

//   if (latitude && longitude) {
//     const userLat = parseFloat(latitude)
//     const userLng = parseFloat(longitude)
//     const distance = maxDistanceParam ? parseInt(maxDistanceParam) : (currentUser.preferences?.maxDistance || 50)

//     users = await User.aggregate([
//       {
//         $geoNear: {
//           near: { type: 'Point', coordinates: [userLng, userLat] },
//           distanceField: 'distance',
//           maxDistance: distance * 1000,
//           spherical: true,
//           query: baseQuery,
//         },
//       },
//       { $limit: 30 },
//       { $project: { password: 0, otp: 0, resetPasswordOTP: 0, __v: 0, preferences: 0 } }
//     ])
//   } else {
//     users = await User.find(baseQuery)
//       .select('-password -otp -resetPasswordOTP -__v -preferences')
//       .limit(30)
//       .lean()
//   }

//   // Calculate match scores and filter for high compatibility
//   const scoredUsers = users.map((user: UserProfile) => ({
//     ...user,
//     matchScore: calculateMatchScore(currentUser, user)
//   }))

//   const highCompatibilityUsers = scoredUsers
//     .filter((user: UserProfile & { matchScore: number }) => user.matchScore > 120)
//     .sort((a: UserProfile & { matchScore: number }, b: UserProfile & { matchScore: number }) => b.matchScore - a.matchScore)
//     .slice(0, 10)

//   return highCompatibilityUsers.map((user: UserProfile) => ({
//     ...user,
//     badge: { type: 'compatible' as const, label: '🎯 High match', color: 'purple' }
//   }))
// }

// // 5. 🔁 Recycled Users - Passed more than 7 days ago
// async function getRecycledUsers(currentUser: CurrentUser): Promise<BadgeUser[]> {
//   const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

//   const passedSwipes = await Swipe.find({
//     swiper: currentUser._id,
//     action: 'pass',
//     createdAt: { $lte: oneWeekAgo }
//   }).populate('swiped')

//   if (passedSwipes.length === 0) return []

//   const recycledUsers: BadgeUser[] = []

//   for (const swipe of passedSwipes) {
//     if (swipe.swiped && recycledUsers.length < 10) {
//       const userData = (swipe.swiped as any).toObject ? (swipe.swiped as any).toObject() : swipe.swiped
//       recycledUsers.push({
//         ...userData,
//         badge: { type: 'recycled' as const, label: '🔁 You passed before', color: 'gray' }
//       })
//     }
//   }

//   return recycledUsers
// }

// // Helper function to get base preferences
// function getBasePreferences(currentUser: CurrentUser) {
//   const preferredGenders = currentUser.preferences?.genders?.map((g: string) => {
//     if (g === 'male') return 'Male'
//     if (g === 'female') return 'Female'
//     return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
//   }) || ['Male', 'Female', 'Other']

//   const minAge = currentUser.preferences?.ageRange?.[0] || 18
//   const maxAge = currentUser.preferences?.ageRange?.[1] || 99

//   return {
//     gender: { $in: preferredGenders },
//     age: { $gte: minAge, $lte: maxAge }
//   }
// }

// // Mix all feed sources with balanced distribution - FIXED VERSION
// function mixFeedSources(sources: FeedSources): BadgeUser[] {
//   const { newUsers, popularUsers, onlineUsers, highCompatibilityUsers, recycledUsers } = sources

//   const mixedFeed: BadgeUser[] = []
//   const maxPerSource = 5 // Maximum users from each source in final feed

//   // Add users from each source in round-robin fashion with proper undefined checks
//   for (let i = 0; i < maxPerSource; i++) {
//     // Use type guards to ensure we only push defined values
//     const newUser = i < newUsers.length ? newUsers[i] : undefined
//     const popularUser = i < popularUsers.length ? popularUsers[i] : undefined
//     const onlineUser = i < onlineUsers.length ? onlineUsers[i] : undefined
//     const compatibleUser = i < highCompatibilityUsers.length ? highCompatibilityUsers[i] : undefined
//     const recycledUser = i < recycledUsers.length ? recycledUsers[i] : undefined

//     // Only push defined users
//     if (newUser) mixedFeed.push(newUser)
//     if (popularUser) mixedFeed.push(popularUser)
//     if (onlineUser) mixedFeed.push(onlineUser)
//     if (compatibleUser) mixedFeed.push(compatibleUser)
//     if (recycledUser) mixedFeed.push(recycledUser)
//   }

//   // Remove duplicates (in case user appears in multiple categories)
//   const uniqueUsers: BadgeUser[] = []
//   const seenIds = new Set<string>()

//   for (const user of mixedFeed) {
//     const userId = user._id.toString()
//     if (!seenIds.has(userId)) {
//       seenIds.add(userId)
//       uniqueUsers.push(user)
//     }
//   }

//   // Shuffle for variety
//   return shuffleArray(uniqueUsers).slice(0, 25) // Return max 25 users
// }

// // Your existing match score function (enhanced)
// function calculateMatchScore(user1: CurrentUser, user2: UserProfile): number {
//   let score = 0

//   // Age compatibility
//   const user1Age = user1.age || 25
//   const user2Age = user2.age || 25
//   const ageDiff = Math.abs(user1Age - user2Age)
//   score += Math.max(0, 100 - ageDiff * 2)

//   // Interest matching
//   if (user1.interests && user2.interests) {
//     const commonInterests = user1.interests.filter((interest: string) =>
//       user2.interests.includes(interest)
//     )
//     score += commonInterests.length * 20 // Increased weight
//   }

//   // Location score
//   if (user2.distance) {
//     score += Math.max(0, 100 - user2.distance)
//   }

//   // Profile completeness bonus
//   if (user2.bio && user2.bio.length > 20) score += 15
//   if (user2.photos && user2.photos.length > 0) score += user2.photos.length * 8
//   if (user2.interests && user2.interests.length > 2) score += 10

//   return Math.min(score, 250) // Increased cap
// }

// // Utility function to shuffle array - FIXED VERSION
// function shuffleArray<T>(array: T[]): T[] {
//   const shuffled = [...array]
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1))
//     const temp = shuffled[i]
//     shuffled[i] = shuffled[j]
//     shuffled[j] = temp
//   }
//   return shuffled
// }

// module.exports = router

const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Swipe = require('../models/Swipe')
const auth = require('../middleware/auth')

// GET /api/users/recommendations - Get mixed feed with badges
router.get('/recommendations', auth, async (req: any, res: any) => {
  try {
    const { latitude, longitude, maxDistance } = req.query
    const currentUserId = req.user.id

    // Get full user from database
    const currentUser = await User.findById(currentUserId)
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    console.log('🔄 Getting mixed feed recommendations for:', currentUser.name)

    // Get all necessary data in parallel for efficiency
    const [
      newUsers,
      popularUsers,
      onlineUsers,
      highCompatibilityUsers,
      recycledUsers,
    ] = await Promise.all([
      getNewUsers(currentUser),
      getPopularUsers(currentUser),
      getOnlineUsers(currentUser),
      getHighCompatibilityUsers(currentUser, latitude, longitude, maxDistance),
      getRecycledUsers(currentUser),
    ])

    // Mix all sources with limits
    const mixedFeed = mixFeedSources(
      newUsers,
      popularUsers,
      onlineUsers,
      highCompatibilityUsers,
      recycledUsers
    )

    console.log(`🎯 Mixed feed created: ${mixedFeed.length} users`)

    res.json({
      users: mixedFeed,
      count: mixedFeed.length,
      sources: {
        new: newUsers.length,
        popular: popularUsers.length,
        online: onlineUsers.length,
        compatible: highCompatibilityUsers.length,
        recycled: recycledUsers.length,
      },
    })
  } catch (error: any) {
    console.error('❌ Recommendation error:', error)
    res.status(500).json({
      message: 'Failed to get recommendations',
      error: error.message,
    })
  }
})

// 1. 🆕 New Users - Joined in last 7 days
async function getNewUsers(currentUser: any): Promise<any[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const newUsers = await User.find({
    _id: { $ne: currentUser._id },
    verified: true,
    createdAt: { $gte: oneWeekAgo },
    ...getBasePreferences(currentUser),
  })
    .select('-password -otp -resetPasswordOTP -__v -preferences')
    .limit(15)
    .lean()

  return newUsers.map((user: any) => ({
    ...user,
    badge: { type: 'new', label: '🆕 New in area', color: 'green' },
  }))
}

// 2. 🔥 Popular Users - Most liked users
async function getPopularUsers(currentUser: any): Promise<any[]> {
  const popularUserIds = await Swipe.aggregate([
    {
      $match: {
        action: 'like',
        swiped: { $ne: currentUser._id },
      },
    },
    {
      $group: {
        _id: '$swiped',
        likeCount: { $sum: 1 },
      },
    },
    {
      $match: {
        likeCount: { $gte: 3 },
      },
    },
    { $sort: { likeCount: -1 } },
    { $limit: 15 },
  ])

  if (popularUserIds.length === 0) return []

  const popularUsers = await User.find({
    _id: { $in: popularUserIds.map((p: any) => p._id) },
    verified: true,
    ...getBasePreferences(currentUser),
  })
    .select('-password -otp -resetPasswordOTP -__v -preferences')
    .lean()

  return popularUsers.map((user: any) => ({
    ...user,
    badge: { type: 'popular', label: '🔥 Popular', color: 'orange' },
  }))
}

// 3. ⚡ Online Recently - Active in last 24 hours
async function getOnlineUsers(currentUser: any): Promise<any[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const onlineUsers = await User.find({
    _id: { $ne: currentUser._id },
    verified: true,
    lastActive: { $gte: oneDayAgo },
    ...getBasePreferences(currentUser),
  })
    .select('-password -otp -resetPasswordOTP -__v -preferences')
    .limit(15)
    .lean()

  return onlineUsers.map((user: any) => ({
    ...user,
    badge: { type: 'online', label: '⚡ Online recently', color: 'blue' },
  }))
}

// 4. 🎯 High Compatibility - Your existing algorithm enhanced
async function getHighCompatibilityUsers(
  currentUser: any,
  latitude: string,
  longitude: string,
  maxDistanceParam: string
): Promise<any[]> {
  let baseQuery: any = {
    _id: { $ne: currentUser._id },
    verified: true,
    ...getBasePreferences(currentUser),
  }

  // Get users that current user hasn't swiped on
  const swipedUsers = await Swipe.find({
    swiper: currentUser._id,
  }).select('swiped')

  const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
  baseQuery._id.$nin = swipedUserIds

  let users: any[] = []

  if (latitude && longitude) {
    const userLat = parseFloat(latitude)
    const userLng = parseFloat(longitude)
    const distance = maxDistanceParam
      ? parseInt(maxDistanceParam)
      : currentUser.preferences?.maxDistance || 50

    users = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [userLng, userLat] },
          distanceField: 'distance',
          maxDistance: distance * 1000,
          spherical: true,
          query: baseQuery,
        },
      },
      { $limit: 30 },
      {
        $project: {
          password: 0,
          otp: 0,
          resetPasswordOTP: 0,
          __v: 0,
          preferences: 0,
        },
      },
    ])
  } else {
    users = await User.find(baseQuery)
      .select('-password -otp -resetPasswordOTP -__v -preferences')
      .limit(30)
      .lean()
  }

  // Calculate match scores and filter for high compatibility
  const scoredUsers = users.map((user: any) => ({
    ...user,
    matchScore: calculateMatchScore(currentUser, user),
  }))

  const highCompatibilityUsers = scoredUsers
    .filter((user: any) => user.matchScore > 120)
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, 10)

  return highCompatibilityUsers.map((user: any) => ({
    ...user,
    badge: { type: 'compatible', label: '🎯 High match', color: 'purple' },
  }))
}

// 5. 🔁 Recycled Users - Passed more than 7 days ago
async function getRecycledUsers(currentUser: any): Promise<any[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const passedSwipes = await Swipe.find({
    swiper: currentUser._id,
    action: 'pass',
    createdAt: { $lte: oneWeekAgo },
  }).populate('swiped')

  if (passedSwipes.length === 0) return []

  const recycledUsers: any[] = []

  for (const swipe of passedSwipes) {
    if (swipe.swiped && recycledUsers.length < 10) {
      const userData = swipe.swiped.toObject
        ? swipe.swiped.toObject()
        : swipe.swiped
      recycledUsers.push({
        ...userData,
        badge: {
          type: 'recycled',
          label: '🔁 You passed before',
          color: 'gray',
        },
      })
    }
  }

  return recycledUsers
}

// Helper function to get base preferences
function getBasePreferences(currentUser: any) {
  const preferredGenders = currentUser.preferences?.genders?.map(
    (g: string) => {
      if (g === 'male') return 'Male'
      if (g === 'female') return 'Female'
      return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
    }
  ) || ['Male', 'Female', 'Other']

  const minAge = currentUser.preferences?.ageRange?.[0] || 18
  const maxAge = currentUser.preferences?.ageRange?.[1] || 99

  return {
    gender: { $in: preferredGenders },
    age: { $gte: minAge, $lte: maxAge },
  }
}

// Mix all feed sources with balanced distribution
function mixFeedSources(
  newUsers: any[],
  popularUsers: any[],
  onlineUsers: any[],
  highCompatibilityUsers: any[],
  recycledUsers: any[]
): any[] {
  const mixedFeed: any[] = []
  const maxPerSource = 5

  // Add users from each source
  for (let i = 0; i < maxPerSource; i++) {
    if (i < newUsers.length) mixedFeed.push(newUsers[i])
    if (i < popularUsers.length) mixedFeed.push(popularUsers[i])
    if (i < onlineUsers.length) mixedFeed.push(onlineUsers[i])
    if (i < highCompatibilityUsers.length)
      mixedFeed.push(highCompatibilityUsers[i])
    if (i < recycledUsers.length) mixedFeed.push(recycledUsers[i])
  }

  // Remove duplicates
  const uniqueUsers: any[] = []
  const seenIds = new Set<string>()

  for (const user of mixedFeed) {
    const userId = user._id.toString()
    if (!seenIds.has(userId)) {
      seenIds.add(userId)
      uniqueUsers.push(user)
    }
  }

  // Shuffle for variety
  return shuffleArray(uniqueUsers).slice(0, 25)
}

// Match score function
function calculateMatchScore(user1: any, user2: any): number {
  let score = 0

  // Age compatibility
  const user1Age = user1.age || 25
  const user2Age = user2.age || 25
  const ageDiff = Math.abs(user1Age - user2Age)
  score += Math.max(0, 100 - ageDiff * 2)

  // Interest matching
  if (user1.interests && user2.interests) {
    const commonInterests = user1.interests.filter((interest: string) =>
      user2.interests.includes(interest)
    )
    score += commonInterests.length * 20
  }

  // Location score
  if (user2.distance) {
    score += Math.max(0, 100 - user2.distance)
  }

  // Profile completeness bonus
  if (user2.bio && user2.bio.length > 20) score += 15
  if (user2.photos && user2.photos.length > 0) score += user2.photos.length * 8
  if (user2.interests && user2.interests.length > 2) score += 10

  return Math.min(score, 250)
}

// Fixed shuffle function - NO GENERICS
function shuffleArray(array: any[]): any[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled
}

module.exports = router
