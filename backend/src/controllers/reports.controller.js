import { asyncHandler } from '../utils/asyncHandler.js';
import { getReportsAnalytics } from '../services/reports.service.js';

const getAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === 'DRIVER') {
    return res.status(403).json({ success: false, message: 'Reports access is not available for drivers.' });
  }

  const data = await getReportsAnalytics();
  res.json({ success: true, data });
});

export default {
  getAnalytics,
};
