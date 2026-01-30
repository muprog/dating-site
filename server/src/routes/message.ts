// import express = require('express')
// const router = express.Router()
// const authMiddleware = require('../middleware/auth')
// import Match from '../models/Match'
// import Message from '../models/Message'

// router.use(authMiddleware)

// router.get('/matches', authMiddleware, async (req: any, res: any) => {
//   try {
//     console.log('🔍 Fetching matches for user:', req.user?.id)

//     // ADD NULL CHECK
//     if (!req.user || !req.user.id) {
//       console.error('❌ No user ID in request')
//       return res.status(401).json({
//         success: false,
//         message: 'User not authenticated',
//         matches: [],
//       })
//     }

//     const userId = req.user.id.toString()
//     console.log('🔍 Looking for matches with userId:', userId)

//     // Query matches where user is in the users array
//     const matches = await Match.find({
//       users: userId,
//       active: true,
//     })
//       .populate('users', 'name photos age location')
//       .sort({ updatedAt: -1 })
//       .lean()

//     console.log(`✅ Found ${matches.length} matches for user ${userId}`)

//     // Transform the data
//     const transformedMatches = matches
//       .map((match: any) => {
//         try {
//           // Find the current user and other user in the match
//           const currentUser = match.users.find(
//             (user: any) => user && user._id && user._id.toString() === userId
//           )

//           const otherUser = match.users.find(
//             (user: any) => user && user._id && user._id.toString() !== userId
//           )

//           if (!otherUser) {
//             console.warn(
//               `⚠️ Match ${match._id} has no other user for ${userId}`
//             )
//             return null
//           }

//           // Get unread count
//           let unreadCount = 0
//           if (match.unreadCounts) {
//             if (typeof match.unreadCounts.get === 'function') {
//               // It's a Map
//               unreadCount = match.unreadCounts.get(userId) || 0
//             } else {
//               // It's a plain object
//               unreadCount = match.unreadCounts[userId] || 0
//             }
//           }

//           return {
//             _id: match._id.toString(),
//             matchId: match._id.toString(),
//             users: match.users.map((user: any) => ({
//               _id: user._id.toString(),
//               name: user.name,
//               photos: user.photos || [],
//               age: user.age,
//               location: user.location,
//             })),
//             otherUser: {
//               _id: otherUser._id.toString(),
//               id: otherUser._id.toString(),
//               name: otherUser.name || 'Unknown',
//               photos: otherUser.photos || [],
//               age: otherUser.age,
//               location: otherUser.location || '',
//             },
//             initiatedBy: match.initiatedBy?.toString() || '',
//             lastMessage: match.lastMessage || null,
//             lastMessageAt: match.lastMessageAt
//               ? match.lastMessageAt.toISOString()
//               : null,
//             unreadCount: unreadCount,
//             createdAt: match.createdAt.toISOString(),
//             updatedAt: match.updatedAt.toISOString(),
//           }
//         } catch (error) {
//           console.error(`❌ Error transforming match ${match._id}:`, error)
//           return null
//         }
//       })
//       .filter((match: any) => match !== null)

//     console.log(`📊 Transformed to ${transformedMatches.length} valid matches`)

//     res.json({
//       success: true,
//       matches: transformedMatches,
//       count: transformedMatches.length,
//     })
//   } catch (error: any) {
//     console.error('❌ Error fetching matches:', error)
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch matches',
//       error: error.message,
//       matches: [],
//     })
//   }
// })

// router.get('/:matchId', async (req: any, res: any) => {
//   try {
//     const { matchId } = req.params
//     const userId = req.user.id || req.user._id

//     console.log(`📩 Fetching messages for match: ${matchId}, user: ${userId}`)

//     // Verify user is in this match
//     const match = await Match.findOne({
//       _id: matchId,
//       users: userId,
//       active: true,
//     }).populate('users', 'name photos age location') // Populate user details

//     if (!match) {
//       console.log(`❌ User ${userId} not authorized for match ${matchId}`)
//       return res.status(403).json({
//         success: false,
//         error: 'Access denied',
//         messages: [],
//       })
//     }

//     // Get messages
//     const messages = await Message.find({ matchId })
//       .sort({ createdAt: 1 })
//       .populate('senderId', 'name photos age')
//       .lean()

