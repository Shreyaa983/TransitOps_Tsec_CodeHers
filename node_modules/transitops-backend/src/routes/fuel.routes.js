import FuelLog from '../models/fuelLog.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { fuelCreateValidators, fuelUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(FuelLog);

export default createResourceRouter({
  controller,
  createValidators: fuelCreateValidators,
  updateValidators: fuelUpdateValidators,
});