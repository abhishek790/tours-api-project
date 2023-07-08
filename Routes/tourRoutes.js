const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authContoller');
const tourController = require('./../controllers/tourController');
const reviewRouter = require('./../Routes/reviewRoutes');
// router.use will tell that this tour router should use the review router in case it ever encouters a route like this
// router itself is just a middleware and so we can use the use method on it and then say that for this specific route here we want to use reviewRouter
// this reviewRouter here will not get access to tourId parameter and so we need to enable the review router to actually get access to this parameter here as well
router.use('/:tourId/reviews', reviewRouter);

//aliasing
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  // adding a middleware in order to allow only logged in user to get access to the getAllTours
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTours);
router
  .route('/:id')
  .get(tourController.getTours)
  .patch(tourController.updateTours)
  //AUTHORIZATION
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTours
  );

module.exports = router;
