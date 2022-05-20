import axios from 'axios'
import { showAlert } from './alerts'

export const resetPassword = async (password, passwordConfirm, token) => {
  console.log(password, passwordConfirm, token)

  try {
    const res = await axios({
      method: 'PATCH',
      url: `http://localhost:3000/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm
      }
    })

    if (res.data.status === 'success') {
      showAlert('success', 'Password successfully reset!')
      window.setTimeout(() => {
        location.assign('/')
      }, 1500)
    }
  } catch (err) {
    showAlert('error', err.response.data.message)
  }
}
