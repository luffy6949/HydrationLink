import { Schema, model, Document } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  statusCode: number;
  body: unknown;
  createdAt: Date;
}

const idempotencySchema = new Schema<IIdempotencyRecord>({
  key: { type: String, required: true, unique: true },
  statusCode: { type: Number, required: true },
  body: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: () => new Date(), expires: 60 * 60 * 24 }, // 24h TTL
});

export const IdempotencyRecord = model<IIdempotencyRecord>('IdempotencyRecord', idempotencySchema);
