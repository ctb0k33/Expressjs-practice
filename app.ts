import express from 'express';
import morgan from 'morgan';
import tourRouter from './routes/tourRoute';
import userRouter from './routes/userRoute';
import helmet from 'helmet';
import { AppError } from './utils/AppError';
import { errorHandler } from './controllers/errorController';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// import xss from 'express-xss-sanitizer';
import hpp from 'hpp';
import reviewRouter from './routes/reviewRoute';
export const app = express();

// middleware for http header security
app.use(helmet());

// middleware to log request information
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}

// middleware for body parsing (req.body)
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSQL query injection ($ example)
app.use(mongoSanitize());

// data sanitization against XSS
// app.use(xss());

// middleware prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use((req: any, res: any, next: any) => {
  req.requestTime = new Date().toISOString();
  next();
});

const limiter = rateLimit({
  // 100 requests per hour
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
// app.use((req: any, res: any, next: any) => {
//   const detector = new DeviceDetector({
//     clientIndexes: true,
//     deviceIndexes: true,
//     deviceAliasCode: false,
//   });
//   // const result = detector.detect(req.useragent);
//   // console.log(req.useragent);
//   console.log(window.navigator.userAgent)
//   next();
// });
app.use('/api', limiter);

app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req: any, res: any, next: any) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
  );
  next(err);
});

app.use(errorHandler);
