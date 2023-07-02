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
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // by default we will return false from the method, which means user has not changed his password after the token was issued
  // this keyword points to the current document
  // if the passwordChangedAt property exists only then we want to do the comparison.But if passwordChangedAt does not exist well then that means the user
  if (this.passwordChangedAt) return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
