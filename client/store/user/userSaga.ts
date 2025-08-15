import { call, put, takeLatest } from 'redux-saga/effects'
import axios from '../../util/axios'
import {
  registerRequest,
  registerSuccess,
  registerFailure,
  registerInitiateSuccess,
  registerVerifyRequest,
  loginSuccess,
  loginFailure,
  loginRequest,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  checkAuthRequest,
  checkAuthSuccess,
  checkAuthFailure,
} from './userSlice'
import { CallEffect, PutEffect } from 'redux-saga/effects'

function postRegisterInitiate(formData: FormData) {
  return axios.post('/register/initiate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

function postRegisterVerify(payload: { email: string; otp: string }) {
  return axios.post('/register/verify', payload)
}

// Step 1: initiate -> send OTP
function* handleRegisterInitiate(
  action: ReturnType<typeof registerRequest>
): Generator<CallEffect<any> | PutEffect<any>, void, any> {
  try {
    const formData: FormData = action.payload
    const email = (formData.get('email') as string) || ''
    const response: any = yield call(postRegisterInitiate, formData)
    yield put(
      registerInitiateSuccess({ email, message: response.data.message })
    )
  } catch (err: any) {
    yield put(
      registerFailure(
        err?.response?.data?.message || err.message || 'Registration failed'
      )
    )
  }
}

// Step 2: verify OTP -> create user
function* handleRegisterVerify(
  action: ReturnType<typeof registerVerifyRequest>
): Generator<CallEffect<any> | PutEffect<any>, void, any> {
  try {
    const response: any = yield call(postRegisterVerify, action.payload)
    yield put(registerSuccess(response.data.user))
  } catch (err: any) {
    yield put(
      registerFailure(
        err?.response?.data?.message || err.message || 'Verification failed'
      )
    )
  }
}
function postLogin(payload: { email: string; password: string }) {
  return axios.post('/login', payload)
}

function* handleLogin(
  action: ReturnType<typeof loginRequest>
): Generator<CallEffect<any> | PutEffect<any>, void, any> {
  try {
    const response: any = yield call(postLogin, action.payload)
    yield put(loginSuccess(response.data.user))
    // optionally store token
    localStorage.setItem('token', response.data.token)
  } catch (err: any) {
    yield put(
      loginFailure(
        err?.response?.data?.message || err.message || 'Login failed'
      )
    )
  }
}

function* handleForgotPassword(
  action: ReturnType<typeof forgotPasswordRequest>
): Generator<CallEffect<any> | PutEffect<any>, void, any> {
  try {
    const response: any = yield call(postForgotPassword, action.payload)
    yield put(forgotPasswordSuccess(response.data.message))
  } catch (err: any) {
    yield put(
      forgotPasswordFailure(
        err?.response?.data?.message ||
          err.message ||
          'Failed to send reset email'
      )
    )
  }
}

function* handleResetPassword(
  action: ReturnType<typeof resetPasswordRequest>
): Generator<CallEffect<any> | PutEffect<any>, void, any> {
  try {
    const response: any = yield call(postResetPassword, action.payload)
    yield put(resetPasswordSuccess(response.data.message))
  } catch (err: any) {
    yield put(
      resetPasswordFailure(
        err?.response?.data?.message ||
          err.message ||
          'Failed to reset password'
      )
    )
  }
}

// Authentication check function
function checkAuth() {
  return axios.get('/auth/me')
}

function* handleCheckAuth(): Generator<
  CallEffect<any> | PutEffect<any>,
  void,
  any
> {
  try {
    const response: any = yield call(checkAuth)
    yield put(checkAuthSuccess(response.data.user))
  } catch (err: any) {
    // If auth check fails, clear token and user state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    yield put(checkAuthFailure())
  }
}

export default function* userSaga() {
  yield takeLatest(registerRequest.type, handleRegisterInitiate)
  yield takeLatest(registerVerifyRequest.type, handleRegisterVerify)
  yield takeLatest(loginRequest.type, handleLogin)
  yield takeLatest(forgotPasswordRequest.type, handleForgotPassword)
  yield takeLatest(resetPasswordRequest.type, handleResetPassword)
  yield takeLatest(checkAuthRequest.type, handleCheckAuth)
}

// API functions
function postForgotPassword(payload: { email: string }) {
  return axios.post('/forgot-password', payload)
}

function postResetPassword(payload: {
  email: string
  otp: string
  newPassword: string
}) {
  return axios.post('/reset-password', payload)
}
