const mongoose = require('mongoose');
const Tour = require('./tourModel');
// review model is a child of tour and user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },

    tour: [
      {
        type: mongoose.Schema.ObjectId,
        // so reference is to a model called tour so it's in that collection where monogoose is then going to look for documents with the ID that we specified
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.'],
      },
    ],
    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user.'],
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  // we populate twice because we want both tour and user model to populate
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// so storing a summary of related data set on the main data set is actually a very popular technique in data modeling. It can be helpful in order to prevent constant queries of the related data set
// static method => these can be called on the model directly like Review.calcStats()
// this function takes in a tour ID
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this keyword will point to the current model, and we need to call aggregate on a model and that's why we used static method
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);
  // find the current tour and update avgRating and nRatings on that tour. this allows us to dynamically change values in the above mentioned field
  /*[
    {
      _id: [ 64aaa317d0b4e62bec430ee6 ],
      nRatings: 3,
      avgRating: 4.333333333333333
    }
  ]*/

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRatings,
    ratingsAverage: stats[0].avgRating,
  });
};
// we will use middleware to call calcAverageRatings
// use post because all the documents are already saved in the db and then we can calculate with all the data including new one
reviewSchema.post('save', function () {
  // Review model is not defined ahead ,its defined after this code so to get around this we use this.constructor,and that will still point to model becaues this keyword is current document and constructor is the model who created that document
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
