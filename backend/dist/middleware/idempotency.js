"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireIdempotencyKey = requireIdempotencyKey;
const IdempotencyRecord_1 = require("../models/IdempotencyRecord");
/**
 * Requires an `Idempotency-Key` header on mutating requests. If a request
 * with the same key was already processed, replays the stored response
 * instead of re-running the handler (e.g. safe retries from the offline
 * outbox on the Receiver app).
 */
async function requireIdempotencyKey(req, res, next) {
    const key = req.header('Idempotency-Key');
    if (!key) {
        res.status(400).json({ error: 'Idempotency-Key header is required for this action' });
        return;
    }
    const existing = await IdempotencyRecord_1.IdempotencyRecord.findOne({ key });
    if (existing) {
        res.status(existing.statusCode).json(existing.body);
        return;
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        IdempotencyRecord_1.IdempotencyRecord.create({ key, statusCode: res.statusCode, body }).catch((err) => {
            console.error('[idempotency] failed to persist record:', err);
        });
        return originalJson(body);
    };
    next();
}
//# sourceMappingURL=idempotency.js.map