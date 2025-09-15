import { createSlice, PayloadAction } from '@reduxjs/toolkit'
interface User {
  _id?: String
  name: String
  email: String
  picture?: String
  photos?: String[]
  age?: String
  gender?: 'male' | 'female' | 'other'
  location?: String
  bio?: String
  interests?: String[]
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
    getProfileRequest(state) {
      state.loading = true
      state.error = null
    },
    getProfileSuccess(state, action: PayloadAction<User>) {
      state.loading = false
      state.user = action.payload
    },
    getProfileFailure(state, action: PayloadAction<string>) {
      state.loading = false
      state.error = action.payload
    },

    // Update profile
    updateProfileRequest(state, _action: PayloadAction<Partial<User>>) {
      state.loading = true
      state.error = null
    },
    updateProfileSuccess(state, action: PayloadAction<User>) {
      state.loading = false
      state.user = action.payload
      state.successMessage = 'Profile updated successfully'
    },
    updateProfileFailure(state, action: PayloadAction<string>) {
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
  },
})

export const {
  logout,
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
} = userSlice.actions
export default userSlice.reducer
