import mongoose from 'mongoose';

import { ApiError } from '../utils/ApiError.js';

export const assertRequiredFields = (body, fields) => {
  const missingFields = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ApiError(400, 'Missing required fields', missingFields);
  }
};

export const assertAllowedFields = (body, allowedFields) => {
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    throw new ApiError(400, 'Unsupported request fields', unknownFields);
  }
};

export const assertPlainObject = (value, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, `${field} must be an object`);
  }
};

export const assertEnumValue = (value, allowedValues, field) => {
  if (value !== undefined && !allowedValues.includes(value)) {
    throw new ApiError(400, `${field} must be one of: ${allowedValues.join(', ')}`);
  }
};

export const assertNonNegativeNumber = (value, field) => {
  if (value !== undefined && (typeof value !== 'number' || Number.isNaN(value) || value < 0)) {
    throw new ApiError(400, `${field} must be a non-negative number`);
  }
};

export const assertBoolean = (value, field) => {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new ApiError(400, `${field} must be a boolean`);
  }
};

export const assertScore = (value, field) => {
  if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 100)) {
    throw new ApiError(400, `${field} must be a number between 0 and 100`);
  }
};

export const assertUrl = (value, field) => {
  if (value !== undefined && value !== '' && !/^https?:\/\/.+/i.test(value)) {
    throw new ApiError(400, `${field} must be a valid HTTP or HTTPS URL`);
  }
};

export const assertArray = (value, field) => {
  if (value !== undefined && !Array.isArray(value)) {
    throw new ApiError(400, `${field} must be an array`);
  }
};

export const assertMongoId = (value, field) => {
  if (value !== undefined && value !== null && !mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `${field} must be a valid MongoDB ObjectId`);
  }
};
