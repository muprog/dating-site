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
