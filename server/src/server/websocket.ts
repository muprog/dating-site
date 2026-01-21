// const socketIO = require('socket.io')
// const jwt = require('jsonwebtoken')
// const Message = require('../models/Message')
// const Match = require('../models/Match')
// const User = require('../models/User')

// function setupWebSocket(server: any) {
//   console.log('🚀 Initializing WebSocket server...')

//   const io = socketIO(server, {
//     cors: {
//       origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//       credentials: true,
//       methods: ['GET', 'POST'],
//       allowedHeaders: ['Content-Type', 'Authorization'],
//     },
//     transports: ['websocket', 'polling'],
//     allowUpgrades: true,
//     pingTimeout: 60000,
//     pingInterval: 25000,
//   })

//   console.log('✅ WebSocket server created')

//   // Authentication middleware
//   io.use(async (socket: any, next: any) => {
//     try {
//       let token = socket.handshake.auth.token || socket.handshake.query.token

//       // Check cookies
//       if (!token && socket.handshake.headers.cookie) {
//         const cookies = socket.handshake.headers.cookie.split(';')
//         const tokenCookie = cookies.find((c: any) =>
//           c.trim().startsWith('token=')
//         )
//         if (tokenCookie) {
//           token = tokenCookie.split('=')[1]
//         }
//       }

//       if (!token) {
//         console.log('⚠️ No token found, allowing anonymous connection')
//         socket.userId = 'anonymous'
//         return next()
//       }

//       // Verify token
//       const decoded = jwt.verify(
//         token,
//         process.env.JWT_SECRET || 'your-secret-key'
//       )
//       console.log('✅ Token verified for user:', decoded.id)

//       // Get user from database
//       const user = await User.findById(decoded.id).select('name photos age')
//       if (!user) {
//         throw new Error('User not found')
//       }

//       socket.userId = decoded.id
//       socket.user = user
//       next()
//     } catch (error: any) {
//       console.error('❌ WebSocket auth error:', error.message)
//       socket.userId = 'unauthenticated'
//       next()
//     }
//   })
//   const connectedUsers = new Map()
//   io.on('connection', (socket: any) => {
//     console.log('🎉 New WebSocket connection:', {
//       socketId: socket.id,
//       userId: socket.userId,
//       userName: socket.user?.name,
//     })
//     if (
//       socket.userId &&
//       socket.userId !== 'anonymous' &&
//       socket.userId !== 'unauthenticated'
//     ) {
//       connectedUsers.set(socket.userId.toString(), {
//         socketId: socket.id,
//         userId: socket.userId,
//         user: socket.user,
//       })

//       // Broadcast user online status
//       socket.broadcast.emit('user-online', socket.userId.toString())
//       console.log(`🟢 User ${socket.userId} is now online`)
//     }

//     // Welcome message
//     socket.emit('welcome', {
//       message: 'Connected to WebSocket server',
//       socketId: socket.id,
//       userId: socket.userId,
//       timestamp: new Date().toISOString(),
//     })

//     // Handle match room joining
//     socket.on('join-match', (matchId: any) => {
//       if (!matchId) {
//         console.error('❌ join-match: No matchId provided')
//         return
//       }

//       const roomName = `match-${matchId}`
//       socket.join(roomName)
//       console.log(`🚪 User ${socket.userId} joined room: ${roomName}`)

//       socket.emit('joined-room', {
//         room: roomName,
//         matchId: matchId,
//         timestamp: new Date().toISOString(),
//       })
//     })

//     // Handle match room leaving
//     socket.on('leave-match', (matchId: any) => {
//       if (!matchId) {
//         console.error('❌ leave-match: No matchId provided')
//         return
//       }

//       const roomName = `match-${matchId}`
//       socket.leave(roomName)
//       console.log(`🚪 User ${socket.userId} left room: ${roomName}`)
//     })

//     // Handle sending messages - UPDATED TO SAVE TO DATABASE
//     socket.on('send-message', async (data: any) => {
//       const { matchId, content } = data

