/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alerts'
const stripe = Stripe(
  'pk_test_51KxfBCK3JkI6Fn4egVjVkFVH612tdJoTFweewXmm9YBqIjfQOdnlMSLpjTJuAUGj7uUoA7oASACSron62f6i5uDv0047Dk4pfs'
)

export const bookTour = async (tourId) => {
  try {
    // 1) GET CHECKOUT SESSION FROM THE API
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    )

    console.log(session)
    // 2) CREATE CHECKOUT FORM + PROCESS / CHARGE THE CREDIT CARD
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch (err) {
    showAlert('error', err)
  }
}
