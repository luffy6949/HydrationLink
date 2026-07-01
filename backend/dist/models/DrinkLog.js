"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrinkLog = void 0;
const mongoose_1 = require("mongoose");
const drinkLogSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['DRANK', 'SNOOZE'], required: true },
    idempotencyKey: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
});
exports.DrinkLog = (0, mongoose_1.model)('DrinkLog', drinkLogSchema);
//# sourceMappingURL=DrinkLog.js.map