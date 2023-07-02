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
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value:${value} please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data.${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token.Please log in again!', 401);
};
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired token.Please log in again!', 401);
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //INVALID DB ID ERROR:

    if (err.name === 'CastError') {
      err = handleCastErrorDB(err);
    }

    //DUPLICATE DB FIELD ERROR:

    if (err.code === 11000) {
      err = handleDuplicateFieldDB(err);
    }

    //VALIDATION ERROR:

    if (err.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }
    // json web token error caused by tempering with payload data which resulted in different token thus creating error
    if (err.name === 'JsonWebTokenError') {
      err = handleJWTError();
    }

    // expired token error
    if (err.name === 'TokenExpiredError') {
      err = handleJWTExpiredError();
    }

    sendErrorProd(err, res);
  }
};
