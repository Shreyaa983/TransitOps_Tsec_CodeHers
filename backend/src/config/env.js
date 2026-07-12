import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
  whapiToken: process.env.WHAPI_TOKEN || '',
  whapiBaseUrl: (process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud').replace(/\/$/, ''),
  whapiEnabled: process.env.WHAPI_ENABLED === 'true',
  whapiDefaultCountryCode: process.env.WHAPI_DEFAULT_COUNTRY_CODE || '254',
  tripReminderMinutes: Number(process.env.TRIP_REMINDER_MINUTES || 30),
};