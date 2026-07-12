import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import vehiclesRoutes from './vehicles.routes.js';
import driversRoutes from './drivers.routes.js';
import tripsRoutes from './trips.routes.js';
import maintenanceRoutes from './maintenance.routes.js';
import fuelRoutes from './fuel.routes.js';
import expensesRoutes from './expenses.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportsRoutes from './reports.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/drivers', driversRoutes);
router.use('/trips', tripsRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/fuel', fuelRoutes);
router.use('/expenses', expensesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

export default router;