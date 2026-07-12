import mongoose from 'mongoose';
import Expense from '../models/expense.model.js';
import FuelLog from '../models/fuelLog.model.js';
import Vehicle from '../models/vehicle.model.js';
import { buildCrudController } from './crud.controller.js';
import { createCrudService } from '../services/crud.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const crud = buildCrudController(Expense);
const crudService = createCrudService(Expense);

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
  res.status(201).json({ success: true, data: document });
});

const getVehicleExpenses = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const expenses = await Expense.find({ vehicle: vehicleId })
    .populate('vehicle')
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({ success: true, data: expenses });
});

const getExpenseSummary = asyncHandler(async (req, res) => {
  const [summary] = await Expense.aggregate([
    {
      $group: {
        _id: null,
        fuel: {
          $sum: {
            $cond: [{ $eq: ['$category', 'FUEL'] }, '$amount', 0],
          },
        },
        maintenance: {
          $sum: {
            $cond: [{ $eq: ['$category', 'MAINTENANCE'] }, '$amount', 0],
          },
        },
        toll: {
          $sum: {
            $cond: [{ $eq: ['$category', 'TOLL'] }, '$amount', 0],
          },
        },
        insurance: {
          $sum: {
            $cond: [{ $eq: ['$category', 'INSURANCE'] }, '$amount', 0],
          },
        },
        other: {
          $sum: {
            $cond: [{ $eq: ['$category', 'OTHER'] }, '$amount', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        fuel: 1,
        maintenance: 1,
        toll: 1,
        insurance: 1,
        other: 1,
        total: {
          $add: ['$fuel', '$maintenance', '$toll', '$insurance', '$other'],
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: summary || {
      fuel: 0,
      maintenance: 0,
      toll: 0,
      insurance: 0,
      other: 0,
      total: 0,
    },
  });
});

const getOperationalCost = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  const [fuelCostEntry] = await FuelLog.aggregate([
    {
      $match: { vehicle: new mongoose.Types.ObjectId(vehicleId) },
    },
    {
      $group: {
        _id: null,
        fuelCost: { $sum: '$cost' },
      },
    },
  ]);

  const [maintenanceCostEntry] = await Expense.aggregate([
    {
      $match: {
        vehicle: new mongoose.Types.ObjectId(vehicleId),
        category: 'MAINTENANCE',
      },
    },
    {
      $group: {
        _id: null,
        maintenanceCost: { $sum: '$amount' },
      },
    },
  ]);

  const fuelCost = fuelCostEntry?.fuelCost || 0;
  const maintenanceCost = maintenanceCostEntry?.maintenanceCost || 0;

  res.status(200).json({
    success: true,
    data: {
      vehicleId,
      fuelCost,
      maintenanceCost,
      operationalCost: fuelCost + maintenanceCost,
    },
  });
});

const getMonthlyExpenses = asyncHandler(async (req, res) => {
  const monthlyExpenses = await Expense.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        total: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        total: { $round: ['$total', 2] },
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  res.status(200).json({ success: true, data: monthlyExpenses });
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await Expense.aggregate([
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: { $round: ['$total', 2] },
      },
    },
    { $sort: { total: -1 } },
  ]);

  res.status(200).json({ success: true, data: breakdown });
});

const getTopCostlyVehicles = asyncHandler(async (req, res) => {
  const topVehicles = await Expense.aggregate([
    {
      $group: {
        _id: '$vehicle',
        total: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        vehicleId: '$_id',
        total: { $round: ['$total', 2] },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({ success: true, data: topVehicles });
});

export default {
  ...crud,
  create,
  getVehicleExpenses,
  getExpenseSummary,
  getOperationalCost,
  getMonthlyExpenses,
  getCategoryBreakdown,
  getTopCostlyVehicles,
};
