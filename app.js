const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorhandler = require('./controllers/errorController');

const app = express();
// WE want to use logger middleware only when we are in development
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestedTime = new Date().toISOString();

  next();
});

// implementing rate limiting in order to prevent the same IP from making too many requests to our API that will help us to prevent attacks like DOS or brute force
// what rate limiter will do is count the requests coming from one IP and then, when there are too many requests block these requests.
// we will implement that in a global middleware,we use npm package called rate limit

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// error handling
app.use(globalErrorhandler);

module.exports = app;
