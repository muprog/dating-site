// import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// import { MessageState, Match, Message } from '../../types/messaging'
// interface OnlineStatus {
//   userId: string
//   isOnline: boolean
//   lastSeen?: string
//   user?: any
// }

// interface TypingIndicator {
//   userId: string
//   matchId: string
//   isTyping: boolean
//   name?: string
//   user?: any
//   timestamp: string
// }
// const initialState: MessageState = {
//   matches: [],
//   currentMatch: null,
//   messages: [],
//   loading: false,
//   error: null,
//   hasMore: true,
//   page: 1,
//   limit: 50,
//   typingIndicators: [],
//   onlineStatus: {},
// }

// const messageSlice = createSlice({
//   name: 'messages',
//   initialState,
//   reducers: {
//     // Match actions
//     replaceOptimisticMessage: (
//       state,
//       action: PayloadAction<{
//         tempId: string
//         realMessage: Message
//       }>
//     ) => {
//       const { tempId, realMessage } = action.payload

//       // Find and replace optimistic message
//       const messageIndex = state.messages.findIndex((msg) => msg._id === tempId)
//       if (messageIndex !== -1) {
//         state.messages[messageIndex] = realMessage
//       }

//       // Also update match last message if needed
//       const matchIndex = state.matches.findIndex(
//         (m) => m._id === realMessage.matchId
//       )
//       if (
//         matchIndex !== -1 &&
//         state.matches[matchIndex].lastMessage === realMessage.content
//       ) {
//         state.matches[matchIndex].lastMessageAt = realMessage.createdAt
//       }
//     },

//     sendMessageOptimistic: (
//       state,
//       action: PayloadAction<{
//         tempId: string
//         matchId: string
//         content: string
//         sender: string
//         senderId: any
//       }>
//     ) => {
//       const { tempId, matchId, content, sender, senderId } = action.payload

//       // Create optimistic message
//       const optimisticMessage = {
//         _id: tempId,
//         matchId,
//         sender,
//         senderId,
//         content,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//         isRead: false,
//         isOptimistic: true, // Flag to identify optimistic messages
//       }

//       // Add to messages immediately
//       state.messages = [...state.messages, optimisticMessage]

//       // Update match in list
//       const matchIndex = state.matches.findIndex((m) => m._id === matchId)
//       if (matchIndex !== -1) {
//         state.matches[matchIndex].lastMessage = content
//         state.matches[matchIndex].lastMessageAt = optimisticMessage.createdAt

//         // Move match to top
//         const updatedMatch = state.matches.splice(matchIndex, 1)[0]
//         state.matches.unshift(updatedMatch)
//       }
//     },
//     getMatchesRequest: (state) => {
//       state.loading = true
//       state.error = null
//     },
//     getMatchesSuccess: (state, action: PayloadAction<Match[]>) => {
//       state.loading = false
//       state.matches = action.payload
//     },
//     getMatchesFailure: (state, action: PayloadAction<string>) => {
//       state.loading = false
//       state.error = action.payload
//     },

//     setCurrentMatch: (state, action: PayloadAction<Match | null>) => {
//       state.currentMatch = action.payload
//       state.messages = []
//       state.page = 1
//       state.hasMore = true
//     },

//     // Message actions
//     getMessagesRequest: (
//       state,
//       action: PayloadAction<{ matchId: string; page?: number }>
//     ) => {
//       state.loading = true
//       state.error = null
//     },

//     getMessagesSuccess: (
//       state,
//       action: PayloadAction<{ messages: Message[]; matchId: string }>
//     ) => {
//       state.loading = false

//       if (state.currentMatch?._id === action.payload.matchId) {
//         state.messages = action.payload.messages
//       }
//     },

//     getMessagesFailure: (state, action: PayloadAction<string>) => {
//       state.loading = false
//       state.error = action.payload
//     },

