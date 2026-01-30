const express = require('express')
const router = express.Router()
import User from '../models/User'
import Swipe from '../models/Swipe'
const auth = require('../middleware/auth')

router.get('/recommendations', auth, async (req: any, res: any) => {
  try {
    const { latitude, longitude, maxDistance } = req.query
    const currentUserId = req.user.id

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
    if (
      swipe.swiped &&
      typeof swipe.swiped === 'object' &&
      recycledUsers.length < 10
    ) {
      const swipedUser = swipe.swiped as any

      if (swipedUser.toObject) {
        const userData = swipedUser.toObject()
        recycledUsers.push({
          ...userData,
          badge: {
            type: 'recycled',
            label: '🔁 You passed before',
            color: 'gray',
          },
        })
      } else {
        recycledUsers.push({
          ...swipedUser,
          badge: {
            type: 'recycled',
            label: '🔁 You passed before',
            color: 'gray',
          },
        })
      }
    }
  }

  return recycledUsers
}
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
function mixFeedSources(
  newUsers: any[],
  popularUsers: any[],
  onlineUsers: any[],
  highCompatibilityUsers: any[],
  recycledUsers: any[]
): any[] {
  const mixedFeed: any[] = []
  const maxPerSource = 5

  for (let i = 0; i < maxPerSource; i++) {
    if (i < newUsers.length) mixedFeed.push(newUsers[i])
    if (i < popularUsers.length) mixedFeed.push(popularUsers[i])
    if (i < onlineUsers.length) mixedFeed.push(onlineUsers[i])
    if (i < highCompatibilityUsers.length)
      mixedFeed.push(highCompatibilityUsers[i])
    if (i < recycledUsers.length) mixedFeed.push(recycledUsers[i])
  }
  const uniqueUsers: any[] = []
  const seenIds = new Set<string>()

  for (const user of mixedFeed) {
    const userId = user._id.toString()
    if (!seenIds.has(userId)) {
      seenIds.add(userId)
      uniqueUsers.push(user)
    }
  }
  return shuffleArray(uniqueUsers).slice(0, 25)
}
function calculateMatchScore(user1: any, user2: any): number {
  let score = 0
  const user1Age = user1.age || 25
  const user2Age = user2.age || 25
  const ageDiff = Math.abs(user1Age - user2Age)
  score += Math.max(0, 100 - ageDiff * 2)
  if (user1.interests && user2.interests) {
    const commonInterests = user1.interests.filter((interest: string) =>
      user2.interests.includes(interest)
    )
    score += commonInterests.length * 20
  }
  if (user2.distance) {
    score += Math.max(0, 100 - user2.distance)
  }
  if (user2.bio && user2.bio.length > 20) score += 15
  if (user2.photos && user2.photos.length > 0) score += user2.photos.length * 8
  if (user2.interests && user2.interests.length > 2) score += 10

  return Math.min(score, 250)
}
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
