class AppError extends Error {
  // constructor method is called each time we create a new object out of this class
  constructor(message, statusCode) {
    // when we extend a parent class we call super in order to call parent constructor and we do that with message because the message is only parameter that the built-in error accepts
    // by doing this we set the message property to our incoming message
    super(message);
    this.statusCode = statusCode;
    // status depends on statusCode
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
    this.isOperational = true;

    // we don't want to add this class to stack trace
    // we pass in object and AppError class itself
    // so in this way when a new object is created and a constructor function is called then that function call is not gonna appear in the stack trace and will not pollute it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
