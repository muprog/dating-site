// store/sagas/matchSaga.ts
import { call, put, takeEvery } from 'redux-saga/effects'
import {
  getMatchesRequest,
  getMatchesSuccess,
  getMatchesFailure,
} from '../slices/matchSlice'
import axios from '../services/api'

function* handleGetMatches(): any {
  try {
    const response = yield call(axios.get, '/api/swipes/matches')

    yield put(getMatchesSuccess(response.data.matches))
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Failed to get matches'
    yield put(getMatchesFailure(errorMessage))
  }
}

export function* matchSaga() {
  yield takeEvery(getMatchesRequest.type, handleGetMatches)
}
