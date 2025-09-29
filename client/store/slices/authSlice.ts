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
}

const initialState: AuthState = {
  loading: false,
  user: null,
  error: null,
  otpSent: false,
  verified: false,
  message: null,
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
    loginSuccess: (state, action: PayloadAction<any>) => {
      state.loading = false
      state.user = action.payload
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
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
} = authSlice.actions

export default authSlice.reducer
