import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MessageState, Match, Message } from '../../types/messaging'

const initialState: MessageState = {
  matches: [],
  currentMatch: null,
  messages: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 50,
}

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Match actions
    replaceOptimisticMessage: (
      state,
      action: PayloadAction<{
        tempId: string
        realMessage: Message
      }>
    ) => {
      const { tempId, realMessage } = action.payload

      // Find and replace optimistic message
      const messageIndex = state.messages.findIndex((msg) => msg._id === tempId)
      if (messageIndex !== -1) {
        state.messages[messageIndex] = realMessage
      }

      // Also update match last message if needed
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
      const optimisticMessage = {
        _id: tempId,
        matchId,
        sender,
        senderId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        isOptimistic: true, // Flag to identify optimistic messages
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
        state.messages = action.payload.messages
      }
    },

    getMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    sendMessageRequest: (
      state,
      action: PayloadAction<{ matchId: string; content: string }>
    ) => {
      state.loading = true
      state.error = null
    },

    sendMessageSuccess: (state, action: PayloadAction<Message>) => {
      state.loading = false
      const savedMessage = action.payload

      // Find and replace optimistic message with saved message
      const messageIndex = state.messages.findIndex(
        (msg) => msg._id?.startsWith('temp-') || msg?.isOptimistic
      )

      if (messageIndex !== -1) {
        // Replace optimistic message with saved one
        const newMessages = [...state.messages]
        newMessages[messageIndex] = savedMessage
        state.messages = newMessages
      } else {
        // If no optimistic message found, just add it
        state.messages = [...state.messages, savedMessage]
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

    newMessageReceived: (state, action: PayloadAction<Message>) => {
      const message = action.payload

      console.log('🔄 Reducer: newMessageReceived', {
        messageId: message._id,
        matchId: message.matchId,
        currentMatchId: state.currentMatch?._id,
      })

      // Check if this message already exists (for temp messages that get replaced)
      const messageExists = state.messages.some((m) => {
        // If it's a temp message, check by content and sender
        if (
          message._id.startsWith('temp-') ||
          message._id.startsWith('socket-')
        ) {
          return (
            m.content === message.content &&
            m.sender === message.sender &&
            Math.abs(
              new Date(m.createdAt).getTime() -
                new Date(message.createdAt).getTime()
            ) < 5000
          )
        }
        // For regular messages, check by ID
        return m._id === message._id
      })

      if (messageExists) {
        console.log('⚠️ Message already exists, skipping')
        return
      }

      // Add to messages if viewing this match
      if (state.currentMatch?._id === message.matchId) {
        state.messages = [...state.messages, message]
        console.log('✅ Added message to current match')
      }

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
    },

    clearError: (state) => {
      state.error = null
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
} = messageSlice.actions

export default messageSlice.reducer
