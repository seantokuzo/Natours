/* eslint-disable */
import '@babel/polyfill'
import { displayMap } from './mapbox'
import { login, logout } from './login'
import { updateSettings } from './updateSettings'
import { signup } from './signup'
import { bookTour } from './stripe'
import { showAlert } from './alerts'
import { forgotPassword } from './forgotPassword'
import { resetPassword } from './resetPassword'

// DOM ELEMENTS
const mapBox = document.getElementById('map')
const loginForm = document.querySelector('.form--login')
const forgotPasswordForm = document.querySelector('.form--forgotpass')
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const passwordResetForm = document.querySelector('.form--reset-password')
const signupForm = document.querySelector('.form--signup')
const userPhotoUpload = document.querySelector('.form__upload')
const bookBtn = document.getElementById('book-tour')

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations)
  displayMap(locations)
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    login(email, password)
  })
}

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const sendLinkBtn = document.getElementById('send-reset-btn')
    sendLinkBtn.setAttribute('disabled', true)
    sendLinkBtn.textContent = 'Sending...'
    const email = document.getElementById('email').value
    forgotPassword(email)
  })
}

if (passwordResetForm) {
  passwordResetForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const password = document.getElementById('reset-password').value
    const passwordConfirm = document.getElementById(
      'reset-password-confirm'
    ).value
    const submitBtn = document.getElementById('reset-password-btn')
    const { token } = submitBtn.dataset

    resetPassword(password, passwordConfirm, token)
  })
}

if (logOutBtn) logOutBtn.addEventListener('click', logout)

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('name', document.getElementById('name').value)
    form.append('email', document.getElementById('email').value)

    updateSettings(form, 'data')
  })

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    document.querySelector('.btn--save-password').textContent = 'Updating...'
    const passwordCurrent = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    )

    document.querySelector('.btn--save-password').textContent = 'Save password'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
  })

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const signupBtn = document.getElementById('signup-btn')
    signupBtn.setAttribute('disabled', true)
    const name = document.getElementById('signup-name').value
    const email = document.getElementById('signup-email').value
    const password = document.getElementById('signup-password').value
    const passwordConfirm = document.getElementById(
      'signup-password-confirm'
    ).value
    signup(name, email, password, passwordConfirm)
  })
}

if (userPhotoUpload) {
  userPhotoUpload.addEventListener('change', (e) => {
    // console.log(e)
    e.preventDefault()
    const form = new FormData()
    form.append('photo', document.getElementById('photo').files[0])
    updateSettings(form, 'data')
  })
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...'
    const { tourId } = e.target.dataset
    bookTour(tourId)
  })
}

const alertMessage = document.querySelector('body').dataset.alert
if (alertMessage) showAlert('success', alertMessage, 15)
