import { call, put, takeLatest } from 'redux-saga/effects'
import axios from '../../util/axios'
import {
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
} from './userSlice'
function* getProfileSaga(): any {
  try {
    const response = yield call(axios.get, `/api/profile/me`, {
      withCredentials: true,
    })
    yield put(getProfileSuccess(response.data))
  } catch (error: any) {
    yield put(
      getProfileFailure(
        error.response?.data?.message || 'Failed to load profile'
      )
    )
  }
}

function* updateProfileSaga(
  action: ReturnType<typeof updateProfileRequest>
): any {
  try {
    const formData = new FormData()

    for (const key in action.payload) {
      const value = (action.payload as any)[key]
      if (key === 'photos' && Array.isArray(value)) {
        value.forEach((file: File) => formData.append('photos', file))
      } else if (key === 'picture' && value instanceof File) {
        formData.append('picture', value)
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value)) // For interests
      } else if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    }

    const response = yield call(axios.put, `/api/profile/me`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    yield put(updateProfileSuccess(response.data))
  } catch (error: any) {
    yield put(
      updateProfileFailure(
        error.response?.data?.message || 'Failed to update profile'
      )
    )
  }
}

export default function* userSaga() {
  yield takeLatest(getProfileRequest.type, getProfileSaga)
  yield takeLatest(updateProfileRequest.type, updateProfileSaga)
}
