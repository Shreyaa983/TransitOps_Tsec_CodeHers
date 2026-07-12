import { Router } from 'express';
import notificationsController from '../controllers/notifications.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/me', notificationsController.getMyNotifications);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);

export default router;
