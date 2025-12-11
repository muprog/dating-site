const express = require('express')
const router = express.Router()
const Swipe = require('../models/Swipe')
const Match = require('../models/Match')
const User = require('../models/User')
const auth = require('../middleware/auth')

router.post('/', auth, async (req: any, res: any) => {
  try {
    const { swipedUserId, action } = req.body
    const swiperId = req.user.id

    // Validate input
    if (!swipedUserId || !['like', 'pass'].includes(action)) {
      return res.status(400).json({ message: 'Invalid swipe data' })
    }

    // Check if user exists
    const swipedUser = await User.findById(swipedUserId)
    if (!swipedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if already swiped
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
      // 🆕 ALLOW BOTH DIRECTIONS: pass→like AND like→pass
      if (existingSwipe.action !== action) {
        previousAction = existingSwipe.action

        // Update the swipe action
        existingSwipe.action = action
        existingSwipe.updatedAt = new Date()
        await existingSwipe.save()

        swipe = existingSwipe
        wasUpdated = true

        console.log(`🔄 Swipe updated from ${previousAction} to ${action}`)

        // 🆕 Handle match logic for both directions
        if (action === 'like') {
          // Check for mutual like when updating to like
          const mutualSwipe = await Swipe.findOne({
            swiper: swipedUserId,
            swiped: swiperId,
            action: 'like',
          })

          if (mutualSwipe) {
            isMatch = true

            // Check if match already exists
            const existingMatch = await Match.findOne({
              users: { $all: [swiperId, swipedUserId] },
            })

            if (!existingMatch) {
              const match = new Match({
                users: [swiperId, swipedUserId],
                initiatedBy: swiperId,
              })
              await match.save()
              console.log(
                `🎉 Match created between ${swiperId} and ${swipedUserId}`
              )
            }

            // Get matched user details
            matchedUser = await User.findById(swipedUserId).select(
              'name age photos bio gender location'
            )
          }
        } else if (action === 'pass' && previousAction === 'like') {
          // 🆕 If changing from like to pass, remove any existing match
          const existingMatch = await Match.findOne({
            users: { $all: [swiperId, swipedUserId] },
          })

          if (existingMatch) {
            await Match.findByIdAndDelete(existingMatch._id)
            console.log(
              `🗑️ Match removed between ${swiperId} and ${swipedUserId}`
            )
          }
        }
      } else {
        // Same action - no change needed
        return res
          .status(400)
          .json({ message: 'Already swiped on this user with same action' })
      }
    } else {
      // Create new swipe
      swipe = new Swipe({
        swiper: swiperId,
        swiped: swipedUserId,
        action: action,
      })
      await swipe.save()

      console.log(`📝 New ${action} swipe created`)

      // Check for mutual like (only for new likes)
      if (action === 'like') {
        const mutualSwipe = await Swipe.findOne({
          swiper: swipedUserId,
          swiped: swiperId,
          action: 'like',
        })

        if (mutualSwipe) {
          isMatch = true

          const existingMatch = await Match.findOne({
            users: { $all: [swiperId, swipedUserId] },
          })

          if (!existingMatch) {
            const match = new Match({
              users: [swiperId, swipedUserId],
              initiatedBy: swiperId,
            })
            await match.save()
            console.log(
              `🎉 Match created between ${swiperId} and ${swipedUserId}`
            )
          }

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
      previousAction: wasUpdated ? previousAction : null, // 🆕 Return previous action if updated
    })
  } catch (error: any) {
    console.error('Swipe error:', error)
    res.status(500).json({
      message: 'Failed to process swipe',
      error: error.message,
    })
  }
})

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

// GET /api/swipes/my-swipes - Get user's swipe history
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

// GET /api/swipes/my-swipe-history - Get user's swipe history for discovery
router.get('/my-swipe-history', auth, async (req: any, res: any) => {
  try {
    const userId = req.user.id

    const swipes = await Swipe.find({
      swiper: userId,
    }).select('swiped action')

    // Separate liked and passed users
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