//       if (!matchId || !content) {
//         console.error('❌ send-message: Missing matchId or content')
//         socket.emit('message-error', { error: 'Missing data' })
//         return
//       }

//       console.log(
//         `💬 User ${socket.userId} sending to ${matchId}:`,
//         content.substring(0, 50)
//       )

//       try {
//         // 1. Verify user has access to this match
//         const match = await Match.findOne({
//           _id: matchId,
//           users: socket.userId,
//           active: true,
//         }).populate('users', 'name photos age')

//         if (!match) {
//           throw new Error('Access denied or match not found')
//         }

//         // 2. Create and save message to database
//         const message = new Message({
//           matchId,
//           senderId: socket.userId,
//           content: content.trim(),
//         })

//         await message.save()

//         // 3. Populate message with sender info
//         const populatedMessage = await Message.findById(message._id)
//           .populate('senderId', 'name photos age')
//           .lean()

//         // 4. Transform message for frontend
//         const messageData = {
//           _id: populatedMessage._id.toString(),
//           matchId: populatedMessage.matchId.toString(),
//           sender: populatedMessage.senderId._id.toString(),
//           senderId: {
//             _id: populatedMessage.senderId._id.toString(),
//             name: populatedMessage.senderId.name || 'Unknown',
//             photos: populatedMessage.senderId.photos || [],
//             age: populatedMessage.senderId.age,
//           },
//           content: populatedMessage.content,
//           createdAt: populatedMessage.createdAt.toISOString(),
//           updatedAt: populatedMessage.updatedAt.toISOString(),
//           isRead: false,
//         }

//         // 5. Update match with last message
//         match.lastMessage = content.trim()
//         match.lastMessageAt = new Date()

//         // 6. Increment unread count for the other user
//         const otherUser = match.users.find(
//           (user: any) => user._id.toString() !== socket.userId.toString()
//         )

//         if (otherUser && match.unreadCounts) {
//           const otherUserId = otherUser._id.toString()
//           if (typeof match.unreadCounts.get === 'function') {
//             const currentUnread = match.unreadCounts.get(otherUserId) || 0
//             match.unreadCounts.set(otherUserId, currentUnread + 1)
//           } else {
//             match.unreadCounts[otherUserId] =
//               (match.unreadCounts[otherUserId] || 0) + 1
//           }
//         }

//         await match.save()

//         // 7. Broadcast to match room
//         const roomName = `match-${matchId}`
//         io.to(roomName).emit('new-message', messageData)
//         console.log(`📤 Message saved and broadcasted to ${roomName}`)

//         // 8. Send confirmation to sender
//         socket.emit('message-sent', {
//           success: true,
//           message: messageData,
//           timestamp: new Date().toISOString(),
//         })
//       } catch (error: any) {
//         console.error('❌ Error sending message via WebSocket:', error)
//         socket.emit('message-error', {
//           error: error.message || 'Failed to send message',
//         })
//       }
//     })

//     // Handle disconnection
//     socket.on('disconnect', (reason: any) => {
//       console.log(`❌ User ${socket.userId} disconnected:`, reason)
//     })

//     socket.on('typing', (data: any) => {
//       const { matchId, isTyping } = data
//       console.log(`✍️ Typing event from ${socket.userId}:`, isTyping)

//       // Broadcast to match room (except sender)
//       socket.to(`match-${matchId}`).emit('user-typing', {
//         matchId,
//         userId: socket.userId,
//         isTyping,
//         timestamp: new Date().toISOString(),
//       })
//     })

//     // Handle read receipts
//     socket.on('mark-read', async (data: any) => {
//       const { matchId, messageIds } = data
//       console.log(`📖 Read receipt from ${socket.userId} for match ${matchId}`)

//       try {
//         // Update messages as read in database
//         await Message.updateMany(
//           {
//             _id: { $in: messageIds },
//             senderId: { $ne: socket.userId },
//           },
//           {
//             $set: {
//               isRead: true,
//               readAt: new Date(),
//             },
//           }
//         )

