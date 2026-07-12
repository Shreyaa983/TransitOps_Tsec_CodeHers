import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

export const protect = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Not authorized, token missing'));
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password').populate('driver');

    if (!user) {
      return next(new ApiError(401, 'Not authorized, user not found'));
    }

    req.user = user;
    return next();
  } catch {
    return next(new ApiError(401, 'Not authorized, invalid token'));
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient role'));
    }

    return next();
  };
};