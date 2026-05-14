import { env } from '../config/env.js';

const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue || {})[0] || 'field';
  return {
    statusCode: 409,
    message: `${field} already exists`
  };
};

const handleValidationError = (error) => ({
  statusCode: 400,
  message: 'Validation failed',
  details: Object.values(error.errors || {}).map((item) => ({
    field: item.path,
    message: item.message
  }))
});

const handleCastError = (error) => ({
  statusCode: 400,
  message: `Invalid ${error.path}: ${error.value}`
});

export const errorHandler = (error, _req, res, _next) => {
  let normalizedError = {
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal server error',
    details: error.details || null
  };

  if (error.code === 11000) {
    normalizedError = handleDuplicateKeyError(error);
  }

  if (error.name === 'ValidationError') {
    normalizedError = handleValidationError(error);
  }

  if (error.name === 'CastError') {
    normalizedError = handleCastError(error);
  }

  const response = {
    success: false,
    message: normalizedError.statusCode === 500 && env.isProduction
      ? 'Internal server error'
      : normalizedError.message
  };

  if (normalizedError.details) {
    response.details = normalizedError.details;
  }

  if (env.isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  res.status(normalizedError.statusCode).json(response);
};
