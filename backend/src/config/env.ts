import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/hydrationlink?replicaSet=rs0',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
  throttleSeconds: parseInt(process.env.THROTTLE_SECONDS ?? '30', 10),
  snoozeMinutes: parseInt(process.env.SNOOZE_MINUTES ?? '30', 10),
};
