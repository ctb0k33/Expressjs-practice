import mongoose, { Query } from 'mongoose';
import slugify from 'slugify';
const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'A tour name must only contain characters'],
    },
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
      require: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // setter function run each time a new value is set
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: any, val: any) {
          // 'this' points to current doc on NEW document creation
          return val < this.price;
        },
        // VALUE here is related to mongoose, it will return the value of this.priceDiscount
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    slug: String,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    startDates: [Date],
    startLocation: {
      // GeoJSON
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });

toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

toursSchema.pre('save', function (next: any) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// DOCUMENT MIDDLEWARE. Only work in save and create, not UPDATE
toursSchema.pre('save', (next: any) => {
  console.log('before save to DB');
  next();
});

// embedded document middleware (in case we need)
// toursSchema.pre('save', async function (next: any) {
//   const tour = this;

//   // a array of promise ( remember async function return a promise)
//   const guidesPromise = tour.guides.map(async (id: any) => {
//     await User.findById(id);
//   });
//   const guides: any = await Promise.all(guidesPromise);
//   this.guides = guides;
//   next();
// });

toursSchema.post('save', (doc: any, next: any) => {
  console.log(doc);
  next();
});

// QUERY MIDDLEWARE
toursSchema.pre<Query<any, any, any, any>>(/^find/, function (next: any) {
  this.find({ secretTour: { $ne: true } });
  next();
});

toursSchema.pre<Query<any, any, any, any>>(/^find/, function (next: any) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
// AGGREGATION MIDDLEWARE
// toursSchema.pre('aggregate', function (next: any) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this.pipeline());
//   next();
// });

export const Tour = mongoose.model('Tour', toursSchema);
