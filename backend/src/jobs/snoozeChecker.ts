import { User } from '../models/User';
import { isUserConnected, emitToUser } from '../sockets/socketServer';
import { sendDataMessage } from '../services/fcmService';

const CHECK_INTERVAL_MS = 30_000;

/**
 * Polls for any user whose snoozeUntil has elapsed and re-sends the
 * hydration alert to them. Polling (rather than an in-memory setTimeout)
 * means a snooze survives a server restart.
 */
export function startSnoozeChecker(): void {
  setInterval(async () => {
    const now = new Date();
    const due = await User.find({ snoozeUntil: { $ne: null, $lte: now } });

    for (const receiver of due) {
      receiver.snoozeUntil = null;
      await receiver.save();

      const receiverId = String(receiver._id);
      const payload: Record<string, string> = {
        type: 'HYDRATION_ALERT',
        senderName: 'Reminder',
        sentAt: now.toISOString(),
      };

      const delivered = isUserConnected(receiverId) && emitToUser(receiverId, 'newAlert', payload);
      if (!delivered) {
        await sendDataMessage(receiver.fcmToken, payload);
      }
    }
  }, CHECK_INTERVAL_MS);
}
