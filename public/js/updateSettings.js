/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alerts'

// TYPE IS EITHER 'PASSWORD' OR 'DATA'
export const updateSettings = async (data, type) => {
  const url =
    type === 'password'
      ? 'http://localhost:3000/api/v1/users/updateMyPassword'
      : 'http://localhost:3000/api/v1/users/updateMe'

  try {
    const res = await axios({
      method: 'PATCH',
      url,
      data
    })

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type[0].toUpperCase() + type.slice(1)} updated successfully`
      )
      window.setTimeout(() => {
        location.assign('/me')
      }, 1500)
    }
  } catch (err) {
    console.log(err.response.data.message)
    showAlert('error', err.response.data.message)
  }
}
