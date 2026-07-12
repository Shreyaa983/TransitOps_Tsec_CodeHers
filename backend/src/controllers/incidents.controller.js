import Incident from '../models/incident.model.js';
import MaintenanceLog from '../models/maintenanceLog.model.js';
import Vehicle from '../models/vehicle.model.js';
import Driver from '../models/driver.model.js';
import { buildCrudController } from './crud.controller.js';

const crud = buildCrudController(Incident);

export const incidentsController = {
  ...crud,

  list: async (req, res, next) => {
    try {
      const { status } = req.query;
      let query = status ? { status: status.toUpperCase() } : {};

      if (req.user.role === 'DRIVER') {
        const driverId = req.user.driver?._id ?? req.user.driver;
        let driver = driverId ? await Driver.findById(driverId) : null;
        if (!driver) {
          driver = await Driver.findOne({ user: req.user._id });
        }

        if (!driver) {
          return res.status(200).json({ success: true, data: [] });
        }
        query.driver = driver._id;
      } else if (req.user.role !== 'FLEET_MANAGER') {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to view incidents.' });
      }

      const incidents = await Incident.find(query)
        .populate('vehicle')
        .populate({
          path: 'driver',
          populate: { path: 'user', select: 'name email' }
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: incidents });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      if (req.user.role !== 'DRIVER') {
        return res.status(403).json({ success: false, message: 'Only drivers can report incidents.' });
      }

      const driverId = req.user.driver?._id ?? req.user.driver;
      let driver = driverId ? await Driver.findById(driverId) : null;
      if (!driver) {
        driver = await Driver.findOne({ user: req.user._id });
      }

      if (!driver) {
        return res.status(400).json({ success: false, message: 'No driver profile associated with this account.' });
      }

      const incident = new Incident({
        ...req.body,
        driver: driver._id
      });

      await incident.save();
      const populated = await Incident.findById(incident._id)
        .populate('vehicle')
        .populate({
          path: 'driver',
          populate: { path: 'user', select: 'name email' }
        });

      return res.status(201).json({ success: true, data: populated });
    } catch (error) {
      next(error);
    }
  },

  approve: async (req, res, next) => {
    try {
      const { id } = req.params;
      const incident = await Incident.findById(id);

      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      if (incident.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: `Cannot approve incident with status ${incident.status}` });
      }

      // Create MaintenanceLog
      const ai = incident.aiAnalysis;
      const description = `[AI GENERATED REPORT]\nSummary: ${ai.summary}\nRecommended Action: ${ai.recommendedAction}\nEstimated Downtime: ${ai.estimatedDowntime}\nLikely Parts: ${ai.likelyParts.join(", ")}`;

      const maintenanceLog = new MaintenanceLog({
        vehicle: incident.vehicle,
        issue: `[AI] ${ai.category} - ${ai.subcategory}`,
        description,
        technician: "Pending Assignment",
        cost: 0,
        status: "OPEN",
      });

      await maintenanceLog.save();

      // Update Vehicle status if requiresImmediateStop
      if (ai.requiresImmediateStop) {
        await Vehicle.findByIdAndUpdate(incident.vehicle, { status: "IN_SHOP" });
      }

      incident.status = 'APPROVED';
      incident.reviewedBy = req.user._id;
      incident.reviewedAt = new Date();
      incident.maintenanceLog = maintenanceLog._id;
      
      await incident.save();

      return res.status(200).json({ success: true, data: incident });
    } catch (error) {
      next(error);
    }
  },

  reject: async (req, res, next) => {
    try {
      const { id } = req.params;
      const incident = await Incident.findById(id);

      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      if (incident.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: `Cannot reject incident with status ${incident.status}` });
      }

      incident.status = 'REJECTED';
      incident.reviewedBy = req.user._id;
      incident.reviewedAt = new Date();

      await incident.save();

      return res.status(200).json({ success: true, data: incident });
    } catch (error) {
      next(error);
    }
  }
};
