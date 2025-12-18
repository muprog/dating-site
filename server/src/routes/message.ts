const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const Match = require('../models/Match')
const Message = require('../models/Message')

// Apply auth middleware to all routes
router.use(authMiddleware)

// Get user's matches with last message
router.get('/matches', async (req: any, res: any) => {
  try {
    const userId = req.user._id

    const matches = await Match.find({
      users: userId,
      active: true,
    })
      .populate('users', 'name age photos location')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean()

    // Format response to show other user info
    const formattedMatches = matches.map((match: any) => {
      const otherUser = match.users.find(
        (user: any) => user._id.toString() !== userId.toString()
      )

      const unreadCount = match.unreadCounts?.get(userId.toString()) || 0

      return {
        _id: match._id,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          age: otherUser.age,
          photos: otherUser.photos,
          location: otherUser.location,
        },
        lastMessage: match.lastMessage,
        lastMessageAt: match.lastMessageAt,
        unreadCount: unreadCount,
        createdAt: match.createdAt,
      }
    })

    res.json({ success: true, matches: formattedMatches })
  } catch (error: any) {
    console.error('Error fetching matches:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Get messages for a match
router.get('/match/:matchId/messages', async (req: any, res: any) => {
  try {
    const { matchId } = req.params
    const userId = req.user._id

    // Verify user is in this match
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      active: true,
    })

    if (!match) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Get messages
    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name photos')
      .lean()

    // Mark messages as read (where user is receiver)
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

    // Reset unread count for this user
    match.unreadCounts.set(userId.toString(), 0)
    await match.save()

    res.json({ success: true, messages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Send a message
router.post('/send', async (req: any, res: any) => {
  try {
    const { matchId, content } = req.body
    const userId = req.user._id

    if (!content || content.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'Message cannot be empty' })
    }

    // Verify user is in this match
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
      active: true,
    })

    if (!match) {
      return res.status(403).json({ success: false, error: 'Access denied' })
    }

    // Create message
    const message = new Message({
      matchId,
      senderId: userId,
      content: content.trim(),
    })

    await message.save()

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name photos')
      .lean()

    // Update match with last message
    match.lastMessage = content.trim()
    match.lastMessageAt = new Date()

    // Increment unread count for the other user
    const otherUser = match.users.find(
      (id: any) => id.toString() !== userId.toString()
    )
    const currentUnread = match.unreadCounts.get(otherUser.toString()) || 0
    match.unreadCounts.set(otherUser.toString(), currentUnread + 1)

    await match.save()

    // Get the io instance from app
    const io = req.app.get('io')
    if (io) {
      // Broadcast to match room
      io.to(`match-${matchId}`).emit('new-message', populatedMessage)
    }

    res.json({ success: true, message: populatedMessage })
  } catch (error: any) {
    console.error('Error sending message:', error)
    res.status(500).json({ success: false, error: 'Server error' })
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
