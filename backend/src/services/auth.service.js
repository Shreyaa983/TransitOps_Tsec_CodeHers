import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const createToken = (userId) => {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

export const authService = {
  async register(payload) {
    const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

    if (existingUser) {
      throw new ApiError(409, 'Email already exists');
    }

    const user = await User.create(payload);
    const safeUser = await User.findById(user._id).select('-password');

    return {
      user: safeUser,
      token: createToken(user._id),
    };
  },

  async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const safeUser = await User.findById(user._id).select('-password');

    return {
      user: safeUser,
      token: createToken(user._id),
    };
  },
};

export { createToken };