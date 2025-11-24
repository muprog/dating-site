// import { all, fork } from 'redux-saga/effects'
// import { authSaga } from './authSaga'
// import { profileSaga } from './profileSaga' // Import profileSaga

// export default function* rootSaga() {
//   yield all([
//     fork(authSaga),
//     fork(profileSaga), // Add profileSaga here
//   ])
// }

// store/sagas/rootSaga.ts
import { all } from 'redux-saga/effects'
import { authSaga } from './authSaga'
import { profileSaga } from './profileSaga'
import { discoverySaga } from './discoverySaga' // Import discovery saga
import { swipeSaga } from './swipeSaga' // Import swipe saga

export default function* rootSaga() {
  yield all([
    authSaga(),
    profileSaga(),
    discoverySaga(), // Add discovery saga
    swipeSaga(), // Add swipe saga
  ])
}
