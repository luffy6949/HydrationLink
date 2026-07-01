import { Schema, model, Document, Types } from 'mongoose';

export type DrinkAction = 'DRANK' | 'SNOOZE';

export interface IDrinkLog extends Document {
  userId: Types.ObjectId;
  action: DrinkAction;
  idempotencyKey: string;
  createdAt: Date;
}

const drinkLogSchema = new Schema<IDrinkLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['DRANK', 'SNOOZE'], required: true },
  idempotencyKey: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

export const DrinkLog = model<IDrinkLog>('DrinkLog', drinkLogSchema);
