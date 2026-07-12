import { Router } from 'express';
import reportsController from '../controllers/reports.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/analytics', reportsController.getAnalytics);

export default router;