//     console.log(`✅ Found ${messages.length} messages for match ${matchId}`)

//     // Get the other user from the match
//     const otherUser = match.users.find(
//       (user: any) => user._id.toString() !== userId.toString()
//     )

//     const currentUser = match.users.find(
//       (user: any) => user._id.toString() === userId.toString()
//     )

//     // Transform messages to match frontend format
//     const transformedMessages = messages.map((msg: any) => {
//       const isCurrentUser = msg.senderId._id.toString() === userId.toString()

//       let senderName = 'Unknown'
//       if (isCurrentUser) {
//         senderName = currentUser?.name || 'You'
//       } else {
//         senderName = otherUser?.name || 'User'
//       }

//       return {
//         _id: msg._id.toString(),
//         matchId: msg.matchId.toString(),
//         sender: msg.senderId._id.toString(), // string ID for isCurrentUser check
//         senderId: {
//           _id: msg.senderId._id.toString(),
//           name: senderName, // Use determined sender name
//           photos: msg.senderId.photos || [],
//           age: msg.senderId.age,
//         },
//         content: msg.content,
//         createdAt: msg.createdAt.toISOString(),
//         updatedAt: msg.updatedAt.toISOString(),
//         isRead: msg.isRead || false,
//         read: msg.isRead, // For compatibility
//       }
//     })

//     console.log('📊 Message transformation complete')
//     console.log('Sample transformed message:', transformedMessages[0])

//     // Mark messages as read (where user is receiver)
//     const unreadMessages = await Message.updateMany(
//       {
//         matchId,
//         senderId: { $ne: userId },
//         isRead: false,
//       },
//       {
//         $set: {
//           isRead: true,
//           readAt: new Date(),
//         },
//       }
//     )

//     if (unreadMessages.modifiedCount > 0) {
//       console.log(`✅ Marked ${unreadMessages.modifiedCount} messages as read`)
//     }

//     // Reset unread count for this user in match
//     if (match.unreadCounts) {
//       if (typeof match.unreadCounts.get === 'function') {
//         // It's a Map
//         match.unreadCounts.set(userId.toString(), 0)
//       } else {
//         // It's a plain object
//         match.unreadCounts[userId.toString()] = 0
//       }
//       await match.save()
//     }

//     res.json({
//       success: true,
//       messages: transformedMessages,
//       match: {
//         _id: match._id.toString(),
//         users: match.users.map((user: any) => ({
//           _id: user._id.toString(),
//           name: user.name,
//           photos: user.photos || [],
//           age: user.age,
//           location: user.location,
//         })),
//         lastMessage: match.lastMessage,
//         lastMessageAt: match.lastMessageAt,
//         unreadCounts: match.unreadCounts,
//       },
//     })
//   } catch (error: any) {
//     console.error('❌ Error fetching messages:', error)
//     res.status(500).json({
//       success: false,
//       error: error.message || 'Server error',
//       messages: [],
//     })
//   }
// })

// router.post('/send', async (req: any, res: any) => {
//   try {
//     const { matchId, content } = req.body
//     const userId = req.user.id || req.user._id

//     console.log(`💬 Sending message to match ${matchId} from user ${userId}`)

//     if (!content || content.trim().length === 0) {
//       return res
//         .status(400)
//         .json({ success: false, error: 'Message cannot be empty' })
//     }

//     // Verify user is in this match and populate users
//     const match = await Match.findOne({
//       _id: matchId,
//       users: userId,
//       active: true,
//     }).populate('users', 'name photos age')

//     if (!match) {
//       return res.status(403).json({ success: false, error: 'Access denied' })
//     }

//     // Find the other user
//     const otherUser = match.users.find(
//       (user: any) => user._id.toString() !== userId.toString()
//     )

//     // Create message
//     const message = new Message({
//       matchId,
//       senderId: userId,
//       content: content.trim(),
//     })

//     await message.save()

//     // Populate sender info
//     const populatedMessage = await Message.findById(message._id)
//       .populate('senderId', 'name photos age')
//       .lean()

