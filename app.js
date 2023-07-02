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
  // this will display data sent in http headers like below. when we send token in headers we follow below standard in postman key:authorization, value:Bearer kdjsdjgiohrwiognpiogoaef. after bearer we write token

  // {
  //   authorization: 'Bearer kdjsdjgiohrwiognpiogoaef',
  //   'user-agent': 'PostmanRuntime/7.32.3',
  //   accept: '*/*',
  //   'postman-token': '73e52c9c-06b3-4e03-9338-bb20c7fa8f55',
  //   host: 'localhost:3000',
  //   'accept-encoding': 'gzip, deflate, br',
  //   connection: 'keep-alive'
  // }
  // console.log(req.headers);

  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// error handling
app.use(globalErrorhandler);

module.exports = app;
