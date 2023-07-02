const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { promisify } = require('util');

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
  // we pass the token as 1st argument so that the algorithm can read the payload, and it also need secret as 2nd argument in order to create the test signature. and 3rd argument as  a callback function, which is  gonna run as soon as the verification has been completed.

  //This veryify is async function so once it verifies token it will then call the callback function
  // We are going to promisify this function so make it return a promise and so that we can use async await.so to do that node has built in tool
  // so promisify(jwt.verify) this is a function that we need to call which will then return a promise. result value of the promise will be decoded data so the decoded payload from this jwt

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //NOW MOST TUTORIAL WOULD STOP HERE.BUt why do i need the steps 3 and 4?
  //for example, what if the user has been deleted in the meantime. So the token will still exist,but if the user is no longer existent then we actually don't want to log him in, right?Or even worse, what if the user has actually changed his password after the token has been issued? Well, that should also not work, right
  // for example imagine that someone stole the JSON web token from a user.But then, in order to protect against that the user changes his password.And so, of course, that old token that was issued before the password change should no longer be validSo it should not be accepted to access protected routes.
  //And so, that's the kind of stuff that we're gonna implement here in step three and step four

  //3) check if user still exists.
  //this is now why we actually have the ID in the payload,because we can now use that ID and query the user using just that ID.
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }
  //4) check if user changed password after the jwt was issued
  //TO IMPLEMENT THIS TEST WE WILL USE INSTANCE METHOD because this code belongs ot user model and not to controller

  next();
});
