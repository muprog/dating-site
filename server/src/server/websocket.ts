// const socketIO = require('socket.io')
// const jwt = require('jsonwebtoken')
// const cookie = require('cookie') // Add this import

// function setupWebSocket(server: any) {
//   const io = socketIO(server, {
//     cors: {
//       origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//       credentials: true,
//     },
//     transports: ['websocket', 'polling'],
//   })

//   const onlineUsers = new Map()

//   // Add authentication middleware
//   io.use(async (socket: any, next: any) => {
//     try {
//       console.log('🔐 WebSocket authentication attempt')

//       // Try to get token from auth object first
//       let token = socket.handshake.auth.token

//       // If no token in auth, try to get from cookies
//       if (!token) {
//         const cookies = socket.handshake.headers.cookie
//         if (cookies) {
//           const parsedCookies = cookie.parse(cookies)
//           token = parsedCookies.token
//         }
//       }

//       if (!token) {
//         console.log('❌ WebSocket: No token found')
//         return next(new Error('Authentication required'))
//       }

//       // Verify token
//       const decoded = jwt.verify(
//         token,
//         process.env.JWT_SECRET || 'your-secret-key'
//       )

//       console.log(
//         `✅ WebSocket: User authenticated - ${decoded.id || decoded.userId}`
//       )

//       // Store user info on socket
//       socket.userId = decoded.id || decoded.userId
//       socket.user = decoded

//       next()
//     } catch (error: any) {
//       console.error('❌ WebSocket authentication failed:', error.message)
//       next(new Error('Authentication failed'))
//     }
//   })

//   io.on('connection', (socket: any) => {
//     console.log(
//       '✅ New WebSocket connection:',
//       socket.id,
//       'User:',
//       socket.userId
//     )

//     // Store user connection
//     if (socket.userId) {
//       onlineUsers.set(socket.userId, socket.id)
//       console.log(`✅ User ${socket.userId} is now online`)
//     }

//     // Join match room
//     socket.on('join-match', (matchId: any) => {
//       if (!matchId) {
//         console.error('❌ join-match: No matchId provided')
//         return
//       }
//       socket.join(`match-${matchId}`)
//       console.log(`🚪 User ${socket.userId} joined match-${matchId}`)
//     })

//     // Leave match room
//     socket.on('leave-match', (matchId: any) => {
//       if (!matchId) {
//         console.error('❌ leave-match: No matchId provided')
//         return
//       }
//       socket.leave(`match-${matchId}`)
//       console.log(`🚪 User ${socket.userId} left match-${matchId}`)
//     })

//     // Send message
//     // socket.on('send-message', (data: any) => {
//     //   const { matchId, content } = data
//     //   if (!matchId || !content) {
//     //     console.error('❌ send-message: Missing matchId or content')
//     //     return
//     //   }
//     //   console.log(
//     //     `💬 User ${socket.userId} sending message to match ${matchId}`
//     //   )

//     //   // Broadcast to everyone in the match room except sender
//     //   socket.to(`match-${matchId}`).emit('new-message', {
//     //     matchId,
//     //     sender: socket.userId,
//     //     senderId: {
//     //       _id: socket.userId,
//     //       name: socket.user?.name || 'User',
//     //     },
//     //     content,
//     //     createdAt: new Date().toISOString(),
//     //     isRead: false,
//     //   })
//     // })
//     // In the send-message event handler in backend websocket.js
//     socket.on('send-message', (data: any) => {
//       const { matchId, content } = data
//       if (!matchId || !content) {
//         console.error('❌ send-message: Missing matchId or content')
//         return
//       }

//       console.log(
//         `💬 User ${socket.userId} sending message to match ${matchId}`
//       )

//       // Create a complete message object
//       const messageData = {
//         _id: `socket-${Date.now()}`,
//         matchId,
//         sender: socket.userId,
//         senderId: {
//           _id: socket.userId,
//           name: socket.user?.name || 'User',
//           photos: socket.user?.photos || [],
//         },
//         content,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         isRead: false,
//       }

//       // Broadcast to everyone in the match room EXCEPT sender
//       // (Sender already added their message via Redux)
//       socket.to(`match-${matchId}`).emit('new-message', messageData)
//       console.log('📤 WebSocket message sent to other users:', messageData)
//     })

//     // Handle typing indicator
//     socket.on('typing', (matchId: any) => {
//       if (!matchId) {
//         console.error('❌ typing: No matchId provided')
//         return
//       }
//       console.log(`⌨️ User ${socket.userId} typing in match ${matchId}`)
//       socket.to(`match-${matchId}`).emit('user-typing', {
//         matchId,
//         userId: socket.userId,
//       })
//     })

//     socket.on('stop-typing', (matchId: any) => {
//       if (!matchId) {
//         console.error('❌ stop-typing: No matchId provided')
//         return
//       }
//       console.log(`💤 User ${socket.userId} stopped typing in match ${matchId}`)
//       socket.to(`match-${matchId}`).emit('user-stopped-typing', {
//         matchId,
//         userId: socket.userId,
//       })
//     })

