import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserProfile {
  _id: string
  name: string
  age: number
  bio: string
  photos: string[]
  gender: string
  interests: string[]
  location: string
  geoLocation: {
    type: string
    coordinates: [number, number]
  }
}

interface DiscoveryState {
  recommendedUsers: UserProfile[]
  loading: boolean
  error: string | null
  swipeHistory: {
    likedUsers: string[]
    passedUsers: string[]
  }
  loadingSwipeHistory: boolean
}

const initialState: DiscoveryState = {
  recommendedUsers: [],
  loading: false,
  error: null,
  swipeHistory: {
    likedUsers: [],
    passedUsers: [],
  },
  loadingSwipeHistory: false,
}

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    getRecommendationsRequest: (
      state,
      action: PayloadAction<{
        latitude?: number
        longitude?: number
        gender?: string
      }>
    ) => {
      state.loading = true
      state.error = null
    },

    getRecommendationsSuccess: (
      state,
      action: PayloadAction<{ users: UserProfile[] }>
    ) => {
      state.loading = false

      state.recommendedUsers = action.payload.users
      state.error = null
    },
    getRecommendationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    addLikedUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      if (!state.swipeHistory.likedUsers.includes(userId)) {
        state.swipeHistory.likedUsers.push(userId)
        state.swipeHistory.passedUsers = state.swipeHistory.passedUsers.filter(
          (id) => id !== userId
        )
      }
    },
    addPassedUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      if (!state.swipeHistory.passedUsers.includes(userId)) {
        state.swipeHistory.passedUsers.push(userId)
      }
    },
    updatePassToLike: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      if (!state.swipeHistory.likedUsers.includes(userId)) {
        state.swipeHistory.likedUsers.push(userId)
      }
      state.swipeHistory.passedUsers = state.swipeHistory.passedUsers.filter(
        (id) => id !== userId
      )
    },
    clearRecommendations: (state) => {
      state.recommendedUsers = []
    },
    clearSwipeHistory: (state) => {
      state.swipeHistory = {
        likedUsers: [],
        passedUsers: [],
      }
    },
    clearError: (state) => {
      state.error = null
    },
    getSwipeHistoryRequest: (state) => {
      state.loadingSwipeHistory = true
    },
    getSwipeHistorySuccess: (
      state,
      action: PayloadAction<{
        likedUsers: string[]
        passedUsers: string[]
      }>
    ) => {
      state.loadingSwipeHistory = false
      state.swipeHistory = action.payload
    },
    getSwipeHistoryFailure: (state, action: PayloadAction<string>) => {
      state.loadingSwipeHistory = false
      state.error = action.payload
    },
    clearDiscovery: (state) => {
      state.recommendedUsers = []
      state.swipeHistory = { likedUsers: [], passedUsers: [] }
      state.loading = false
      state.loadingSwipeHistory = false
      state.error = null
    },
    updateLikeToPass: (state, action: PayloadAction<string>) => {
      const userId = action.payload
      state.swipeHistory.likedUsers = state.swipeHistory.likedUsers.filter(
        (id) => id !== userId
      )
      if (!state.swipeHistory.passedUsers.includes(userId)) {
        state.swipeHistory.passedUsers.push(userId)
      }
    },
  },
})

export const {
  getRecommendationsRequest,
  getRecommendationsSuccess,
  getRecommendationsFailure,
  getSwipeHistoryRequest,
  getSwipeHistorySuccess,
  getSwipeHistoryFailure,
  addLikedUser,
  addPassedUser,
  updatePassToLike,
  clearRecommendations,
  clearSwipeHistory,
  clearError,
  clearDiscovery,
  updateLikeToPass,
} = discoverySlice.actions

export default discoverySlice.reducer
