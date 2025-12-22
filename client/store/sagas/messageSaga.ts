import { call, put, takeLatest } from 'redux-saga/effects'
import { SagaIterator } from 'redux-saga'
import {
  getMatchesRequest,
  getMatchesSuccess,
  getMatchesFailure,
  getMessagesRequest,
  getMessagesSuccess,
  getMessagesFailure,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
} from '../slices/messageSlice'
import { messageApi } from '../services/messageApi'
import { Match, Message } from '../../types/messaging'

// Worker Saga: Get matches
// sagas/messageSaga.ts - Update handleGetMatches
function* handleGetMatches(): SagaIterator {
  console.log('🔄 [handleGetMatches] Saga starting...')

  try {
    const response = yield call(messageApi.getMatches)

    console.log('✅ [handleGetMatches] Got response:', {
      success: response.success,
      matchesCount: response.matches?.length,
    })

    if (response.success) {
      console.log(
        `✅ [handleGetMatches] Dispatching ${response.matches.length} matches`
      )
      yield put(getMatchesSuccess(response.matches))
    } else {
      // Even if not successful, dispatch empty matches to avoid UI errors
      console.log('⚠️ [handleGetMatches] No matches found or error occurred')
      yield put(getMatchesSuccess([]))
    }
  } catch (error: any) {
    console.error('❌ [handleGetMatches] Error:', error.message)

    // Dispatch empty matches on error
    yield put(getMatchesSuccess([]))
  }
}

// Worker Saga: Get messages for a match
function* handleGetMessages(
  action: ReturnType<typeof getMessagesRequest>
): SagaIterator {
  try {
    const { matchId } = action.payload
    console.log(`🔄 Message Saga: Fetching messages for match ${matchId}`)

    const response: { success: boolean; messages: Message[] } = yield call(
      messageApi.getMessages,
      matchId
    )

    if (response.success) {
      console.log(`✅ Message Saga: Messages fetched for match ${matchId}`)
      yield put(
        getMessagesSuccess({
          messages: response.messages,
          matchId,
        })
      )
    } else {
      throw new Error('Failed to fetch messages')
    }
  } catch (error: any) {
    console.error('❌ Message Saga: Failed to get messages:', error)

    let errorMessage = 'Failed to load messages'

    if (error.response?.status === 401) {
      errorMessage = 'Please login again'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    yield put(getMessagesFailure(errorMessage))
  }
}

// Worker Saga: Send message
function* handleSendMessage(
  action: ReturnType<typeof sendMessageRequest>
): SagaIterator {
  try {
    const { matchId, content } = action.payload
    console.log(`🔄 Message Saga: Sending message to match ${matchId}`)

    const response: { success: boolean; message: Message } = yield call(
      messageApi.sendMessage,
      matchId,
      content
    )

    if (response.success) {
      console.log(`✅ Message Saga: Message sent to match ${matchId}`)
      yield put(sendMessageSuccess(response.message))
    } else {
      throw new Error('Failed to send message')
    }
  } catch (error: any) {
    console.error('❌ Message Saga: Failed to send message:', error)

    let errorMessage = 'Failed to send message'

    if (error.response?.status === 401) {
      errorMessage = 'Please login again'
    } else if (error.response?.status === 403) {
      errorMessage = 'You are not matched with this user'
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error.message) {
      errorMessage = error.message
    }

    yield put(sendMessageFailure(errorMessage))
  }
}

// Watcher Saga
export function* messageSaga() {
  yield takeLatest(getMatchesRequest.type, handleGetMatches)
  yield takeLatest(getMessagesRequest.type, handleGetMessages)
  yield takeLatest(sendMessageRequest.type, handleSendMessage)
}
