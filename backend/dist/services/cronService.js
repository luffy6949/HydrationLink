"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronScheduler = startCronScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = require("../models/User");
const socketServer_1 = require("../sockets/socketServer");
const fcmService_1 = require("./fcmService");
/**
 * Scientific Auto-Reminder Engine
 * Sends automatic hydration reminders to the RECEIVER based on
 * circadian-optimized intervals for female metabolic health.
 *
 * Schedule (IST / Asia-Kolkata):
 *   Active Daytime    07:00–12:00  → every 90 min
 *   Peak Metabolism   12:00–17:00  → every 90 min
 *   Wind-down         17:00–22:00  → every 120 min
 *   Sleep DND         22:00–07:00  → ZERO triggers
 */
async function sendAutoReminder() {
    try {
        const receiver = await User_1.User.findOne({ role: 'RECEIVER' });
        if (!receiver) {
            console.log('[cron] No RECEIVER found in DB, skipping auto-reminder.');
            return;
        }
        // Respect active snooze
        if (receiver.snoozeUntil && receiver.snoozeUntil > new Date()) {
            console.log('[cron] Receiver is snoozed until', receiver.snoozeUntil.toISOString(), '— skipping.');
            return;
        }
        const receiverId = String(receiver._id);
        const payload = {
            type: 'HYDRATION_ALERT',
            senderName: 'Auto-Reminder',
            sentAt: new Date().toISOString(),
        };
        // Dual delivery: socket for instant foreground + FCM for background/killed
        const delivered = (0, socketServer_1.isUserConnected)(receiverId) && (0, socketServer_1.emitToUser)(receiverId, 'newAlert', payload);
        await (0, fcmService_1.sendDataMessage)(receiver.fcmToken, payload);
        console.log(`[cron] Auto-reminder sent (socket: ${delivered}, fcm: always)`);
    }
    catch (err) {
        console.error('[cron] Auto-reminder failed:', err);
    }
}
function startCronScheduler() {
    // Active Daytime Phase: 7:00 AM - 12:00 PM IST, every 90 minutes
    // Fires at: 07:00, 08:30, 10:00, 11:30
    node_cron_1.default.schedule('0 7 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('30 8 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('0 10 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('30 11 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    // Peak Metabolism Phase: 12:00 PM - 5:00 PM IST, every 90 minutes
    // Fires at: 13:00, 14:30, 16:00
    node_cron_1.default.schedule('0 13 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('30 14 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('0 16 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    // Wind-down Phase: 5:00 PM - 10:00 PM IST, every 120 minutes
    // Fires at: 17:30, 19:30, 21:30
    node_cron_1.default.schedule('30 17 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('30 19 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    node_cron_1.default.schedule('30 21 * * *', sendAutoReminder, { timezone: 'Asia/Kolkata' });
    // Sleep DND Phase: 10:00 PM - 7:00 AM → NO cron jobs scheduled.
    console.log('[cron] ✅ Scientific Auto-Reminder Engine started (10 daily triggers, IST timezone).');
}
//# sourceMappingURL=cronService.js.map