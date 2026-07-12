import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { loginValidators, registerValidators } from '../validators/index.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post('/register', registerValidators, validateRequest, register);
router.post('/login', loginValidators, validateRequest, login);
router.get('/me', protect, me);

export default router;