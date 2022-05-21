import axios from 'axios'
import { showAlert } from './alerts'

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    })

    console.log(res.data.status)

    if (res.data.status === 'success') {
      showAlert('success', 'Confirmation request sent. Check your email!')
      window.setTimeout(() => {
        location.assign('/signupConfirm')
      }, 1500)
    }
  } catch (err) {
    showAlert('error', err.response.data.message)
  }
}
