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
import incidentsRoutes from './incidents.routes.js';
import notificationsRoutes from './notifications.routes.js';
import aiRoutes from '../ai/routes/index.js'; // ← AI Incident Analyzer (isolated module)

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
router.use('/incidents', incidentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/ai', aiRoutes); // POST /api/ai/analyze-incident

export default router;