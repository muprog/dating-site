import { all } from 'redux-saga/effects'
import { authSaga } from './authSaga'
import { profileSaga } from './profileSaga'
import { discoverySaga } from './discoverySaga'
import { swipeSaga } from './swipeSaga'
import { matchSaga } from './matchSaga'
import { messageSaga } from './messageSaga'
export default function* rootSaga() {
  yield all([
    authSaga(),
    profileSaga(),
    discoverySaga(),
    swipeSaga(),
    matchSaga(),
    messageSaga(),
  ])
}
