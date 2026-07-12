import Driver from '../models/driver.model.js';
import Notification from '../models/notification.model.js';
import { env } from '../config/env.js';
import { sendWhatsAppText } from './whapi.service.js';

/**
 * Persist an in-app notification and optionally send WhatsApp to the driver.
 * Failures in WhatsApp delivery never throw — they are logged and stored on the record.
 */
export async function notifyDriver(driverId, {
  title,
  message,
  type = 'INFO',
  actionUrl = null,
  tripId = null,
  eventKey = null,
  sendWhatsApp = true,
}) {
  const driver = await Driver.findById(driverId);
  if (!driver) {
    return null;
  }

  if (eventKey) {
    const existing = await Notification.findOne({ driver: driverId, eventKey });
    if (existing) {
      return existing;
    }
  }

  const notification = await Notification.create({
    driver: driverId,
    trip: tripId,
    title,
    message,
    type,
    actionUrl,
    eventKey,
    isRead: false,
  });

  if (!sendWhatsApp || !env.whapiEnabled || !driver.phone) {
    return notification;
  }

  try {
    const whatsappBody = `*${title}*\n\n${message}\n\n— TransitOps`;
    await sendWhatsAppText(driver.phone, whatsappBody);
    notification.whatsappSent = true;
    await notification.save();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[WhatsApp] Failed for driver ${driverId}:`, error.message);
    notification.whatsappSent = false;
    notification.whatsappError = error.message;
    await notification.save();
  }

  return notification;
}

export async function getDriverNotifications(driverId, { limit = 50 } = {}) {
  return Notification.find({ driver: driverId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('trip', 'source destination status');
}

export async function markNotificationRead(notificationId, driverId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, driver: driverId },
    { isRead: true },
    { new: true }
  );
}

export async function markAllNotificationsRead(driverId) {
  await Notification.updateMany({ driver: driverId, isRead: false }, { isRead: true });
  return getDriverNotifications(driverId);
}
