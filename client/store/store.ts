// import { configureStore } from '@reduxjs/toolkit'
// import createSagaMiddleware from 'redux-saga'
// import authReducer from './slices/authSlice'
// import profileReducer from './slices/profileSlice'
// import rootSaga from './sagas/rootSaga'

// const sagaMiddleware = createSagaMiddleware()

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     profile: profileReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       thunk: false,
//       serializableCheck: {
//         ignoredActions: ['profile/uploadPhotosRequest'],
//         ignoredPaths: ['profile.uploadPhotosRequest.payload'],
//       },
//     }).concat(sagaMiddleware),
// })

// sagaMiddleware.run(rootSaga)

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch
// store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import discoveryReducer from './slices/discoverySlice'
import swipeReducer from './slices/swipeSlice'
import rootSaga from './sagas/rootSaga'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    discovery: discoveryReducer, // Added discovery slice
    swipe: swipeReducer, // Added swipe slice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        ignoredActions: [
          'profile/uploadPhotosRequest',
          'discovery/getRecommendations/pending', // Add discovery actions if needed
          'swipe/createSwipe/pending', // Add swipe actions if needed
        ],
        ignoredPaths: [
          'profile.uploadPhotosRequest.payload',
          'discovery.recommendedUsers', // Add discovery paths if needed
          'swipe.lastMatch', // Add swipe paths if needed
        ],
      },
    }).concat(sagaMiddleware),
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
