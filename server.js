const mongoose = require('mongoose');
const dotenv = require('dotenv');
// UNCAUGHT EXCEPTIONS
// all errors or bugs that occurs in our synchronous code but are not handled anywhere are called uncaught exceptions

// we have to define this code before any other code is executed because it can now listen to events for all the code below , if there is code above this code than it cannot listen to event occured in that code
process.on('uncaughtException', (err) => {
  // so we wanna log the error to the console,and giving us a way of then fixing the problem and then we want to gracefully shutdown the server
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
// process.exit will abruptly close the app , but we need to close gradually so first close server and so on , for that we save server in a variable
const server = app.listen(port, () => {
  console.log(`App running on port ${port}... `);
});

// UNHANDLED REJECTION
//unhandled promise rejection is rejection that has not been handled anywhere.
// handling error outside of express eg: db connection failure

//so each time that there is an unhandled rejection somewhere in our application, the process object will emit an object called unhandled rejection and so we can subscribe to that event .

// all unhandled rejection will be catched here
// we are listening to this unhandledRejection which then allows us to handle all the errors that occur in asynchronous code
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  //our application will not work because of db error so in this case we shutdown our application
  // we can also pass a code in here code 0 stands for success and code 1 stands for uncaught exception
  // by doing server.close we give the server time to finish all the request that are still pending or being handled at the time and only after that, the server is then closed
  server.close(() => {
    process.exit(1);
  });
});