//     // Transform the message
//     const transformedMessage = {
//       _id: populatedMessage._id.toString(),
//       matchId: populatedMessage.matchId.toString(),
//       sender: populatedMessage.senderId._id.toString(),
//       senderId: {
//         _id: populatedMessage.senderId._id.toString(),
//         name: populatedMessage.senderId.name || 'Unknown',
//         photos: populatedMessage.senderId.photos || [],
//         age: populatedMessage.senderId.age,
//       },
//       content: populatedMessage.content,
//       createdAt: populatedMessage.createdAt.toISOString(),
//       updatedAt: populatedMessage.updatedAt.toISOString(),
//       isRead: populatedMessage.isRead || false,
//     }

//     // Update match with last message
//     match.lastMessage = content.trim()
//     match.lastMessageAt = new Date()

//     // Increment unread count for the other user
//     if (otherUser && match.unreadCounts) {
//       const otherUserId = otherUser._id.toString()
//       if (typeof match.unreadCounts.get === 'function') {
//         // It's a Map
//         const currentUnread = match.unreadCounts.get(otherUserId) || 0
//         match.unreadCounts.set(otherUserId, currentUnread + 1)
//       } else {
//         // It's a plain object
//         match.unreadCounts[otherUserId] =
//           (match.unreadCounts[otherUserId] || 0) + 1
//       }
//     }

//     await match.save()

//     // Get the io instance from app
//     const io = req.app.get('io')
//     if (io) {
//       // Broadcast to match room with transformed message
//       io.to(`match-${matchId}`).emit('new-message', transformedMessage)
//     }

//     res.json({
//       success: true,
//       message: transformedMessage,
//     })
//   } catch (error: any) {
//     console.error('❌ Error sending message:', error)
//     res.status(500).json({
//       success: false,
//       error: error.message || 'Server error',
//     })
//   }
// })
// // Mark messages as read
// router.post('/mark-read/:matchId', async (req: any, res: any) => {
//   try {
//     const { matchId } = req.params
//     const userId = req.user._id

//     // Update messages as read
//     await Message.updateMany(
//       {
//         matchId,
//         senderId: { $ne: userId },
//         isRead: false,
//       },
//       {
//         isRead: true,
//         readAt: new Date(),
//       }
//     )

//     // Reset unread count
//     await Match.findByIdAndUpdate(matchId, {
//       $set: { [`unreadCounts.${userId}`]: 0 },
//     })

//     res.json({ success: true })
//   } catch (error: any) {
//     console.error('Error marking messages as read:', error)
//     res.status(500).json({ success: false, error: 'Server error' })
//   }
// })

// router.put('/:messageId/edit', authMiddleware, async (req: any, res: any) => {
//   try {
//     const { messageId } = req.params
//     const { matchId, content } = req.body
//     const userId = req.user.id

//     console.log(`✏️ API: Editing message ${messageId} by user ${userId}`)

//     // Validate input
//     if (!content || !content.trim()) {
//       return res.status(400).json({
//         success: false,
//         error: 'Message content is required',
//       })
//     }

//     if (content.length > 1000) {
//       return res.status(400).json({
//         success: false,
//         error: 'Message is too long (max 1000 characters)',
//       })
//     }

//     if (!matchId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Match ID is required',
//       })
//     }

//     // Find the message
//     const message = await Message.findById(messageId)

//     if (!message) {
//       return res.status(404).json({
//         success: false,
//         error: 'Message not found',
//       })
//     }

//     // Check if user owns the message
//     if (message.senderId.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         error: 'You can only edit your own messages',
//       })
//     }

//     // Check if message belongs to the specified match
//     if (message.matchId.toString() !== matchId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Message does not belong to this match',
//       })
//     }

//     // Check if message is too old to edit (15 minutes limit)
//     const messageAge = Date.now() - message.createdAt.getTime()
//     const editTimeLimit = 15 * 60 * 1000 // 15 minutes in milliseconds

//     if (messageAge > editTimeLimit) {
//       return res.status(400).json({
//         success: false,
//         error: 'Message is too old to edit',
//       })
//     }

//     // Save old content for audit (optional)
//     const oldContent = message.content

//     // Update the message
//     message.content = content.trim()
//     message.updatedAt = Date.now()
//     message.isEdited = true

//     await message.save()

