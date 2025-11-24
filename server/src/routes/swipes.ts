// const express = require('express')
// const router = express.Router()
// const Swipe = require('../models/Swipe')
// const Match = require('../models/Match')
// const User = require('../models/User')
// const auth = require('../middleware/auth')

// interface SwipeRequest {
//   swipedUserId: string
//   action: 'like' | 'pass'
// }

// // POST /api/swipes - Create a swipe (like/pass)
// router.post('/', auth, async (req: any, res: any) => {
//   try {
//     const { swipedUserId, action }: SwipeRequest = req.body

//     // FIX: Use req.user.id instead of req.user._id
//     const swiperId = req.user.id

//     console.log(`🔄 Processing ${action} from ${swiperId} to ${swipedUserId}`)

//     // Validate input
//     if (!swipedUserId || !['like', 'pass'].includes(action)) {
//       return res.status(400).json({ message: 'Invalid swipe data' })
//     }

//     // Check if user exists
//     const swipedUser = await User.findById(swipedUserId)
//     if (!swipedUser) {
//       return res.status(404).json({ message: 'User not found' })
//     }

//     // Check if already swiped
//     const existingSwipe = await Swipe.findOne({
//       swiper: swiperId,
//       swiped: swipedUserId,
//     })

//     if (existingSwipe) {
//       return res.status(400).json({ message: 'Already swiped on this user' })
//     }

//     // Create swipe
//     const swipe = new Swipe({
//       swiper: swiperId, // This should now work with the correct ID
//       swiped: swipedUserId,
//       action: action,
//     })

//     await swipe.save()

//     let isMatch = false
//     let matchedUser = null

//     // Check for mutual like (match)
//     if (action === 'like') {
//       const mutualSwipe = await Swipe.findOne({
//         swiper: swipedUserId,
//         swiped: swiperId,
//         action: 'like',
//       })

//       if (mutualSwipe) {
//         // It's a match!
//         isMatch = true

//         // Check if match already exists
//         const existingMatch = await Match.findOne({
//           users: { $all: [swiperId, swipedUserId] },
//         })

//         if (!existingMatch) {
//           // Create match only if it doesn't exist
//           const match = new Match({
//             users: [swiperId, swipedUserId],
//             initiatedBy: swiperId,
//           })

//           await match.save()
//           console.log(
//             `🎉 Match created between ${swiperId} and ${swipedUserId}`
//           )
//         } else {
//           console.log(
//             `ℹ️ Match already exists between ${swiperId} and ${swipedUserId}`
//           )
//         }

//         // Get matched user details
//         matchedUser = await User.findById(swipedUserId).select(
//           'name age photos bio gender location'
//         )
//       }
//     }

//     res.json({
//       message: `Swipe recorded: ${action}`,
//       isMatch,
//       matchedUser: isMatch ? matchedUser : null,
//     })
//   } catch (error: any) {
//     console.error('❌ Swipe error:', error)
//     res.status(500).json({
//       message: 'Failed to process swipe',
//       error: error.message,
//     })
//   }
// })

// // GET /api/swipes/matches - Get user's matches
// router.get('/matches', auth, async (req: any, res: any) => {
//   try {
//     // FIX: Use req.user.id here too
//     const userId = req.user.id

//     const matches = await Match.find({
//       users: userId,
//       active: true,
//     })
//       .populate('users', 'name age photos bio gender location')
//       .sort({ createdAt: -1 })

//     // Filter out the current user from matches
//     const formattedMatches = matches.map((match: any) => ({
//       _id: match._id,
//       user: match.users.find(
//         (user: any) => user._id.toString() !== userId.toString()
//       ),
//       createdAt: match.createdAt,
//     }))

//     res.json({
//       matches: formattedMatches,
//       count: formattedMatches.length,
//     })
//   } catch (error: any) {
//     console.error('❌ Get matches error:', error)
//     res.status(500).json({
//       message: 'Failed to get matches',
//       error: error.message,
//     })
//   }
// })

// module.exports = router

const express = require('express')
const router = express.Router()
const Swipe = require('../models/Swipe')
const Match = require('../models/Match')
const User = require('../models/User')
const auth = require('../middleware/auth')

interface SwipeRequest {
  swipedUserId: string
  action: 'like' | 'pass'
}

// POST /api/swipes - Create or update a swipe (like/pass)
// router.post('/', auth, async (req: any, res: any) => {
//   try {
//     const { swipedUserId, action }: SwipeRequest = req.body
//     const swiperId = req.user.id

//     console.log(`🔄 Processing ${action} from ${swiperId} to ${swipedUserId}`)

//     // Validate input
//     if (!swipedUserId || !['like', 'pass'].includes(action)) {
//       return res.status(400).json({ message: 'Invalid swipe data' })
//     }

