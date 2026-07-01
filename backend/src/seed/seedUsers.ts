import { User } from '../models/User';
import { connectDB } from '../config/db';

/**
 * Seeds exactly two users (Sender "Prince" and "Receiver") if they don't
 * already exist, and links their pairedUserId fields. Safe to call on
 * every server startup -- it's a no-op once both exist.
 */
export async function seedUsers(): Promise<void> {
  // Auto-migrate any existing SENDER with the name 'Prince' to 'Luffy'
  await User.updateMany({ role: 'SENDER', displayName: 'Prince' }, { displayName: 'Luffy' });

  const existingSender = await User.findOne({ role: 'SENDER' });
  const existingReceiver = await User.findOne({ role: 'RECEIVER' });

  if (existingSender && existingReceiver) {
    console.log('[seed] Sender and Receiver already exist, skipping seed.');
    return;
  }

  const sender =
    existingSender ??
    (await User.create({
      displayName: 'Luffy',
      role: 'SENDER',
      timezone: 'Asia/Kolkata',
    }));

  const receiver =
    existingReceiver ??
    (await User.create({
      displayName: 'Receiver',
      role: 'RECEIVER',
      timezone: 'Asia/Kolkata',
    }));

  sender.pairedUserId = receiver._id as any;
  receiver.pairedUserId = sender._id as any;
  await sender.save();
  await receiver.save();

  console.log('[seed] Seeded Sender (Luffy) and Receiver, and paired them.');
}

// Allow running standalone via `npm run seed`
if (require.main === module) {
  connectDB()
    .then(() => seedUsers())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] failed:', err);
      process.exit(1);
    });
}
