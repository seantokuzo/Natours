/* eslint-disable */
import '@babel/polyfill'
import { displayMap } from './mapbox'
import { login, logout } from './login'

//DELEGATION
if (document.getElementById('map')) {
  const locations = JSON.parse(document.getElementById('map').dataset.locations)
  displayMap(locations)
}

if (document.querySelector('.form')) {
  document.querySelector('.form').addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    login(email, password)
  })
}

if (document.querySelector('.nav__el--logout'))
  document.querySelector('.nav__el--logout').addEventListener('click', logout)
