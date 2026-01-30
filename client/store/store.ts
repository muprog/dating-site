import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import discoveryReducer from './slices/discoverySlice'
import swipeReducer from './slices/swipeSlice'
import rootSaga from './sagas/rootSaga'
import matchReducer from './slices/matchSlice'
import messageReducer from './slices/messageSlice'
const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    discovery: discoveryReducer,
    swipe: swipeReducer,
    match: matchReducer,
    messages: messageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        ignoredActions: [
          'profile/uploadPhotosRequest',
          'discovery/getRecommendations/pending',
          'swipe/createSwipe/pending',
          'messages/newMessageReceived',
        ],
        ignoredPaths: [
          'profile.uploadPhotosRequest.payload',
          'discovery.recommendedUsers',
          'swipe.lastMatch',
          'messages.messages',
        ],
      },
    }).concat(sagaMiddleware),
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