//     // Populate sender info
//     await message.populate('senderId', 'name photos age')

//     // Update match last message if this was the last message
//     const lastMessage = await Message.findOne({
//       matchId: matchId,
//     }).sort({ createdAt: -1 })

//     if (lastMessage && lastMessage._id.toString() === messageId) {
//       await Match.findByIdAndUpdate(matchId, {
//         lastMessage: content.trim(),
//         lastMessageAt: new Date(),
//       })
//     }

//     // Emit WebSocket event if using WebSocket
//     if (req.app.get('io')) {
//       const io = req.app.get('io')
//       io.to(`match-${matchId}`).emit('message-edited', {
//         messageId: message._id,
//         matchId,
//         content: message.content,
//         updatedAt: message.updatedAt,
//         isEdited: true,
//         sender: {
//           _id: message.senderId._id,
//           name: message.senderId.name,
//         },
//       })
//     }

//     res.json({
//       success: true,
//       message: {
//         _id: message._id,
//         matchId: message.matchId,
//         sender: message.senderId._id,
//         senderId: {
//           _id: message.senderId._id,
//           name: message.senderId.name,
//           photos: message.senderId.photos || [],
//           age: message.senderId.age,
//         },
//         content: message.content,
//         createdAt: message.createdAt,
//         updatedAt: message.updatedAt,
//         isRead: message.isRead,
//         isEdited: true,
//       },
//       updatedAt: message.updatedAt,
//     })

//     console.log(`✅ API: Message ${messageId} edited successfully`)
//   } catch (error) {
//     console.error('❌ API Error editing message:', error)
//     res.status(500).json({
//       success: false,
//       error: 'Server error while editing message',
//     })
//   }
// })

// // routes/messages.js - Add this endpoint
// router.get('/unread/total', authMiddleware, async (req: any, res: any) => {
//   try {
//     const userId = req.user.id
//     console.log(`🔔 Fetching total unread messages for user: ${userId}`)

//     // Get all matches for the user
//     const matches = await Match.find({
//       users: userId,
//       active: true,
//     })

//     // Calculate total unread messages across all matches
//     let totalUnread = 0
//     const matchesWithUnread = []

//     for (const match of matches) {
//       let unread = 0

//       if (match.unreadCounts) {
//         if (typeof match.unreadCounts.get === 'function') {
//           // It's a Map
//           unread = match.unreadCounts.get(userId) || 0
//         } else {
//           // It's a plain object
//           unread = match.unreadCounts[userId] || 0
//         }
//       }

//       if (unread > 0) {
//         totalUnread += unread
//         matchesWithUnread.push({
//           matchId: match._id,
//           unreadCount: unread,
//         })
//       }
//     }

//     console.log(
//       `✅ Total unread messages: ${totalUnread} across ${matchesWithUnread.length} matches`
//     )

//     res.json({
//       success: true,
//       totalUnread,
//       matchesWithUnread,
//       matchesWithUnreadCount: matchesWithUnread.length,
//     })
//   } catch (error: any) {
//     console.error('❌ Error fetching unread total:', error)
//     res.status(500).json({
//       success: false,
//       error: error.message || 'Server error',
//     })
//   }
// })

// module.exports = router

import express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
import Match from '../models/Match'
import Message from '../models/Message'

router.use(authMiddleware)

