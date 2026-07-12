import { Router } from 'express';
import expenseController from '../controllers/expenses.controller.js';
import { createResourceRouter } from './resource-router.js';
import { expenseCreateValidators, expenseUpdateValidators } from '../validators/index.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/summary', expenseController.getExpenseSummary);
router.get('/monthly', expenseController.getMonthlyExpenses);
router.get('/category-breakdown', expenseController.getCategoryBreakdown);
router.get('/top-costly-vehicles', expenseController.getTopCostlyVehicles);
router.get('/vehicle/:vehicleId', expenseController.getVehicleExpenses);
router.get('/vehicle/:vehicleId/operational-cost', expenseController.getOperationalCost);

router.use(
  createResourceRouter({
    controller: expenseController,
    createValidators: expenseCreateValidators,
    updateValidators: expenseUpdateValidators,
  })
);

export default router;