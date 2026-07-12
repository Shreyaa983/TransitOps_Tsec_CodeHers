import Vehicle from '../models/vehicle.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { vehicleCreateValidators, vehicleUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(Vehicle);

export default createResourceRouter({
  controller,
  createValidators: vehicleCreateValidators,
  updateValidators: vehicleUpdateValidators,
});