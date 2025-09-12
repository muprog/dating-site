import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export interface pendingUser {
  id?: string
  email: string
  name: string
  provider: 'google' | 'facebook'
  picture?: string
  photos?: string[]
  age?: string | number
  gender?: 'male' | 'female' | 'other'
  location?: string
  bio?: string
  interests?: string[]
}
export interface User {
  id: string
  email: string
  name: string
  provider: 'google' | 'facebook'
  picture?: string
  photos?: string[]
  age?: string | number
  gender?: 'male' | 'female' | 'other'
  location?: string
  bio?: string
  interests?: string[]
}

export interface AuthState {
  user: User | null
  pendingUser: pendingUser | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  otpPending?: boolean
}

const initialState: AuthState = {
  user: null,
  pendingUser: null,
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
    // Signup
    signupRequest: (
      state,
      action: PayloadAction<{
        name: string
        email: string
        password: string
        age: number
        gender: string
        location: string
      }>
    ) => {
      state.loading = true
      state.error = null
    },
    signupSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

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
    getProfileRequest: (state, action: PayloadAction<string>) => {
      state.loading = true
      state.error = null
    },
    getProfileSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false
      state.user = action.payload
    },
    getProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    registerInitiateRequest: (state, action) => {
      state.loading = true
      state.error = null
    },
    registerInitiateSuccess: (state, action) => {
      state.loading = false
      state.error = null
      state.pendingUser = action.payload
    },
    registerInitiateFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },

    verifyOtpRequest: (
      state,
      action: PayloadAction<{ email: string; otp: string }>
    ) => {
      state.loading = true
      state.error = null
    },
    verifyOtpSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false
      state.user = action.payload
      // state.isAuthenticated = true
      state.otpPending = false
    },
    verifyOtpFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
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
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  registerInitiateRequest,
  registerInitiateSuccess,
  registerInitiateFailure,
} = authSlice.actions

export default authSlice.reducer
