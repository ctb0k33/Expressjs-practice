import express from 'express';
const tourRouter = express.Router();
import {
  // getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getAllTours,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistance,
} from '../controllers/tourController';
import { protect, restrictTo } from '../controllers/authController';
import reviewRouter from './reviewRoute';
// tourRouter.param('id', (req: any, res: any, next: any, val: any) =>
//   checkId(req, res, next, val)
// );

tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.get('/top-5-cheap', aliasTopTours, getAllTours);
tourRouter.route('/tour-stats').get(getTourStats);
tourRouter.get('/', getAllTours);
tourRouter.get('/:id', getTour);
tourRouter.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  getToursWithin,
);
tourRouter.get('/distances/:latlng/unit/:unit', getDistance);
tourRouter.use(protect);
tourRouter
  .route('/getMonthlyPlan/:year')
  .get(restrictTo('admin', 'user', 'guide'), getMonthlyPlan);

tourRouter.use(restrictTo('admin', 'lead-guide'));
tourRouter.route('/').post(createTour);
tourRouter.route('/:id').patch(updateTour).delete(deleteTour);

export default tourRouter;
