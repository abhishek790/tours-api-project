const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTouruserIds = (req, res, next) => {
  // if we did not specify the tour ID in the body then we want to define that as the one coming form url
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // if we did not specify the user ID in the body then we want to define that as the one coming form url
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
