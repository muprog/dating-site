import { call, put, takeLatest } from 'redux-saga/effects'
import axios from 'axios'
import { SagaIterator } from 'redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'

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
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  registerInitiateRequest,
  registerInitiateSuccess,
  registerInitiateFailure,
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
    axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, updates, {
      withCredentials: true,
    }),
  getProfile: (userId: string) =>
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  signup: (userData: any) =>
    axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, userData, {
      withCredentials: true,
    }),
  verifyOtp: (otpData: any) =>
    axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/verify`,
      otpData,
      {
        withCredentials: true,
      }
    ),
}

// Sagas
function* signupSaga(
  action: ReturnType<typeof signupRequest>
): Generator<any, void, any> {
  try {
    const response: any = yield call(api.signup, action.payload)
    yield put(signupSuccess(response.data.user))
  } catch (error: any) {
    yield put(signupFailure(error.response?.data?.message || 'Signup failed'))
  }
}

function* handleGetProfile(action: {
  type: string
  payload: string
}): SagaIterator {
  try {
    const response: any = yield call(api.getProfile, action.payload)
    yield put(getProfileSuccess(response.data.user)) // ✅ FIX
  } catch (err: any) {
    yield put(
      getProfileFailure(err.response?.data?.message || 'Profile fetch failed') // ✅ FIX
    )
  }
}

function* checkAuthStatusSaga(): Generator<any, void, any> {
  try {
    const response: any = yield call(api.checkAuthStatus)
    if (response.data?.user) {
      yield put(checkAuthStatusSuccess({ user: response.data.user })) // ✅ FIX
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
function* verifyOtpSaga(
  action: ReturnType<typeof verifyOtpRequest>
): SagaIterator {
  try {
    const response: any = yield call(api.verifyOtp, action.payload)
    yield put(verifyOtpSuccess(response.data.user))
  } catch (error: any) {
    yield put(
      verifyOtpFailure(
        error.response?.data?.message || 'OTP verification failed'
      )
    )
  }
}

// function* registerInitiateSaga(action: PayloadAction<FormData>): Generator {
//   try {
//     const response: any = yield call(
//       axios.post,
//       `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/initiate`,
//       action.payload,
//       { headers: { 'Content-Type': 'multipart/form-data' } }
//     )

//     // Send pendingUser to Redux
//     yield put(registerInitiateSuccess(response.data.pendingUser))
//   } catch (err: any) {
//     yield put(
//       registerInitiateFailure(err.response?.data?.message || 'Signup failed')
//     )
//   }
// }
function* registerInitiateSaga(
  action: PayloadAction<{
    name: string
    email: string
    password: string
    age: string
    gender: string
    location: string
  }>
): Generator {
  try {
    const fd = new FormData()
    fd.append('name', action.payload.name)
    fd.append('email', action.payload.email)
    fd.append('password', action.payload.password)
    fd.append('age', action.payload.age)
    fd.append('gender', action.payload.gender)
    fd.append('location', action.payload.location)

    // if you add profilePhoto later
    // fd.append('profilePhoto', action.payload.profilePhoto)

    const response: any = yield call(
      axios.post,
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/initiate`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    yield put(registerInitiateSuccess(response.data.pendingUser))
  } catch (err: any) {
    yield put(
      registerInitiateFailure(err.response?.data?.message || 'Signup failed')
    )
  }
}

// Root auth saga
export function* authSaga(): Generator<any, void, any> {
  yield takeLatest(checkAuthStatusRequest.type, checkAuthStatusSaga)
  yield takeLatest(logoutRequest.type, logoutSaga)
  yield takeLatest(createOrUpdateUserRequest.type, createOrUpdateUserSaga)
  yield takeLatest(updateUserProfileRequest.type, updateUserProfileSaga)
  yield takeLatest(getProfileRequest.type, handleGetProfile)
  yield takeLatest(signupRequest.type, signupSaga)
  yield takeLatest(registerInitiateRequest.type, registerInitiateSaga)
  yield takeLatest(verifyOtpRequest.type, verifyOtpSaga)
}
