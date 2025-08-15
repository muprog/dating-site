import { all } from 'redux-saga/effects'
import userSaga from './user/userSaga'
import { authSaga } from './auth/authSaga'

export default function* rootSaga() {
  yield all([userSaga(), authSaga()])
}
