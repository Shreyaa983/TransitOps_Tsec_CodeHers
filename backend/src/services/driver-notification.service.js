import Driver from '../models/driver.model.js';
import { notifyDriver } from './notification.service.js';
import { env } from '../config/env.js';

export function formatTripCode(trip) {
  const id = trip?._id?.toString() || String(trip);
  return `TRP-${id.slice(-6).toUpperCase()}`;
}

export function formatTime(date) {
  if (!date) return 'TBD';
  return new Date(date).toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function tripActionUrl(tripId) {
  return `/trips/${tripId}`;
}

async function getPopulatedTrip(trip) {
  if (trip?.vehicle?.registrationNumber || trip?.vehicle?.name) {
    return trip;
  }
  const Trip = (await import('../models/trip.model.js')).default;
  return Trip.findById(trip._id || trip).populate('vehicle driver');
}

/** Fire-and-forget wrapper — never blocks the caller */
export function safeNotify(promise) {
  promise.catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[Notification]', err.message);
  });
}

// ─── Trip notifications ───────────────────────────────────────────────────────

export async function notifyTripAssigned(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);
  const vehicle = full.vehicle?.registrationNumber || full.vehicle?.name || 'N/A';

  return notifyDriver(full.driver._id || full.driver, {
    title: '📦 New Trip Assigned',
    message: [
      `${full.source} → ${full.destination}`,
      '',
      `Trip: ${code}`,
      `Vehicle: ${vehicle}`,
      `Cargo: ${full.cargoWeight} kg`,
      `Dispatch Time: ${formatTime(full.dispatchTime || full.scheduledStartTime)}`,
    ].join('\n'),
    type: 'INFO',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `trip-assigned:${full._id}:${full.driver._id || full.driver}`,
  });
}

export async function notifyTripDraftAssigned(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);
  const vehicle = full.vehicle?.registrationNumber || full.vehicle?.name || 'N/A';

  return notifyDriver(full.driver._id || full.driver, {
    title: '📋 Trip Draft Assigned',
    message: [
      `You have been assigned to a draft trip.`,
      '',
      `${full.source} → ${full.destination}`,
      `Trip: ${code}`,
      `Vehicle: ${vehicle}`,
      `Scheduled Start: ${formatTime(full.scheduledStartTime)}`,
    ].join('\n'),
    type: 'INFO',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `trip-draft:${full._id}:${full.driver._id || full.driver}`,
  });
}

export async function notifyTripDispatched(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);
  const vehicle = full.vehicle?.registrationNumber || full.vehicle?.name || 'N/A';

  return notifyDriver(full.driver._id || full.driver, {
    title: '🚚 Trip Dispatched',
    message: [
      `Your trip is now live.`,
      '',
      `${full.source} → ${full.destination}`,
      `Trip: ${code}`,
      `Vehicle: ${vehicle}`,
      `Dispatch Time: ${formatTime(full.dispatchTime)}`,
    ].join('\n'),
    type: 'INFO',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `trip-dispatched:${full._id}`,
  });
}

export async function notifyTripUpdated(before, after) {
  const full = await getPopulatedTrip(after);
  const code = formatTripCode(full);
  const changes = [];

  if (before.source !== after.source) changes.push(`Source changed to ${after.source}.`);
  if (before.destination !== after.destination) changes.push(`Destination changed to ${after.destination}.`);
  if (String(before.driver) !== String(after.driver)) changes.push('Driver reassigned.');
  if (String(before.vehicle) !== String(after.vehicle)) changes.push('Vehicle changed.');
  if (before.cargoWeight !== after.cargoWeight) changes.push(`Cargo weight updated to ${after.cargoWeight} kg.`);
  if (before.plannedDistance !== after.plannedDistance) changes.push(`Planned distance updated to ${after.plannedDistance} km.`);
  if (before.scheduledStartTime?.toString() !== after.scheduledStartTime?.toString()) {
    changes.push(`Scheduled start updated to ${formatTime(after.scheduledStartTime)}.`);
  }

  if (changes.length === 0) return null;

  const driverId = full.driver._id || full.driver;

  return notifyDriver(driverId, {
    title: '✏️ Trip Updated',
    message: `Trip ${code} has been updated.\n\n${changes.join('\n')}`,
    type: 'WARNING',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
  });
}

export async function notifyTripCancelled(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);

  return notifyDriver(full.driver._id || full.driver, {
    title: '❌ Trip Cancelled',
    message: `Trip ${code} (${full.source} → ${full.destination}) has been cancelled.`,
    type: 'ERROR',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `trip-cancelled:${full._id}`,
  });
}

export async function notifyTripCompleted(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);

  return notifyDriver(full.driver._id || full.driver, {
    title: '✅ Trip Completed',
    message: [
      `Trip ${code} completed successfully.`,
      '',
      `${full.source} → ${full.destination}`,
      `Distance: ${full.actualDistance} km`,
      'Great job!',
    ].join('\n'),
    type: 'SUCCESS',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `trip-completed:${full._id}`,
  });
}

