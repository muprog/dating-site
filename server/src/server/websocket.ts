const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')
const Message = require('../models/Message')
const Match = require('../models/Match')
const User = require('../models/User')

function setupWebSocket(server: any) {
  console.log('🚀 Initializing WebSocket server...')

  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  console.log('✅ WebSocket server created')

  // Authentication middleware
  io.use(async (socket: any, next: any) => {
    try {
      let token = socket.handshake.auth.token || socket.handshake.query.token

      // Check cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';')
        const tokenCookie = cookies.find((c: any) =>
          c.trim().startsWith('token=')
        )
        if (tokenCookie) {
          token = tokenCookie.split('=')[1]
        }
      }

      if (!token) {
        console.log('⚠️ No token found, allowing anonymous connection')
        socket.userId = 'anonymous'
        return next()
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      )
      console.log('✅ Token verified for user:', decoded.id)

      // Get user from database
      const user = await User.findById(decoded.id).select('name photos age')
      if (!user) {
        throw new Error('User not found')
      }

      socket.userId = decoded.id
      socket.user = user
      next()
    } catch (error: any) {
      console.error('❌ WebSocket auth error:', error.message)
      socket.userId = 'unauthenticated'
      next()
    }
  })

  io.on('connection', (socket: any) => {
    console.log('🎉 New WebSocket connection:', {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.user?.name,
    })

    // Welcome message
    socket.emit('welcome', {
      message: 'Connected to WebSocket server',
      socketId: socket.id,
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    })

    // Handle match room joining
    socket.on('join-match', (matchId: any) => {
      if (!matchId) {
        console.error('❌ join-match: No matchId provided')
        return
      }

      const roomName = `match-${matchId}`
      socket.join(roomName)
      console.log(`🚪 User ${socket.userId} joined room: ${roomName}`)

      socket.emit('joined-room', {
        room: roomName,
        matchId: matchId,
        timestamp: new Date().toISOString(),
      })
    })

    // Handle match room leaving
    socket.on('leave-match', (matchId: any) => {
      if (!matchId) {
        console.error('❌ leave-match: No matchId provided')
        return
      }

      const roomName = `match-${matchId}`
      socket.leave(roomName)
      console.log(`🚪 User ${socket.userId} left room: ${roomName}`)
    })

    // Handle sending messages - UPDATED TO SAVE TO DATABASE
    socket.on('send-message', async (data: any) => {
      const { matchId, content } = data

      if (!matchId || !content) {
        console.error('❌ send-message: Missing matchId or content')
        socket.emit('message-error', { error: 'Missing data' })
        return
      }

      console.log(
        `💬 User ${socket.userId} sending to ${matchId}:`,
        content.substring(0, 50)
      )

      try {
        // 1. Verify user has access to this match
        const match = await Match.findOne({
          _id: matchId,
          users: socket.userId,
          active: true,
        }).populate('users', 'name photos age')

        if (!match) {
          throw new Error('Access denied or match not found')
        }

        // 2. Create and save message to database
        const message = new Message({
          matchId,
          senderId: socket.userId,
          content: content.trim(),
        })

        await message.save()

        // 3. Populate message with sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name photos age')
          .lean()

        // 4. Transform message for frontend
        const messageData = {
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
          isRead: false,
        }

        // 5. Update match with last message
        match.lastMessage = content.trim()
        match.lastMessageAt = new Date()

        // 6. Increment unread count for the other user
        const otherUser = match.users.find(
          (user: any) => user._id.toString() !== socket.userId.toString()
        )

        if (otherUser && match.unreadCounts) {
          const otherUserId = otherUser._id.toString()
          if (typeof match.unreadCounts.get === 'function') {
            const currentUnread = match.unreadCounts.get(otherUserId) || 0
            match.unreadCounts.set(otherUserId, currentUnread + 1)
          } else {
            match.unreadCounts[otherUserId] =
              (match.unreadCounts[otherUserId] || 0) + 1
          }
        }

        await match.save()

        // 7. Broadcast to match room
        const roomName = `match-${matchId}`
        io.to(roomName).emit('new-message', messageData)
        console.log(`📤 Message saved and broadcasted to ${roomName}`)

        // 8. Send confirmation to sender
        socket.emit('message-sent', {
          success: true,
          message: messageData,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        console.error('❌ Error sending message via WebSocket:', error)
        socket.emit('message-error', {
          error: error.message || 'Failed to send message',
        })
      }
    })

    // Handle disconnection
    socket.on('disconnect', (reason: any) => {
      console.log(`❌ User ${socket.userId} disconnected:`, reason)
    })

    // Handle errors
    socket.on('error', (error: any) => {
      console.error(`❌ Socket error:`, error)
    })
  })

  console.log('✅ WebSocket server fully initialized')
  return io
}

module.exports = setupWebSocket
