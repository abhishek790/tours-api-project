const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, // transform the email into lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // it will not show up in response to user
  },
  passwordConfirm: {
    type: String,
    required: true,

    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  // creating field for the date where the password has been changed
  // this passwordChangedAt property will change when someone change the password
  passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  // ONLY RUN THIS FUNCITON IF PASSWORD WAS ACTUALLY MODIFED OR CREATED NEW PASSWORD

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);

  // DELETE PASSWORD CONFIRM FIELD
  this.passwordConfirm = undefined;
  next();
});

//INSTANCE METHOD
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userpassword
) {
  // bcrypt.compare is async function. returns true if matched else returns false
  return await bcrypt.compare(candidatePassword, userpassword);
};

// inside the function we will pass jwt Time stamp which says when the token was issued
userSchema.methods.changePasswordAt = function (JWTTimestamp) {
  // by default we will return false from the method, which means user has not changed his password after the token was issued
  // this keyword points to the current document
  // if the passwordChangedAt property exists only then we want to do the comparison.But if passwordChangedAt does not exist well then that means the user has not changed the password so we can simply return false
  if (this.passwordChangedAt) {
    //2023-07-02T00:00:00.000Z 1688276530 =>converting data format into millisecond and dividing it by 1000 for second because our JWTTimestamp is in second
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);
    //not changed basically means that the day or the time at which the token was issued is less than the changed timestamp
    // for eg:the token was issued at time 100.But then, we changed the password, let's say, at time 200.so, we changed the password after the token was issued and so therefore, this is now true.But let's say that the password was last changed at 200,but then only after that, we issued the token so let's say, at time 300.And so, 300, less than 200?No, that's false.And so, we return false, which again means not changed

    return JWTTimestamp < changedTimestamp;
  }
  //false means not changed
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