router.get('/matches', authMiddleware, async (req: any, res: any) => {
  try {
    console.log('🔍 Fetching matches for user:', req.user?.id)

    // ADD NULL CHECK
    if (!req.user || !req.user.id) {
      console.error('❌ No user ID in request')
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        matches: [],
      })
    }

    const userId = req.user.id.toString()
    console.log('🔍 Looking for matches with userId:', userId)

    // Query matches where user is in the users array
    const matches = await Match.find({
      users: userId,
      active: true,
    })
      .populate('users', 'name photos age location')
      .sort({ updatedAt: -1 })
      .lean()

    console.log(`✅ Found ${matches.length} matches for user ${userId}`)

    // Transform the data
    const transformedMatches = matches
      .map((match: any) => {
        try {
          // Find the current user and other user in the match
          const currentUser = match.users.find(
            (user: any) => user && user._id && user._id.toString() === userId
          )

          const otherUser = match.users.find(
            (user: any) => user && user._id && user._id.toString() !== userId
          )

          if (!otherUser) {
            console.warn(
              `⚠️ Match ${match._id} has no other user for ${userId}`
            )
            return null
          }

          // Get unread count
          let unreadCount = 0
          if (match.unreadCounts) {
            // Type assertion to handle Map or object
            const unreadCounts = match.unreadCounts as any
            if (typeof unreadCounts.get === 'function') {
              // It's a Map
              unreadCount = unreadCounts.get(userId) || 0
            } else {
              // It's a plain object
              unreadCount = unreadCounts[userId] || 0
            }
          }

          return {
            _id: match._id.toString(),
            matchId: match._id.toString(),
            users: match.users.map((user: any) => ({
              _id: user._id.toString(),
              name: user.name,
              photos: user.photos || [],
              age: user.age,
              location: user.location,
            })),
            otherUser: {
              _id: otherUser._id.toString(),
              id: otherUser._id.toString(),
              name: otherUser.name || 'Unknown',
              photos: otherUser.photos || [],
              age: otherUser.age,
              location: otherUser.location || '',
            },
            initiatedBy: match.initiatedBy?.toString() || '',
            lastMessage: match.lastMessage || null,
            lastMessageAt: match.lastMessageAt
              ? match.lastMessageAt.toISOString()
              : null,
            unreadCount: unreadCount,
            createdAt: match.createdAt.toISOString(),
            updatedAt: match.updatedAt.toISOString(),
          }
        } catch (error) {
          console.error(`❌ Error transforming match ${match._id}:`, error)
          return null
        }
      })
      .filter((match: any) => match !== null)

    console.log(`📊 Transformed to ${transformedMatches.length} valid matches`)

    res.json({
      success: true,
      matches: transformedMatches,
      count: transformedMatches.length,
    })
  } catch (error: any) {
    console.error('❌ Error fetching matches:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message,
      matches: [],
    })
  }
})

router.get('/:matchId', async (req: any, res: any) => {
  try {
    const { matchId } = req.params
    const userId = req.user.id || req.user._id

    console.log(`📩 Fetching messages for match: ${matchId}, user: ${userId}`)

    // Verify user is in this match
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      active: true,
    }).populate('users', 'name photos age location') // Populate user details

    if (!match) {
      console.log(`❌ User ${userId} not authorized for match ${matchId}`)
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        messages: [],
      })
    }

    // Get messages
    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name photos age')
      .lean()

    console.log(`✅ Found ${messages.length} messages for match ${matchId}`)

    // Get the other user from the match (with type assertion)
    const otherUser = match.users.find(
      (user: any) => user._id.toString() !== userId.toString()
    ) as any

    const currentUser = match.users.find(
      (user: any) => user._id.toString() === userId.toString()
    ) as any

    // Transform messages to match frontend format
    const transformedMessages = messages.map((msg: any) => {
      const senderId = msg.senderId as any
      const isCurrentUser = senderId._id.toString() === userId.toString()

      let senderName = 'Unknown'
      if (isCurrentUser) {
        // LINE 167: Fix property access with type assertion
        senderName = (currentUser?.name as string) || 'You'
      } else {
        // LINE 169: Fix property access with type assertion
        senderName = (otherUser?.name as string) || 'User'
      }

      return {
        _id: msg._id.toString(),
        matchId: msg.matchId.toString(),
        sender: senderId._id.toString(), // string ID for isCurrentUser check
        senderId: {
          _id: senderId._id.toString(),
          name: senderName, // Use determined sender name
          photos: senderId.photos || [],
          age: senderId.age,
        },
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
        isRead: msg.isRead || false,
        read: msg.isRead, // For compatibility
      }
    })

    console.log('📊 Message transformation complete')
    console.log('Sample transformed message:', transformedMessages[0])

    // Mark messages as read (where user is receiver)
    const unreadMessages = await Message.updateMany(
      {
        matchId,
        senderId: { $ne: userId },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    )

    if (unreadMessages.modifiedCount > 0) {
      console.log(`✅ Marked ${unreadMessages.modifiedCount} messages as read`)
    }

    // Reset unread count for this user in match
    if (match.unreadCounts) {
      const unreadCounts = match.unreadCounts as any
      if (typeof unreadCounts.get === 'function') {
        // LINE 216: It's a Map, use type assertion
        ;(unreadCounts as Map<string, number>).set(userId.toString(), 0)
      } else {
        // LINE 219: It's a plain object, use type assertion
        ;(unreadCounts as Record<string, number>)[userId.toString()] = 0
      }
      await match.save()
    }

    res.json({
      success: true,
      messages: transformedMessages,
      match: {
        _id: match._id.toString(),
        users: match.users.map((user: any) => ({
          _id: user._id.toString(),
          name: user.name,
          photos: user.photos || [],
          age: user.age,
          location: user.location,
        })),
        lastMessage: match.lastMessage,
        lastMessageAt: match.lastMessageAt,
        unreadCounts: match.unreadCounts,
      },
    })
  } catch (error: any) {
    console.error('❌ Error fetching messages:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      messages: [],
    })
  }
})

