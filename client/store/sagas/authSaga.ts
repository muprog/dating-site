import { call, put, takeLatest } from 'redux-saga/effects'
import axios from '../services/api'
import { SagaIterator } from 'redux-saga'
import {
  registerRequest,
  registerSuccess,
  registerFailure,
  verifyOtpRequest,
  verifyOtpSuccess,
  verifyOtpFailure,
  loginRequest,
  loginSuccess,
  loginFailure,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  logoutRequest,
  logoutSuccess,
  logoutFailure,
  checkAuthRequest,
  checkAuthSuccess,
  checkAuthFailure,
} from '../slices/authSlice'

function* handleRegister(
  action: ReturnType<typeof registerRequest>
): SagaIterator {
  try {
    yield call(axios.post, '/api/auth/register', action.payload)
    yield put(registerSuccess())
  } catch (error: any) {
    yield put(
      registerFailure(error.response?.data?.message || 'Registration failed')
    )
  }
}

function* handleVerifyOtp(
  action: ReturnType<typeof verifyOtpRequest>
): SagaIterator {
  try {
    yield call(axios.post, '/api/auth/verify-otp', action.payload)
    yield put(verifyOtpSuccess())
  } catch (error: any) {
    yield put(
      verifyOtpFailure(
        error.response?.data?.message || 'OTP verification failed'
      )
    )
  }
}

// function* handleLogin(action: ReturnType<typeof loginRequest>): SagaIterator {
//   try {
//     const response = yield call(axios.post, '/api/auth/login', action.payload)
//     // yield put(loginSuccess(response.data))
//     if (response.data?.user) {
//       yield put(loginSuccess(response.data))
//     } else {
//       yield put(loginFailure(response.data?.message || 'Login failed'))
//     }
//   } catch (error: any) {
//     yield put(loginFailure(error.response?.data?.message || 'Login failed'))
//   }
// }
// sagas/authSaga.ts - Update handleLogin
function* handleLogin(action: ReturnType<typeof loginRequest>): SagaIterator {
  try {
    const response = yield call(axios.post, '/api/auth/login', action.payload)
    console.log('✅ Login response:', response.data)

    if (response.data?.user) {
      // Make sure we're storing the complete user object
      yield put(loginSuccess(response.data.user))
    } else {
      yield put(loginFailure(response.data?.message || 'Login failed'))
    }
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.data)
    yield put(loginFailure(error.response?.data?.message || 'Login failed'))
  }
}
function* handleForgotPassword(
  action: ReturnType<typeof forgotPasswordRequest>
): SagaIterator {
  try {
    const response = yield call(
      axios.post,
      '/api/auth/forgot-password',
      action.payload
    )
    yield put(forgotPasswordSuccess(response.data.message))
  } catch (error: any) {
    yield put(
      forgotPasswordFailure(
        error.response?.data?.message || 'Error sending OTP'
      )
    )
  }
}

function* handleResetPassword(
  action: ReturnType<typeof resetPasswordRequest>
): SagaIterator {
  try {
    const { email, otp, password } = action.payload
    const response = yield call(axios.post, '/api/auth/reset-password', {
      email,
      otp,
      newPassword: password, // match backend param
    })
    yield put(resetPasswordSuccess(response.data.message))
  } catch (error: any) {
    yield put(
      resetPasswordFailure(error.response?.data?.message || 'Reset failed')
    )
  }
}
function* handleLogout(): SagaIterator {
  try {
    yield call(axios.post, '/api/auth/logout')
    yield put(logoutSuccess())
  } catch (error: any) {
    yield put(logoutFailure(error.response?.data?.message || 'Logout failed'))
  }
}
function* handleCheckAuth(): SagaIterator {
  try {
    console.log('🔐 Checking authentication status...')
    const response = yield call(axios.get, '/api/auth/check')
    console.log('✅ Auth check successful:', response.data)
    yield put(checkAuthSuccess(response.data.user))
  } catch (error: any) {
    console.log('❌ Auth check failed - not authenticated')
    yield put(checkAuthFailure())
  }
}

export function* authSaga() {
  yield takeLatest(registerRequest.type, handleRegister)
  yield takeLatest(verifyOtpRequest.type, handleVerifyOtp)
  yield takeLatest(loginRequest.type, handleLogin)
  yield takeLatest(forgotPasswordRequest.type, handleForgotPassword)
  yield takeLatest(resetPasswordRequest.type, handleResetPassword)
  yield takeLatest(logoutRequest.type, handleLogout)
  yield takeLatest(checkAuthRequest.type, handleCheckAuth)
}
