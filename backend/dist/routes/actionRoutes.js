"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const DrinkLog_1 = require("../models/DrinkLog");
const throttleService_1 = require("../services/throttleService");
const socketServer_1 = require("../sockets/socketServer");
const fcmService_1 = require("../services/fcmService");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Receiver responds to an alert from the full-screen modal / heads-up notification.
router.post('/respond', auth_1.requireAuth, (0, auth_1.requireRole)('RECEIVER'), idempotency_1.requireIdempotencyKey, async (req, res) => {
    const receiver = req.user;
    const { action } = req.body;
    const idempotencyKey = req.header('Idempotency-Key');
    if (action !== 'DRANK' && action !== 'SNOOZE') {
        res.status(400).json({ error: 'action must be DRANK or SNOOZE' });
        return;
    }
    await DrinkLog_1.DrinkLog.create({ userId: receiver._id, action, idempotencyKey });
    let snoozeUntil;
    if (action === 'SNOOZE') {
        snoozeUntil = await (0, throttleService_1.setSnooze)(String(receiver._id));
    }
    else {
        await (0, throttleService_1.clearSnooze)(String(receiver._id));
        if (receiver.pairedUserId) {
            await User_1.User.findByIdAndUpdate(receiver.pairedUserId, { $inc: { acknowledgedCount: 1 } });
        }
    }
    if (receiver.pairedUserId) {
        const senderId = String(receiver.pairedUserId);
        const event = action === 'DRANK' ? 'ackUpdated' : 'snoozed';
        const payload = { type: event, at: new Date().toISOString() };
        // Foreground Sender app: live socket event triggers the full-screen VFX pingback.
        (0, socketServer_1.emitToUser)(senderId, event, payload);
        // Always also nudge via FCM: the native Glance widget has no persistent
        // socket connection, so it needs a background-deliverable signal to
        // refresh its own state (e.g. -> "Acknowledged") even if the app is closed.
        const sender = await User_1.User.findById(senderId);
        await (0, fcmService_1.sendDataMessage)(sender?.fcmToken, payload);
    }
    res.status(200).json({ ok: true, action, snoozeUntil });
});
exports.default = router;
//# sourceMappingURL=actionRoutes.js.map