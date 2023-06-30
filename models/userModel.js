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
});

userSchema.pre('save', async function (next) {
  // ONLY RUN THIS FUNCITON IF PASSWORD WAS ACTUALLY MODIFED OR CREATED NEW PASSWORD

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 16);

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

const User = mongoose.model('User', userSchema);

module.exports = User;
