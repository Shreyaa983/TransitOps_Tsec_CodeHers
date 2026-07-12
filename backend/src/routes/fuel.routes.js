import { Router } from 'express';
import fuelController from '../controllers/fuel.controller.js';
import { createResourceRouter } from './resource-router.js';
import { fuelCreateValidators, fuelUpdateValidators } from '../validators/index.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/monthly', fuelController.getMonthlyFuelConsumption);
router.get('/vehicle/:vehicleId', fuelController.getVehicleFuelLogs);
router.get('/vehicle/:vehicleId/summary', fuelController.getFuelSummary);
router.get('/vehicle/:vehicleId/latest', fuelController.getLatestFuelLog);

router.use(
  createResourceRouter({
    controller: fuelController,
    createValidators: fuelCreateValidators,
    updateValidators: fuelUpdateValidators,
  })
);

export default router;