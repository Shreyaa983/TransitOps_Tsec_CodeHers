import MaintenanceLog from '../models/maintenanceLog.model.js';
import Expense from '../models/expense.model.js';
import Vehicle from '../models/vehicle.model.js';
import { buildCrudController } from './crud.controller.js';
import { createCrudService } from '../services/crud.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const crud = buildCrudController(MaintenanceLog);
const crudService = createCrudService(MaintenanceLog);

const create = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId, cost } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  const document = await crudService.create(req.body);

  await Expense.create({
    vehicle: document.vehicle?._id ?? document.vehicle,
    category: 'MAINTENANCE',
    amount: Number(cost ?? document.cost ?? 0),
    description: document.issue,
    date: document.openedAt || document.createdAt,
  });

  res.status(201).json({ success: true, data: document });
});

export default {
  ...crud,
  create,
};
