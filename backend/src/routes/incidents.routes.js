import { incidentsController } from '../controllers/incidents.controller.js';
import { createResourceRouter } from './resource-router.js';
import { incidentCreateValidators, incidentUpdateValidators } from '../validators/index.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = createResourceRouter({
  controller: incidentsController,
  createValidators: incidentCreateValidators,
  updateValidators: incidentUpdateValidators,
});

// Add custom routes
router.patch('/:id/approve', protect, authorizeRoles('FLEET_MANAGER'), incidentsController.approve);
router.patch('/:id/reject', protect, authorizeRoles('FLEET_MANAGER'), incidentsController.reject);

export default router;
