import { combineReducers } from '@reduxjs/toolkit'
import userReducer from './user/userSlice'
import authReducer from './auth/authSlice'

const rootReducer = combineReducers({
  user: userReducer,
  auth: authReducer,
})

export default rootReducer
export type RootReducer = ReturnType<typeof rootReducer>
