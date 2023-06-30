const AppError = require('./../utils/appError');

// sending complex error for development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// sending simple error for production
const sendErrorProd = (err, res) => {
  //operational ,trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // programming or other unknown error: don't leak error details
  } else {
    //1) Log error for developer
    console.log('ERROR', err);

    //2) Send generic message to client
    res.status(500).json({
      status: 'error',
      message: 'Something went very worng',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  // 400 for badrequest
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  // it gives array of matched value, but we only want the one in first
  // this regex will extract The Forest Hikerr from this format { name: \"The Forest Hiker\" }"
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value:${value} please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // now inorder to create one big string out of all the strings from all the errors,we have to loop over all of these objects,and then extract all the error messages into a new array
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data.${errors.join('. ')}`;
  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //INVALID DB ID ERROR:
    // CastError is name given to invalid DB id
    // we gonna pass error created by mongoose in handleCastErrorDB, this will then create a new error with AppError class and that error will then be marked as operational because all our AppErrors have this operational property set to true automatically
    // this handleCastErrorDB will return an error so we will save it
    // it's not a good practice to change original err object so we make duplicate copy

    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    }

    //DUPLICATE DB FIELD ERROR:
    // dublicate error occurs when we gave same field name to fields that need to be unique this error occurs
    // this error doesnot have name property, because it's not an error caused by a mongoose but instead by underlying mongoDB driver
    // so we use the code 11000 in error message to identify this type of error

    if (err.code === 11000) {
      err = handleDuplicateFieldDB(err);
    }

    //VALIDATION ERROR:
    // this is also error created by mongoose just like the CastError

    if (err.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }
    sendErrorProd(err, res);
  }
};

// there are 3 types of error created by mongoose in which we need to mark as operational errors so that we can send back meaning full error message: these 3 errors are invalid db id, duplicate db fields, validation error
