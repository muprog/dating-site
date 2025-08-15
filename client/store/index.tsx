import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import rootReducer from './rootReducer'
import rootSaga from './rootSaga'

const sagaMiddleware = createSagaMiddleware()

// Configure persistence
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // Only persist user state
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (gDM) =>
    gDM({
      thunk: false,
      serializableCheck: {
        ignoredActions: [
          'user/registerRequest',
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    }).concat(sagaMiddleware),
})

export const persistor = persistStore(store)

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
