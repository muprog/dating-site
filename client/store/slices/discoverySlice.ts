// // store/slices/discoverySlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// interface UserProfile {
//   _id: string
//   name: string
//   age: number
//   bio: string
//   photos: string[]
//   gender: string
//   interests: string[]
//   location: string
//   geoLocation: {
//     type: string
//     coordinates: [number, number] // [longitude, latitude]
//   }
// }

// interface DiscoveryState {
//   recommendedUsers: UserProfile[]
//   loading: boolean
//   error: string | null
// }

// const initialState: DiscoveryState = {
//   recommendedUsers: [],
//   loading: false,
//   error: null,
// }

// const discoverySlice = createSlice({
//   name: 'discovery',
//   initialState,
//   reducers: {
//     // Request action - triggered by component
//     getRecommendationsRequest: (
//       state,
//       action: PayloadAction<{ latitude?: number; longitude?: number }>
//     ) => {
//       state.loading = true
//       state.error = null
//     },
//     // Success action - called by saga
//     getRecommendationsSuccess: (
//       state,
//       action: PayloadAction<{ users: UserProfile[] }>
//     ) => {
//       state.loading = false
//       state.recommendedUsers = action.payload.users
//       state.error = null
//     },
//     // Failure action - called by saga
//     getRecommendationsFailure: (state, action: PayloadAction<string>) => {
//       state.loading = false
//       state.error = action.payload
//     },
//     clearRecommendations: (state) => {
//       state.recommendedUsers = []
//     },
//     clearError: (state) => {
//       state.error = null
//     },
//   },
// })

// export const {
//   getRecommendationsRequest,
//   getRecommendationsSuccess,
//   getRecommendationsFailure,
//   clearRecommendations,
//   clearError,
// } = discoverySlice.actions

// export default discoverySlice.reducer
// store/slices/discoverySlice.ts
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
}

const initialState: DiscoveryState = {
  recommendedUsers: [],
  loading: false,
  error: null,
  swipeHistory: {
    likedUsers: [],
    passedUsers: [],
  },
}

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    getRecommendationsRequest: (
      state,
      action: PayloadAction<{ latitude?: number; longitude?: number }>
    ) => {
      state.loading = true
      state.error = null
    },
    getRecommendationsSuccess: (
      state,
      action: PayloadAction<{ users: UserProfile[] }>
    ) => {
      state.loading = false

      // Filter out liked users but keep passed users
      const filteredUsers = action.payload.users.filter(
        (user) => !state.swipeHistory.likedUsers.includes(user._id)
      )

      state.recommendedUsers = filteredUsers
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
        // Remove from passed users if they were previously passed
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
      // Add to liked
      if (!state.swipeHistory.likedUsers.includes(userId)) {
        state.swipeHistory.likedUsers.push(userId)
      }
      // Remove from passed
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
  },
})

export const {
  getRecommendationsRequest,
  getRecommendationsSuccess,
  getRecommendationsFailure,
  addLikedUser,
  addPassedUser,
  updatePassToLike,
  clearRecommendations,
  clearSwipeHistory,
  clearError,
} = discoverySlice.actions

export default discoverySlice.reducer
