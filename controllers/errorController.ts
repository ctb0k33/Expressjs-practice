import { AppError } from '../utils/AppError';

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const regex = /(['"])(?:(?=(\\?))\2.)*?\1/;
  const value = err.errmsg.match(regex)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err: any) => {
  console.log(err);
  let errors = '';
  Object.values(err.errors).map((item: any) => {
    errors += item.properties.message + '. ';
    // console.log('item:', item.properties.message);
  });
  console.log('errors:', errors);
  const message = `Input valid data. ${errors}`;

  return new AppError(message, 400);
};
const handleJsonWebTokenError = () => {
  return new AppError('Invalid token. Please login again', 401);
};
const handleTokenExpiredError = () => {
  return new AppError('Expired token. Please login again', 401);
};
const sendErrorDev = (err: any, res: any) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err: any, res: any) => {
  // OPERATIONAL ERRORS
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    //PROGRAMING OR OTHER UNKNOW ERROR => DON'T LEAK DETAIL
  } else {
    console.error('Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};
// MIDDLEWARE WITH 4 PARAMS ALWAYS RECOGNIZE AS ERROR HANDDLER
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  let error = Object.create(err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV?.trim() === 'production') {
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpiredError();
    }
    sendErrorProd(error, res);
  }
};
