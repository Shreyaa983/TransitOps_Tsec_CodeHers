import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getOperationsDashboard,
  getDriverDashboard,
} from '../services/dashboard.service.js';

const getDashboard = asyncHandler(async (req, res) => {
  if (req.user.role === 'DRIVER') {
    const data = await getDriverDashboard(req.user);
    return res.json({ success: true, data });
  }

  const data = await getOperationsDashboard({
    vehicleType: req.query.vehicleType || undefined,
    vehicleStatus: req.query.vehicleStatus || undefined,
    region: req.query.region || undefined,
  });

  res.json({ success: true, data });
});

export default {
  getDashboard,
};
