// import { call, put, takeEvery } from 'redux-saga/effects'
// import { createSwipeSuccess, createSwipeFailure } from '../slices/swipeSlice'
// import { createSwipeRequest } from '../slices/swipeSlice'
// import {
//   addLikedUser,
//   addPassedUser,
//   updatePassToLike,
// } from '../slices/discoverySlice'
// import axios from '../services/api'

// interface SwipeAction {
//   type: string
//   payload: {
//     swipedUserId: string
//     action: 'like' | 'pass'
//   }
// }

// function* handleCreateSwipe(action: SwipeAction): any {
//   console.log('🔄 Saga: Starting swipe processing...')

//   try {
//     console.log('🔄 Saga: Processing swipe...', action.payload)

//     const { swipedUserId, action: swipeAction } = action.payload

//     // Validate required data
//     if (!swipedUserId) {
//       console.error('❌ Validation failed: swipedUserId is required')
//       throw new Error('swipedUserId is required')
//     }

//     if (!swipeAction || (swipeAction !== 'like' && swipeAction !== 'pass')) {
//       console.error('❌ Validation failed: Invalid swipe action', swipeAction)
//       throw new Error('Invalid swipe action')
//     }

//     console.log('🔍 Saga: Making API call to /api/swipes...')

//     // Make API call with better error handling
//     const response = yield call(
//       axios.post,
//       '/api/swipes',
//       {
//         swipedUserId,
//         action: swipeAction,
//       },
//       {
//         withCredentials: true,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         timeout: 10000, // 10 second timeout
//       }
//     )

//     console.log('✅ Saga: Swipe processed successfully:', response.data)

//     // TRACK SWIPES IN DISCOVERY SLICE
//     if (swipeAction === 'like') {
//       console.log('❤️ Adding user to liked users:', swipedUserId)
//       yield put(addLikedUser(swipedUserId))

//       // If this was updating a pass to like, handle accordingly
//       if (response.data.wasUpdated) {
//         console.log('🔄 Updated pass to like for user:', swipedUserId)
//         yield put(updatePassToLike(swipedUserId))
//       }
//     } else if (swipeAction === 'pass') {
//       console.log('❌ Adding user to passed users:', swipedUserId)
//       yield put(addPassedUser(swipedUserId))
//     }

//     // Handle success - for passes we don't get a match, for likes we might
//     if (response.data.isMatch) {
//       console.log('🎉 Match found!')
//       yield put(
//         createSwipeSuccess({
//           match: response.data.matchedUser,
//           swipe: response.data.swipe,
//         })
//       )
//     } else {
//       console.log('✅ Swipe processed (no match)')
//       yield put(
//         createSwipeSuccess({
//           swipe: response.data.swipe,
//           match: null,
//         })
//       )
//     }
//   } catch (error: any) {
//     console.error('❌ ========== SAGA ERROR DETAILS ==========')
//     console.error('❌ Saga: Swipe processing FAILED')
//     console.error('❌ Error name:', error.name)
//     console.error('❌ Error message:', error.message)
//     console.error('❌ Error code:', error.code)
//     console.error('❌ Error stack:', error.stack)

//     // Axios specific error details
//     if (error.response) {
//       console.error('❌ Response status:', error.response.status)
//       console.error('❌ Response data:', error.response.data)
//       console.error('❌ Response headers:', error.response.headers)
//     } else if (error.request) {
//       console.error(
//         '❌ No response received - request was made but no response'
//       )
//       console.error('❌ Request:', error.request)
//     } else {
//       console.error('❌ Error setting up request:', error.message)
//     }

//     // Network errors
//     if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
//       console.error('❌ NETWORK ERROR - API server might be down or CORS issue')
//     }

//     // Timeout errors
//     if (error.code === 'ECONNABORTED') {
//       console.error('❌ REQUEST TIMEOUT - API took too long to respond')
//     }

//     // Provide more specific error messages
//     let errorMessage = 'Swipe failed'

//     if (error.response?.data?.message) {
//       errorMessage = error.response.data.message
//     } else if (error.message) {
//       errorMessage = error.message
//     } else if (error.code === 'NETWORK_ERROR') {
//       errorMessage =
//         'Network error. Please check your connection and ensure the backend server is running.'
//     } else if (error.code === 'ECONNABORTED') {
//       errorMessage = 'Request timeout. Please try again.'
//     } else if (error.code === 'ECONNREFUSED') {
//       errorMessage =
//         'Cannot connect to server. Please check if the backend is running.'
//     }

//     console.error('❌ Dispatching error to store:', errorMessage)
//     yield put(createSwipeFailure(errorMessage))
//     console.error('❌ ========== END ERROR DETAILS ==========')
//   }
// }

// export function* swipeSaga() {
//   console.log('🔄 Swipe saga initialized')
//   yield takeEvery(createSwipeRequest.type, handleCreateSwipe)
// }

// store/sagas/swipeSaga.ts
import { call, put, takeEvery } from 'redux-saga/effects'
import { createSwipeSuccess, createSwipeFailure } from '../slices/swipeSlice'
import { createSwipeRequest } from '../slices/swipeSlice'
import {
  addLikedUser,
  addPassedUser,
  updatePassToLike,
} from '../slices/discoverySlice'
import axios from '../services/api'

interface SwipeAction {
  type: string
  payload: {
    swipedUserId: string
    action: 'like' | 'pass'
  }
}

function* handleCreateSwipe(action: SwipeAction): any {
  try {
    const { swipedUserId, action: swipeAction } = action.payload

    // Validate required data
    if (!swipedUserId) {
      throw new Error('swipedUserId is required')
    }

    if (!swipeAction || (swipeAction !== 'like' && swipeAction !== 'pass')) {
      throw new Error('Invalid swipe action')
    }

    // Make API call
    const response = yield call(axios.post, '/api/swipes', {
      swipedUserId,
      action: swipeAction,
    })

    // Track swipes in discovery slice
    if (swipeAction === 'like') {
      yield put(addLikedUser(swipedUserId))

      // If this was updating a pass to like, handle accordingly
      if (response.data.wasUpdated) {
        yield put(updatePassToLike(swipedUserId))
      }
    } else if (swipeAction === 'pass') {
      yield put(addPassedUser(swipedUserId))
    }

    // Handle success
    yield put(
      createSwipeSuccess({
        match: response.data.isMatch ? response.data.matchedUser : null,
        swipe: response.data.swipe,
      })
    )
  } catch (error: any) {
    // Simple error handling
    const errorMessage =
      error.response?.data?.message || error.message || 'Swipe failed'
    yield put(createSwipeFailure(errorMessage))
  }
}

export function* swipeSaga() {
  yield takeEvery(createSwipeRequest.type, handleCreateSwipe)
}
