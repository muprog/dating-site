const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const Match = require('../models/Match')
const Message = require('../models/Message')

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
            if (typeof match.unreadCounts.get === 'function') {
              // It's a Map
              unreadCount = match.unreadCounts.get(userId) || 0
            } else {
              // It's a plain object
              unreadCount = match.unreadCounts[userId] || 0
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

    // Get the other user from the match
    const otherUser = match.users.find(
      (user: any) => user._id.toString() !== userId.toString()
    )

    const currentUser = match.users.find(
      (user: any) => user._id.toString() === userId.toString()
    )

    // Transform messages to match frontend format
    const transformedMessages = messages.map((msg: any) => {
      const isCurrentUser = msg.senderId._id.toString() === userId.toString()

      // Determine sender name - if sender is current user, use their name, otherwise use other user's name
      let senderName = 'Unknown'
      if (isCurrentUser) {
        senderName = currentUser?.name || 'You'
      } else {
        senderName = otherUser?.name || 'User'
      }

      return {
        _id: msg._id.toString(),
        matchId: msg.matchId.toString(),
        sender: msg.senderId._id.toString(), // string ID for isCurrentUser check
        senderId: {
          _id: msg.senderId._id.toString(),
          name: senderName, // Use determined sender name
          photos: msg.senderId.photos || [],
          age: msg.senderId.age,
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
      if (typeof match.unreadCounts.get === 'function') {
        // It's a Map
        match.unreadCounts.set(userId.toString(), 0)
      } else {
        // It's a plain object
        match.unreadCounts[userId.toString()] = 0
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
    )

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

    // Transform the message
    const transformedMessage = {
      _id: populatedMessage._id.toString(),
      matchId: populatedMessage.matchId.toString(),
      sender: populatedMessage.senderId._id.toString(),
      senderId: {
        _id: populatedMessage.senderId._id.toString(),
        name: populatedMessage.senderId.name || 'Unknown',
        photos: populatedMessage.senderId.photos || [],
        age: populatedMessage.senderId.age,
      },
      content: populatedMessage.content,
      createdAt: populatedMessage.createdAt.toISOString(),
      updatedAt: populatedMessage.updatedAt.toISOString(),
      isRead: populatedMessage.isRead || false,
    }

    // Update match with last message
    match.lastMessage = content.trim()
    match.lastMessageAt = new Date()

    // Increment unread count for the other user
    if (otherUser && match.unreadCounts) {
      const otherUserId = otherUser._id.toString()
      if (typeof match.unreadCounts.get === 'function') {
        // It's a Map
        const currentUnread = match.unreadCounts.get(otherUserId) || 0
        match.unreadCounts.set(otherUserId, currentUnread + 1)
      } else {
        // It's a plain object
        match.unreadCounts[otherUserId] =
          (match.unreadCounts[otherUserId] || 0) + 1
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

module.exports = router
