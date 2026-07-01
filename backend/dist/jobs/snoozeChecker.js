"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSnoozeChecker = startSnoozeChecker;
const User_1 = require("../models/User");
const socketServer_1 = require("../sockets/socketServer");
const fcmService_1 = require("../services/fcmService");
const CHECK_INTERVAL_MS = 30000;
/**
 * Polls for any user whose snoozeUntil has elapsed and re-sends the
 * hydration alert to them. Polling (rather than an in-memory setTimeout)
 * means a snooze survives a server restart.
 */
function startSnoozeChecker() {
    setInterval(async () => {
        const now = new Date();
        const due = await User_1.User.find({ snoozeUntil: { $ne: null, $lte: now } });
        for (const receiver of due) {
            receiver.snoozeUntil = null;
            await receiver.save();
            const receiverId = String(receiver._id);
            const payload = {
                type: 'HYDRATION_ALERT',
                senderName: 'Reminder',
                sentAt: now.toISOString(),
            };
            // Dual delivery: socket for instant foreground + FCM for background/killed
            const delivered = (0, socketServer_1.isUserConnected)(receiverId) && (0, socketServer_1.emitToUser)(receiverId, 'newAlert', payload);
            await (0, fcmService_1.sendDataMessage)(receiver.fcmToken, payload);
        }
    }, CHECK_INTERVAL_MS);
}
//# sourceMappingURL=snoozeChecker.js.map