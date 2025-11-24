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

// // sagas/profileSaga.ts - Update handleGetProfile with more debugging
// function* handleGetProfile(): SagaIterator {
//   try {
//     console.log('🔄 Saga: Fetching profile from /api/auth/profile...')

//     // Add request logging
//     const response = yield call(axios.get, '/api/auth/profile')

//     console.log('✅ Saga: Profile API response status:', response.status)
//     console.log('✅ Saga: Profile data received:', response.data)

//     yield put(getProfileSuccess(response.data))
//   } catch (error: any) {
//     console.error('❌ Saga: Profile fetch failed:')
//     console.error('❌ Error message:', error.message)
//     console.error('❌ Response data:', error.response?.data)
//     console.error('❌ Response status:', error.response?.status)
//     console.error('❌ Response headers:', error.response?.headers)

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
//     console.log('🔄 Saga: Updating profile...', action.payload)
//     const response = yield call(axios.put, '/api/auth/profile', action.payload)
//     console.log('✅ Saga: Profile updated successfully:', response.data)
//     yield put(updateProfileSuccess(response.data))
//   } catch (error: any) {
//     console.error('❌ Saga: Profile update failed:', error.response?.data)
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
//     console.log('🔄 Saga: Uploading photos...')

//     const response = yield call(
//       axios.post,
//       '/api/auth/profile/photos',
//       action.payload,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//         timeout: 60000, // Increase timeout to 60 seconds for larger files
//         onUploadProgress: (progressEvent) => {
//           const progress = Math.round(
//             (progressEvent.loaded * 100) / (progressEvent.total || 1)
//           )
//           console.log(`📤 Upload progress: ${progress}%`)
//         },
//       }
//     )

//     console.log('✅ Saga: Photos uploaded successfully:', response.data)
//     yield put(uploadPhotosSuccess(response.data))
//   } catch (error: any) {
//     console.error('❌ Saga: Photo upload failed:')
//     console.error('❌ Error message:', error.message)
//     console.error('❌ Response status:', error.response?.status)
//     console.error('❌ Response data:', error.response?.data)
//     console.error('❌ Error code:', error.code)

//     let errorMessage = 'Failed to upload photos'

//     if (error.response?.data?.message) {
//       errorMessage = error.response.data.message
//     } else if (error.code === 'ECONNABORTED') {
//       errorMessage = 'Upload timeout. Please try again with smaller files.'
//     } else if (error.code === 'NETWORK_ERROR') {
//       errorMessage = 'Network error. Please check your connection.'
//     } else if (!error.response) {
//       errorMessage = 'Server unavailable. Please try again later.'
//     } else if (error.response?.status === 413) {
//       errorMessage = 'File too large. Maximum size is 10MB.'
//     }

//     yield put(uploadPhotosFailure(errorMessage))
//   }
// }

// function* handleDeletePhoto(
//   action: ReturnType<typeof deletePhotoRequest>
// ): SagaIterator {
//   try {
//     console.log('🔄 Saga: Deleting photo...', action.payload)
//     const photoIndex = action.payload
//     const response = yield call(
//       axios.delete,
//       `/api/auth/profile/photos/${photoIndex}`
//     )
//     console.log('✅ Saga: Photo deleted successfully:', response.data)
//     yield put(deletePhotoSuccess(response.data))
//   } catch (error: any) {
//     console.error('❌ Saga: Photo delete failed:', error.response?.data)
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
    console.error('❌ Saga: Profile update failed:')
    console.error('❌ Full error object:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error code:', error.code)
    console.error('❌ Error name:', error.name)
    console.error('❌ Response status:', error.response?.status)
    console.error('❌ Response status text:', error.response?.statusText)
    console.error('❌ Response data:', error.response?.data)
    console.error('❌ Response headers:', error.response?.headers)
    console.error('❌ Request config:', error.config)

    let errorMessage = 'Failed to update profile'

    // More detailed error handling
    if (error.response?.status === 400) {
      errorMessage = 'Invalid data. Please check your input.'
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please login again.'
    } else if (error.response?.status === 413) {
      errorMessage = 'Data too large. Please reduce the size.'
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.'
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.'
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please check your connection.'
    } else if (!error.response) {
      errorMessage = 'Server unavailable. Please try again later.'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      errorMessage = error.response.data.errors.join(', ')
    }

    console.error('❌ Final error message to user:', errorMessage)
    yield put(updateProfileFailure(errorMessage))
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
        timeout: 60000, // Increase timeout to 60 seconds for larger files
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          )
          console.log(`📤 Upload progress: ${progress}%`)
        },
      }
    )

    console.log('✅ Saga: Photos uploaded successfully:', response.data)
    yield put(uploadPhotosSuccess(response.data))
  } catch (error: any) {
    console.error('❌ Saga: Photo upload failed:')
    console.error('❌ Error message:', error.message)
    console.error('❌ Response status:', error.response?.status)
    console.error('❌ Response data:', error.response?.data)
    console.error('❌ Error code:', error.code)

    let errorMessage = 'Failed to upload photos'

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timeout. Please try again with smaller files.'
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network error. Please check your connection.'
    } else if (!error.response) {
      errorMessage = 'Server unavailable. Please try again later.'
    } else if (error.response?.status === 413) {
      errorMessage = 'File too large. Maximum size is 10MB.'
    }

    yield put(uploadPhotosFailure(errorMessage))
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
