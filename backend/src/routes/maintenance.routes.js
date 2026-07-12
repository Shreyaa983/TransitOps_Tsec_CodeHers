import MaintenanceLog from '../models/maintenanceLog.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { maintenanceCreateValidators, maintenanceUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(MaintenanceLog);

export default createResourceRouter({
  controller,
  createValidators: maintenanceCreateValidators,
  updateValidators: maintenanceUpdateValidators,
});