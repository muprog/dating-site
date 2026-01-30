const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')
import User from '../models/User'
import Match from '../models/Match'
import Message from '../models/Message'

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

  const connectedUsers = new Map()

  const typingUsers = new Map()

  io.use(async (socket: any, next: any) => {
    try {
      let token = socket.handshake.auth.token || socket.handshake.query.token

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
        console.log('⚠️ No token found, connection rejected')
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      )

      const user = await User.findById(decoded.id).select(
        '_id name email photos age'
      )
      if (!user) {
        throw new Error('User not found')
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error: any) {
      console.error('❌ WebSocket auth error:', error.message)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: any) => {
    console.log('🎉 New WebSocket connection:', {
      socketId: socket.id,
      userId: socket.userId,
      userName: socket.user?.name,
    })

    const handleConnection = async () => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          lastActive: new Date(),
        })

        connectedUsers.set(socket.userId, {
          socketId: socket.id,
          user: socket.user,
          joinedRooms: new Set(),
          typingIn: new Set(),
          lastActivity: new Date(),
        })

        io.emit('user-status', {
          userId: socket.userId,
          status: 'online',
          lastSeen: new Date().toISOString(),
          user: {
            _id: socket.user._id,
            name: socket.user.name,
            photos: socket.user.photos,
          },
        })

        console.log(
          `🟢 User ${socket.user.name} (${socket.userId}) is now online`
        )

        socket.emit('welcome', {
          message: 'Connected to WebSocket server',
          socketId: socket.id,
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        })
        await emitUnreadUpdate(io, socket.userId)

        const onlineUsers = Array.from(connectedUsers.keys())
        socket.emit('online-users', onlineUsers)
      } catch (error) {
        console.error('❌ Error handling connection:', error)
      }
    }

    handleConnection()

    const getUnreadCount = (match: any, userId: string): number => {
      if (!match.unreadCounts) return 0

      const unreadCounts = match.unreadCounts as any
      if (typeof unreadCounts.get === 'function') {
        return (unreadCounts as Map<string, number>).get(userId) || 0
      } else {
        return (unreadCounts as Record<string, number>)[userId] || 0
      }
    }

    const setUnreadCount = (match: any, userId: string, value: number) => {
      if (!match.unreadCounts) {
        match.unreadCounts = new Map()
      }

      const unreadCounts = match.unreadCounts as any
      if (typeof unreadCounts.set === 'function') {
        ;(unreadCounts as Map<string, number>).set(userId, value)
      } else {
        ;(unreadCounts as Record<string, number>)[userId] = value
      }
    }

    socket.on('join-match', async (matchId: any) => {
      if (!matchId) {
        console.error('❌ join-match: No matchId provided')
        return
      }

      try {
        const match = await Match.findById(matchId)
        if (
          !match ||
          !match.users.some((u: any) => u.toString() === socket.userId)
        ) {
          console.error(
            `❌ User ${socket.userId} not authorized for match ${matchId}`
          )
          return
        }

        const roomName = `match-${matchId}`
        socket.join(roomName)

        const userData = connectedUsers.get(socket.userId)
        if (userData) {
          userData.joinedRooms.add(matchId)
        }

        console.log(`🚪 User ${socket.user.name} joined room: ${roomName}`)

        socket.emit('room-joined', {
          matchId,
          room: roomName,
          timestamp: new Date().toISOString(),
        })

        const matchTyping = typingUsers.get(matchId)
        if (matchTyping) {
          const otherUserTyping = Array.from(matchTyping.keys()).find(
            (userId) => userId !== socket.userId
          )
          if (otherUserTyping) {
            const otherUserData = connectedUsers.get(otherUserTyping)
            if (otherUserData) {
              socket.emit('user-typing', {
                matchId,
                userId: otherUserTyping,
                isTyping: true,
                user: otherUserData.user,
                timestamp: new Date().toISOString(),
              })
            }
          }
        }
      } catch (error) {
        console.error('❌ Error joining match:', error)
      }
    })

    socket.on('leave-match', (matchId: any) => {
      if (!matchId) return

      const roomName = `match-${matchId}`
      socket.leave(roomName)

      const userData = connectedUsers.get(socket.userId)
      if (userData) {
        userData.joinedRooms.delete(matchId)
        userData.typingIn.delete(matchId)
      }

      console.log(`🚪 User ${socket.userId} left room: ${roomName}`)

      const matchTyping = typingUsers.get(matchId)
      if (matchTyping) {
        matchTyping.delete(socket.userId)
        if (matchTyping.size === 0) {
          typingUsers.delete(matchId)
        }
      }

      socket.to(roomName).emit('user-typing', {
        matchId,
        userId: socket.userId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('typing', (data: any) => {
      const { matchId, isTyping } = data

      if (!matchId) {
        console.error('❌ typing: No matchId provided')
        return
      }

      try {
        const roomName = `match-${matchId}`
        socket.to(roomName).emit('user-typing', {
          matchId,
          userId: socket.userId,
          isTyping,
          user: {
            _id: socket.user._id,
            name: socket.user.name,
          },
          timestamp: new Date().toISOString(),
        })

        console.log(
          `✍️ ${socket.user.name} ${
            isTyping ? 'started' : 'stopped'
          } typing in match ${matchId}`
        )
      } catch (error) {
        console.error('❌ Error handling typing:', error)
      }
    })

    const emitUnreadUpdate = async (io: any, userId: any) => {
      try {
        const matches = await Match.find({
          users: userId,
          active: true,
        })

        let totalUnread = 0
        const matchesWithUnread: Array<{
          matchId: string
          unreadCount: number
        }> = []

        for (const match of matches) {
          const unread = getUnreadCount(match, userId)

          if (unread > 0) {
            totalUnread += unread
            matchesWithUnread.push({
              matchId: match._id.toString(),
              unreadCount: unread,
            })
          }
        }
        const userData = connectedUsers.get(userId)
        if (userData) {
          io.to(userData.socketId).emit('unread-update', {
            totalUnread,
            matchesWithUnread,
            matchesWithUnreadCount: matchesWithUnread.length,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error('❌ Error emitting unread update:', error)
      }
    }

    socket.on('send-message', async (data: any) => {
      const { matchId, content, tempId } = data

      if (!matchId || !content || content.trim().length === 0) {
        socket.emit('message-error', { error: 'Invalid message data' })
        return
      }

      console.log(`💬 ${socket.user.name} sending message to match ${matchId}`)

      try {
        const match = await Match.findById(matchId)
        if (
          !match ||
          !match.users.some((u: any) => u.toString() === socket.userId)
        ) {
          throw new Error('Match not found or access denied')
        }

        const message = new Message({
          matchId,
          senderId: socket.userId,
          content: content.trim(),
        })

        await message.save()

        await message.populate('senderId', 'name photos age')

        const populatedMessage = message as any
        const senderId = populatedMessage.senderId as any

        const messageData = {
          _id: message._id.toString(),
          tempId: tempId,
          matchId: message.matchId.toString(),
          sender: senderId._id.toString(),
          senderId: {
            _id: senderId._id.toString(),
            name: senderId.name,
            photos: senderId.photos || [],
            age: senderId.age,
          },
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
          isRead: false,
          isOptimistic: false,
        }

        match.lastMessage = content.trim()
        match.lastMessageAt = new Date()
        const otherUser = match.users.find(
          (u: any) => u.toString() !== socket.userId
        )
        if (otherUser) {
          const currentCount = getUnreadCount(match, otherUser.toString())
          setUnreadCount(match, otherUser.toString(), currentCount + 1)
          await emitUnreadUpdate(io, otherUser.toString())
        }

        await match.save()

        const matchTyping = typingUsers.get(matchId)
        if (matchTyping) {
          matchTyping.delete(socket.userId)
          if (matchTyping.size === 0) {
            typingUsers.delete(matchId)
          }
        }

        const userData = connectedUsers.get(socket.userId)
        if (userData) {
          userData.typingIn.delete(matchId)
        }
        const roomName = `match-${matchId}`
        io.to(roomName).emit('new-message', messageData)

        socket.emit('message-sent', {
          success: true,
          message: messageData,
          tempId,
          timestamp: new Date().toISOString(),
        })

        console.log(`✅ Message sent to match ${matchId}`)

        socket.to(roomName).emit('user-typing', {
          matchId,
          userId: socket.userId,
          isTyping: false,
          timestamp: new Date().toISOString(),
        })
      } catch (error: any) {
        console.error('❌ Error sending message:', error)
        socket.emit('message-error', {
          error: error.message || 'Failed to send message',
          tempId,
        })
      }
    })

    socket.on('mark-read', async (data: any) => {
      const { matchId, messageIds } = data

      if (!matchId || !messageIds || !Array.isArray(messageIds)) {
        return
      }

      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            senderId: { $ne: socket.userId },
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: new Date(),
            },
          }
        )

        await Match.findByIdAndUpdate(matchId, {
          $set: { [`unreadCounts.${socket.userId}`]: 0 },
        })
        await emitUnreadUpdate(io, socket.userId)

        socket.to(`match-${matchId}`).emit('messages-read', {
          matchId,
          userId: socket.userId,
          messageIds,
          timestamp: new Date().toISOString(),
        })

        console.log(
          `📖 ${socket.user.name} marked ${messageIds.length} messages as read`
        )
      } catch (error) {
        console.error('❌ Error marking messages as read:', error)
      }
    })

    socket.on('check-online', (userId: any) => {
      const userData = connectedUsers.get(userId)
      const isOnline = !!userData

      socket.emit('online-status', {
        userId,
        isOnline,
        lastSeen: isOnline ? new Date().toISOString() : null,
        user: userData?.user,
      })
    })

    socket.on('check-online-batch', (userIds: any) => {
      if (!Array.isArray(userIds)) return

      const statuses: {
        [key: string]: { isOnline: boolean; lastSeen?: string; user?: any }
      } = {}

      userIds.forEach((userId) => {
        const userData = connectedUsers.get(userId)
        statuses[userId] = {
          isOnline: !!userData,
          lastSeen: userData?.lastActivity || null,
          user: userData?.user,
        }
      })

      socket.emit('online-status-batch', statuses)
    })
    socket.on('heartbeat', () => {
      const userData = connectedUsers.get(socket.userId)
      if (userData) {
        userData.lastActivity = new Date()
      }
    })

    socket.on('edit-message', async (data: any) => {
      const { messageId, matchId, content } = data

      if (!messageId || !matchId || !content || content.trim().length === 0) {
        socket.emit('edit-message-error', {
          error: 'Invalid edit data',
          messageId,
        })
        return
      }

      console.log(`✏️ ${socket.user.name} editing message ${messageId}`)

      try {
        const message = await Message.findById(messageId)
        if (!message) {
          throw new Error('Message not found')
        }

        if (message.senderId.toString() !== socket.userId) {
          throw new Error('You can only edit your own messages')
        }

        const messageAge = Date.now() - message.createdAt.getTime()
        const editTimeLimit = 15 * 60 * 1000

        if (messageAge > editTimeLimit) {
          throw new Error('Message is too old to edit')
        }

        const oldContent = message.content
        message.content = content.trim()
        message.updatedAt = new Date()
        message.isEdited = true

        await message.save()

        await message.populate('senderId', 'name photos age')

        const populatedMessage = message as any
        const senderId = populatedMessage.senderId as any

        const editedMessageData = {
          messageId: message._id.toString(),
          matchId: message.matchId.toString(),
          content: message.content,
          updatedAt: message.updatedAt.toISOString(),
          isEdited: true,
          sender: {
            _id: senderId._id.toString(),
            name: senderId.name,
          },
          oldContent: oldContent,
        }

        const roomName = `match-${matchId}`
        io.to(roomName).emit('message-edited', editedMessageData)

        const lastMessage = await Message.findOne({
          matchId: matchId,
        }).sort({ createdAt: -1 })

        if (lastMessage && lastMessage._id.toString() === messageId) {
          await Match.findByIdAndUpdate(matchId, {
            lastMessage: content.trim(),
            lastMessageAt: new Date(),
          })
        }

        console.log(`✅ Message ${messageId} edited successfully`)

        socket.emit('edit-message-success', {
          success: true,
          messageId,
          matchId,
          content: message.content,
          updatedAt: message.updatedAt,
        })
      } catch (error: any) {
        console.error('❌ Error editing message:', error)
        socket.emit('edit-message-error', {
          error: error.message || 'Failed to edit message',
          messageId,
        })
      }
    })

    socket.on('edit-message-error', (error: any) => {
      console.error('❌ Edit message error:', error)
    })

    socket.on('edit-message-success', (data: any) => {
      console.log('✅ Edit message success:', data)
    })

    socket.on('disconnect', async (reason: any) => {
      console.log(`❌ User ${socket.userId} disconnected:`, reason)

      try {
        const userData = connectedUsers.get(socket.userId)

        if (userData) {
          userData.joinedRooms.forEach((matchId: any) => {
            const matchTyping = typingUsers.get(matchId)
            if (matchTyping) {
              matchTyping.delete(socket.userId)
              if (matchTyping.size === 0) {
                typingUsers.delete(matchId)
              }
            }
            const roomName = `match-${matchId}`
            io.to(roomName).emit('user-typing', {
              matchId,
              userId: socket.userId,
              isTyping: false,
              timestamp: new Date().toISOString(),
            })
          })
        }
        connectedUsers.delete(socket.userId)
        io.emit('user-status', {
          userId: socket.userId,
          status: 'offline',
          lastSeen: new Date().toISOString(),
          user: userData?.user,
        })

        console.log(`🔴 User ${socket.userId} is now offline`)
      } catch (error) {
        console.error('❌ Error handling disconnection:', error)
      }
    })

    socket.on('error', (error: any) => {
      console.error(`❌ Socket error for ${socket.userId}:`, error)
    })
  })
  setInterval(() => {
    const now = Date.now()
    typingUsers.forEach((userMap, matchId) => {
      userMap.forEach((timestamp: any, userId: any) => {
        if (now - timestamp > 5000) {
          userMap.delete(userId)

          io.to(`match-${matchId}`).emit('user-typing', {
            matchId,
            userId,
            isTyping: false,
            timestamp: new Date().toISOString(),
          })
        }
      })

      if (userMap.size === 0) {
        typingUsers.delete(matchId)
      }
    })
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    connectedUsers.forEach((userData, userId) => {
      if (userData.lastActivity.getTime() < fiveMinutesAgo) {
        const socket = io.sockets.sockets.get(userData.socketId)
        if (socket) {
          socket.disconnect(true)
        }
      }
    })
  }, 30000)

  console.log('✅ WebSocket server fully initialized')
  return io
}

module.exports = setupWebSocket
