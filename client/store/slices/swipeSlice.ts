// import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// interface SwipeState {
//   loading: boolean
//   error: string | null
//   lastMatch: any | null
// }

// const initialState: SwipeState = {
//   loading: false,
//   error: null,
//   lastMatch: null,
// }

// const swipeSlice = createSlice({
//   name: 'swipe',
//   initialState,
//   reducers: {
//     // Request action - triggered by component
//     createSwipeRequest: (
//       state,
//       action: PayloadAction<{ swipedUserId: string; action: 'like' | 'pass' }>
//     ) => {
//       state.loading = true
//       state.error = null
//     },
//     // Success action - called by saga
//     createSwipeSuccess: (
//       state,
//       action: PayloadAction<{ swipe: any; match: any }>
//     ) => {
//       state.loading = false
//       state.lastMatch = action.payload.match // This will be null for passes
//       state.error = null

//       if (action.payload.match) {
//         console.log('🎉 Match created:', action.payload.match)
//       } else {
//         console.log('✅ Swipe processed successfully (no match)')
//       }
//     },
//     // Failure action - called by saga
//     createSwipeFailure: (state, action: PayloadAction<string>) => {
//       state.loading = false
//       state.error = action.payload
//     },
//     clearLastMatch: (state) => {
//       state.lastMatch = null
//     },
//     clearError: (state) => {
//       state.error = null
//     },
//   },
// })

// export const {
//   createSwipeRequest,
//   createSwipeSuccess,
//   createSwipeFailure,
//   clearLastMatch,
//   clearError,
// } = swipeSlice.actions

// export default swipeSlice.reducer

// store/slices/swipeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SwipeState {
  loading: boolean
  error: string | null
  lastMatch: any | null
}

const initialState: SwipeState = {
  loading: false,
  error: null,
  lastMatch: null,
}

const swipeSlice = createSlice({
  name: 'swipe',
  initialState,
  reducers: {
    createSwipeRequest: (
      state,
      action: PayloadAction<{ swipedUserId: string; action: 'like' | 'pass' }>
    ) => {
      state.loading = true
      state.error = null
    },
    createSwipeSuccess: (
      state,
      action: PayloadAction<{ swipe: any; match: any }>
    ) => {
      state.loading = false
      state.lastMatch = action.payload.match
      state.error = null
    },
    createSwipeFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    clearLastMatch: (state) => {
      state.lastMatch = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  createSwipeRequest,
  createSwipeSuccess,
  createSwipeFailure,
  clearLastMatch,
  clearError,
} = swipeSlice.actions

export default swipeSlice.reducer
