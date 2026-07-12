import { asyncHandler } from '../utils/asyncHandler.js';
import { createCrudService } from '../services/crud.service.js';

export const buildCrudController = (model) => {
  const crudService = createCrudService(model);

  return {
    list: asyncHandler(async (_req, res) => {
      const documents = await crudService.list();
      res.status(200).json({ success: true, data: documents });
    }),

    getOne: asyncHandler(async (req, res) => {
      const document = await crudService.getById(req.params.id);
      res.status(200).json({ success: true, data: document });
    }),

    create: asyncHandler(async (req, res) => {
      const document = await crudService.create(req.body);
      res.status(201).json({ success: true, data: document });
    }),

    update: asyncHandler(async (req, res) => {
      const document = await crudService.update(req.params.id, req.body);
      res.status(200).json({ success: true, data: document });
    }),

    remove: asyncHandler(async (req, res) => {
      await crudService.remove(req.params.id);
      res.status(200).json({ success: true, message: `${model.modelName} deleted successfully` });
    }),
  };
};