export async function notifyTripReminder(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);
  const minutes = env.tripReminderMinutes;

  return notifyDriver(full.driver._id || full.driver, {
    title: '⏰ Trip Reminder',
    message: [
      `Your trip starts in ${minutes} minutes.`,
      '',
      `${full.source} → ${full.destination}`,
      `Trip: ${code}`,
      `Start Time: ${formatTime(full.scheduledStartTime)}`,
    ].join('\n'),
    type: 'WARNING',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `trip-reminder:${full._id}:${minutes}m`,
  });
}

export async function notifyDriverReassigned(trip, oldDriverId, newDriver) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);

  const tasks = [];

  if (oldDriverId && String(oldDriverId) !== String(newDriver._id)) {
    tasks.push(
      notifyDriver(oldDriverId, {
        title: '↩️ Trip Reassigned',
        message: `Trip ${code} (${full.source} → ${full.destination}) has been reassigned to another driver.`,
        type: 'INFO',
        actionUrl: tripActionUrl(full._id),
        tripId: full._id,
      })
    );
  }

  tasks.push(
    notifyDriver(newDriver._id, {
      title: '📦 New Trip Assigned',
      message: [
        `You have been assigned to trip ${code}.`,
        '',
        `${full.source} → ${full.destination}`,
        `Vehicle: ${full.vehicle?.registrationNumber || 'N/A'}`,
      ].join('\n'),
      type: 'INFO',
      actionUrl: tripActionUrl(full._id),
      tripId: full._id,
      eventKey: `trip-reassigned:${full._id}:${newDriver._id}`,
    })
  );

  return Promise.all(tasks);
}

export async function notifyVehicleChanged(trip, oldVehicle, newVehicle) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);
  const oldLabel = oldVehicle?.registrationNumber || oldVehicle?.name || 'Previous vehicle';
  const newLabel = newVehicle?.registrationNumber || newVehicle?.name || 'New vehicle';

  return notifyDriver(full.driver._id || full.driver, {
    title: '🚛 Vehicle Changed',
    message: [
      `Your assigned vehicle has changed for trip ${code}.`,
      '',
      `Old: ${oldLabel}`,
      `New: ${newLabel}`,
    ].join('\n'),
    type: 'WARNING',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
  });
}

// ─── Driver notifications ─────────────────────────────────────────────────────

export async function notifyDriverStatusChanged(driver, newStatus, changedByManager = true) {
  if (!changedByManager) return null;

  const statusLabels = {
    AVAILABLE: 'Available',
    ON_TRIP: 'On Trip',
    OFF_DUTY: 'Off Duty',
    SUSPENDED: 'Suspended',
  };

  const label = statusLabels[newStatus] || newStatus;
  const type = newStatus === 'SUSPENDED' ? 'ERROR' : 'INFO';

  return notifyDriver(driver._id, {
    title: '👤 Status Updated',
    message: `Your status has been changed to:\n\n${label}`,
    type,
    actionUrl: '/settings',
  });
}

export async function notifyLicenseExpiry(driver, daysLeft) {
  let title = '⚠️ License Expiry Reminder';
  let type = 'WARNING';

  if (daysLeft <= 1) {
    title = '🚨 License Expires Tomorrow';
    type = 'ERROR';
  } else if (daysLeft <= 7) {
    title = '🚨 License Expiring Soon';
    type = 'ERROR';
  }

  return notifyDriver(driver._id, {
    title,
    message: `Your driving license (${driver.licenseNumber}) expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
    type,
    actionUrl: '/settings',
    eventKey: `license-expiry:${driver._id}:${daysLeft}d`,
  });
}

export async function notifyOdometerReminder(trip) {
  const full = await getPopulatedTrip(trip);
  const code = formatTripCode(full);

  return notifyDriver(full.driver._id || full.driver, {
    title: '📊 Odometer Reminder',
    message: `Remember to enter the final odometer reading after completing trip ${code}.`,
    type: 'INFO',
    actionUrl: tripActionUrl(full._id),
    tripId: full._id,
    eventKey: `odometer-reminder:${full._id}`,
  });
}

export async function checkLicenseExpiryReminders() {
  const thresholds = [30, 15, 7, 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const days of thresholds) {
    const target = new Date(today);
    target.setDate(target.getDate() + days);

    const nextDay = new Date(target);
    nextDay.setDate(nextDay.getDate() + 1);

    const drivers = await Driver.find({
      licenseExpiry: { $gte: target, $lt: nextDay },
    });

    for (const driver of drivers) {
      await notifyLicenseExpiry(driver, days);
    }
  }
}

export async function checkTripReminders() {
  const Trip = (await import('../models/trip.model.js')).default;
  const minutes = env.tripReminderMinutes;
  const now = new Date();
  const windowStart = new Date(now.getTime() + (minutes - 2) * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (minutes + 2) * 60 * 1000);

  const trips = await Trip.find({
    status: { $in: ['DRAFT', 'DISPATCHED'] },
    scheduledStartTime: { $gte: windowStart, $lte: windowEnd },
  });

  for (const trip of trips) {
    await notifyTripReminder(trip);
  }
}
