import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.status(200).json({ success: true, data: result });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});