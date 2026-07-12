import User from '../models/user.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { userCreateValidators, userUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(User);

export default createResourceRouter({
  controller,
  createValidators: userCreateValidators,
  updateValidators: userUpdateValidators,
});