import { call, put, takeLatest } from 'redux-saga/effects'
import axios from 'axios'
import {
  checkAuthStatusRequest,
  checkAuthStatusSuccess,
  checkAuthStatusFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  createOrUpdateUserRequest,
  createOrUpdateUserSuccess,
  createOrUpdateUserFailure,
  updateUserProfileRequest,
  updateUserProfileSuccess,
  updateUserProfileFailure,
} from './authSlice'

// API functions
const api = {
  checkAuthStatus: () =>
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
      withCredentials: true,
    }),

  logout: () =>
    axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      }
    ),

  createOrUpdateUser: (userData: any) =>
    axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, userData, {
      withCredentials: true,
    }),

  updateUserProfile: (userId: string, updates: any) =>
    axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/user/${userId}`,
      updates,
      {
        withCredentials: true,
      }
    ),
}

// Sagas
function* checkAuthStatusSaga(): Generator<any, void, any> {
  try {
    const response: any = yield call(api.checkAuthStatus)
    if (response.data?.user) {
      yield put(checkAuthStatusSuccess(response.data))
    } else {
      yield put(checkAuthStatusFailure('No user found'))
    }
  } catch (error: any) {
    yield put(
      checkAuthStatusFailure(
        error.response?.data?.message || 'Authentication check failed'
      )
    )
  }
}

function* logoutSaga(): Generator<any, void, any> {
  try {
    yield call(api.logout)
    yield put(logoutSuccess())
  } catch (error: any) {
    yield put(logoutFailure(error.response?.data?.message || 'Logout failed'))
  }
}

function* createOrUpdateUserSaga(
  action: ReturnType<typeof createOrUpdateUserRequest>
): Generator<any, void, any> {
  try {
    const response: any = yield call(api.createOrUpdateUser, action.payload)
    yield put(createOrUpdateUserSuccess(response.data.user))
  } catch (error: any) {
    yield put(
      createOrUpdateUserFailure(
        error.response?.data?.message || 'User creation failed'
      )
    )
  }
}

function* updateUserProfileSaga(
  action: ReturnType<typeof updateUserProfileRequest>
): Generator<any, void, any> {
  try {
    if (action.payload) {
      const response: any = yield call(
        api.updateUserProfile,
        action.payload.userId,
        action.payload.updates
      )
      yield put(updateUserProfileSuccess(response.data.user))
    }
  } catch (error: any) {
    yield put(
      updateUserProfileFailure(
        error.response?.data?.message || 'Profile update failed'
      )
    )
  }
}

// Root auth saga
export function* authSaga(): Generator<any, void, any> {
  yield takeLatest(checkAuthStatusRequest.type, checkAuthStatusSaga)
  yield takeLatest(logoutRequest.type, logoutSaga)
  yield takeLatest(createOrUpdateUserRequest.type, createOrUpdateUserSaga)
  yield takeLatest(updateUserProfileRequest.type, updateUserProfileSaga)
}
