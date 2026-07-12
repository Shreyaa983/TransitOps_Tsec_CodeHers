import Trip from '../models/trip.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { tripCreateValidators, tripUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(Trip);

export default createResourceRouter({
  controller,
  createValidators: tripCreateValidators,
  updateValidators: tripUpdateValidators,
});