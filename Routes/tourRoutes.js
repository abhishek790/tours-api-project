const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authContoller');

const tourController = require('./../controllers/tourController');

// router.param('id', tourController.checkID);

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
  .delete(tourController.deleteTours);

module.exports = router;
