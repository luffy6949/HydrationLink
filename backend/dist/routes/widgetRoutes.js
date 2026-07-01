"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const throttleService_1 = require("../services/throttleService");
const User_1 = require("../models/User");
const socketServer_1 = require("../sockets/socketServer");
const fcmService_1 = require("../services/fcmService");
const router = (0, express_1.Router)();
// Tapped from the Sender's Jetpack Glance home-screen widget (background
// POST, no app foreground required).
router.post('/tap', auth_1.requireAuth, (0, auth_1.requireRole)('SENDER'), async (req, res) => {
    const sender = req.user;
    // --- THROTTLE WITH FAIL-SAFE ---
    // If the Mongo transaction fails (e.g. replica set issue on Atlas free tier),
    // log it clearly but DO NOT block the notification emission.
    let retryAt;
    try {
        const result = await (0, throttleService_1.checkAndSetThrottle)(String(sender._id));
        if (result.throttled) {
            res.status(200).json({ widgetState: 'THROTTLED', retryAt: result.retryAt });
            return;
        }
        retryAt = result.retryAt;
    }
    catch (throttleErr) {
        console.error('[widgetRoutes] ❌ Throttle check FAILED (transaction/replica-set error). Proceeding with emission anyway:', throttleErr);
        // Do NOT return — fall through to emit the notification regardless
    }
    if (!sender.pairedUserId) {
        res.status(500).json({ error: 'Sender has no paired receiver configured' });
        return;
    }
    const receiver = await User_1.User.findById(sender.pairedUserId);
    if (!receiver) {
        console.error(`[widgetRoutes] ❌ Receiver not found for pairedUserId: ${sender.pairedUserId}`);
        res.status(500).json({ error: 'Paired receiver not found in database' });
        return;
    }
    const receiverId = String(receiver._id);
    const payload = {
        type: 'HYDRATION_ALERT',
        senderName: sender.displayName,
        sentAt: new Date().toISOString(),
    };
    // --- DUAL DELIVERY: Socket + FCM ---
    // Socket handles instant foreground display. FCM guarantees background/killed
    // delivery. A lingering dead socket must NEVER silently swallow the alert.
    const connMap = (0, socketServer_1.getConnectedUsers)();
    console.log(`[DIAGNOSTIC] connectedUsers Map: ${JSON.stringify([...connMap.entries()])}`);
    console.log(`[DIAGNOSTIC] Looking for receiverId: "${receiverId}"`);
    // Best-effort socket emit for instant foreground display
    const deliveredViaSocket = (0, socketServer_1.isUserConnected)(receiverId) && (0, socketServer_1.emitToUser)(receiverId, 'newAlert', payload);
    console.log(`[DIAGNOSTIC] deliveredViaSocket: ${deliveredViaSocket}`);
    // ALWAYS send FCM as a guaranteed fallback — covers background, killed,
    // and lingering dead socket scenarios on real devices.
    console.log(`[DIAGNOSTIC] Sending FCM regardless. receiver.fcmToken exists: ${!!receiver.fcmToken}`);
    await (0, fcmService_1.sendDataMessage)(receiver.fcmToken, payload);
    res.status(200).json({ widgetState: 'SENT', retryAt });
});
exports.default = router;
//# sourceMappingURL=widgetRoutes.js.map