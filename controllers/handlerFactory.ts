import { AppError } from '../utils/AppError';
import { APIFeature } from '../utils/apiFeatures';
import { catchAsync } from '../utils/catchAsync';

export const deleteOne = (model: any) =>
  catchAsync(async (req: any, res: any, next: any) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return new AppError('No document found with that ID', 404);
    } else {
      res.status(204).json({
        status: 'success',
        data: null,
      });
    }
  });

export const updateOne = (model: any) =>
  catchAsync(async (req: any, res: any, next: any) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('no document found with that id ', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const createOne = (model: any) =>
  catchAsync(async (req: any, res: any, next: any) => {
    const doc = await model.create(req.body);
    if (!doc) {
      return next(new AppError('no tour found with that id ', 404));
    }
    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

export const getOne = (model: any, populate?: any) =>
  catchAsync(async (req: any, res: any, next: any) => {
    // populate happend only in query, but not database
    let query = model.findById(req.params.id);
    if (populate) {
      query = query.populate(populate);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('no document found with that id ', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const getAllDoc = (model: any) =>
  catchAsync(async (req: any, res: any, next: any) => {
    let filter = {};
    if (req.body.tourId) {
      filter = { tour: req.body.tourId };
    }
    const features = new APIFeature(model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    //SEND BACK JSON
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
