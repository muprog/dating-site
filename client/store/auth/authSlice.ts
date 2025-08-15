import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface User {
  id: string
  email: string
  name: string
  picture?: string
  provider: 'google' | 'facebook'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Check auth status
    checkAuthStatusRequest: (state) => {
      state.loading = true
      state.error = null
    },
    checkAuthStatusSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.loading = false
      state.user = action.payload.user
      state.isAuthenticated = true
      state.error = null
    },
    checkAuthStatusFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.isAuthenticated = false
      state.user = null
      state.error = action.payload
    },

    // Logout
    logoutRequest: (state) => {
      state.loading = true
      state.error = null
    },
    logoutSuccess: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
      state.loading = false
    },
    logoutFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },

    // Create or update user
    createOrUpdateUserRequest: (
      state,
      action: PayloadAction<Partial<User> & { providerId: string }>
    ) => {
      state.loading = true
      state.error = null
    },
    createOrUpdateUserSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    createOrUpdateUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    // Update user profile
    updateUserProfileRequest: (
      state,
      action: PayloadAction<{ userId: string; updates: Partial<User> }>
    ) => {
      state.loading = true
      state.error = null
    },
    updateUserProfileSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false
      state.user = action.payload
      state.error = null
    },
    updateUserProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    // Manual actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  checkAuthStatusRequest,
  checkAuthStatusSuccess,
  checkAuthStatusFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  createOrUpdateUserRequest,
  createOrUpdateUserSuccess,
  createOrUpdateUserFailure,
  updateUserProfileRequest,
  updateUserProfileSuccess,
  updateUserProfileFailure,
  setUser,
  clearUser,
  setError,
  clearError,
} = authSlice.actions

export default authSlice.reducer