//     // Check if user exists
//     const swipedUser = await User.findById(swipedUserId)
//     if (!swipedUser) {
//       return res.status(404).json({ message: 'User not found' })
//     }

//     // Check if already swiped - allow updating passes to likes
//     const existingSwipe = await Swipe.findOne({
//       swiper: swiperId,
//       swiped: swipedUserId,
//     })

//     let isMatch = false
//     let matchedUser = null
//     let swipe = existingSwipe

//     if (existingSwipe) {
//       // If already swiped, only allow updating from 'pass' to 'like'
//       if (existingSwipe.action === 'pass' && action === 'like') {
//         console.log(`🔄 Updating swipe from pass to like`)

//         // Update the swipe action
//         existingSwipe.action = 'like'
//         existingSwipe.updatedAt = new Date()
//         await existingSwipe.save()

//         swipe = existingSwipe

//         // Now check for mutual like since we updated to like
//         const mutualSwipe = await Swipe.findOne({
//           swiper: swipedUserId,
//           swiped: swiperId,
//           action: 'like',
//         })

//         if (mutualSwipe) {
//           isMatch = true

//           // Check if match already exists
//           const existingMatch = await Match.findOne({
//             users: { $all: [swiperId, swipedUserId] },
//           })

//           if (!existingMatch) {
//             const match = new Match({
//               users: [swiperId, swipedUserId],
//               initiatedBy: swiperId,
//             })
//             await match.save()
//             console.log(
//               `🎉 Match created between ${swiperId} and ${swipedUserId}`
//             )
//           }

//           // Get matched user details
//           matchedUser = await User.findById(swipedUserId).select(
//             'name age photos bio gender location'
//           )
//         }
//       } else if (existingSwipe.action === action) {
//         return res
//           .status(400)
//           .json({ message: 'Already swiped on this user with same action' })
//       } else if (existingSwipe.action === 'like' && action === 'pass') {
//         return res.status(400).json({ message: 'Cannot change like to pass' })
//       }
//     } else {
//       // Create new swipe
//       swipe = new Swipe({
//         swiper: swiperId,
//         swiped: swipedUserId,
//         action: action,
//       })
//       await swipe.save()

//       // Check for mutual like (only for new likes, not for passes)
//       if (action === 'like') {
//         const mutualSwipe = await Swipe.findOne({
//           swiper: swipedUserId,
//           swiped: swiperId,
//           action: 'like',
//         })

//         if (mutualSwipe) {
//           isMatch = true

//           const existingMatch = await Match.findOne({
//             users: { $all: [swiperId, swipedUserId] },
//           })

//           if (!existingMatch) {
//             const match = new Match({
//               users: [swiperId, swipedUserId],
//               initiatedBy: swiperId,
//             })
//             await match.save()
//             console.log(
//               `🎉 Match created between ${swiperId} and ${swipedUserId}`
//             )
//           }

//           matchedUser = await User.findById(swipedUserId).select(
//             'name age photos bio gender location'
//           )
//         }
//       }
//     }

//     res.json({
//       message: `Swipe recorded: ${action}`,
//       swipe: swipe,
//       isMatch,
//       matchedUser: isMatch ? matchedUser : null,
//       wasUpdated:
//         !!existingSwipe && existingSwipe.action === 'pass' && action === 'like',
//     })
//   } catch (error: any) {
//     console.error('❌ Swipe error:', error)
//     res.status(500).json({
//       message: 'Failed to process swipe',
//       error: error.message,
//     })
//   }
// })
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

    if (existingSwipe) {
      // If already swiped, only allow updating from 'pass' to 'like'
      if (existingSwipe.action === 'pass' && action === 'like') {
        // Update the swipe action
        existingSwipe.action = 'like'
        existingSwipe.updatedAt = new Date()
        await existingSwipe.save()

        swipe = existingSwipe
        wasUpdated = true

        // Check for mutual like
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
          }

          // Get matched user details
          matchedUser = await User.findById(swipedUserId).select(
            'name age photos bio gender location'
          )
        }
      } else if (existingSwipe.action === action) {
        return res.status(400).json({ message: 'Already swiped on this user' })
      } else if (existingSwipe.action === 'like' && action === 'pass') {
        return res.status(400).json({ message: 'Cannot change like to pass' })
      }
    } else {
      // Create new swipe
      swipe = new Swipe({
        swiper: swiperId,
        swiped: swipedUserId,
        action: action,
      })
      await swipe.save()

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
    })
  } catch (error: any) {
    console.error('Swipe error:', error)
    res.status(500).json({
      message: 'Failed to process swipe',
      error: error.message,
    })
  }
})

// GET /api/swipes/matches - Get user's matches
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

module.exports = router
