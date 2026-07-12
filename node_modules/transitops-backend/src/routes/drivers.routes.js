import Driver from '../models/driver.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { driverCreateValidators, driverUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(Driver);

export default createResourceRouter({
  controller,
  createValidators: driverCreateValidators,
  updateValidators: driverUpdateValidators,
});