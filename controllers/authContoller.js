const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  //201 means created
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!'), 400);
  }

  //2) check if user exists && password is correct

  // email:email;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 means unauthorized
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) If everything ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

// middleware function to allow only logged in user to have access to getAllTours route
exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    //spiliting at space and picking second value form array i.e. token eg: authorization:'Bearer kdjsdjfdesa'
    token = req.headers.authorization.split(' ')[1];
  }
  //check if token is there
  if (!token) {
    return next(
      //401 means unauthorized
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  //2) verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) check if user still exists.

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }
  //4) check if user changed password after the jwt was issued

  if (currentUser.changePasswordAt(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  // grant access to protected route
  req.user = currentUser;
  next();
});

// Authorization to perform certain task
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles['admin','lead-guide]
    if (!roles.includes(req.user.role)) {
      return next(
        // 403 means forbidden
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Password reset functionality
// there are 2 steps for implementing, the first one is that the user sends a post request to a forgot password route, only with this email address.This will then create a reset token(random token ,not a jwt) and sent that to the email address that was provided.Then in 2nd part the user then sends that token from his email along with a new password in order to update his password

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // 404 means not found
    return next(new AppError('There is no user with email address.', 404));
  }
  //2) Generate the random reset token
  //for this we are gonna create instance method on user because this has to do with data itself
  const resetToken = user.createPasswordResetToken();

  // we just modifed it in userModel but now we need to save it
  // we pass in options in save to avoid errors
  await user.save({ validateBeforeSave: false });

  //3) Send it to user's email
  // user will then click on this email and will then be able to do the request from there
  // here we are going to send the plain token not the reset one
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}//ap1/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  // since we want to do more than just send error message so we use try catch block and set token and expire date to undefined (which will delete the field)
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // above code will just modify the data but to save it in database use .save
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email.Try again later!'),
      500
    );
  }
});

exports.resetPassword = (req, res, next) => {
  //
};
