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
  // PasswordResetToken should be a random string and it doesn't need to as cryptographically as strong as password hash so we use built in crypto.randomBytes
  // we need to specify number of characters and then convert it into hexadecimal string
  const resetToken = crypto.randomBytes(32).toString('hex');

  // to store this we're gonna create a new field in our db schema so that we can campare it with the token that the user provides
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
