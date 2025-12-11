// store/slices/matchSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface MatchUser {
  _id: string
  name: string
  age: number
  photos: string[]
  bio: string
  gender: string
  location: string
}

interface Match {
  _id: string
  user: MatchUser
  createdAt: string
}

interface MatchState {
  matches: Match[]
  loading: boolean
  error: string | null
}

const initialState: MatchState = {
  matches: [],
  loading: false,
  error: null,
}

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    getMatchesRequest: (state) => {
      state.loading = true
      state.error = null
    },
    getMatchesSuccess: (state, action: PayloadAction<Match[]>) => {
      state.loading = false
      state.matches = action.payload
      state.error = null
    },
    getMatchesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
      state.matches = []
    },
    addNewMatch: (state, action: PayloadAction<Match>) => {
      // Add new match to the beginning of the list
      state.matches.unshift(action.payload)
    },
    removeMatch: (state, action: PayloadAction<string>) => {
      // Remove match by ID (when unlike happens)
      state.matches = state.matches.filter(
        (match) => match._id !== action.payload
      )
    },
    clearMatches: (state) => {
      state.matches = []
      state.error = null
    },
  },
})

export const {
  getMatchesRequest,
  getMatchesSuccess,
  getMatchesFailure,
  addNewMatch,
  removeMatch,
  clearMatches,
} = matchSlice.actions

export default matchSlice.reducer
