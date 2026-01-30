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
    clearSwipe: (state) => {
      state.loading = false
      state.error = null
      state.lastMatch = null
    },
  },
})

export const {
  createSwipeRequest,
  createSwipeSuccess,
  createSwipeFailure,
  clearLastMatch,
  clearError,
  clearSwipe,
} = swipeSlice.actions

export default swipeSlice.reducer