router.post('/send', async (req: any, res: any) => {
  try {
    const { matchId, content } = req.body
    const userId = req.user.id || req.user._id

    console.log(`💬 Sending message to match ${matchId} from user ${userId}`)

    if (!content || content.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Message cannot be empty' })
    }

    // Verify user is in this match and populate users
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      active: true,
    }).populate('users', 'name photos age')

    if (!match) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Find the other user
    const otherUser = match.users.find(
      (user: any) => user._id.toString() !== userId.toString()
    ) as any

    // Create message
    const message = new Message({
      matchId,
      senderId: userId,
      content: content.trim(),
    })

    await message.save()

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name photos age')
      .lean()

    // Check if populatedMessage is null
    if (!populatedMessage) {
      return res.status(500).json({
        success: false,
        error: 'Failed to populate message',
      })
    }

    // Type assertion for senderId
    const populatedMsg = populatedMessage as any
    const senderId = populatedMsg.senderId as any

    // Transform the message
    const transformedMessage = {
      _id: populatedMsg._id.toString(),
      matchId: populatedMsg.matchId.toString(),
      sender: senderId._id.toString(),
      senderId: {
        _id: senderId._id.toString(),
        name: senderId.name || 'Unknown',
        photos: senderId.photos || [],
        age: senderId.age,
      },
      content: populatedMsg.content,
      createdAt: populatedMsg.createdAt.toISOString(),
      updatedAt: populatedMsg.updatedAt.toISOString(),
      isRead: populatedMsg.isRead || false,
    }

    // Update match with last message
    match.lastMessage = content.trim()
    match.lastMessageAt = new Date()

    // Increment unread count for the other user
    if (otherUser && match.unreadCounts) {
      const otherUserId = otherUser._id.toString()
      const unreadCounts = match.unreadCounts as any

      if (typeof unreadCounts.get === 'function') {
        // LINE 321: It's a Map
        const currentUnread =
          (unreadCounts as Map<string, number>).get(otherUserId) || 0
        ;(unreadCounts as Map<string, number>).set(
          otherUserId,
          currentUnread + 1
        )
      } else {
        // LINE 324 & 325: It's a plain object, use type assertion
        const currentUnread =
          (unreadCounts as Record<string, number>)[otherUserId] || 0
        ;(unreadCounts as Record<string, number>)[otherUserId] =
          currentUnread + 1
      }
    }

    await match.save()

    // Get the io instance from app
    const io = req.app.get('io')
    if (io) {
      // Broadcast to match room with transformed message
      io.to(`match-${matchId}`).emit('new-message', transformedMessage)
    }

    res.json({
      success: true,
      message: transformedMessage,
    })
  } catch (error: any) {
    console.error('❌ Error sending message:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    })
  }
})
// Mark messages as read
router.post('/mark-read/:matchId', async (req: any, res: any) => {
  try {
    const { matchId } = req.params
    const userId = req.user._id

    // Update messages as read
    await Message.updateMany(
      {
        matchId,
        senderId: { $ne: userId },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    )

    // Reset unread count
    await Match.findByIdAndUpdate(matchId, {
      $set: { [`unreadCounts.${userId}`]: 0 },
    })

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

router.put('/:messageId/edit', authMiddleware, async (req: any, res: any) => {
  try {
    const { messageId } = req.params
    const { matchId, content } = req.body
    const userId = req.user.id

    console.log(`✏️ API: Editing message ${messageId} by user ${userId}`)

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      })
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long (max 1000 characters)',
      })
    }

    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required',
      })
    }

    // Find the message
    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      })
    }

    // Check if user owns the message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages',
      })
    }

    // Check if message belongs to the specified match
    if (message.matchId.toString() !== matchId) {
      return res.status(400).json({
        success: false,
        error: 'Message does not belong to this match',
      })
    }

    // Check if message is too old to edit (15 minutes limit)
    const messageAge = Date.now() - message.createdAt.getTime()
    const editTimeLimit = 15 * 60 * 1000 // 15 minutes in milliseconds

    if (messageAge > editTimeLimit) {
      return res.status(400).json({
        success: false,
        error: 'Message is too old to edit',
      })
    }

    // Save old content for audit (optional)
    const oldContent = message.content

    // Update the message
    message.content = content.trim()
    // LINE 453: Fix - use Date object instead of number
    message.updatedAt = new Date()
    message.isEdited = true

    await message.save()

    // Populate sender info
    await message.populate('senderId', 'name photos age')

    // Type assertion for senderId
    const populatedMessage = message as any
    const senderId = populatedMessage.senderId as any

    // Update match last message if this was the last message
    const lastMessage = await Message.findOne({
      matchId: matchId,
    }).sort({ createdAt: -1 })

    if (lastMessage && lastMessage._id.toString() === messageId) {
      await Match.findByIdAndUpdate(matchId, {
        lastMessage: content.trim(),
        lastMessageAt: new Date(),
      })
    }

    // Emit WebSocket event if using WebSocket
    if (req.app.get('io')) {
      const io = req.app.get('io')
      io.to(`match-${matchId}`).emit('message-edited', {
        messageId: message._id,
        matchId,
        content: message.content,
        updatedAt: message.updatedAt,
        isEdited: true,
        sender: {
          _id: senderId._id,
          name: senderId.name,
        },
      })
    }

    res.json({
      success: true,
      message: {
        _id: message._id,
        matchId: message.matchId,
        sender: senderId._id,
        senderId: {
          _id: senderId._id,
          // LINE 484 & 497: Fix property access
          name: senderId.name,
          // LINE 498: Fix property access
          photos: senderId.photos || [],
          // LINE 499: Fix property access
          age: senderId.age,
        },
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        isRead: message.isRead,
        isEdited: true,
      },
      updatedAt: message.updatedAt,
    })

    console.log(`✅ API: Message ${messageId} edited successfully`)
  } catch (error) {
    console.error('❌ API Error editing message:', error)
    res.status(500).json({
      success: false,
      error: 'Server error while editing message',
    })
  }
})

