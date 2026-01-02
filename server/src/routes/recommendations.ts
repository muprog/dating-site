// const express = require('express')
// const router = express.Router()
// const User = require('../models/User')
// const Swipe = require('../models/Swipe')
// const auth = require('../middleware/auth')

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
//       recycledUsers,
//     ] = await Promise.all([
//       getNewUsers(currentUser),
//       getPopularUsers(currentUser),
//       getOnlineUsers(currentUser),
//       getHighCompatibilityUsers(currentUser, latitude, longitude, maxDistance),
//       getRecycledUsers(currentUser),
//     ])

//     // Mix all sources with limits
//     const mixedFeed = mixFeedSources(
//       newUsers,
//       popularUsers,
//       onlineUsers,
//       highCompatibilityUsers,
//       recycledUsers
//     )

//     console.log(`🎯 Mixed feed created: ${mixedFeed.length} users`)

//     res.json({
//       users: mixedFeed,
//       count: mixedFeed.length,
//       sources: {
//         new: newUsers.length,
//         popular: popularUsers.length,
//         online: onlineUsers.length,
//         compatible: highCompatibilityUsers.length,
//         recycled: recycledUsers.length,
//       },
//     })
//   } catch (error: any) {
//     console.error('❌ Recommendation error:', error)
//     res.status(500).json({
//       message: 'Failed to get recommendations',
//       error: error.message,
//     })
//   }
// })

// // 1. 🆕 New Users - Joined in last 7 days
// async function getNewUsers(currentUser: any): Promise<any[]> {
//   const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

//   const newUsers = await User.find({
//     _id: { $ne: currentUser._id },
//     verified: true,
//     createdAt: { $gte: oneWeekAgo },
//     ...getBasePreferences(currentUser),
//   })
//     .select('-password -otp -resetPasswordOTP -__v -preferences')
//     .limit(15)
//     .lean()

//   return newUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'new', label: '🆕 New in area', color: 'green' },
//   }))
// }

// // 2. 🔥 Popular Users - Most liked users
// async function getPopularUsers(currentUser: any): Promise<any[]> {
//   const popularUserIds = await Swipe.aggregate([
//     {
//       $match: {
//         action: 'like',
//         swiped: { $ne: currentUser._id },
//       },
//     },
//     {
//       $group: {
//         _id: '$swiped',
//         likeCount: { $sum: 1 },
//       },
//     },
//     {
//       $match: {
//         likeCount: { $gte: 3 },
//       },
//     },
//     { $sort: { likeCount: -1 } },
//     { $limit: 15 },
//   ])

//   if (popularUserIds.length === 0) return []

//   const popularUsers = await User.find({
//     _id: { $in: popularUserIds.map((p: any) => p._id) },
//     verified: true,
//     ...getBasePreferences(currentUser),
//   })
//     .select('-password -otp -resetPasswordOTP -__v -preferences')
//     .lean()

//   return popularUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'popular', label: '🔥 Popular', color: 'orange' },
//   }))
// }

// // 3. ⚡ Online Recently - Active in last 24 hours
// async function getOnlineUsers(currentUser: any): Promise<any[]> {
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

//   const onlineUsers = await User.find({
//     _id: { $ne: currentUser._id },
//     verified: true,
//     lastActive: { $gte: oneDayAgo },
//     ...getBasePreferences(currentUser),
//   })
//     .select('-password -otp -resetPasswordOTP -__v -preferences')
//     .limit(15)
//     .lean()

//   return onlineUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'online', label: '⚡ Online recently', color: 'blue' },
//   }))
// }

// // 4. 🎯 High Compatibility - Your existing algorithm enhanced
// async function getHighCompatibilityUsers(
//   currentUser: any,
//   latitude: string,
//   longitude: string,
//   maxDistanceParam: string
// ): Promise<any[]> {
//   let baseQuery: any = {
//     _id: { $ne: currentUser._id },
//     verified: true,
//     ...getBasePreferences(currentUser),
//   }

//   // Get users that current user hasn't swiped on
//   const swipedUsers = await Swipe.find({
//     swiper: currentUser._id,
//   }).select('swiped')

