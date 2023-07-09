const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authContoller');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// what this will do is to protect all the routes that come after this point and again that's because middleware runs in sequence and so after these 4 middleware function this will execute and this will only call the next middleware if the user is authenticated. So all of the middleware that come after this one are now protected .
router.use(authController.protect);
//we can remove protect form below because we have already implemented protect above

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// only admin will get access to following routes
router.use(authController.restrictTo('admin'));
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
