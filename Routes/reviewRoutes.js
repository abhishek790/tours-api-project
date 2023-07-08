const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authContoller');
// here in the express.router() we can specify some options and all we need to do is mergeParams. why do we need mergeParams? because by default each router only has access to the parameters of their specific routes but here in this route, os in this url for this post there's actually no tour id but we still want ot get access to the tour id that was in other router i.e. tourRoutes inorder to get access to the parameter of another router we need to physically merger the paramters and that's what mergeParams set to true does

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