//   const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//   baseQuery._id.$nin = swipedUserIds

//   let users: any[] = []

//   if (latitude && longitude) {
//     const userLat = parseFloat(latitude)
//     const userLng = parseFloat(longitude)
//     const distance = maxDistanceParam
//       ? parseInt(maxDistanceParam)
//       : currentUser.preferences?.maxDistance || 50

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
//       {
//         $project: {
//           password: 0,
//           otp: 0,
//           resetPasswordOTP: 0,
//           __v: 0,
//           preferences: 0,
//         },
//       },
//     ])
//   } else {
//     users = await User.find(baseQuery)
//       .select('-password -otp -resetPasswordOTP -__v -preferences')
//       .limit(30)
//       .lean()
//   }

//   // Calculate match scores and filter for high compatibility
//   const scoredUsers = users.map((user: any) => ({
//     ...user,
//     matchScore: calculateMatchScore(currentUser, user),
//   }))

//   const highCompatibilityUsers = scoredUsers
//     .filter((user: any) => user.matchScore > 120)
//     .sort((a: any, b: any) => b.matchScore - a.matchScore)
//     .slice(0, 10)

//   return highCompatibilityUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'compatible', label: '🎯 High match', color: 'purple' },
//   }))
// }

// // 5. 🔁 Recycled Users - Passed more than 7 days ago
// async function getRecycledUsers(currentUser: any): Promise<any[]> {
//   const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

//   const passedSwipes = await Swipe.find({
//     swiper: currentUser._id,
//     action: 'pass',
//     createdAt: { $lte: oneWeekAgo },
//   }).populate('swiped')

//   if (passedSwipes.length === 0) return []

//   const recycledUsers: any[] = []

//   for (const swipe of passedSwipes) {
//     if (swipe.swiped && recycledUsers.length < 10) {
//       const userData = swipe.swiped.toObject
//         ? swipe.swiped.toObject()
//         : swipe.swiped
//       recycledUsers.push({
//         ...userData,
//         badge: {
//           type: 'recycled',
//           label: '🔁 You passed before',
//           color: 'gray',
//         },
//       })
//     }
//   }

//   return recycledUsers
// }

// // Helper function to get base preferences
// function getBasePreferences(currentUser: any) {
//   const preferredGenders = currentUser.preferences?.genders?.map(
//     (g: string) => {
//       if (g === 'male') return 'Male'
//       if (g === 'female') return 'Female'
//       return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
//     }
//   ) || ['Male', 'Female', 'Other']

//   const minAge = currentUser.preferences?.ageRange?.[0] || 18
//   const maxAge = currentUser.preferences?.ageRange?.[1] || 99

//   return {
//     gender: { $in: preferredGenders },
//     age: { $gte: minAge, $lte: maxAge },
//   }
// }

// // Mix all feed sources with balanced distribution
// function mixFeedSources(
//   newUsers: any[],
//   popularUsers: any[],
//   onlineUsers: any[],
//   highCompatibilityUsers: any[],
//   recycledUsers: any[]
// ): any[] {
//   const mixedFeed: any[] = []
//   const maxPerSource = 5

//   // Add users from each source
//   for (let i = 0; i < maxPerSource; i++) {
//     if (i < newUsers.length) mixedFeed.push(newUsers[i])
//     if (i < popularUsers.length) mixedFeed.push(popularUsers[i])
//     if (i < onlineUsers.length) mixedFeed.push(onlineUsers[i])
//     if (i < highCompatibilityUsers.length)
//       mixedFeed.push(highCompatibilityUsers[i])
//     if (i < recycledUsers.length) mixedFeed.push(recycledUsers[i])
//   }

//   // Remove duplicates
//   const uniqueUsers: any[] = []
//   const seenIds = new Set<string>()

//   for (const user of mixedFeed) {
//     const userId = user._id.toString()
//     if (!seenIds.has(userId)) {
//       seenIds.add(userId)
//       uniqueUsers.push(user)
//     }
//   }

//   // Shuffle for variety
//   return shuffleArray(uniqueUsers).slice(0, 25)
// }

