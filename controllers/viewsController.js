const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

exports.alerts = (req, res, next) => {
  const { alert } = req.query

  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later."

  next()
}

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) GET TOUR DATA FROM COLLECTION
  const tours = await Tour.find()
  // 2) BUILD TEMPLATE

  // 3) RENDER TEMPLATE USING TOUR DATA FROM STEP 1

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  })
})

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  })

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404))
  }

  res.status(200).render('tour', {
    title: tour.name,
    tour
  })
})

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  })
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
}

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) FIND ALL BOOKINGS
  const bookings = await Booking.find({ user: req.user.id })

  // 2) FIND TOURS WITH THE RETURNED ID'S
  const tourIds = bookings.map((el) => el.tour)
  const tours = await Tour.find({ _id: { $in: tourIds } })

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })
})

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  )

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  })
})

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create an account'
  })
}
