"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    displayName: { type: String, required: true },
    role: { type: String, enum: ['SENDER', 'RECEIVER'], required: true, unique: true },
    timezone: { type: String, required: true, default: 'Asia/Kolkata' },
    pairedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    deviceToken: { type: String, unique: true, sparse: true },
    deviceClaimed: { type: Boolean, default: false },
    fcmToken: { type: String },
    socketId: { type: String, default: null },
    throttleUntil: { type: Date, default: null },
    snoozeUntil: { type: Date, default: null },
    acknowledgedCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: () => new Date() },
});
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map