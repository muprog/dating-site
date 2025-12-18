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
      state.messages = [...state.messages, action.payload]

      // Update last message in matches list
      const matchIndex = state.matches.findIndex(
        (m) => m._id === action.payload.matchId
      )
      if (matchIndex !== -1) {
        state.matches[matchIndex].lastMessage = action.payload.content
        state.matches[matchIndex].lastMessageAt = action.payload.createdAt
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

    // WebSocket actions
    newMessageReceived: (state, action: PayloadAction<Message>) => {
      const message = action.payload

      // Add to messages if viewing this match
      if (state.currentMatch?._id === message.matchId) {
        state.messages = [...state.messages, message]
      }

      // Update match in list
      const matchIndex = state.matches.findIndex(
        (m) => m._id === message.matchId
      )
      if (matchIndex !== -1) {
        const match = state.matches[matchIndex]

        // If match is not current match, increment unread count
        if (state.currentMatch?._id !== message.matchId) {
          match.unreadCount += 1
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
} = messageSlice.actions

export default messageSlice.reducer
