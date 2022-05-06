const Tour = require('../models/tourModel')
const catchAsync = require('../utils/catchAsync')

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

exports.getTour = (req, res) => {
  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour'
  })
}