//     // Handle disconnect
//     socket.on('disconnect', () => {
//       if (socket.userId) {
//         console.log(`❌ User ${socket.userId} disconnected`)
//         onlineUsers.delete(socket.userId)
//       }
//     })

//     // Error handling
//     socket.on('error', (error: any) => {
//       console.error('❌ Socket error:', error)
//     })
//   })

//   return io
// }

// module.exports = setupWebSocket

const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')

function setupWebSocket(server: any) {
  const io = socketIO(server, {
    cors: {
      origin: function (origin: any, callback: any) {
        // Allow all origins in development, restrict in production
        if (!origin || process.env.NODE_ENV !== 'production') {
          return callback(null, true)
        }

        const allowedOrigins = [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:3000',
        ]

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  console.log('✅ WebSocket server initialized')

  // Add authentication middleware
  io.use(async (socket: any, next: any) => {
    try {
      console.log('🔐 WebSocket authentication attempt')

      // Get token from handshake query
      let token = socket.handshake.query.token

      // If no token in query, try auth object
      if (!token) {
        token = socket.handshake.auth.token
      }

      // If still no token, try cookies
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
        console.log(
          '⚠️ WebSocket: No token found, allowing connection for debugging'
        )
        // Allow connection but mark as unauthenticated
        socket.userId = 'anonymous'
        return next()
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

      // Allow connection even if authentication fails (for debugging)
      console.log('⚠️ Allowing connection despite auth failure for debugging')
      socket.userId = 'unauthenticated'
      next()
    }
  })

  io.on('connection', (socket: any) => {
    console.log(
      '✅ New WebSocket connection:',
      socket.id,
      'User:',
      socket.userId || 'unknown'
    )

    // Send welcome message
    socket.emit('welcome', {
      message: 'Connected to WebSocket server',
      socketId: socket.id,
      userId: socket.userId,
    })

    // Debug: Listen for all events
    socket.onAny((event: any, ...args: any) => {
      console.log(
        `🔵 [Socket ${socket.id}] Event: ${event}`,
        args.length > 0 ? args[0] : ''
      )
    })

    // Join match room
    socket.on('join-match', (matchId: any) => {
      if (!matchId) {
        console.error('❌ join-match: No matchId provided')
        return
      }
      const roomName = `match-${matchId}`
      socket.join(roomName)
      console.log(
        `🚪 User ${socket.userId || socket.id} joined room: ${roomName}`
      )

      // Send confirmation
      socket.emit('joined-room', { room: roomName })
    })

    // Leave match room
    socket.on('leave-match', (matchId: any) => {
      if (!matchId) {
        console.error('❌ leave-match: No matchId provided')
        return
      }
      const roomName = `match-${matchId}`
      socket.leave(roomName)
      console.log(
        `🚪 User ${socket.userId || socket.id} left room: ${roomName}`
      )
    })

    // Send message via WebSocket
    socket.on('send-message', (data: any) => {
      const { matchId, content } = data
      if (!matchId || !content) {
        console.error('❌ send-message: Missing matchId or content')
        return
      }

      console.log(
        `💬 WebSocket: User ${
          socket.userId || socket.id
        } sending message to match ${matchId}`
      )

      // Create a complete message object
      const messageData = {
        _id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        matchId,
        sender: socket.userId || 'unknown',
        senderId: {
          _id: socket.userId || 'unknown',
          name: socket.user?.name || 'User',
        },
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
      }

      const roomName = `match-${matchId}`

      // Broadcast to everyone in the match room EXCEPT sender
      socket.to(roomName).emit('new-message', messageData)
      console.log(`📤 Message broadcasted to room ${roomName}`)

      // Send confirmation to sender
      socket.emit('message-sent', {
        success: true,
        messageId: messageData._id,
      })
    })

    // Handle typing indicator
    socket.on('typing', (matchId: any) => {
      if (!matchId) {
        console.error('❌ typing: No matchId provided')
        return
      }
      console.log(
        `⌨️ User ${socket.userId || socket.id} typing in match ${matchId}`
      )
      socket.to(`match-${matchId}`).emit('user-typing', {
        matchId,
        userId: socket.userId || socket.id,
      })
    })

    socket.on('stop-typing', (matchId: any) => {
      if (!matchId) {
        console.error('❌ stop-typing: No matchId provided')
        return
      }
      console.log(
        `💤 User ${
          socket.userId || socket.id
        } stopped typing in match ${matchId}`
      )
      socket.to(`match-${matchId}`).emit('user-stopped-typing', {
        matchId,
        userId: socket.userId || socket.id,
      })
    })

    // Handle disconnect
    socket.on('disconnect', (reason: any) => {
      console.log(
        `❌ User ${socket.userId || socket.id} disconnected: ${reason}`
      )
    })

    // Error handling
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error)
    })
  })

  return io
}

module.exports = setupWebSocket
