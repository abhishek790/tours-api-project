const express = require('express');
const reviewController = require('./../controllers/reviewController');
const router = express.Router();
const authController = require('./../controllers/authContoller');

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
