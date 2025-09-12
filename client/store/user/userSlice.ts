import { createSlice, PayloadAction } from '@reduxjs/toolkit'
interface User {
  _id?: string
  name: string
  email: string
  picture?: string[]
  age?: number
  gender?: string
  location?: string
}
interface RegisterPayload {
  name: string
  email: string
  password: string
  age: number
  gender: string
  location: string
}

interface UserState {
  loading: boolean
  error: string | null
  successMessage: string | null
  user?: User | null
  otpPhase: boolean
  pendingEmail: string | null
}

const initialState: UserState = {
  loading: false,
  error: null,
  successMessage: null,
  user: null,
  otpPhase: false,
  pendingEmail: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Step 1: initiate registration (send OTP)
    // registerRequest(state, _action: PayloadAction<FormData>) {
    //   state.loading = true
    //   state.error = null
    //   state.successMessage = null
    // },
    // registerInitiateSuccess(
    //   state,
    //   action: PayloadAction<{ email: string; message: string }>
    // ) {
    //   state.loading = false
    //   state.otpPhase = true
    //   state.pendingEmail = action.payload.email
    //   state.successMessage = action.payload.message
    // },
    // registerFailure(state, action: PayloadAction<string>) {
    //   state.loading = false
    //   state.error = action.payload
    // },

    // // Step 2: verify OTP and finalize user
    // registerVerifyRequest(
    //   state,
    //   _action: PayloadAction<{ email: string; otp: string }>
    // ) {
    //   state.loading = true
    //   state.error = null
    // },
    // registerSuccess(
    //   state,
    //   action: PayloadAction<{ name: string; email: string }>
    // ) {
    //   state.loading = false
    //   state.user = action.payload
    //   state.successMessage = 'Registration successful'
    //   state.otpPhase = false
    //   state.pendingEmail = null
    // },
    // Add to state
    loginRequest(
      state,
      _action: PayloadAction<{ email: string; password: string }>
    ) {
      state.loading = true
      state.error = null
    },
    loginSuccess(
      state,
      action: PayloadAction<{ name: string; email: string }>
    ) {
      state.loading = false
      state.user = action.payload
      state.successMessage = 'Login successful'
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
    },
    logout(state) {
      state.loading = false
      state.error = null
      state.successMessage = null
      state.user = null
      state.otpPhase = false
      state.pendingEmail = null
    },
    // Password reset actions
    forgotPasswordRequest(state, _action: PayloadAction<{ email: string }>) {
      state.loading = true
      state.error = null
      state.successMessage = null
    },
    forgotPasswordSuccess(state, action: PayloadAction<string>) {
      state.loading = false
      state.successMessage = action.payload
      state.error = null
    },
    forgotPasswordFailure(state, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
      state.successMessage = null
    },
    resetPasswordRequest(
      state,
      _action: PayloadAction<{
        email: string
        otp: string
        newPassword: string
      }>
    ) {
      state.loading = true
      state.error = null
      state.successMessage = null
    },
    resetPasswordSuccess(state, action: PayloadAction<string>) {
      state.loading = false
      state.successMessage = action.payload
      state.error = null
    },
    resetPasswordFailure(state, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
      state.successMessage = null
    },
    // Authentication check actions
    checkAuthRequest(state) {
      state.loading = true
      state.error = null
    },
    checkAuthSuccess(
      state,
      action: PayloadAction<{ name: string; email: string }>
    ) {
      state.loading = false
      state.user = action.payload
      state.error = null
    },
    checkAuthFailure(state) {
      state.loading = false
      state.user = null
      state.error = null
    },
    updateProfileRequest: (
      state,
      action: PayloadAction<{ userId: string; updates: FormData }>
    ) => {
      state.loading = true
    },
    updateProfileSuccess: (state, action) => {
      state.loading = false
      state.user = action.payload // updated user from backend
    },
    updateProfileFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    getProfileRequest: (state, _action: PayloadAction<string>) => {
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
  },
})

export const {
  // registerRequest,
  // registerInitiateSuccess,
  // registerFailure,
  // registerVerifyRequest,
  // registerSuccess,
  loginRequest,
  loginSuccess,
  loginFailure,
  logout,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  checkAuthRequest,
  checkAuthSuccess,
  checkAuthFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
} = userSlice.actions
export default userSlice.reducer
