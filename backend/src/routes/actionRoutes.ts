import { Router } from 'express';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { requireIdempotencyKey } from '../middleware/idempotency';
import { DrinkLog } from '../models/DrinkLog';
import { setSnooze, clearSnooze } from '../services/throttleService';
import { emitToUser } from '../sockets/socketServer';
import { sendDataMessage } from '../services/fcmService';
import { User } from '../models/User';

const router = Router();

// Receiver responds to an alert from the full-screen modal / heads-up notification.
router.post(
  '/respond',
  requireAuth,
  requireRole('RECEIVER'),
  requireIdempotencyKey,
  async (req: AuthedRequest, res) => {
    const receiver = req.user!;
    const { action } = req.body as { action?: 'DRANK' | 'SNOOZE' };
    const idempotencyKey = req.header('Idempotency-Key')!;

    if (action !== 'DRANK' && action !== 'SNOOZE') {
      res.status(400).json({ error: 'action must be DRANK or SNOOZE' });
      return;
    }

    await DrinkLog.create({ userId: receiver._id, action, idempotencyKey });

    let snoozeUntil: Date | undefined;
    if (action === 'SNOOZE') {
      snoozeUntil = await setSnooze(String(receiver._id));
    } else {
      await clearSnooze(String(receiver._id));
      if (receiver.pairedUserId) {
        await User.findByIdAndUpdate(receiver.pairedUserId, { $inc: { acknowledgedCount: 1 } });
      }
    }

    if (receiver.pairedUserId) {
      const senderId = String(receiver.pairedUserId);
      const event = action === 'DRANK' ? 'ackUpdated' : 'snoozed';
      const payload: Record<string, string> = { type: event, at: new Date().toISOString() };

      // Foreground Sender app: live socket event triggers the full-screen VFX pingback.
      emitToUser(senderId, event, payload);

      // Always also nudge via FCM: the native Glance widget has no persistent
      // socket connection, so it needs a background-deliverable signal to
      // refresh its own state (e.g. -> "Acknowledged") even if the app is closed.
      const sender = await User.findById(senderId);
      await sendDataMessage(sender?.fcmToken, payload);
    }

    res.status(200).json({ ok: true, action, snoozeUntil });
  }
);

export default router;
