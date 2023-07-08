const Tour = require('./../models/tourModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

//aliasing
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTours = factory.getOne(Tour, { path: 'reviews' });
exports.createTours = factory.createOne(Tour);
exports.updateTours = factory.updateOne(Tour);

// in the deleteOne function we pass the model and this function will then right away return this handler function declared in handlerFactory this works because of JavaScript closures,which is just a fancy way of saying that this inner function here will get access to the variables of the outer function even after the outer has already returned.
exports.deleteTours = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },

    {
      $group: {
        // _id:null,
        // _id: '$ratingsAverage',

        _id: { $toUpper: '$difficulty' },

        numTours: { $sum: 1 },

        numRatings: { $sum: '$ratingsQuantity' },

        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // sort stage
    {
      // 1 is for ascending
      $sort: { avgPrice: 1 },
    },

    /*
      // we can also repeat stages
      {
        // _id is now difficulty because we have specified above
        //$ne, refers to not equal to
        // selects all the documents that are not easy
        $match: { _id: { $ne: 'EASY' } },
      },
      */
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  console.log(plan);
  res.status(200).json({
    message: 'success',
    data: {
      plan,
    },
  });
});
