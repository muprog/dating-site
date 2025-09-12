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
    logout(state) {
      state.loading = false
      state.error = null
      state.successMessage = null
      state.user = null
      state.otpPhase = false
      state.pendingEmail = null
    },
    // Password reset actions
  },
})

export const {
  // registerRequest,
  // registerInitiateSuccess,
  // registerFailure,
  // registerVerifyRequest,
  // registerSuccess,

  logout,
} = userSlice.actions
export default userSlice.reducer
