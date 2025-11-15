// import { configureStore } from '@reduxjs/toolkit'
// import createSagaMiddleware from 'redux-saga'
// import authReducer from './slices/authSlice'
// import rootSaga from './sagas/rootSaga'

// const sagaMiddleware = createSagaMiddleware()

// export const store = configureStore({
//   reducer: {
//     auth: authReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       thunk: false,
//       serializableCheck: false,
//     }).concat(sagaMiddleware),
// })

// sagaMiddleware.run(rootSaga)

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch

// store/index.ts
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
//         ignoredActions: ['profile/uploadPhotosRequest', 'auth/loginRequest'],
//         ignoredPaths: ['profile.uploadPhotosRequest.payload'],
//       },
//     }).concat(sagaMiddleware),
// })

// sagaMiddleware.run(rootSaga)

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch
// store/store.ts
// store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import rootSaga from './sagas/rootSaga'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: false,
      serializableCheck: {
        ignoredActions: ['profile/uploadPhotosRequest'],
        ignoredPaths: ['profile.uploadPhotosRequest.payload'],
      },
    }).concat(sagaMiddleware),
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
