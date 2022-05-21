const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Email = require('../utils/email')

const signToken = (id, confirmed) => {
  if (confirmed) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    })
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_CONFIRM_EXPIRES_IN
  })
}

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id, true)

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.get('x-forwarded-proto') === 'https'
  })

  // Remove the password from the output
  user.password = undefined

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
}

exports.signup = catchAsync(async (req, res, next) => {
  // CHECK IF USER EXISTS WITH THAT EMAIL
  const user = await User.findOne({ email: req.body.email }).select(
    '+confirmed'
  )

  if (user && user.confirmed) {
    return next(new AppError('That email is already registered to an account'))
  }

  if (user && !user.confirmed && user.confirmationExpires > Date.now()) {
    return next(
      new AppError(
        'Confirmation has already been sent. Please check your email'
      )
    )
  }

  if (user && !user.confirmed && user.confirmationExpires < Date.now()) {
    const deletedUser = await User.deleteOne({ email: req.body.email })
  }

  const newUser = await User.create(req.body)

  // CREATE CONFIRMATION TOKEN
  const token = signToken(newUser._id, false)

  // SAVE TOKEN AND EXPIRATION TO USER
  newUser.confirmationExpires = Date.now() + 24 * 60 * 60 * 1000
  await newUser.save({ validateBeforeSave: false })

  // CREATE URL FOR BTN IN EMAIL - TOKEN AS PARAM
  const url = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/confirmSignup/${token}`
  // console.log(url)

  // SEND CONFIRMATION EMAIL
  try {
    await new Email(newUser, url).sendEmailConfirm()

    res.status(200).json({
      status: 'success',
      message: 'Token sent by email'
    })
  } catch (err) {
    console.log(err)
    return next(
      new AppError(
        'There was an error sending the confirmation email, please try again later',
        500
      )
    )
  }
})

exports.confirmSignup = catchAsync(async (req, res, next) => {
  const token = req.params.token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  const user = await User.findById(decoded.id).select('+confirmed')

  if (!user) {
    return next(
      new AppError('The use belonging to the token does not exist', 401)
    )
  }
  if (user.confirmed) {
    return next(new AppError('This account has already been verified', 400))
  }
  user.confirmed = true
  await user.save({ validateBeforeSave: false })

  const url = `${req.protocol}://${req.get('host')}/me`
  await new Email(user, url).sendWelcome()
  createSendToken(user, 201, req, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  // 1) Check email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400))
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select(['+password', '+confirmed'])

  console.log(user.confirmed)

  if (!user.confirmed) {
    return next(
      new AppError('Please confirm your email address before logging in')
    )
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401))
  }

  // 3) All Good - send the JWT to client
  createSendToken(user, 200, req, res)
  const token = signToken(user._id, true)
  res.status(200).json({
    status: 'success',
    token
  })
})

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  res.status(200).json({ status: 'success' })
}

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token and check it exists
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    )
  }

  // 2) VERIFICATION - Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).select('+confirmed')
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists', 401)
    )
  }

  // 3.5) CHECK THAT USER HAS CONFIRMED THEIR EMAIL
  if (!currentUser.confirmed) {
    return next(
      new AppError('You need to confirm your email address before continuing')
    )
  }

  // 4) Check if user changed password after the JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again!', 401)
    )
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser
  res.locals.user = currentUser
  next()
})

// ONLY FOR RENDERED PAGES, NO ERRORS
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      )

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id)
      if (!currentUser) {
        return next()
      }

      // 3) Check if user changed password after the JWT was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next()
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser
      return next()
    } catch (err) {
      return next()
    }
  }
  next()
}

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array - in this case ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      )
    }

    next()
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON POSTed EMAIL
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError('There is no user with this email address', 404))
  }
  // 2) GENERATE THE RANDOM TOKEN
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // 3) SEND IT TO THE USER'S EMAIL
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`

    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    )
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  // 2) IF TOKEN NOT EXPIRED && USER EXISTS - SET NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // 3) UPDATE changedPasswordAt PROPERTY FOR THE USER
  // 4) LOG THE USER IN, SEND JWT
  createSendToken(user, 200, req, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password')

  // 2) CHECK IF POSTed PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401))
  }
  // 3) IF CORRECT, UPDATE PASSWORD
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()
  // User.findByIdAndUpdate will not work
  // password validator will not work and pre-save middleware will not run

  // 4) LOG USER IN, SEND JWT
  createSendToken(user, 200, req, res)
})
