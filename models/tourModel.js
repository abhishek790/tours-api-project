const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    // scheme definition
    name: {
      type: String,
      unique: true,
      trim: true,
      // mongoose validator
      required: [true, 'A tour must have a name'],

      maxlength: [40, 'A tour name must have less or equal the 40 characters'],
      minlength: [10, 'A tour name must have less or equal then 10 characters'],

      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // enum is only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either :easy, medium,difficult ',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    // making custom validation
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover '],
    },

    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // it will remove createdAt from the client(client will not be able to see createdAt)
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  // scheme options
  {
    // this will make them available in response data
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// we can create indexes on specific fields in a collection for eg: mongo automatically creates index on the id by default.And this ID index is then basically an ordered list of all the IDs that get stored somewhere outside of the collection , And this index is extremely useful.Because whenever documents are queried by the ID, MongoDB will search that ordered index instead of searching through the whole collection and look at all the documents one by one which is of course much slower.
// without an index Mongo has to look at each document one by one.But with an index on the field that we are querying for,this process becomes much more efficient.
// we pass in object with name of the field that we want to index. 1 means sorting index ascending order and -1 means sorting index descending order
// this is also called single field index
//if we sometimes query for a field but combined with another field then it's actually more efficient to create a compound index(two fields)

//tourSchema.index({ price: 1 });
// compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // calculating duration in week
});

//virtual populate

tourSchema.virtual('reviews', {
  // name of the model we want to reference
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//documnet middleware
tourSchema.pre('save', function (next) {
  console.log(this);

  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function (next) {
  console.log('Will save document...');
  next();
});

tourSchema.post('save', function (doc, next) {
  // console.log(doc);
  next();
});

//query middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//child referencing
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(Date.now() - this.start);
  // console.log(docs);
  next();
});

// aggregate middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this.pipeline());
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
