import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/', dashboardController.getDashboard);

export default router;
