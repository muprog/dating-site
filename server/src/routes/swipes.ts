import express = require('express')
const router = express.Router()
import Swipe from '../models/Swipe'
import Match from '../models/Match'
import User from '../models/User'
const auth = require('../middleware/auth')
import mongoose from 'mongoose'

router.post('/', auth, async (req: any, res: any) => {
  try {
    const { swipedUserId, action } = req.body
    const swiperId = req.user.id

    if (!swipedUserId || !['like', 'pass'].includes(action)) {
      return res.status(400).json({ message: 'Invalid swipe data' })
    }

    const swipedUser = await User.findById(swipedUserId)
    if (!swipedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (swiperId.toString() === swipedUserId.toString()) {
      return res.status(400).json({ message: 'Cannot swipe on yourself' })
    }
    const existingSwipe = await Swipe.findOne({
      swiper: swiperId,
      swiped: swipedUserId,
    })

    let isMatch = false
    let matchedUser = null
    let swipe = existingSwipe
    let wasUpdated = false
    let previousAction = null

    if (existingSwipe) {
      if (existingSwipe.action !== action) {
        previousAction = existingSwipe.action
        existingSwipe.action = action
        existingSwipe.updatedAt = new Date()
        await existingSwipe.save()
        wasUpdated = true
        swipe = existingSwipe
        if (action === 'like') {
          const mutualSwipe = await Swipe.findOne({
            swiper: swipedUserId,
            swiped: swiperId,
            action: 'like',
          })

          if (mutualSwipe) {
            isMatch = true
            await createMatch(swiperId, swipedUserId)
            matchedUser = await User.findById(swipedUserId).select(
              'name age photos bio gender location'
            )
          }
        } else if (action === 'pass' && previousAction === 'like') {
          await Match.findOneAndDelete({
            users: { $all: [swiperId, swipedUserId] },
          })
        }
      } else {
        return res.status(400).json({
          message: 'Already swiped on this user with same action',
        })
      }
    } else {
      swipe = new Swipe({
        swiper: swiperId,
        swiped: swipedUserId,
        action: action,
      })
      await swipe.save()

      if (action === 'like') {
        const mutualSwipe = await Swipe.findOne({
          swiper: swipedUserId,
          swiped: swiperId,
          action: 'like',
        })

        if (mutualSwipe) {
          isMatch = true
          await createMatch(swiperId, swipedUserId)
          matchedUser = await User.findById(swipedUserId).select(
            'name age photos bio gender location'
          )
        }
      }
    }

    res.json({
      message: `Swipe recorded: ${action}`,
      swipe: swipe,
      isMatch,
      matchedUser: isMatch ? matchedUser : null,
      wasUpdated,
      previousAction: wasUpdated ? previousAction : null,
    })
  } catch (error: any) {
    console.error('Swipe error:', error)
    res.status(500).json({
      message: 'Failed to process swipe',
      error: error.message,
    })
  }
})

async function createMatch(userId1: any, userId2: any) {
  try {
    console.log(`\n🎯 Attempting to create match between:`)
    console.log(`   User 1: ${userId1}`)
    console.log(`   User 2: ${userId2}`)

    const user1Str = userId1.toString()
    const user2Str = userId2.toString()

    const sortedUserIds = [user1Str, user2Str].sort()

    console.log(
      `🔍 Checking for existing match with sorted users: ${sortedUserIds}`
    )

    const existingMatch = await Match.findOne({
      users: {
        $all: [
          new mongoose.Types.ObjectId(sortedUserIds[0]),
          new mongoose.Types.ObjectId(sortedUserIds[1]),
        ],
      },
    })

    if (existingMatch) {
      console.log(`✅ Match already exists! ID: ${existingMatch._id}`)
      console.log(
        `   Existing match users: ${existingMatch.users.map((u: any) =>
          u.toString()
        )}`
      )
      return existingMatch
    }

    console.log(`📝 No existing match found. Creating new match...`)

    const match = new Match({
      users: [
        new mongoose.Types.ObjectId(sortedUserIds[0]),
        new mongoose.Types.ObjectId(sortedUserIds[1]),
      ],
      initiatedBy: new mongoose.Types.ObjectId(user1Str),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await match.save()

    console.log(`🎉 SUCCESS! New match created:`)
    console.log(`   Match ID: ${match._id}`)
    console.log(`   Users: ${match.users.map((u: any) => u.toString())}`)
    console.log(`   Initiated by: ${match.initiatedBy}`)

    return match
  } catch (error: any) {
    console.error(`\n💥 ERROR in createMatch function:`)
    console.error(`   Error message: ${error.message}`)
    console.error(`   Error code: ${error.code}`)
    console.error(`   Error name: ${error.name}`)

    if (error.code === 11000) {
      console.error(
        `   🚨 DUPLICATE KEY ERROR! The unique index is still active!`
      )
      console.error(`   Key pattern: ${JSON.stringify(error.keyPattern)}`)
      console.error(`   Key value: ${JSON.stringify(error.keyValue)}`)

      console.log(`🔄 Searching for existing match again...`)
      const user1Str = userId1.toString()
      const user2Str = userId2.toString()
      const sortedUserIds = [user1Str, user2Str].sort()

      const existing = await Match.findOne({
        users: {
          $all: [
            new mongoose.Types.ObjectId(sortedUserIds[0]),
            new mongoose.Types.ObjectId(sortedUserIds[1]),
          ],
        },
      })

      if (existing) {
        console.log(`✅ Found match after error: ${existing._id}`)
        return existing
      }
    }

    throw error
  }
}

router.get('/matches', auth, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const matches = await Match.find({
      users: userId,
      active: true,
    })
      .populate('users', 'name age photos bio gender location')
      .sort({ createdAt: -1 })

    const formattedMatches = matches.map((match: any) => ({
      _id: match._id,
      user: match.users.find(
        (user: any) => user._id.toString() !== userId.toString()
      ),
      createdAt: match.createdAt,
    }))

    res.json({
      matches: formattedMatches,
      count: formattedMatches.length,
    })
  } catch (error: any) {
    console.error('❌ Get matches error:', error)
    res.status(500).json({
      message: 'Failed to get matches',
      error: error.message,
    })
  }
})
router.get('/my-swipes', auth, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const swipes = await Swipe.find({
      swiper: userId,
    })
      .select('swiped action createdAt')
      .populate('swiped', 'name age photos')
      .sort({ createdAt: -1 })

    res.json({
      swipes: swipes,
    })
  } catch (error: any) {
    console.error('❌ Get swipes error:', error)
    res.status(500).json({
      message: 'Failed to get swipes',
      error: error.message,
    })
  }
})
router.get('/my-swipe-history', auth, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const swipes = await Swipe.find({
      swiper: userId,
    }).select('swiped action')

    const likedUsers = swipes
      .filter((swipe: any) => swipe.action === 'like')
      .map((swipe: any) => swipe.swiped.toString())
    const passedUsers = swipes
      .filter((swipe: any) => swipe.action === 'pass')
      .map((swipe: any) => swipe.swiped.toString())

    res.json({
      likedUsers,
      passedUsers,
      totalSwipes: swipes.length,
    })
  } catch (error: any) {
    console.error('❌ Get swipe history error:', error)
    res.status(500).json({
      message: 'Failed to get swipe history',
      error: error.message,
    })
  }
})

module.exports = router
