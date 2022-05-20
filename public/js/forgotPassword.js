import axios from 'axios'
import { showAlert } from './alerts'

export const forgotPassword = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/forgotPassword',
      data: {
        email
      }
    })

    if (res.data.status === 'success') {
      // showAlert('success', 'Password reset link sent! Please check your email.')
      window.setTimeout(() => {
        location.assign('/resetSent')
      }, 1500)
    }
  } catch (err) {
    showAlert('error', err.response.data.message)
  }
}
