import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startNotificationJobs } from './jobs/notification.jobs.js';

const startServer = async () => {
  await connectDB();

  startNotificationJobs();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`TransitOps backend listening on port ${env.port}`);
    if (env.whapiEnabled) {
      // eslint-disable-next-line no-console
      console.log('[WhatsApp] Whapi notifications enabled for drivers');
    } else {
      // eslint-disable-next-line no-console
      console.log('[WhatsApp] Whapi disabled — set WHAPI_ENABLED=true and WHAPI_TOKEN in .env');
    }
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend server:', error.message);
  process.exit(1);
});