// // Match score function
// function calculateMatchScore(user1: any, user2: any): number {
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
//     score += commonInterests.length * 20
//   }

//   // Location score
//   if (user2.distance) {
//     score += Math.max(0, 100 - user2.distance)
//   }

//   // Profile completeness bonus
//   if (user2.bio && user2.bio.length > 20) score += 15
//   if (user2.photos && user2.photos.length > 0) score += user2.photos.length * 8
//   if (user2.interests && user2.interests.length > 2) score += 10

//   return Math.min(score, 250)
// }

// // Fixed shuffle function - NO GENERICS
// function shuffleArray(array: any[]): any[] {
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

// const express = require('express')
// const router = express.Router()
// const User = require('../models/User')
// const Swipe = require('../models/Swipe')
// const auth = require('../middleware/auth')

// router.get('/recommendations', auth, async (req: any, res: any) => {
//   try {
//     const {
//       latitude,
//       longitude,
//       maxDistance,
//       includeSwiped = 'true',
//     } = req.query
//     const currentUserId = req.user.id

//     // Get full user from database
//     const currentUser = await User.findById(currentUserId)
//     if (!currentUser) {
//       return res.status(404).json({ message: 'User not found' })
//     }

//     console.log('🔄 Getting mixed feed recommendations for:', currentUser.name)
//     console.log('📊 Include swiped users:', includeSwiped)

//     // Get all necessary data in parallel for efficiency
//     const [
//       newUsers,
//       popularUsers,
//       onlineUsers,
//       highCompatibilityUsers,
//       recycledUsers,
//     ] = await Promise.all([
//       getNewUsers(currentUser, includeSwiped === 'true'),
//       getPopularUsers(currentUser, includeSwiped === 'true'),
//       getOnlineUsers(currentUser, includeSwiped === 'true'),
//       getHighCompatibilityUsers(
//         currentUser,
//         latitude,
//         longitude,
//         maxDistance,
//         includeSwiped === 'true'
//       ),
//       getRecycledUsers(currentUser),
//     ])

//     // Mix all sources with limits
//     const mixedFeed = mixFeedSources(
//       newUsers,
//       popularUsers,
//       onlineUsers,
//       highCompatibilityUsers,
//       recycledUsers
//     )

//     console.log(`🎯 Mixed feed created: ${mixedFeed.length} users`)

//     // Get swipe history to include in response
//     const swipeHistory = await Swipe.find({
//       swiper: currentUserId,
//     }).select('swiped action')

//     const likedUsers = swipeHistory
//       .filter((swipe: any) => swipe.action === 'like')
//       .map((swipe: any) => swipe.swiped.toString())

//     const passedUsers = swipeHistory
//       .filter((swipe: any) => swipe.action === 'pass')
//       .map((swipe: any) => swipe.swiped.toString())

//     res.json({
//       users: mixedFeed,
//       count: mixedFeed.length,
//       swipeHistory: {
//         likedUsers,
//         passedUsers,
//       },
//       sources: {
//         new: newUsers.length,
//         popular: popularUsers.length,
//         online: onlineUsers.length,
//         compatible: highCompatibilityUsers.length,
//         recycled: recycledUsers.length,
//       },
//     })
//   } catch (error: any) {
//     console.error('❌ Recommendation error:', error)
//     res.status(500).json({
//       message: 'Failed to get recommendations',
//       error: error.message,
//     })
//   }
// })

// // 1. 🆕 New Users - Joined in last 7 days
// async function getNewUsers(
//   currentUser: any,
//   includeSwiped: boolean
// ): Promise<any[]> {
//   const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

//   let baseQuery: any = {
//     _id: { $ne: currentUser._id },
//     verified: true,
//     createdAt: { $gte: oneWeekAgo },
//     ...getBasePreferences(currentUser),
//   }

//   // Only exclude swiped users if includeSwiped is false
//   if (!includeSwiped) {
//     const swipedUsers = await Swipe.find({
//       swiper: currentUser._id,
//     }).select('swiped')
//     const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//     baseQuery._id.$nin = swipedUserIds
//   }

