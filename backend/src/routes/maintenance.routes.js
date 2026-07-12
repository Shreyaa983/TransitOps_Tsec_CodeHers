import maintenanceController from '../controllers/maintenance.controller.js';
import { createResourceRouter } from './resource-router.js';
import { maintenanceCreateValidators, maintenanceUpdateValidators } from '../validators/index.js';

export default createResourceRouter({
  controller: maintenanceController,
  createValidators: maintenanceCreateValidators,
  updateValidators: maintenanceUpdateValidators,
});