import express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
import Match from '../models/Match'
import Message from '../models/Message'

router.use(authMiddleware)

router.get('/matches', authMiddleware, async (req: any, res: any) => {
  try {
    console.log('🔍 Fetching matches for user:', req.user?.id)

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

    const matches = await Match.find({
      users: userId,
      active: true,
    })
      .populate('users', 'name photos age location')
      .sort({ updatedAt: -1 })
      .lean()

    console.log(`✅ Found ${matches.length} matches for user ${userId}`)

    const transformedMatches = matches
      .map((match: any) => {
        try {
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

          let unreadCount = 0
          if (match.unreadCounts) {
            const unreadCounts = match.unreadCounts as any
            if (typeof unreadCounts.get === 'function') {
              unreadCount = unreadCounts.get(userId) || 0
            } else {
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

    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      active: true,
    }).populate('users', 'name photos age location')

    if (!match) {
      console.log(`❌ User ${userId} not authorized for match ${matchId}`)
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        messages: [],
      })
    }

    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name photos age')
      .lean()

    console.log(`✅ Found ${messages.length} messages for match ${matchId}`)

    const otherUser = match.users.find(
      (user: any) => user._id.toString() !== userId.toString()
    ) as any

    const currentUser = match.users.find(
      (user: any) => user._id.toString() === userId.toString()
    ) as any

    const transformedMessages = messages.map((msg: any) => {
      const senderId = msg.senderId as any
      const isCurrentUser = senderId._id.toString() === userId.toString()

      let senderName = 'Unknown'
      if (isCurrentUser) {
        senderName = (currentUser?.name as string) || 'You'
      } else {
        senderName = (otherUser?.name as string) || 'User'
      }

      return {
        _id: msg._id.toString(),
        matchId: msg.matchId.toString(),
        sender: senderId._id.toString(),
        senderId: {
          _id: senderId._id.toString(),
          name: senderName,
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

    if (match.unreadCounts) {
      const unreadCounts = match.unreadCounts as any
      if (typeof unreadCounts.get === 'function') {
        ;(unreadCounts as Map<string, number>).set(userId.toString(), 0)
      } else {
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

    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      active: true,
    }).populate('users', 'name photos age')

    if (!match) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    const otherUser = match.users.find(
      (user: any) => user._id.toString() !== userId.toString()
    ) as any

    const message = new Message({
      matchId,
      senderId: userId,
      content: content.trim(),
    })

    await message.save()

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name photos age')
      .lean()

    if (!populatedMessage) {
      return res.status(500).json({
        success: false,
        error: 'Failed to populate message',
      })
    }

    const populatedMsg = populatedMessage as any
    const senderId = populatedMsg.senderId as any

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

    match.lastMessage = content.trim()
    match.lastMessageAt = new Date()

    if (otherUser && match.unreadCounts) {
      const otherUserId = otherUser._id.toString()
      const unreadCounts = match.unreadCounts as any

      if (typeof unreadCounts.get === 'function') {
        const currentUnread =
          (unreadCounts as Map<string, number>).get(otherUserId) || 0
        ;(unreadCounts as Map<string, number>).set(
          otherUserId,
          currentUnread + 1
        )
      } else {
        const currentUnread =
          (unreadCounts as Record<string, number>)[otherUserId] || 0
        ;(unreadCounts as Record<string, number>)[otherUserId] =
          currentUnread + 1
      }
    }

    await match.save()

    const io = req.app.get('io')
    if (io) {
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
router.post('/mark-read/:matchId', async (req: any, res: any) => {
  try {
    const { matchId } = req.params
    const userId = req.user._id

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

    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      })
    }
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages',
      })
    }
    if (message.matchId.toString() !== matchId) {
      return res.status(400).json({
        success: false,
        error: 'Message does not belong to this match',
      })
    }
    const messageAge = Date.now() - message.createdAt.getTime()
    const editTimeLimit = 15 * 60 * 1000

    if (messageAge > editTimeLimit) {
      return res.status(400).json({
        success: false,
        error: 'Message is too old to edit',
      })
    }
    const oldContent = message.content
    message.content = content.trim()

    message.updatedAt = new Date()
    message.isEdited = true

    await message.save()

    await message.populate('senderId', 'name photos age')

    const populatedMessage = message as any
    const senderId = populatedMessage.senderId as any

    const lastMessage = await Message.findOne({
      matchId: matchId,
    }).sort({ createdAt: -1 })

    if (lastMessage && lastMessage._id.toString() === messageId) {
      await Match.findByIdAndUpdate(matchId, {
        lastMessage: content.trim(),
        lastMessageAt: new Date(),
      })
    }
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

          name: senderId.name,

          photos: senderId.photos || [],

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

router.get('/unread/total', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.id
    console.log(`🔔 Fetching total unread messages for user: ${userId}`)

    const matches = await Match.find({
      users: userId,
      active: true,
    })

    let totalUnread = 0
    const matchesWithUnread = []

    for (const match of matches) {
      let unread = 0

      if (match.unreadCounts) {
        const unreadCounts = match.unreadCounts as any
        if (typeof unreadCounts.get === 'function') {
          unread = (unreadCounts as Map<string, number>).get(userId) || 0
        } else {
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
