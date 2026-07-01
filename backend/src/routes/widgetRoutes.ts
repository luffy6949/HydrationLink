import { Router } from 'express';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { checkAndSetThrottle } from '../services/throttleService';
import { User } from '../models/User';
import { isUserConnected, emitToUser, getConnectedUsers } from '../sockets/socketServer';
import { sendDataMessage } from '../services/fcmService';

const router = Router();

// Tapped from the Sender's Jetpack Glance home-screen widget (background
// POST, no app foreground required).
router.post('/tap', requireAuth, requireRole('SENDER'), async (req: AuthedRequest, res) => {
  const sender = req.user!;

  // --- THROTTLE WITH FAIL-SAFE ---
  // If the Mongo transaction fails (e.g. replica set issue on Atlas free tier),
  // log it clearly but DO NOT block the notification emission.
  let throttled = false;
  try {
    const result = await checkAndSetThrottle(String(sender._id));
    if (result.throttled) {
      res.status(200).json({ widgetState: 'THROTTLED', retryAt: result.retryAt });
      return;
    }
  } catch (throttleErr) {
    console.error('[widgetRoutes] ❌ Throttle check FAILED (transaction/replica-set error). Proceeding with emission anyway:', throttleErr);
    // Do NOT return — fall through to emit the notification regardless
  }

  if (!sender.pairedUserId) {
    res.status(500).json({ error: 'Sender has no paired receiver configured' });
    return;
  }

  const receiver = await User.findById(sender.pairedUserId);
  if (!receiver) {
    console.error(`[widgetRoutes] ❌ Receiver not found for pairedUserId: ${sender.pairedUserId}`);
    res.status(500).json({ error: 'Paired receiver not found in database' });
    return;
  }

  const receiverId = String(receiver._id);
  const payload: Record<string, string> = {
    type: 'HYDRATION_ALERT',
    senderName: sender.displayName,
    sentAt: new Date().toISOString(),
  };

  // --- DIAGNOSTIC: Dump the full socket map ---
  const connMap = getConnectedUsers();
  console.log(`[DIAGNOSTIC] connectedUsers Map: ${JSON.stringify([...connMap.entries()])}`);
  console.log(`[DIAGNOSTIC] Looking for receiverId: "${receiverId}"`);
  console.log(`[DIAGNOSTIC] isUserConnected(receiverId): ${isUserConnected(receiverId)}`);

  // Foreground receiver: deliver live over the socket.
  const deliveredViaSocket = isUserConnected(receiverId) && emitToUser(receiverId, 'newAlert', payload);
  console.log(`[DIAGNOSTIC] deliveredViaSocket: ${deliveredViaSocket}`);

  // Backgrounded/killed receiver: fall back to a high-priority FCM data message,
  // caught by @notifee/react-native via Headless JS.
  if (!deliveredViaSocket) {
    console.log(`[DIAGNOSTIC] Falling back to FCM. receiver.fcmToken exists: ${!!receiver.fcmToken}`);
    await sendDataMessage(receiver.fcmToken, payload);
  }

  res.status(200).json({ widgetState: 'SENT' });
});

export default router;
