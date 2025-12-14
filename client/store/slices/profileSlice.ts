import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserProfile {
  _id: string
  name: string
  email: string
  age?: number
  bio?: string
  photos: string[]
  interests: string[]
  gender?: 'male' | 'female' | 'other'
  location: string
  geoLocation?: {
    type: 'Point'
    coordinates: [number, number]
  }
  preferences?: {
    ageRange: [number, number]
    genders: string[]
    maxDistance: number
  }
  verified?: boolean
  createdAt?: string
  updatedAt?: string
}

interface ProfileState {
  loading: boolean
  user: UserProfile | null
  error: string | null
  message: string | null
}

const initialState: ProfileState = {
  loading: false,
  user: null,
  error: null,
  message: null,
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Get Profile
    getProfileRequest: (state) => {
      state.loading = true
      state.error = null
    },
    getProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.loading = false
      state.user = action.payload
      state.error = null
    },
    getProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    // Update Profile
    updateProfileRequest: (
      state,
      _action: PayloadAction<Partial<UserProfile>>
    ) => {
      state.loading = true
      state.error = null
      state.message = null
    },
    updateProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.loading = false
      state.user = action.payload
      state.message = 'Profile updated successfully'
      state.error = null
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
      state.message = null
    },

    // Upload Photos
    uploadPhotosRequest: (state, _action: PayloadAction<FormData>) => {
      state.loading = true
      state.error = null
      state.message = null
    },
    uploadPhotosSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.loading = false
      state.user = action.payload
      state.message = 'Photos uploaded successfully'
      state.error = null
    },
    uploadPhotosFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
      state.message = null
    },

    // Delete Photo
    deletePhotoRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true
      state.error = null
      state.message = null
    },
    deletePhotoSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.loading = false
      state.user = action.payload
      state.message = 'Photo deleted successfully'
      state.error = null
    },
    deletePhotoFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
      state.message = null
    },

    // Clear messages and errors
    clearMessage: (state) => {
      state.message = null
    },
    clearError: (state) => {
      state.error = null
    },

    // Reset profile state
    resetProfile: (state) => {
      state.loading = false
      state.user = null
      state.error = null
      state.message = null
    },
    clearProfile: (state) => {
      state.user = null
      state.loading = false
      state.error = null
    },
  },
})

export const {
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  uploadPhotosRequest,
  uploadPhotosSuccess,
  uploadPhotosFailure,
  deletePhotoRequest,
  deletePhotoSuccess,
  deletePhotoFailure,
  clearMessage,
  clearError,
  resetProfile,

  clearProfile,
} = profileSlice.actions

export default profileSlice.reducer