// routes/messages.js - Add this endpoint
router.get('/unread/total', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id
    console.log(`🔔 Fetching total unread messages for user: ${userId}`)

    // Get all matches for the user
    const matches = await Match.find({
      users: userId,
      active: true,
    })

    // Calculate total unread messages across all matches
    let totalUnread = 0
    const matchesWithUnread = []

    for (const match of matches) {
      let unread = 0

      if (match.unreadCounts) {
        const unreadCounts = match.unreadCounts as any
        if (typeof unreadCounts.get === 'function') {
          // It's a Map
          unread = (unreadCounts as Map<string, number>).get(userId) || 0
        } else {
          // LINE 545: It's a plain object, use type assertion
          unread = (unreadCounts as Record<string, number>)[userId] || 0
        }
      }

      if (unread > 0) {
        totalUnread += unread
        matchesWithUnread.push({
          matchId: match._id,
          unreadCount: unread,
        })
      }
    }

    console.log(
      `✅ Total unread messages: ${totalUnread} across ${matchesWithUnread.length} matches`
    )

    res.json({
      success: true,
      totalUnread,
      matchesWithUnread,
      matchesWithUnreadCount: matchesWithUnread.length,
    })
  } catch (error: any) {
    console.error('❌ Error fetching unread total:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    })
  }
})

module.exports = router
