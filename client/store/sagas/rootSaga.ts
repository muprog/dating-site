// import { all, fork } from 'redux-saga/effects'
// import { authSaga } from './authSaga'

// export default function* rootSaga() {
//   yield all([fork(authSaga)])
// }
// sagas/rootSaga.ts
import { all, fork } from 'redux-saga/effects'
import { authSaga } from './authSaga'
import { profileSaga } from './profileSaga' // Import profileSaga

export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(profileSaga), // Add profileSaga here
  ])
}
