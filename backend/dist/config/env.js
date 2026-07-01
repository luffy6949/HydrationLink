"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    port: parseInt(process.env.PORT ?? '4000', 10),
    mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/hydrationlink?replicaSet=rs0',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? '',
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
    throttleMinutes: parseInt(process.env.THROTTLE_MINUTES ?? '20', 10),
    snoozeMinutes: parseInt(process.env.SNOOZE_MINUTES ?? '30', 10),
};
//# sourceMappingURL=env.js.map