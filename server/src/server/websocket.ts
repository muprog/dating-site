const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')

function setupWebSocket(server: any) {
  const io = socketIO(server, {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  })

  const onlineUsers = new Map()

  io.on('connection', (socket: any) => {
    console.log('New client connected:', socket.id)

    // Get token from handshake
    const token = socket.handshake.auth.token

    if (!token) {
      socket.disconnect()
      return
    }

    try {
      // Verify token
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      )
      const userId = decoded.userId

      // Store user connection
      onlineUsers.set(userId, socket.id)
      console.log(`User ${userId} is now online`)

      // Store userId on socket
      socket.userId = userId

      // Join match room
      socket.on('join-match', (matchId: string) => {
        socket.join(`match-${matchId}`)
        console.log(`User ${userId} joined match-${matchId}`)
      })

      // Leave match room
      socket.on('leave-match', (matchId: string) => {
        socket.leave(`match-${matchId}`)
        console.log(`User ${userId} left match-${matchId}`)
      })

      // Handle typing indicator
      socket.on('typing', (matchId: string) => {
        socket.to(`match-${matchId}`).emit('user-typing', {
          matchId,
          userId,
        })
      })

      socket.on('stop-typing', (matchId: string) => {
        socket.to(`match-${matchId}`).emit('user-stopped-typing', {
          matchId,
          userId,
        })
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          console.log(`User ${socket.userId} disconnected`)
          onlineUsers.delete(socket.userId)
        }
      })
    } catch (error: any) {
      console.error('Authentication failed:', error)
      socket.disconnect()
    }
  })

  return io
}

module.exports = setupWebSocket
