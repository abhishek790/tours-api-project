const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');

exports.getAllReview = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  // Nested routes
  // if we did not specify the tour ID in the body then we want to define that as the one coming form url
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // if we did not specify the user ID in the body then we want to define that as the one coming form url
  if (!req.body.user) req.body.user = req.user.id;
  const newReview = await Review.create(req.body);
  res.status(200).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
