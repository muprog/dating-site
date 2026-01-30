import { call, put, takeLatest, delay } from 'redux-saga/effects'
import axios from '../services/api'
import { SagaIterator } from 'redux-saga'
import { clearProfile } from '../slices/profileSlice'
import { clearDiscovery } from '../slices/discoverySlice'
import { clearSwipe } from '../slices/swipeSlice'
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

function* handleLogin(action: ReturnType<typeof loginRequest>): SagaIterator {
  try {
    const response = yield call(axios.post, '/api/auth/login', action.payload)
    console.log('✅ Login successful:', response.data)

    if (response.data?.user) {
      yield put(loginSuccess(response.data.user))
    } else {
      yield put(loginFailure(response.data?.message || 'Login failed'))
    }
  } catch (error: any) {
    if (error?.response?.status === 400) {
      const errorMessage =
        error.response?.data?.message || 'Invalid email or password'
      console.log('🔄 Login failed (expected):', errorMessage)
      yield put(loginFailure(errorMessage))
    } else {
      console.error('❌ Unexpected login error:', error)
      const errorMessage =
        error.response?.data?.message || error.message || 'Login failed'
      yield put(loginFailure(errorMessage))
    }
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
      newPassword: password,
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
    console.log('🔄 Saga: Logging out...')

    yield call(
      axios.post,
      '/api/auth/logout',
      {},
      {
        withCredentials: true,
      }
    )

    yield put(logoutSuccess())
    yield put(clearProfile())
    yield put(clearDiscovery())
    yield put(clearSwipe())

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  } catch (error: any) {
    console.error('❌ Saga: Logout failed:', error)

    yield put(logoutSuccess())
    yield put(clearProfile())
    yield put(clearDiscovery())
    yield put(clearSwipe())

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// Helper function for redirect
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    // Clear any stored tokens
    localStorage.clear()
    sessionStorage.clear()

    // Force hard redirect
    window.location.href = '/login'
    // OR use replace for better UX
    // window.location.replace('/login')
  }
}

function* handleCheckAuth(): SagaIterator {
  try {
    console.log('🔐 Saga: Checking authentication status...')

    // IMPORTANT: Add withCredentials to send cookies
    const response = yield call(axios.get, '/api/auth/check', {
      withCredentials: true,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })

    console.log('✅ Auth check successful:', response.data)

    if (response.data?.user) {
      yield put(checkAuthSuccess(response.data.user))
    } else {
      console.log('⚠️ Auth check returned no user data')
      yield put(checkAuthFailure())
    }
  } catch (error: any) {
    console.log(
      '❌ Auth check failed:',
      error.response?.data?.message || error.message
    )
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
