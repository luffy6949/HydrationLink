"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = require("crypto");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/claim', async (req, res) => {
    const { role } = req.body;
    if (role !== 'SENDER' && role !== 'RECEIVER') {
        res.status(400).json({ error: 'role must be SENDER or RECEIVER' });
        return;
    }
    const user = await User_1.User.findOne({ role });
    if (!user) {
        res.status(500).json({ error: 'Seeded user not found -- has the server seeded the database?' });
        return;
    }
    // ❌ Rigid 409 check hata diya taaki baar-baar re-login ho sake
    user.deviceToken = (0, crypto_1.randomUUID)();
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
router.post('/me/fcm-token', auth_1.requireAuth, async (req, res) => {
    const { fcmToken } = req.body;
    if (!fcmToken) {
        res.status(400).json({ error: 'fcmToken is required' });
        return;
    }
    req.user.fcmToken = fcmToken;
    await req.user.save();
    res.status(200).json({ ok: true });
});
router.get('/me', auth_1.requireAuth, async (req, res) => {
    const u = req.user;
    res.status(200).json({
        userId: u._id,
        role: u.role,
        displayName: u.displayName,
        pairedUserId: u.pairedUserId,
        throttleUntil: u.throttleUntil,
        snoozeUntil: u.snoozeUntil,
    });
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map