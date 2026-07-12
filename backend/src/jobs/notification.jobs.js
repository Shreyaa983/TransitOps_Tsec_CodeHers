import { env } from '../config/env.js';
import {
  checkLicenseExpiryReminders,
  checkTripReminders,
} from '../services/driver-notification.service.js';

const JOB_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

let intervalId = null;

export function startNotificationJobs() {
  if (intervalId) return;

  const run = async () => {
    try {
      await checkTripReminders();
      await checkLicenseExpiryReminders();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[NotificationJobs] Error:', error.message);
    }
  };

  // Run once shortly after startup, then on interval
  setTimeout(run, 10_000);
  intervalId = setInterval(run, JOB_INTERVAL_MS);

  // eslint-disable-next-line no-console
  console.log(
    `[NotificationJobs] Started (trip reminders ${env.tripReminderMinutes}m before start, license checks daily thresholds)`
  );
}

export function stopNotificationJobs() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
