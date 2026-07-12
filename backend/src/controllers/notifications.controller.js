import Driver from '../models/driver.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getDriverNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notification.service.js';

async function resolveDriverForUser(user) {
  const driverId = user.driver?._id ?? user.driver;
  if (driverId) {
    return Driver.findById(driverId);
  }
  return Driver.findOne({ user: user._id });
}

// GET /notifications/me
const getMyNotifications = asyncHandler(async (req, res) => {
  const driver = await resolveDriverForUser(req.user);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'No driver profile linked to this user',
    });
  }

  const notifications = await getDriverNotifications(driver._id);
  const unread = notifications.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    data: notifications,
    meta: { unread },
  });
});

// PATCH /notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const driver = await resolveDriverForUser(req.user);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'No driver profile linked to this user',
    });
  }

  const notification = await markNotificationRead(req.params.id, driver._id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.json({ success: true, data: notification });
});

// PATCH /notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  const driver = await resolveDriverForUser(req.user);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'No driver profile linked to this user',
    });
  }

  const notifications = await markAllNotificationsRead(driver._id);

  res.json({ success: true, data: notifications });
});

export default {
  getMyNotifications,
  markRead,
  markAllRead,
};
