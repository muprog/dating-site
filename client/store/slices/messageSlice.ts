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
  totalUnread: 0,
  loadingUnread: false,
}

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
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
        const messageMap = new Map<string, Message>()

        state.messages.forEach((msg) => {
          if (!msg.isOptimistic && !msg._id?.startsWith('temp-')) {
            messageMap.set(msg._id, msg)
          }
        })
        action.payload.messages.forEach((msg) => {
          messageMap.set(msg._id, msg)
        })

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

      state.messages = [...state.messages, optimisticMessage]

      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1) {
        state.matches[matchIndex].lastMessage = content
        state.matches[matchIndex].lastMessageAt = optimisticMessage.createdAt

        const updatedMatch = state.matches.splice(matchIndex, 1)[0]
        state.matches.unshift(updatedMatch)
      }
    },

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

      const messageIndex = state.messages.findIndex(
        (msg) => msg._id === tempId || msg.tempId === tempId
      )

      if (messageIndex !== -1) {
        const updatedMessage = {
          ...realMessage,
        }
        state.messages[messageIndex] = updatedMessage
        console.log('✅ Optimistic message replaced successfully')
      } else {
        console.log('⚠️ Optimistic message not found, adding real message')
        state.messages = [...state.messages, realMessage]
      }

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
        const messageIndex = state.messages.findIndex(
          (msg) =>
            (msg._id?.startsWith('temp-') || msg?.isOptimistic) &&
            msg.content === savedMessage.content &&
            msg.sender === savedMessage.sender &&
            Math.abs(
              new Date(msg.createdAt).getTime() -
                new Date(savedMessage.createdAt).getTime()
            ) < 10000
        )

        if (messageIndex !== -1) {
          state.messages[messageIndex] = savedMessage
        } else {
          state.messages = [...state.messages, savedMessage]
        }
      }

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
    markMessageAsRead: (
      state,
      action: PayloadAction<{ messageId: string; matchId: string }>
    ) => {
      const { messageId, matchId } = action.payload

      state.messages = state.messages.map((msg) => {
        if (msg._id === messageId) {
          return { ...msg, isRead: true }
        }
        return msg
      })
      const matchIndex = state.matches.findIndex((m) => m._id === matchId)
      if (matchIndex !== -1 && state.matches[matchIndex].unreadCount > 0) {
        state.matches[matchIndex].unreadCount--
      }
    },

    markMessagesReadSuccess: (
      state,
      action: PayloadAction<{ matchId: string; messageIds: string[] }>
    ) => {
      const { matchId, messageIds } = action.payload

      state.messages = state.messages.map((msg) => {
        if (messageIds.includes(msg._id)) {
          return { ...msg, isRead: true }
        }
        return msg
      })

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

      const messageExists = state.messages.some((m) => {
        if (m._id === message._id) return true
        if (message.tempId && m._id === message.tempId) return true
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

      if (message.tempId) {
        state.messages = state.messages.filter((m) => m._id !== message.tempId)
      }
      state.messages = [...state.messages, message]
      const matchIndex = state.matches.findIndex(
        (m) => m._id === message.matchId
      )
      if (matchIndex !== -1) {
        const match = state.matches[matchIndex]

        if (state.currentMatch?._id !== message.matchId) {
          match.unreadCount = (match.unreadCount || 0) + 1
        }

        match.lastMessage = message.content
        match.lastMessageAt = message.createdAt

        const updatedMatch = state.matches.splice(matchIndex, 1)[0]
        state.matches.unshift(updatedMatch)
      }

      console.log(
        '✅ Added message to state. Total messages:',
        state.messages.length
      )
    },
    setTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
      const { userId, matchId, isTyping, timestamp } = action.payload

      console.log('✍️ Setting typing indicator:', { userId, matchId, isTyping })
      state.typingIndicators = state.typingIndicators.filter(
        (indicator) =>
          !(indicator.userId === userId && indicator.matchId === matchId)
      )
      if (isTyping) {
        state.typingIndicators.push({
          ...action.payload,
          timestamp: timestamp || new Date().toISOString(),
        })
      }
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
    setOnlineStatus: (state, action: PayloadAction<OnlineStatus>) => {
      const { userId, isOnline, lastSeen, user } = action.payload
      state.onlineStatus[userId] = { isOnline, lastSeen, user }

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

    setOnlineStatusBatch: (
      state,
      action: PayloadAction<OnlineStatus[] | Record<string, OnlineStatus>>
    ) => {
      let statusMap: Record<string, OnlineStatus>

      if (!Array.isArray(action.payload)) {
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
        statusMap = action.payload.reduce((acc, status) => {
          acc[status.userId] = status
          return acc
        }, {} as Record<string, OnlineStatus>)
      }

      state.onlineStatus = { ...state.onlineStatus, ...statusMap }

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
