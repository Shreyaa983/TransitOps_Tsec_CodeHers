import { Router } from 'express';
import { incidentsController } from '../controllers/incidents.controller.js';
import { incidentCreateValidators, incidentUpdateValidators } from '../validators/index.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { idParamValidator } from '../validators/common.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Create incident - DRIVER only
router.post('/', protect, authorizeRoles('DRIVER'), incidentCreateValidators, validateRequest, incidentsController.create);

// List incidents - FLEET_MANAGER or DRIVER
router.get('/', protect, authorizeRoles('FLEET_MANAGER', 'DRIVER'), incidentsController.list);

// Get single incident - DRIVER or FLEET_MANAGER
router.get('/:id', protect, authorizeRoles('DRIVER', 'FLEET_MANAGER'), idParamValidator, validateRequest, incidentsController.getOne);

// Approve / Reject - FLEET_MANAGER only
router.patch('/:id/approve', protect, authorizeRoles('FLEET_MANAGER'), incidentsController.approve);
router.patch('/:id/reject', protect, authorizeRoles('FLEET_MANAGER'), incidentsController.reject);

export default router;
