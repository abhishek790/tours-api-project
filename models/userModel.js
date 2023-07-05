const crypto = require('crypto');
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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
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
  passwordChangedAt: Date,
  passwordResetToken: String,
  // this reset token will expire after certain time for security measures
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // ONLY RUN THIS FUNCITON IF PASSWORD WAS ACTUALLY MODIFED OR CREATED NEW PASSWORD

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);

  // DELETE PASSWORD CONFIRM FIELD
  this.passwordConfirm = undefined;
  next();
});

// update the changedPasswordAt property
userSchema.pre('save', function (next) {
  // when we create a new document we actually did modify the password and then we would seet the passwordChangedAt property
  if (!this.isModified('password') || this.isNew) return next();
  //sometimes it happens that the token is created a bit before the changed password timestamp has actually been created And so, we just need to fix that by subtracting one second so that then will put the passwordChangedAt one second in the past, okay, which will then of course,not be 100% accurate, but that's not a problem at all because one second here doesn't make any difference at all.
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// filtering out non-active user
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//INSTANCE METHOD
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userpassword
) {
  return await bcrypt.compare(candidatePassword, userpassword);
};
userSchema.methods.changePasswordAt = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //2023-07-02T00:00:00.000Z 1688276530 =>converting data format into millisecond and dividing it by 1000 for second because our JWTTimestamp is in second
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }
  //false means not changed
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // logging it as an object because this way it will then tell me the variable name along with it's value
  console.log({ resetToken }, this.passwordResetToken);

  // we want token to work for 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // return the plain text token which will be sent through email
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
