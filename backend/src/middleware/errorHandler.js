import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import ENV from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log error
  logger.error(err.message, { path: req.path, method: req.method });

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate value entered for field(s): ${fields}. Please use unique values.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, 'Validation Error', messages);
  }

  // Handle JWT Malformed / Invalid
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authorization token');
  }

  // Handle JWT Expired
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authorization token has expired. Please log in again');
  }

  // If error is not an instance of ApiError, convert to generic 500
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(ENV.NODE_ENV === 'development' && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