//   const newUsers = await User.find(baseQuery)
//     .select('-password -otp -resetPasswordOTP -__v -preferences')
//     .limit(15)
//     .lean()

//   return newUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'new', label: '🆕 New in area', color: 'green' },
//   }))
// }

// // 2. 🔥 Popular Users - Most liked users
// async function getPopularUsers(
//   currentUser: any,
//   includeSwiped: boolean
// ): Promise<any[]> {
//   const popularUserIds = await Swipe.aggregate([
//     {
//       $match: {
//         action: 'like',
//         swiped: { $ne: currentUser._id },
//       },
//     },
//     {
//       $group: {
//         _id: '$swiped',
//         likeCount: { $sum: 1 },
//       },
//     },
//     {
//       $match: {
//         likeCount: { $gte: 3 },
//       },
//     },
//     { $sort: { likeCount: -1 } },
//     { $limit: 15 },
//   ])

//   if (popularUserIds.length === 0) return []

//   let baseQuery: any = {
//     _id: { $in: popularUserIds.map((p: any) => p._id) },
//     verified: true,
//     ...getBasePreferences(currentUser),
//   }

//   // Only exclude swiped users if includeSwiped is false
//   if (!includeSwiped) {
//     const swipedUsers = await Swipe.find({
//       swiper: currentUser._id,
//     }).select('swiped')
//     const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//     baseQuery._id.$nin = [...(baseQuery._id.$nin || []), ...swipedUserIds]
//   }

//   const popularUsers = await User.find(baseQuery)
//     .select('-password -otp -resetPasswordOTP -__v -preferences')
//     .lean()

//   return popularUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'popular', label: '🔥 Popular', color: 'orange' },
//   }))
// }

// // 3. ⚡ Online Recently - Active in last 24 hours
// async function getOnlineUsers(
//   currentUser: any,
//   includeSwiped: boolean
// ): Promise<any[]> {
//   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

//   let baseQuery: any = {
//     _id: { $ne: currentUser._id },
//     verified: true,
//     lastActive: { $gte: oneDayAgo },
//     ...getBasePreferences(currentUser),
//   }

//   // Only exclude swiped users if includeSwiped is false
//   if (!includeSwiped) {
//     const swipedUsers = await Swipe.find({
//       swiper: currentUser._id,
//     }).select('swiped')
//     const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//     baseQuery._id.$nin = swipedUserIds
//   }

//   const onlineUsers = await User.find(baseQuery)
//     .select('-password -otp -resetPasswordOTP -__v -preferences')
//     .limit(15)
//     .lean()

//   return onlineUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'online', label: '⚡ Online recently', color: 'blue' },
//   }))
// }

// // 4. 🎯 High Compatibility - Your existing algorithm enhanced
// async function getHighCompatibilityUsers(
//   currentUser: any,
//   latitude: string,
//   longitude: string,
//   maxDistanceParam: string,
//   includeSwiped: boolean
// ): Promise<any[]> {
//   let baseQuery: any = {
//     _id: { $ne: currentUser._id },
//     verified: true,
//     ...getBasePreferences(currentUser),
//   }

//   // Only exclude swiped users if includeSwiped is false
//   if (!includeSwiped) {
//     const swipedUsers = await Swipe.find({
//       swiper: currentUser._id,
//     }).select('swiped')
//     const swipedUserIds = swipedUsers.map((swipe: any) => swipe.swiped)
//     baseQuery._id.$nin = swipedUserIds
//   }

//   let users: any[] = []

//   if (latitude && longitude) {
//     const userLat = parseFloat(latitude)
//     const userLng = parseFloat(longitude)
//     const distance = maxDistanceParam
//       ? parseInt(maxDistanceParam)
//       : currentUser.preferences?.maxDistance || 50

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
//       {
//         $project: {
//           password: 0,
//           otp: 0,
//           resetPasswordOTP: 0,
//           __v: 0,
//           preferences: 0,
//         },
//       },
//     ])
//   } else {
//     users = await User.find(baseQuery)
//       .select('-password -otp -resetPasswordOTP -__v -preferences')
//       .limit(30)
//       .lean()
//   }

