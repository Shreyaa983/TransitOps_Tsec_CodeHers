import mongoose from 'mongoose';
import FuelLog from '../models/fuelLog.model.js';
import Expense from '../models/expense.model.js';
import Vehicle from '../models/vehicle.model.js';
import { buildCrudController } from './crud.controller.js';
import { createCrudService } from '../services/crud.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const crud = buildCrudController(FuelLog);
const crudService = createCrudService(FuelLog);

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const create = asyncHandler(async (req, res) => {
  const { vehicle: vehicleId } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  const document = await crudService.create(req.body);

  await Expense.create({
    vehicle: document.vehicle?._id ?? document.vehicle,
    category: 'FUEL',
    amount: document.cost,
    description: `Fuel refill · ${document.liters}L`,
    date: document.date,
  });

  res.status(201).json({ success: true, data: document });
});

const getVehicleFuelLogs = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const logs = await FuelLog.find({ vehicle: vehicleId })
    .populate('vehicle')
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({ success: true, data: logs });
});

const getFuelSummary = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const logs = await FuelLog.find({ vehicle: vehicleId }).select('liters cost date').lean();

  const totalFuel = logs.reduce((sum, log) => sum + (Number(log.liters) || 0), 0);
  const totalFuelCost = logs.reduce((sum, log) => sum + (Number(log.cost) || 0), 0);
  const avgFuelPrice = totalFuel > 0 ? totalFuelCost / totalFuel : 0;

  res.status(200).json({
    success: true,
    data: {
      totalFuel,
      totalFuelCost,
      avgFuelPrice: round(avgFuelPrice, 2),
      entries: logs.length,
    },
  });
});

const getLatestFuelLog = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const log = await FuelLog.findOne({ vehicle: vehicleId })
    .populate('vehicle')
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({ success: true, data: log });
});

const getMonthlyFuelConsumption = asyncHandler(async (req, res) => {
  const monthlyFuel = await FuelLog.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        liters: { $sum: '$liters' },
        cost: { $sum: '$cost' },
        entries: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        liters: { $round: ['$liters', 2] },
        cost: { $round: ['$cost', 2] },
        entries: 1,
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  res.status(200).json({ success: true, data: monthlyFuel });
});

export default {
  ...crud,
  create,
  getVehicleFuelLogs,
  getFuelSummary,
  getLatestFuelLog,
  getMonthlyFuelConsumption,
};
