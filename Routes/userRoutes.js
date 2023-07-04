const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authContoller');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
//the ID of the user that is gonna be updated come from request.user,which was set by this protect middleware here,which in turn got the id from the json web token,and since no one can change the ID in that json web token without knowing the secret, well we know that the ID is then safe because of that And so because of this, everything here is safe.

router.patch('/updateMe', authController.protect, userController.updateMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
