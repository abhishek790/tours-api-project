const crypto = require('crypto');
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

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // token should be stored in secure http only cookie,cookie is a small piece of text that a server can send to clients,then when the client receives a cookie it automatically store it and then automatically send it back along with all future request to the same server

  // to send cookie we have to attach it to the response object
  // specify the name of the cookie,and the data that we want to send in cookie and then we can send couple of options
  const cookieOptions = {
    // client will delete the cookie after expiration date
    // when specifying dates we always need to say new date
    // process.env.JWT_COOKIE_EXPIRES_IN it has 90 day now we need to convert it into milli second
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // cookie will only be sent on encrypted connection only (HTTPS) by this option
    //secure: true,
    // this will make the cookie not accessed or modified in any way by browser it is important to prevent cross-site scripting attacks
    // when we set httpOnly true ,the browser will receive the cookie ,store it and then send it automatically along with every request
    httpOnly: true,
    // now if we want test this cookie rightnow it wouldn't work because right now we are not using https. and so because of this secure: true, the cookie would not be sent to the client. so we only want to activate secure property on production
  };
  // only when we are production secure options will be set to true
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  // remove the password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
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

  //201 means created
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // 404 means not found
    return next(new AppError('There is no user with email address.', 404));
  }
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) Send it to user's email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}//ap1/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

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

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // if password expires is greater than right now , which means it's in future which in turn means it hasn't expired
    passwordResetExpires: { $gt: Date.now() },
  });
  //2)  If token has not expired, and there is user , set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user
  //4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

//Allow logged-in user to simply update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  //we still need the user to pass in his current password,so in order to confirm that user actually is who he says he is.
  //1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //2) check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError(' Your current password is wrong', 401)); // 401 means unauthorized
  }
  //3) if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) log user in ,send jwt
  createSendToken(user, 200, res);
});
