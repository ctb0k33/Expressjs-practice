import { Review } from '../models/reviewModel';
import { catchAsync } from '../utils/catchAsync';
import { createOne, deleteOne, getAllDoc, getOne, updateOne } from './handlerFactory';

export const getAllReview = getAllDoc(Review);
export const getReviewById = getOne(Review);

export const getReviewByTour = catchAsync(
  async (req: any, res: any, next: any) => {
    const review = await Review.find({ tour: req.params.tourId });
    res.status(200).json({
      status: 'success',
      results: review.length,
      data: {
        review,
      },
    });
  },
);

export const getReviewByUser = catchAsync(
  async (req: any, res: any, next: any) => {
    const review = await Review.find({ user: req.params.userId });
    res.status(200).json({
      status: 'success',
      results: review.length,
      data: {
        review,
      },
    });
  },
);

export const getTourAndUserInfo = (req: any, res: any, next: any) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
export const createReview = createOne(Review);
export const updateReview = updateOne(Review);
export const deleteReview = deleteOne(Review);
