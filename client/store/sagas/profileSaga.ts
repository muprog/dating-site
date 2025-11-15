// import { call, put, takeLatest } from 'redux-saga/effects'
// import axios from '../services/api'
// import { SagaIterator } from 'redux-saga'
// import {
//   getProfileRequest,
//   getProfileSuccess,
//   getProfileFailure,
//   updateProfileRequest,
//   updateProfileSuccess,
//   updateProfileFailure,
//   uploadPhotosRequest,
//   uploadPhotosSuccess,
//   uploadPhotosFailure,
//   deletePhotoRequest,
//   deletePhotoSuccess,
//   deletePhotoFailure,
// } from '../slices/profileSlice'

// function* handleGetProfile(): SagaIterator {
//   try {
//     const response = yield call(axios.get, '/api/auth/profile')
//     yield put(getProfileSuccess(response.data))
//   } catch (error: any) {
//     yield put(
//       getProfileFailure(
//         error.response?.data?.message || 'Failed to fetch profile'
//       )
//     )
//   }
// }

// function* handleUpdateProfile(
//   action: ReturnType<typeof updateProfileRequest>
// ): SagaIterator {
//   try {
//     const response = yield call(axios.put, '/api/auth/profile', action.payload)
//     yield put(updateProfileSuccess(response.data))
//   } catch (error: any) {
//     yield put(
//       updateProfileFailure(
//         error.response?.data?.message || 'Failed to update profile'
//       )
//     )
//   }
// }

// function* handleUploadPhotos(
//   action: ReturnType<typeof uploadPhotosRequest>
// ): SagaIterator {
//   try {
//     const response = yield call(
//       axios.post,
//       '/api/auth/profile/photos',
//       action.payload,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       }
//     )
//     yield put(uploadPhotosSuccess(response.data))
//   } catch (error: any) {
//     yield put(
//       uploadPhotosFailure(
//         error.response?.data?.message || 'Failed to upload photos'
//       )
//     )
//   }
// }

// function* handleDeletePhoto(
//   action: ReturnType<typeof deletePhotoRequest>
// ): SagaIterator {
//   try {
//     const photoUrl = encodeURIComponent(action.payload)
//     const response = yield call(
//       axios.delete,
//       `/api/auth/profile/photos/${photoUrl}`
//     )
//     yield put(deletePhotoSuccess(response.data))
//   } catch (error: any) {
//     yield put(
//       deletePhotoFailure(
//         error.response?.data?.message || 'Failed to delete photo'
//       )
//     )
//   }
// }

// export function* profileSaga() {
//   yield takeLatest(getProfileRequest.type, handleGetProfile)
//   yield takeLatest(updateProfileRequest.type, handleUpdateProfile)
//   yield takeLatest(uploadPhotosRequest.type, handleUploadPhotos)
//   yield takeLatest(deletePhotoRequest.type, handleDeletePhoto)
// }

import { call, put, takeLatest } from 'redux-saga/effects'
import axios from '../services/api'
import { SagaIterator } from 'redux-saga'
import {
  getProfileRequest,
  getProfileSuccess,
  getProfileFailure,
  updateProfileRequest,
  updateProfileSuccess,
  updateProfileFailure,
  uploadPhotosRequest,
  uploadPhotosSuccess,
  uploadPhotosFailure,
  deletePhotoRequest,
  deletePhotoSuccess,
  deletePhotoFailure,
} from '../slices/profileSlice'

// sagas/profileSaga.ts - Update handleGetProfile with more debugging
function* handleGetProfile(): SagaIterator {
  try {
    console.log('🔄 Saga: Fetching profile from /api/auth/profile...')

    // Add request logging
    const response = yield call(axios.get, '/api/auth/profile')

    console.log('✅ Saga: Profile API response status:', response.status)
    console.log('✅ Saga: Profile data received:', response.data)

    yield put(getProfileSuccess(response.data))
  } catch (error: any) {
    console.error('❌ Saga: Profile fetch failed:')
    console.error('❌ Error message:', error.message)
    console.error('❌ Response data:', error.response?.data)
    console.error('❌ Response status:', error.response?.status)
    console.error('❌ Response headers:', error.response?.headers)

    yield put(
      getProfileFailure(
        error.response?.data?.message || 'Failed to fetch profile'
      )
    )
  }
}

function* handleUpdateProfile(
  action: ReturnType<typeof updateProfileRequest>
): SagaIterator {
  try {
    console.log('🔄 Saga: Updating profile...', action.payload)
    const response = yield call(axios.put, '/api/auth/profile', action.payload)
    console.log('✅ Saga: Profile updated successfully:', response.data)
    yield put(updateProfileSuccess(response.data))
  } catch (error: any) {
    console.error('❌ Saga: Profile update failed:', error.response?.data)
    yield put(
      updateProfileFailure(
        error.response?.data?.message || 'Failed to update profile'
      )
    )
  }
}

function* handleUploadPhotos(
  action: ReturnType<typeof uploadPhotosRequest>
): SagaIterator {
  try {
    console.log('🔄 Saga: Uploading photos...')
    const response = yield call(
      axios.post,
      '/api/auth/profile/photos',
      action.payload,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    console.log('✅ Saga: Photos uploaded successfully:', response.data)
    yield put(uploadPhotosSuccess(response.data))
  } catch (error: any) {
    console.error('❌ Saga: Photo upload failed:', error.response?.data)
    yield put(
      uploadPhotosFailure(
        error.response?.data?.message || 'Failed to upload photos'
      )
    )
  }
}

function* handleDeletePhoto(
  action: ReturnType<typeof deletePhotoRequest>
): SagaIterator {
  try {
    console.log('🔄 Saga: Deleting photo...', action.payload)
    const photoIndex = action.payload
    const response = yield call(
      axios.delete,
      `/api/auth/profile/photos/${photoIndex}`
    )
    console.log('✅ Saga: Photo deleted successfully:', response.data)
    yield put(deletePhotoSuccess(response.data))
  } catch (error: any) {
    console.error('❌ Saga: Photo delete failed:', error.response?.data)
    yield put(
      deletePhotoFailure(
        error.response?.data?.message || 'Failed to delete photo'
      )
    )
  }
}

export function* profileSaga() {
  yield takeLatest(getProfileRequest.type, handleGetProfile)
  yield takeLatest(updateProfileRequest.type, handleUpdateProfile)
  yield takeLatest(uploadPhotosRequest.type, handleUploadPhotos)
  yield takeLatest(deletePhotoRequest.type, handleDeletePhoto)
}
