import Expense from '../models/expense.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { expenseCreateValidators, expenseUpdateValidators } from '../validators/index.js';

const controller = buildCrudController(Expense);

export default createResourceRouter({
  controller,
  createValidators: expenseCreateValidators,
  updateValidators: expenseUpdateValidators,
});