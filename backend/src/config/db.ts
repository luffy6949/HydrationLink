import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`[db] connected to MongoDB at ${env.mongoUri}`);
  console.log(
    '[db] NOTE: the widget-tap throttle uses a Mongo transaction, which requires ' +
      'Mongo to be running as a replica set (even a single local node). See README.md.'
  );
}
