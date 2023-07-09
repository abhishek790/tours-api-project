const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authContoller');
const tourController = require('./../controllers/tourController');
const reviewRouter = require('./../Routes/reviewRoutes');

router.use('/:tourId/reviews', reviewRouter);

//aliasing
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  // adding a middleware in order to allow only logged in user to get access to the getAllTours
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTours
  );
router
  .route('/:id')
  .get(tourController.getTours)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTours
  )
  //AUTHORIZATION
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTours
  );

module.exports = router;