//   // Calculate match scores and filter for high compatibility
//   const scoredUsers = users.map((user: any) => ({
//     ...user,
//     matchScore: calculateMatchScore(currentUser, user),
//   }))

//   const highCompatibilityUsers = scoredUsers
//     .filter((user: any) => user.matchScore > 120)
//     .sort((a: any, b: any) => b.matchScore - a.matchScore)
//     .slice(0, 10)

//   return highCompatibilityUsers.map((user: any) => ({
//     ...user,
//     badge: { type: 'compatible', label: '🎯 High match', color: 'purple' },
//   }))
// }

// // 5. 🔁 Recycled Users - Passed more than 7 days ago
// async function getRecycledUsers(currentUser: any): Promise<any[]> {
//   const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

//   const passedSwipes = await Swipe.find({
//     swiper: currentUser._id,
//     action: 'pass',
//     createdAt: { $lte: oneWeekAgo },
//   }).populate('swiped')

//   if (passedSwipes.length === 0) return []

//   const recycledUsers: any[] = []

//   for (const swipe of passedSwipes) {
//     if (swipe.swiped && recycledUsers.length < 10) {
//       const userData = swipe.swiped.toObject
//         ? swipe.swiped.toObject()
//         : swipe.swiped
//       recycledUsers.push({
//         ...userData,
//         badge: {
//           type: 'recycled',
//           label: '🔁 You passed before',
//           color: 'gray',
//         },
//       })
//     }
//   }

//   return recycledUsers
// }

// // Helper function to get base preferences
// function getBasePreferences(currentUser: any) {
//   const preferredGenders = currentUser.preferences?.genders?.map(
//     (g: string) => {
//       if (g === 'male') return 'Male'
//       if (g === 'female') return 'Female'
//       return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
//     }
//   ) || ['Male', 'Female', 'Other']

//   const minAge = currentUser.preferences?.ageRange?.[0] || 18
//   const maxAge = currentUser.preferences?.ageRange?.[1] || 99

//   return {
//     gender: { $in: preferredGenders },
//     age: { $gte: minAge, $lte: maxAge },
//   }
// }

// // Mix all feed sources with balanced distribution
// function mixFeedSources(
//   newUsers: any[],
//   popularUsers: any[],
//   onlineUsers: any[],
//   highCompatibilityUsers: any[],
//   recycledUsers: any[]
// ): any[] {
//   const mixedFeed: any[] = []
//   const maxPerSource = 5

//   // Add users from each source
//   for (let i = 0; i < maxPerSource; i++) {
//     if (i < newUsers.length) mixedFeed.push(newUsers[i])
//     if (i < popularUsers.length) mixedFeed.push(popularUsers[i])
//     if (i < onlineUsers.length) mixedFeed.push(onlineUsers[i])
//     if (i < highCompatibilityUsers.length)
//       mixedFeed.push(highCompatibilityUsers[i])
//     if (i < recycledUsers.length) mixedFeed.push(recycledUsers[i])
//   }

//   // Remove duplicates
//   const uniqueUsers: any[] = []
//   const seenIds = new Set<string>()

//   for (const user of mixedFeed) {
//     const userId = user._id.toString()
//     if (!seenIds.has(userId)) {
//       seenIds.add(userId)
//       uniqueUsers.push(user)
//     }
//   }

//   // Shuffle for variety
//   return shuffleArray(uniqueUsers).slice(0, 25)
// }

// // Match score function
// function calculateMatchScore(user1: any, user2: any): number {
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
//     score += commonInterests.length * 20
//   }

//   // Location score
//   if (user2.distance) {
//     score += Math.max(0, 100 - user2.distance)
//   }

//   // Profile completeness bonus
//   if (user2.bio && user2.bio.length > 20) score += 15
//   if (user2.photos && user2.photos.length > 0) score += user2.photos.length * 8
//   if (user2.interests && user2.interests.length > 2) score += 10

//   return Math.min(score, 250)
// }

// // Fixed shuffle function
// function shuffleArray(array: any[]): any[] {
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