//     sendMessageRequest: (
//       state,
//       action: PayloadAction<{
//         matchId: string
//         content: string
//         tempId?: string
//       }>
//     ) => {
//       state.loading = true
//       state.error = null
//     },

//     sendMessageSuccess: (state, action: PayloadAction<Message>) => {
//       state.loading = false
//       const savedMessage = action.payload

//       // Find and replace optimistic message with saved message
//       const messageIndex = state.messages.findIndex(
//         (msg) => msg._id?.startsWith('temp-') || msg?.isOptimistic
//       )

//       if (messageIndex !== -1) {
//         // Replace optimistic message with saved one
//         const newMessages = [...state.messages]
//         newMessages[messageIndex] = savedMessage
//         state.messages = newMessages
//       } else {
//         // If no optimistic message found, just add it
//         state.messages = [...state.messages, savedMessage]
//       }

//       // Update last message in matches list
//       const matchIndex = state.matches.findIndex(
//         (m) => m._id === savedMessage.matchId
//       )
//       if (matchIndex !== -1) {
//         state.matches[matchIndex].lastMessage = savedMessage.content
//         state.matches[matchIndex].lastMessageAt = savedMessage.createdAt
//       }
//     },

//     sendMessageFailure: (state, action: PayloadAction<string>) => {
//       state.loading = false
//       state.error = action.payload
//     },

//     markMessagesReadRequest: (state, action: PayloadAction<string>) => {
//       const matchId = action.payload
//       const matchIndex = state.matches.findIndex((m) => m._id === matchId)
//       if (matchIndex !== -1) {
//         state.matches[matchIndex].unreadCount = 0
//       }
//     },

//     newMessageReceived: (state, action: PayloadAction<Message>) => {
//       const message = action.payload

//       console.log('🔄 Reducer: newMessageReceived', {
//         messageId: message._id,
//         matchId: message.matchId,
//         currentMatchId: state.currentMatch?._id,
//       })

//       // Check if this message already exists (for temp messages that get replaced)
//       const messageExists = state.messages.some((m) => {
//         // If it's a temp message, check by content and sender
//         if (
//           message._id.startsWith('temp-') ||
//           message._id.startsWith('socket-')
//         ) {
//           return (
//             m.content === message.content &&
//             m.sender === message.sender &&
//             Math.abs(
//               new Date(m.createdAt).getTime() -
//                 new Date(message.createdAt).getTime()
//             ) < 5000
//           )
//         }
//         // For regular messages, check by ID
//         return m._id === message._id
//       })

//       if (messageExists) {
//         console.log('⚠️ Message already exists, skipping')
//         return
//       }

//       // Add to messages if viewing this match
//       if (state.currentMatch?._id === message.matchId) {
//         state.messages = [...state.messages, message]
//         console.log('✅ Added message to current match')
//       }

//       // Update match in list
//       const matchIndex = state.matches.findIndex(
//         (m) => m._id === message.matchId
//       )
//       if (matchIndex !== -1) {
//         const match = state.matches[matchIndex]

//         // If match is not current match, increment unread count
//         if (state.currentMatch?._id !== message.matchId) {
//           match.unreadCount = (match.unreadCount || 0) + 1
//         }

//         match.lastMessage = message.content
//         match.lastMessageAt = message.createdAt

//         // Move match to top
//         const updatedMatch = state.matches.splice(matchIndex, 1)[0]
//         state.matches.unshift(updatedMatch)
//       }
//     },
//     setTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
//       const { userId, matchId, isTyping } = action.payload

//       // Remove existing typing indicator for this user in this match
//       state.typingIndicators = state.typingIndicators.filter(
//         (indicator) =>
//           !(indicator.userId === userId && indicator.matchId === matchId)
//       )

//       // Add new typing indicator if user is typing
//       if (isTyping) {
//         state.typingIndicators.push(action.payload)
//       }

//       // Update match in list if it exists
//       const matchIndex = state.matches.findIndex((m) => m._id === matchId)
//       if (matchIndex !== -1) {
//         // You can add a typing indicator to the match if needed
//         // For now, we'll just use the separate typingIndicators array
//       }
//     },

