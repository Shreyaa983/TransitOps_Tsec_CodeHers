import { Router } from 'express';
import Driver from '../models/driver.model.js';
import { buildCrudController } from '../controllers/crud.controller.js';
import { createResourceRouter } from './resource-router.js';
import { driverCreateValidators, driverUpdateValidators } from '../validators/index.js';
import { protect } from '../middleware/authMiddleware.js';

const controller = buildCrudController(Driver);
const router = Router();

router.use(protect);

router.patch('/me/status', async (req, res, next) => {
  try {
    let driver = req.user.driver;
    if (!driver) {
      driver = await Driver.findOne({ $or: [{ user: req.user._id }, { name: req.user.name }] });
      if (!driver) {
        return res.status(400).json({ success: false, message: 'No driver profile linked to this user' });
      }
    }
    const { status } = req.body;
    const normalizedStatus = status ? status.toUpperCase() : 'AVAILABLE';
    if (!['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const driverId = driver._id || driver;
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { status: normalizedStatus },
      { new: true, runValidators: true }
    ).populate('user');
    res.status(200).json({ success: true, data: updatedDriver });
  } catch (err) {
    next(err);
  }
});

router.use(
  createResourceRouter({
    controller,
    createValidators: driverCreateValidators,
    updateValidators: driverUpdateValidators,
  })
);

export default router;