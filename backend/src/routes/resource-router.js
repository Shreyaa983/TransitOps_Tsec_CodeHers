import { Router } from 'express';
import { idParamValidator } from '../validators/common.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { protect } from '../middleware/authMiddleware.js';

export const createResourceRouter = ({ controller, createValidators = [], updateValidators = [] }) => {
  const router = Router();

  // All resource routes require a valid JWT
  router.use(protect);

  router.route('/').get(controller.list).post(createValidators, validateRequest, controller.create);
  router
    .route('/:id')
    .get(idParamValidator, validateRequest, controller.getOne)
    .patch(idParamValidator, updateValidators, validateRequest, controller.update)
    .delete(idParamValidator, validateRequest, controller.remove);

  return router;
};