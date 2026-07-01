"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndSetThrottle = checkAndSetThrottle;
exports.setSnooze = setSnooze;
exports.clearSnooze = clearSnooze;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const env_1 = require("../config/env");
/**
 * Atomically checks the Sender's throttle window and, if clear, sets a new
 * throttleUntil 20 minutes in the future -- all inside a MongoDB transaction
 * so a flood of rapid widget taps can never both pass the check.
 *
 * NOTE: session.withTransaction() requires Mongo to be running as a replica
 * set (a single-node rs works fine for local dev). See README.md.
 */
async function checkAndSetThrottle(senderId) {
    const session = await mongoose_1.default.startSession();
    try {
        let result = { throttled: false };
        await session.withTransaction(async () => {
            const sender = await User_1.User.findById(senderId).session(session);
            if (!sender) {
                throw new Error('Sender not found');
            }
            const now = new Date();
            if (sender.throttleUntil && sender.throttleUntil > now) {
                result = { throttled: true, retryAt: sender.throttleUntil };
                return;
            }
            const retryAt = new Date(now.getTime() + env_1.env.throttleMinutes * 60000);
            sender.throttleUntil = retryAt;
            await sender.save({ session });
            result = { throttled: false, retryAt };
        });
        return result;
    }
    finally {
        await session.endSession();
    }
}
async function setSnooze(receiverId) {
    const snoozeUntil = new Date(Date.now() + env_1.env.snoozeMinutes * 60000);
    await User_1.User.findByIdAndUpdate(receiverId, { snoozeUntil });
    return snoozeUntil;
}
async function clearSnooze(receiverId) {
    await User_1.User.findByIdAndUpdate(receiverId, { snoozeUntil: null });
}
//# sourceMappingURL=throttleService.js.map