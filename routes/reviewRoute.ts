import express from 'express';
import {
  createReview,
  deleteReview,
  getAllReview,
  getReviewById,
  getReviewByTour,
  getReviewByUser,
  getTourAndUserInfo,
  updateReview,
} from '../controllers/reviewController';
import { protect, restrictTo } from '../controllers/authController';
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.use(protect);
reviewRouter.get('/', getAllReview);

reviewRouter
  .route('/')
  .post(restrictTo('user'), getTourAndUserInfo, createReview);

reviewRouter
  .route('/:id')
  .get(getReviewById)
  .patch(restrictTo('admin', 'user'), updateReview)
  .delete(restrictTo('admin', 'user'), deleteReview);

// reviewRouter.route('/getByTour/:id').get(getReviewByTour);
// reviewRouter.route('/getByUser/:id').get(getReviewByUser);
export default reviewRouter;
