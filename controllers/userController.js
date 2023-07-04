const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

const filterObj = (obj, ...allowedFields) => {
  //loop through the object and for each element check if it's one of the allowed fields and if it is, simply add it to a new object,that we're then gonna return in the end.
  const newObj = {};
  // this will return an array containing all the key names of object
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// allow currently logged in user to manipulate user data, user can update name and email address
exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user Post password data
  if (req.body.password || req.body.password) {
    return next(
      new AppError(
        'This route is not for password updates.Pleade use /updateMyPassword.',
        400
      ) // 400 for bad request
    );
  }
  //2)Update user document
  //filter the body so that the user can update only name and email,So not letting user update other fields using this url
  const filteredBody = filterObj(req.body, 'name', 'email');
  const UpdatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined ',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined ',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined ',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined ',
  });
};