//     clearTypingIndicator: (
//       state,
//       action: PayloadAction<{ userId: string; matchId: string }>
//     ) => {
//       const { userId, matchId } = action.payload
//       state.typingIndicators = state.typingIndicators.filter(
//         (indicator) =>
//           !(indicator.userId === userId && indicator.matchId === matchId)
//       )
//     },

//     clearAllTypingIndicators: (state) => {
//       state.typingIndicators = []
//     },

//     // ============ ONLINE STATUS ============
//     setOnlineStatus: (state, action: PayloadAction<OnlineStatus>) => {
//       const { userId, isOnline, lastSeen, user } = action.payload
//       state.onlineStatus[userId] = { isOnline, lastSeen, user }

//       // Update match user online status
//       state.matches = state.matches.map((match) => {
//         if (match.otherUser?._id === userId) {
//           return {
//             ...match,
//             otherUser: {
//               ...match.otherUser,
//               online: isOnline,
//               lastSeen,
//             },
//           }
//         }
//         return match
//       })
//     },

//     setOnlineStatusBatch: (
//       state,
//       action: PayloadAction<
//         Record<string, { isOnline: boolean; lastSeen?: string; user?: any }>
//       >
//     ) => {
//       state.onlineStatus = { ...state.onlineStatus, ...action.payload }

//       // Update match user online status
//       state.matches = state.matches.map((match) => {
//         const otherUserId = match.otherUser?._id
//         if (otherUserId && action.payload[otherUserId]) {
//           return {
//             ...match,
//             otherUser: {
//               ...match.otherUser,
//               online: action.payload[otherUserId].isOnline,
//               lastSeen: action.payload[otherUserId].lastSeen,
//             },
//           }
//         }
//         return match
//       })
//     },

//     clearError: (state) => {
//       state.error = null
//     },
//   },
// })

// export const {
//   getMatchesRequest,
//   getMatchesSuccess,
//   getMatchesFailure,
//   setCurrentMatch,
//   getMessagesRequest,
//   getMessagesSuccess,
//   getMessagesFailure,
//   sendMessageRequest,
//   sendMessageSuccess,
//   sendMessageFailure,
//   markMessagesReadRequest,
//   newMessageReceived,
//   clearError,
//   sendMessageOptimistic,
//   replaceOptimisticMessage,
//   setTypingIndicator,
//   clearTypingIndicator,
//   clearAllTypingIndicators,
//   setOnlineStatus,
//   setOnlineStatusBatch,
// } = messageSlice.actions

// export default messageSlice.reducer

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MessageState, Match, Message, User } from '../../types/messaging'

interface OnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen?: string
  user?: User
}
interface TypingIndicator {
  userId: string
  matchId: string
  isTyping: boolean
  name?: string
  user?: any
  timestamp: string
}

