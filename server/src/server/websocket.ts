const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')
const cookie = require('cookie') // Add this import

function setupWebSocket(server: any) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  const onlineUsers = new Map()

  // Add authentication middleware
  io.use(async (socket: any, next: any) => {
    try {
      console.log('🔐 WebSocket authentication attempt')

      // Try to get token from auth object first
      let token = socket.handshake.auth.token

      // If no token in auth, try to get from cookies
      if (!token) {
        const cookies = socket.handshake.headers.cookie
        if (cookies) {
          const parsedCookies = cookie.parse(cookies)
          token = parsedCookies.token
        }
      }

      if (!token) {
        console.log('❌ WebSocket: No token found')
        return next(new Error('Authentication required'))
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      )

      console.log(
        `✅ WebSocket: User authenticated - ${decoded.id || decoded.userId}`
      )

      // Store user info on socket
      socket.userId = decoded.id || decoded.userId
      socket.user = decoded

      next()
    } catch (error: any) {
      console.error('❌ WebSocket authentication failed:', error.message)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: any) => {
    console.log(
      '✅ New WebSocket connection:',
      socket.id,
      'User:',
      socket.userId
    )

    // Store user connection
    if (socket.userId) {
      onlineUsers.set(socket.userId, socket.id)
      console.log(`✅ User ${socket.userId} is now online`)
    }

    // Join match room
    socket.on('join-match', (matchId: any) => {
      if (!matchId) {
        console.error('❌ join-match: No matchId provided')
        return
      }
      socket.join(`match-${matchId}`)
      console.log(`🚪 User ${socket.userId} joined match-${matchId}`)
    })

    // Leave match room
    socket.on('leave-match', (matchId: any) => {
      if (!matchId) {
        console.error('❌ leave-match: No matchId provided')
        return
      }
      socket.leave(`match-${matchId}`)
      console.log(`🚪 User ${socket.userId} left match-${matchId}`)
    })

    // Send message
    socket.on('send-message', (data: any) => {
      const { matchId, content } = data
      if (!matchId || !content) {
        console.error('❌ send-message: Missing matchId or content')
        return
      }
      console.log(
        `💬 User ${socket.userId} sending message to match ${matchId}`
      )

      // Broadcast to everyone in the match room except sender
      socket.to(`match-${matchId}`).emit('new-message', {
        matchId,
        sender: socket.userId,
        senderId: {
          _id: socket.userId,
          name: socket.user?.name || 'User',
        },
        content,
        createdAt: new Date().toISOString(),
        isRead: false,
      })
    })

    // Handle typing indicator
    socket.on('typing', (matchId: any) => {
      if (!matchId) {
        console.error('❌ typing: No matchId provided')
        return
      }
      console.log(`⌨️ User ${socket.userId} typing in match ${matchId}`)
      socket.to(`match-${matchId}`).emit('user-typing', {
        matchId,
        userId: socket.userId,
      })
    })

    socket.on('stop-typing', (matchId: any) => {
      if (!matchId) {
        console.error('❌ stop-typing: No matchId provided')
        return
      }
      console.log(`💤 User ${socket.userId} stopped typing in match ${matchId}`)
      socket.to(`match-${matchId}`).emit('user-stopped-typing', {
        matchId,
        userId: socket.userId,
      })
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`❌ User ${socket.userId} disconnected`)
        onlineUsers.delete(socket.userId)
      }
    })

    // Error handling
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error)
    })
  })

  return io
}

module.exports = setupWebSocket
