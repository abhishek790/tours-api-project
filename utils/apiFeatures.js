class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); // it is same as projection in mongodb
    } else {
      this.query = this.query.select('-__v'); // - prefix means not including, it will not send __v to client
    }
    return this;
  }
  paginate() {
    // passing default value even if the user doesnot specify the page
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10 page1= 1-10, page2= 11-20, page3= 21-30

    this.query = this.query.skip(skip).limit(limit); // limit=> amount of result we want in the query, and skip=> amount of result that should be skipped before querying data
    // console.log(this);
    return this;
  }
}
module.exports = APIFeatures;