const initialState: MessageState = {
  matches: [],
  currentMatch: null,
  messages: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 50,
  typingIndicators: [],
  onlineStatus: {},
  totalUnread: 0, // Add this
  loadingUnread: false,
}

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Match actions
    getMatchesRequest: (state) => {
      state.loading = true
      state.error = null
    },

    getMatchesSuccess: (state, action: PayloadAction<Match[]>) => {
      state.loading = false
      state.matches = action.payload
    },

    getMatchesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    setCurrentMatch: (state, action: PayloadAction<Match | null>) => {
      state.currentMatch = action.payload
      state.messages = []
      state.page = 1
      state.hasMore = true
    },

    // Message actions
    getMessagesRequest: (
      state,
      action: PayloadAction<{ matchId: string; page?: number }>
    ) => {
      state.loading = true
      state.error = null
    },

    getMessagesSuccess: (
      state,
      action: PayloadAction<{ messages: Message[]; matchId: string }>
    ) => {
      state.loading = false

      if (state.currentMatch?._id === action.payload.matchId) {
        // Create a map of message IDs to ensure uniqueness
        const messageMap = new Map<string, Message>()

        // First, add all existing messages (excluding optimistic ones that might be duplicates)
        state.messages.forEach((msg) => {
          if (!msg.isOptimistic && !msg._id?.startsWith('temp-')) {
            messageMap.set(msg._id, msg)
          }
        })

        // Then add new messages from payload
        action.payload.messages.forEach((msg) => {
          messageMap.set(msg._id, msg)
        })

        // Convert back to array and sort by timestamp
        const uniqueMessages = Array.from(messageMap.values()).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )

        state.messages = uniqueMessages
      }
    },

    getMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    // Optimistic message handling
    sendMessageOptimistic: (
      state,
      action: PayloadAction<{
        tempId: string
        matchId: string
        content: string
        sender: string
        senderId: any
      }>
    ) => {
      const { tempId, matchId, content, sender, senderId } = action.payload

      // Create optimistic message
      const optimisticMessage: Message = {
        _id: tempId,
        matchId,
        sender,
        senderId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        isOptimistic: true,
        tempId: tempId,
      }

      // Add to messages immediately
      state.messages = [...state.messages, optimisticMessage]

      // Update match in list
      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1) {
        state.matches[matchIndex].lastMessage = content
        state.matches[matchIndex].lastMessageAt = optimisticMessage.createdAt

        // Move match to top
        const updatedMatch = state.matches.splice(matchIndex, 1)[0]
        state.matches.unshift(updatedMatch)
      }
    },

    // Replace optimistic message with real one
    replaceOptimisticMessage: (
      state,
      action: PayloadAction<{
        tempId: string
        realMessage: Message
      }>
    ) => {
      const { tempId, realMessage } = action.payload

      console.log('🔄 Replacing optimistic message:', {
        tempId,
        realMessageId: realMessage._id,
      })

      // Find and replace optimistic message
      const messageIndex = state.messages.findIndex(
        (msg) => msg._id === tempId || msg.tempId === tempId
      )

      if (messageIndex !== -1) {
        // Replace the optimistic message with the real one
        const updatedMessage = {
          ...realMessage,
          // Keep the tempId for reference if needed
        }
        state.messages[messageIndex] = updatedMessage
        console.log('✅ Optimistic message replaced successfully')
      } else {
        // If not found, add the real message
        console.log('⚠️ Optimistic message not found, adding real message')
        state.messages = [...state.messages, realMessage]
      }

      // Update match last message if needed
      const matchIndex = state.matches.findIndex(
        (m) => m._id === realMessage.matchId
      )
      if (
        matchIndex !== -1 &&
        state.matches[matchIndex].lastMessage === realMessage.content
      ) {
        state.matches[matchIndex].lastMessageAt = realMessage.createdAt
      }
    },

    sendMessageRequest: (
      state,
      action: PayloadAction<{
        matchId: string
        content: string
        tempId?: string
      }>
    ) => {
      state.loading = true
      state.error = null
    },

    sendMessageSuccess: (state, action: PayloadAction<Message>) => {
      state.loading = false
      const savedMessage = action.payload

      console.log('💾 Message saved:', {
        id: savedMessage._id,
        tempId: savedMessage.tempId,
      })

      // Try to replace by tempId first
      if (savedMessage.tempId) {
        const messageIndex = state.messages.findIndex(
          (msg) =>
            msg._id === savedMessage.tempId ||
            msg.tempId === savedMessage.tempId
        )
        if (messageIndex !== -1) {
          state.messages[messageIndex] = savedMessage
        } else {
          state.messages = [...state.messages, savedMessage]
        }
      } else {
        // Fallback: try to find by content and sender
        const messageIndex = state.messages.findIndex(
          (msg) =>
            (msg._id?.startsWith('temp-') || msg?.isOptimistic) &&
            msg.content === savedMessage.content &&
            msg.sender === savedMessage.sender &&
            Math.abs(
              new Date(msg.createdAt).getTime() -
                new Date(savedMessage.createdAt).getTime()
            ) < 10000 // Within 10 seconds
        )

        if (messageIndex !== -1) {
          state.messages[messageIndex] = savedMessage
        } else {
          state.messages = [...state.messages, savedMessage]
        }
      }

      // Update last message in matches list
      const matchIndex = state.matches.findIndex(
        (m) => m._id === savedMessage.matchId
      )
      if (matchIndex !== -1) {
        state.matches[matchIndex].lastMessage = savedMessage.content
        state.matches[matchIndex].lastMessageAt = savedMessage.createdAt
      }
    },

    sendMessageFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    markMessagesReadRequest: (state, action: PayloadAction<string>) => {
      const matchId = action.payload
      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1) {
        state.matches[matchIndex].unreadCount = 0
      }
    },
    // Add these reducers to your messageSlice
    markMessageAsRead: (
      state,
      action: PayloadAction<{ messageId: string; matchId: string }>
    ) => {
      const { messageId, matchId } = action.payload

      // Update message read status
      state.messages = state.messages.map((msg) => {
        if (msg._id === messageId) {
          return { ...msg, isRead: true }
        }
        return msg
      })

      // Decrement unread count for the match if needed
      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1 && state.matches[matchIndex].unreadCount > 0) {
        state.matches[matchIndex].unreadCount--
      }
    },

    // Update when receiving messages read confirmation
    markMessagesReadSuccess: (
      state,
      action: PayloadAction<{ matchId: string; messageIds: string[] }>
    ) => {
      const { matchId, messageIds } = action.payload

      // Mark messages as read
      state.messages = state.messages.map((msg) => {
        if (messageIds.includes(msg._id)) {
          return { ...msg, isRead: true }
        }
        return msg
      })

      // Reset unread count for this match
      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1) {
        state.matches[matchIndex].unreadCount = 0
      }
    },

    newMessageReceived: (state, action: PayloadAction<Message>) => {
      const message = action.payload

      console.log('🔄 Reducer: newMessageReceived', {
        messageId: message._id,
        tempId: message.tempId,
        matchId: message.matchId,
      })

      // Check if message already exists
      const messageExists = state.messages.some((m) => {
        // Check by ID first
        if (m._id === message._id) return true

        // Check if this is replacing a temp message
        if (message.tempId && m._id === message.tempId) return true

        // Check if this is a duplicate by content and timestamp
        if (
          m.content === message.content &&
          m.sender === message.sender &&
          m.matchId === message.matchId &&
          Math.abs(
            new Date(m.createdAt).getTime() -
              new Date(message.createdAt).getTime()
          ) < 1000
        ) {
          return true
        }

        return false
      })

      if (messageExists) {
        console.log('⚠️ Message already exists, skipping')
        return
      }

      // If this message has a tempId, remove the temp message
      if (message.tempId) {
        state.messages = state.messages.filter((m) => m._id !== message.tempId)
      }

      // Add the new message
      state.messages = [...state.messages, message]

      // Update match in list
      const matchIndex = state.matches.findIndex(
        (m) => m._id === message.matchId
      )
      if (matchIndex !== -1) {
        const match = state.matches[matchIndex]

        // If match is not current match, increment unread count
        if (state.currentMatch?._id !== message.matchId) {
          match.unreadCount = (match.unreadCount || 0) + 1
        }

        match.lastMessage = message.content
        match.lastMessageAt = message.createdAt

        // Move match to top
        const updatedMatch = state.matches.splice(matchIndex, 1)[0]
        state.matches.unshift(updatedMatch)
      }

      console.log(
        '✅ Added message to state. Total messages:',
        state.messages.length
      )
    },
    // Typing indicators
    setTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
      const { userId, matchId, isTyping, timestamp } = action.payload

      console.log('✍️ Setting typing indicator:', { userId, matchId, isTyping })

      // Remove existing typing indicator for this user in this match
      state.typingIndicators = state.typingIndicators.filter(
        (indicator) =>
          !(indicator.userId === userId && indicator.matchId === matchId)
      )

      // Add new typing indicator if user is typing
      if (isTyping) {
        state.typingIndicators.push({
          ...action.payload,
          timestamp: timestamp || new Date().toISOString(),
        })
      }

      // Keep only recent typing indicators (last 30 seconds)
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
      state.typingIndicators = state.typingIndicators.filter(
        (indicator) => indicator.timestamp > thirtySecondsAgo
      )
    },

    clearTypingIndicator: (
      state,
      action: PayloadAction<{ userId: string; matchId: string }>
    ) => {
      const { userId, matchId } = action.payload
      state.typingIndicators = state.typingIndicators.filter(
        (indicator) =>
          !(indicator.userId === userId && indicator.matchId === matchId)
      )
    },

    clearAllTypingIndicators: (state) => {
      state.typingIndicators = []
    },

    // Online status
    setOnlineStatus: (state, action: PayloadAction<OnlineStatus>) => {
      const { userId, isOnline, lastSeen, user } = action.payload
      state.onlineStatus[userId] = { isOnline, lastSeen, user }

      // Update match user online status
      state.matches = state.matches.map((match) => {
        if (match.otherUser?._id === userId) {
          return {
            ...match,
            otherUser: {
              ...match.otherUser,
              online: isOnline,
              lastSeen,
            },
          }
        }
        return match
      })
    },

    // setOnlineStatusBatch: (
    //   state,
    //   action: PayloadAction<Record<string, OnlineStatus[]>>
    // ) => {
    //   state.onlineStatus = { ...state.onlineStatus, ...action.payload }

    //   // Update match user online status
    //   state.matches = state.matches.map((match) => {
    //     const otherUserId = match.otherUser?._id
    //     if (otherUserId && action.payload[otherUserId]) {
    //       return {
    //         ...match,
    //         otherUser: {
    //           ...match.otherUser,
    //           online: action.payload[otherUserId].isOnline,
    //           lastSeen: action.payload[otherUserId].lastSeen,
    //         },
    //       }
    //     }
    //     return match
    //   })
    // },
    // In your messageSlice.ts
    // setOnlineStatusBatch: (state, action: PayloadAction<OnlineStatus[]>) => {
    //   // Convert array to object with userId as key
    //   const statusMap = action.payload.reduce((acc, status) => {
    //     acc[status.userId] = status
    //     return acc
    //   }, {} as Record<string, OnlineStatus>)

    //   state.onlineStatus = { ...state.onlineStatus, ...statusMap }

    //   // Update match user online status
    //   state.matches = state.matches.map((match) => {
    //     const otherUserId = match.otherUser?._id
    //     if (otherUserId && statusMap[otherUserId]) {
    //       return {
    //         ...match,
    //         otherUser: {
    //           ...match.otherUser,
    //           online: statusMap[otherUserId].isOnline,
    //           lastSeen: statusMap[otherUserId].lastSeen,
    //         },
    //       }
    //     }
    //     return match
    //   })
    // },
    // In messageSlice.ts
    setOnlineStatusBatch: (
      state,
      action: PayloadAction<OnlineStatus[] | Record<string, OnlineStatus>>
    ) => {
      let statusMap: Record<string, OnlineStatus>

      // Check if payload is an object with userIds as keys (from websocket)
      if (!Array.isArray(action.payload)) {
        // Convert object to array first, then to map
        statusMap = Object.entries(action.payload).reduce(
          (acc, [userId, status]) => {
            if (status && typeof status === 'object') {
              acc[userId] = {
                userId,
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
                user: status.user,
              }
            }
            return acc
          },
          {} as Record<string, OnlineStatus>
        )
      } else {
        // Payload is already an array
        statusMap = action.payload.reduce((acc, status) => {
          acc[status.userId] = status
          return acc
        }, {} as Record<string, OnlineStatus>)
      }

      state.onlineStatus = { ...state.onlineStatus, ...statusMap }

      // Update match user online status
      state.matches = state.matches.map((match) => {
        const otherUserId = match.otherUser?._id
        if (otherUserId && statusMap[otherUserId]) {
          return {
            ...match,
            otherUser: {
              ...match.otherUser,
              online: statusMap[otherUserId].isOnline,
              lastSeen: statusMap[otherUserId].lastSeen,
            },
          }
        }
        return match
      })
    },
    editMessageRequest: (
      state,
      action: PayloadAction<{
        messageId: string
        matchId: string
        content: string
      }>
    ) => {
      state.loading = true
      state.error = null
    },

    editMessageSuccess: (
      state,
      action: PayloadAction<{
        messageId: string
        matchId: string
        content: string
        updatedAt: string
      }>
    ) => {
      state.loading = false
      const { messageId, matchId, content, updatedAt } = action.payload

      // Update the message in messages array
      state.messages = state.messages.map((msg) => {
        if (msg._id === messageId) {
          return {
            ...msg,
            content,
            updatedAt,
            isEdited: true,
          }
        }
        return msg
      })

      // Update last message in matches list if this was the last message
      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1) {
        const lastMessage = state.messages
          .filter((msg) => msg.matchId === matchId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]

        if (lastMessage && lastMessage._id === messageId) {
          state.matches[matchIndex].lastMessage = content
        }
      }
    },

    editMessageFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    // Unread count reducers
    getUnreadTotalRequest: (state) => {
      state.loadingUnread = true
      state.error = null
    },

    getUnreadTotalSuccess: (
      state,
      action: PayloadAction<{
        totalUnread: number
        matchesWithUnread: Array<{ matchId: string; unreadCount: number }>
      }>
    ) => {
      state.loadingUnread = false
      state.totalUnread = action.payload.totalUnread

      // Also update individual match unread counts
      action.payload.matchesWithUnread.forEach(({ matchId, unreadCount }) => {
        const matchIndex = state.matches.findIndex((m) => m._id === matchId)
        if (matchIndex !== -1) {
          state.matches[matchIndex].unreadCount = unreadCount
        }
      })
    },

    getUnreadTotalFailure: (state, action: PayloadAction<string>) => {
      state.loadingUnread = false
      state.error = action.payload
    },

    incrementTotalUnread: (state) => {
      state.totalUnread += 1
    },

    decrementTotalUnread: (state, action: PayloadAction<number>) => {
      state.totalUnread = Math.max(0, state.totalUnread - action.payload)
    },

    resetTotalUnread: (state) => {
      state.totalUnread = 0
    },

    clearError: (state) => {
      state.error = null
    },
    clearMessages: (state) => {
      state.messages = []
      state.loading = false
      state.error = null
    },
    // Clear loading states
    clearLoading: (state) => {
      state.loading = false
    },
  },
})

export const {
  getMatchesRequest,
  getMatchesSuccess,
  getMatchesFailure,
  setCurrentMatch,
  getMessagesRequest,
  getMessagesSuccess,
  getMessagesFailure,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  markMessagesReadRequest,
  newMessageReceived,
  clearError,
  sendMessageOptimistic,
  replaceOptimisticMessage,
  setTypingIndicator,
  clearTypingIndicator,
  clearAllTypingIndicators,
  setOnlineStatus,
  setOnlineStatusBatch,
  clearLoading,
  markMessageAsRead,
  markMessagesReadSuccess,
  editMessageRequest,
  editMessageSuccess,
  editMessageFailure,
  clearMessages,
  getUnreadTotalRequest,
  getUnreadTotalSuccess,
  getUnreadTotalFailure,
  incrementTotalUnread,
  decrementTotalUnread,
  resetTotalUnread,
} = messageSlice.actions

export default messageSlice.reducer
