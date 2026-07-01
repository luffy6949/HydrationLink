import mongoose from 'mongoose';
import { User } from '../models/User';
import { env } from '../config/env';

export interface ThrottleResult {
  throttled: boolean;
  retryAt?: Date;
}

/**
 * Atomically checks the Sender's throttle window and, if clear, sets a new
 * throttleUntil 20 minutes in the future -- all inside a MongoDB transaction
 * so a flood of rapid widget taps can never both pass the check.
 *
 * NOTE: session.withTransaction() requires Mongo to be running as a replica
 * set (a single-node rs works fine for local dev). See README.md.
 */
export async function checkAndSetThrottle(senderId: string): Promise<ThrottleResult> {
  const session = await mongoose.startSession();
  try {
    let result: ThrottleResult = { throttled: false };

    await session.withTransaction(async () => {
      const sender = await User.findById(senderId).session(session);
      if (!sender) {
        throw new Error('Sender not found');
      }

      const now = new Date();
      if (sender.throttleUntil && sender.throttleUntil > now) {
        result = { throttled: true, retryAt: sender.throttleUntil };
        return;
      }

      const retryAt = new Date(now.getTime() + env.throttleMinutes * 60_000);
      sender.throttleUntil = retryAt;
      await sender.save({ session });
      result = { throttled: false, retryAt };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function setSnooze(receiverId: string): Promise<Date> {
  const snoozeUntil = new Date(Date.now() + env.snoozeMinutes * 60_000);
  await User.findByIdAndUpdate(receiverId, { snoozeUntil });
  return snoozeUntil;
}

export async function clearSnooze(receiverId: string): Promise<void> {
  await User.findByIdAndUpdate(receiverId, { snoozeUntil: null });
}
