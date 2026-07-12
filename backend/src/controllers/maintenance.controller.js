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

  // Mandatory Rule: Creating an active maintenance record automatically changes vehicle status to In Shop.
  req.body.status = 'OPEN';
  const document = await crudService.create(req.body);

  vehicle.status = 'IN_SHOP';
  await vehicle.save();

  await Expense.create({
    vehicle: document.vehicle?._id ?? document.vehicle,
    category: 'MAINTENANCE',
    amount: Number(cost ?? document.cost ?? 0),
    description: document.issue,
    date: document.openedAt || document.createdAt,
  });

  res.status(201).json({ success: true, data: document });
});

const update = asyncHandler(async (req, res) => {
  const existingLog = await MaintenanceLog.findById(req.params.id);
  if (!existingLog) {
    throw new ApiError(404, 'Maintenance log not found');
  }

  const document = await crudService.update(req.params.id, req.body);

  // Mandatory Rule: Closing maintenance restores the vehicle to Available (unless retired).
  if (req.body.status === 'CLOSED' && existingLog.status !== 'CLOSED') {
    const vehicle = await Vehicle.findById(document.vehicle);
    if (vehicle && vehicle.status !== 'RETIRED') {
      vehicle.status = 'AVAILABLE';
      await vehicle.save();
    }
  }

  res.status(200).json({ success: true, data: document });
});

export default {
  ...crud,
  create,
  update,
};
