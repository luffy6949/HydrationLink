import { Response, NextFunction } from 'express';
import { IdempotencyRecord } from '../models/IdempotencyRecord';
import { AuthedRequest } from './auth';

/**
 * Requires an `Idempotency-Key` header on mutating requests. If a request
 * with the same key was already processed, replays the stored response
 * instead of re-running the handler (e.g. safe retries from the offline
 * outbox on the Receiver app).
 */
export async function requireIdempotencyKey(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const key = req.header('Idempotency-Key');
  if (!key) {
    res.status(400).json({ error: 'Idempotency-Key header is required for this action' });
    return;
  }

  const existing = await IdempotencyRecord.findOne({ key });
  if (existing) {
    res.status(existing.statusCode).json(existing.body);
    return;
  }

  const originalJson = res.json.bind(res);
  (res as unknown as { json: (body: unknown) => Response }).json = (body: unknown) => {
    IdempotencyRecord.create({ key, statusCode: res.statusCode, body }).catch((err) => {
      console.error('[idempotency] failed to persist record:', err);
    });
    return originalJson(body);
  };

  next();
}
