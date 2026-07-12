import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export const validateRequest = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    console.error("VALIDATION FAILED:", result.array(), "PAYLOAD:", req.body);
    return next(new ApiError(400, 'Validation failed', result.array()));
  }

  return next();
};