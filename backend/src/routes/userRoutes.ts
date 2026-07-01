import { Router } from 'express';
import { randomUUID } from 'crypto';
import { User } from '../models/User';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

router.post('/claim', async (req, res) => {
  const { role } = req.body as { role?: 'SENDER' | 'RECEIVER' };
  if (role !== 'SENDER' && role !== 'RECEIVER') {
    res.status(400).json({ error: 'role must be SENDER or RECEIVER' });
    return;
  }

  const user = await User.findOne({ role });
  if (!user) {
    res.status(500).json({ error: 'Seeded user not found -- has the server seeded the database?' });
    return;
  }

  // ❌ Rigid 409 check hata diya taaki baar-baar re-login ho sake
  user.deviceToken = randomUUID();
  user.deviceClaimed = true;
  await user.save();

  res.status(200).json({
    userId: user._id,
    role: user.role,
    displayName: user.displayName,
    pairedUserId: user.pairedUserId,
    deviceToken: user.deviceToken,
  });
});

// Called after Firebase init on the client to (re)register this device's FCM token.
router.post('/me/fcm-token', requireAuth, async (req: AuthedRequest, res) => {
  const { fcmToken } = req.body as { fcmToken?: string };
  if (!fcmToken) {
    res.status(400).json({ error: 'fcmToken is required' });
    return;
  }
  req.user!.fcmToken = fcmToken;
  await req.user!.save();
  res.status(200).json({ ok: true });
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const u = req.user!;
  res.status(200).json({
    userId: u._id,
    role: u.role,
    displayName: u.displayName,
    pairedUserId: u.pairedUserId,
    throttleUntil: u.throttleUntil,
    snoozeUntil: u.snoozeUntil,
  });
});

export default router;