//         // Update match unread count
//         await Match.findByIdAndUpdate(matchId, {
//           $set: { [`unreadCounts.${socket.userId}`]: 0 },
//         })

//         // Broadcast read receipt to match room
//         socket.to(`match-${matchId}`).emit('messages-read', {
//           matchId,
//           userId: socket.userId,
//           messageIds,
//           timestamp: new Date().toISOString(),
//         })
//       } catch (error) {
//         console.error('❌ Error marking messages as read:', error)
//       }
//     })

//     // Handle disconnection
//     socket.on('disconnect', (reason: any) => {
//       console.log(`❌ User ${socket.userId} disconnected:`, reason)

//       // Remove from connected users
//       if (connectedUsers.has(socket.userId?.toString())) {
//         connectedUsers.delete(socket.userId.toString())

//         // Broadcast user offline status
//         socket.broadcast.emit('user-offline', socket.userId?.toString())
//         console.log(`🔴 User ${socket.userId} is now offline`)
//       }
//     })

//     // Handle errors
//     // socket.on('error', (error: any) => {
//     //   console.error(`❌ Socket error:`, error)
//     // })
//   })

//   console.log('✅ WebSocket server fully initialized')
//   return io
// }

// module.exports = setupWebSocket

const socketIO = require('socket.io')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Match = require('../models/Match')
const Message = require('../models/Message')

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

  // Store connected users in memory (no DB changes needed)
  const connectedUsers = new Map() // userId -> {socketId, user, joinedRooms, typingIn}

  // Store typing status in memory
  const typingUsers = new Map() // matchId -> Map(userId -> timestamp)

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
        console.log('⚠️ No token found, connection rejected')
        return next(new Error('Authentication required'))
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      )

      // Get user from database
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

    // Handle user connection
    const handleConnection = async () => {
      try {
        // Update user last active in DB (optional, but good for analytics)
        await User.findByIdAndUpdate(socket.userId, {
          lastActive: new Date(),
        })

        // Store in memory
        connectedUsers.set(socket.userId, {
          socketId: socket.id,
          user: socket.user,
          joinedRooms: new Set(),
          typingIn: new Set(), // Track which matches user is typing in
          lastActivity: new Date(),
        })

        // Broadcast user online status to all connected clients
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

        // Send welcome message
        socket.emit('welcome', {
          message: 'Connected to WebSocket server',
          socketId: socket.id,
          userId: socket.userId,
          timestamp: new Date().toISOString(),
        })
        await emitUnreadUpdate(io, socket.userId)

        // Send list of online users
        const onlineUsers = Array.from(connectedUsers.keys())
        socket.emit('online-users', onlineUsers)
      } catch (error) {
        console.error('❌ Error handling connection:', error)
      }
    }

    handleConnection()

    // Join match room
    socket.on('join-match', async (matchId: any) => {
      if (!matchId) {
        console.error('❌ join-match: No matchId provided')
        return
      }

      try {
        // Verify user is part of this match
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

        // Update memory
        const userData = connectedUsers.get(socket.userId)
        if (userData) {
          userData.joinedRooms.add(matchId)
        }

        console.log(`🚪 User ${socket.user.name} joined room: ${roomName}`)

        // Send room info to user
        socket.emit('room-joined', {
          matchId,
          room: roomName,
          timestamp: new Date().toISOString(),
        })

        // Send current typing status for this match
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

    // Leave match room
    socket.on('leave-match', (matchId: any) => {
      if (!matchId) return

      const roomName = `match-${matchId}`
      socket.leave(roomName)

      // Update memory
      const userData = connectedUsers.get(socket.userId)
      if (userData) {
        userData.joinedRooms.delete(matchId)
        userData.typingIn.delete(matchId)
      }

      console.log(`🚪 User ${socket.userId} left room: ${roomName}`)

      // Clear typing status for this match
      const matchTyping = typingUsers.get(matchId)
      if (matchTyping) {
        matchTyping.delete(socket.userId)
        if (matchTyping.size === 0) {
          typingUsers.delete(matchId)
        }
      }

      // Notify others that user stopped typing
      socket.to(roomName).emit('user-typing', {
        matchId,
        userId: socket.userId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      })
    })

    // In the typing handler, update to be more responsive:
    socket.on('typing', (data: any) => {
      const { matchId, isTyping } = data

      if (!matchId) {
        console.error('❌ typing: No matchId provided')
        return
      }

      try {
        const roomName = `match-${matchId}`

        // Broadcast to match room (except sender)
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
        // Get matches for the user
        const matches = await Match.find({
          users: userId,
          active: true,
        })

        // Calculate total unread
        let totalUnread = 0
        const matchesWithUnread = []

        for (const match of matches) {
          let unread = 0

          if (match.unreadCounts) {
            if (typeof match.unreadCounts.get === 'function') {
              // It's a Map
              unread = match.unreadCounts.get(userId) || 0
            } else {
              // It's a plain object
              unread = match.unreadCounts[userId] || 0
            }
          }

          if (unread > 0) {
            totalUnread += unread
            matchesWithUnread.push({
              matchId: match._id.toString(),
              unreadCount: unread,
            })
          }
        }

        // Find the user's socket
        const userData = connectedUsers.get(userId)
        if (userData) {
          // Emit to the specific user
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
    // Send message
    socket.on('send-message', async (data: any) => {
      const { matchId, content, tempId } = data

      if (!matchId || !content || content.trim().length === 0) {
        socket.emit('message-error', { error: 'Invalid message data' })
        return
      }

      console.log(`💬 ${socket.user.name} sending message to match ${matchId}`)

      try {
        // Verify match exists and user is part of it
        const match = await Match.findById(matchId)
        if (
          !match ||
          !match.users.some((u: any) => u.toString() === socket.userId)
        ) {
          throw new Error('Match not found or access denied')
        }

        // Create message
        const message = new Message({
          matchId,
          senderId: socket.userId,
          content: content.trim(),
        })

        await message.save()

        // Populate sender info
        await message.populate('senderId', 'name photos age')

        // Prepare message data for emission
        const messageData = {
          _id: message._id.toString(),
          tempId: tempId, // Include tempId for frontend reconciliation
          matchId: message.matchId.toString(),
          sender: message.senderId._id.toString(),
          senderId: {
            _id: message.senderId._id.toString(),
            name: message.senderId.name,
            photos: message.senderId.photos || [],
            age: message.senderId.age,
          },
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
          isRead: false,
          isOptimistic: false,
        }

        // Update match last message
        match.lastMessage = content.trim()
        match.lastMessageAt = new Date()

        // Increment unread count for other user
        const otherUser = match.users.find(
          (u: any) => u.toString() !== socket.userId
        )
        if (otherUser) {
          const currentCount = match.unreadCounts.get(otherUser.toString()) || 0
          match.unreadCounts.set(otherUser.toString(), currentCount + 1)
          await emitUnreadUpdate(io, otherUser.toString())
        }

        await match.save()

        // Clear typing status for this user in this match
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

        // Broadcast to match room
        const roomName = `match-${matchId}`
        io.to(roomName).emit('new-message', messageData)

        // Send confirmation to sender
        socket.emit('message-sent', {
          success: true,
          message: messageData,
          tempId,
          timestamp: new Date().toISOString(),
        })

        console.log(`✅ Message sent to match ${matchId}`)

        // Clear typing indicator for this user
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

    // Mark messages as read
    socket.on('mark-read', async (data: any) => {
      const { matchId, messageIds } = data

      if (!matchId || !messageIds || !Array.isArray(messageIds)) {
        return
      }

      try {
        // Update messages as read
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

        // Reset unread count for this user in match
        await Match.findByIdAndUpdate(matchId, {
          $set: { [`unreadCounts.${socket.userId}`]: 0 },
        })
        await emitUnreadUpdate(io, socket.userId)
        // Broadcast read receipt
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

    // Check online status
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

    // Check batch online status
    socket.on('check-online-batch', (userIds: any) => {
      if (!Array.isArray(userIds)) return

      // Fix: Type the statuses object properly
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
    // Handle heartbeat
    socket.on('heartbeat', () => {
      const userData = connectedUsers.get(socket.userId)
      if (userData) {
        userData.lastActivity = new Date()
      }
    })

    // Add this handler for message editing
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
        // Verify user owns the message
        const message = await Message.findById(messageId)
        if (!message) {
          throw new Error('Message not found')
        }

        if (message.senderId.toString() !== socket.userId) {
          throw new Error('You can only edit your own messages')
        }

        // Check if message is too old to edit (15 minutes limit)
        const messageAge = Date.now() - message.createdAt.getTime()
        const editTimeLimit = 15 * 60 * 1000 // 15 minutes

        if (messageAge > editTimeLimit) {
          throw new Error('Message is too old to edit')
        }

        // Update message content
        const oldContent = message.content
        message.content = content.trim()
        message.updatedAt = new Date()
        message.isEdited = true

        await message.save()

        // Populate sender info
        await message.populate('senderId', 'name photos age')

        // Prepare edited message data
        const editedMessageData = {
          messageId: message._id.toString(),
          matchId: message.matchId.toString(),
          content: message.content,
          updatedAt: message.updatedAt.toISOString(),
          isEdited: true,
          sender: {
            _id: message.senderId._id.toString(),
            name: message.senderId.name,
          },
          oldContent: oldContent, // Optional: include old content for undo feature
        }

        // Broadcast to match room
        const roomName = `match-${matchId}`
        io.to(roomName).emit('message-edited', editedMessageData)

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

        console.log(`✅ Message ${messageId} edited successfully`)

        // Send confirmation to sender
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

    // Add error event for message editing
    socket.on('edit-message-error', (error: any) => {
      console.error('❌ Edit message error:', error)
    })

    // Add success event for message editing
    socket.on('edit-message-success', (data: any) => {
      console.log('✅ Edit message success:', data)
    })

    // Handle disconnection
    socket.on('disconnect', async (reason: any) => {
      console.log(`❌ User ${socket.userId} disconnected:`, reason)

      try {
        // Get user data before removing
        const userData = connectedUsers.get(socket.userId)

        // Clear typing indicators in all rooms user was in
        if (userData) {
          userData.joinedRooms.forEach((matchId: any) => {
            // Clear from global typing map
            const matchTyping = typingUsers.get(matchId)
            if (matchTyping) {
              matchTyping.delete(socket.userId)
              if (matchTyping.size === 0) {
                typingUsers.delete(matchId)
              }
            }

            // Notify others in the room
            const roomName = `match-${matchId}`
            io.to(roomName).emit('user-typing', {
              matchId,
              userId: socket.userId,
              isTyping: false,
              timestamp: new Date().toISOString(),
            })
          })
        }

        // Remove from memory
        connectedUsers.delete(socket.userId)

        // Broadcast user offline status
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

    // Handle errors
    socket.on('error', (error: any) => {
      console.error(`❌ Socket error for ${socket.userId}:`, error)
    })
  })

  // Periodic cleanup for stale typing indicators
  setInterval(() => {
    const now = Date.now()

    // Clean up stale typing indicators (older than 5 seconds)
    typingUsers.forEach((userMap, matchId) => {
      userMap.forEach((timestamp: any, userId: any) => {
        if (now - timestamp > 5000) {
          userMap.delete(userId)

          // Notify room that user stopped typing
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

    // Clean up stale connections (inactive for 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    connectedUsers.forEach((userData, userId) => {
      if (userData.lastActivity.getTime() < fiveMinutesAgo) {
        const socket = io.sockets.sockets.get(userData.socketId)
        if (socket) {
          socket.disconnect(true)
        }
      }
    })
  }, 30000) // Run every 30 seconds

  console.log('✅ WebSocket server fully initialized')
  return io
}

module.exports = setupWebSocket
