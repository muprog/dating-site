import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface RegisterPayload {
  name: string
  email: string
  password: string
}

interface VerifyOtpPayload {
  email: string
  otp: string
}

interface AuthState {
  loading: boolean
  user: any
  error: string | null
  otpSent: boolean
  verified: boolean
  message: string | null
  checkingAuth: boolean
}

const initialState: AuthState = {
  loading: false,
  user: null,
  error: null,
  otpSent: false,
  verified: false,
  message: null,
  checkingAuth: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    registerRequest: (state, _action: PayloadAction<RegisterPayload>) => {
      state.loading = true
    },
    registerSuccess: (state) => {
      state.loading = false
      state.otpSent = true
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    verifyOtpRequest: (state, _action: PayloadAction<VerifyOtpPayload>) => {
      state.loading = true
    },
    verifyOtpSuccess: (state) => {
      state.loading = false
      state.verified = true
    },
    verifyOtpFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    loginRequest: (
      state,
      _action: PayloadAction<{ email: string; password: string }>
    ) => {
      state.loading = true
    },
    // slices/authSlice.ts - Check your loginSuccess reducer
    loginSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false
      // Make sure we're storing the user object correctly
      state.user = action.payload.user || action.payload
      state.error = null

      console.log('✅ Login success - User stored:', state.user)
      console.log('✅ User ID:', state.user?.id)
      console.log('✅ User _id:', state.user?._id)
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.user = action.payload
      state.error = action.payload
    },
    forgotPasswordRequest: (
      state,
      _action: PayloadAction<{ email: string }>
    ) => {
      state.loading = true
    },
    forgotPasswordSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.message = action.payload
      state.otpSent = true // let frontend know OTP step is ready
    },

    forgotPasswordFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    resetPasswordRequest: (
      state,
      _action: PayloadAction<{ email: string; otp: string; password: string }>
    ) => {
      state.loading = true
    },
    resetPasswordSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.message = action.payload
      state.verified = true
    },
    resetPasswordFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    logoutRequest: (state) => {
      state.loading = true
    },
    logoutSuccess: (state) => {
      state.loading = false
      state.user = null
      state.error = null
    },
    logoutFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    checkAuthRequest: (state) => {
      state.checkingAuth = true
    },
    checkAuthSuccess: (state, action: PayloadAction<any>) => {
      state.checkingAuth = false
      state.user = action.payload
      state.error = null
    },
    checkAuthFailure: (state) => {
      state.checkingAuth = false
      state.user = null
      state.error = null
    },
  },
})

export const {
  registerRequest,
  registerSuccess,
  registerFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  loginRequest,
  loginSuccess,
  loginFailure,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  checkAuthRequest,
  checkAuthSuccess,
  checkAuthFailure,
} = authSlice.actions

export default authSlice.reducer
