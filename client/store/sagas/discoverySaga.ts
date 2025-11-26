// // store/sagas/discoverySaga.ts
// import { call, put, takeLatest } from 'redux-saga/effects'
// import { SagaIterator } from 'redux-saga'
// import axios from '../services/api'
// import {
//   getRecommendationsRequest,
//   getRecommendationsSuccess,
//   getRecommendationsFailure,
// } from '../slices/discoverySlice'

// function* handleGetRecommendations(
//   action: ReturnType<typeof getRecommendationsRequest>
// ): SagaIterator {
//   try {
//     console.log('🔄 Saga: Fetching recommendations...', action.payload)

//     const { latitude, longitude } = action.payload
//     let url = '/api/users/recommendations'

//     // Build query params if location is provided
//     if (latitude !== undefined && longitude !== undefined) {
//       url += `?latitude=${latitude}&longitude=${longitude}`
//     }

//     const response = yield call(axios.get, url)
//     console.log('✅ Saga: Recommendations fetched successfully:', response.data)

//     yield put(getRecommendationsSuccess(response.data))
//   } catch (error: any) {
//     console.error('❌ Saga: Failed to get recommendations:')
//     console.error('❌ Error message:', error.message)
//     console.error('❌ Response data:', error.response?.data)
//     console.error('❌ Response status:', error.response?.status)

//     let errorMessage = 'Failed to get recommendations'

//     if (error.response?.status === 401) {
//       errorMessage = 'Please login again'
//     } else if (error.response?.status === 404) {
//       errorMessage = 'No users found in your area'
//     } else if (error.code === 'NETWORK_ERROR') {
//       errorMessage = 'Network error. Please check your connection.'
//     } else if (error.response?.data?.message) {
//       errorMessage = error.response.data.message
//     }

//     yield put(getRecommendationsFailure(errorMessage))
//   }
// }

// export function* discoverySaga() {
//   yield takeLatest(getRecommendationsRequest.type, handleGetRecommendations)
// }
// store/sagas/discoverySaga.ts
import { call, put, takeLatest } from 'redux-saga/effects'
import { SagaIterator } from 'redux-saga'
import axios from '../services/api'
import {
  getRecommendationsRequest,
  getRecommendationsSuccess,
  getRecommendationsFailure,
  getSwipeHistoryRequest,
  getSwipeHistorySuccess,
  getSwipeHistoryFailure,
} from '../slices/discoverySlice'

function* handleGetRecommendations(
  action: ReturnType<typeof getRecommendationsRequest>
): SagaIterator {
  try {
    console.log('🔄 Saga: Fetching recommendations...', action.payload)

    const { latitude, longitude } = action.payload
    let url = '/api/users/recommendations'

    // Build query params if location is provided
    if (latitude !== undefined && longitude !== undefined) {
      url += `?latitude=${latitude}&longitude=${longitude}`
    }

    const response = yield call(axios.get, url)
    console.log('✅ Saga: Recommendations fetched successfully:', response.data)

    yield put(getRecommendationsSuccess(response.data))
  } catch (error: any) {
    console.error('❌ Saga: Failed to get recommendations:')
    console.error('❌ Error message:', error.message)
    console.error('❌ Response data:', error.response?.data)
    console.error('❌ Response status:', error.response?.status)

    let errorMessage = 'Failed to get recommendations'

    if (error.response?.status === 401) {
      errorMessage = 'Please login again'
    } else if (error.response?.status === 404) {
      errorMessage = 'No users found in your area'
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please check your connection.'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    yield put(getRecommendationsFailure(errorMessage))
  }
}

function* handleGetSwipeHistory(): SagaIterator {
  try {
    console.log('🔄 Saga: Fetching swipe history...')

    const response = yield call(axios.get, '/api/swipes/my-swipe-history')
    console.log('✅ Saga: Swipe history fetched successfully:', response.data)

    yield put(
      getSwipeHistorySuccess({
        likedUsers: response.data.likedUsers || [],
        passedUsers: response.data.passedUsers || [],
      })
    )
  } catch (error: any) {
    console.error('❌ Saga: Failed to get swipe history:')
    console.error('❌ Error message:', error.message)
    console.error('❌ Response data:', error.response?.data)
    console.error('❌ Response status:', error.response?.status)

    let errorMessage = 'Failed to get swipe history'

    if (error.response?.status === 401) {
      errorMessage = 'Please login again'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    yield put(getSwipeHistoryFailure(errorMessage))
  }
}

export function* discoverySaga() {
  yield takeLatest(getRecommendationsRequest.type, handleGetRecommendations)
  yield takeLatest(getSwipeHistoryRequest.type, handleGetSwipeHistory) // Add this line
}
