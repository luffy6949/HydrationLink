"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyRecord = void 0;
const mongoose_1 = require("mongoose");
const idempotencySchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    statusCode: { type: Number, required: true },
    body: { type: mongoose_1.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: () => new Date(), expires: 60 * 60 * 24 }, // 24h TTL
});
exports.IdempotencyRecord = (0, mongoose_1.model)('IdempotencyRecord', idempotencySchema);
//# sourceMappingURL=IdempotencyRecord.js.map