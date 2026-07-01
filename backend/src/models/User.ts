import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'SENDER' | 'RECEIVER';

export interface IUser extends Document {
  displayName: string;
  role: UserRole;
  timezone: string;
  pairedUserId?: Types.ObjectId;
  deviceToken?: string;
  deviceClaimed: boolean;
  fcmToken?: string;
  throttleUntil?: Date | null;
  snoozeUntil?: Date | null;
  acknowledgedCount: number;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  displayName: { type: String, required: true },
  role: { type: String, enum: ['SENDER', 'RECEIVER'], required: true, unique: true },
  timezone: { type: String, required: true, default: 'Asia/Kolkata' },
  pairedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  deviceToken: { type: String, unique: true, sparse: true },
  deviceClaimed: { type: Boolean, default: false },
  fcmToken: { type: String },
  throttleUntil: { type: Date, default: null },
  snoozeUntil: { type: Date, default: null },
  acknowledgedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: () => new Date() },
});

export const User = model<IUser>('User', userSchema);
