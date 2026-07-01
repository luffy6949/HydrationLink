"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDataMessage = sendDataMessage;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const env_1 = require("../config/env");
let initialized = false;
let initFailed = false;
function ensureInitialized() {
    if (initialized)
        return true;
    if (initFailed)
        return false;
    try {
        // 1. Prioritize raw JSON string from environment (Render deployment)
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || env_1.env.firebaseServiceAccountJson;
        if (rawJson) {
            try {
                const credentials = JSON.parse(rawJson);
                firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(credentials) });
                initialized = true;
                return true;
            }
            catch (parseErr) {
                console.error('[fcm] ❌ CRITICAL: FIREBASE_SERVICE_ACCOUNT_JSON is malformed. It must be valid JSON.', parseErr);
                initFailed = true;
                return false;
            }
        }
        // 2. Fallback to file path (Local Dev)
        const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || env_1.env.firebaseServiceAccountPath;
        if (filePath) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const credentials = require(filePath);
            firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(credentials) });
            initialized = true;
            return true;
        }
        // 3. Complete failure
        console.error('[fcm] ❌ CRITICAL: No Firebase credentials found! Push notifications are disabled.\n' +
            '--> On Render: Set FIREBASE_SERVICE_ACCOUNT_JSON to the raw JSON string.\n' +
            '--> Locally: Set FIREBASE_SERVICE_ACCOUNT_PATH to the .json file path.');
        initFailed = true;
        return false;
    }
    catch (err) {
        console.error('[fcm] ❌ CRITICAL: Failed to initialize firebase-admin:', err);
        initFailed = true;
        return false;
    }
}
/**
 * Sends a high-priority FCM data message (no notification payload -- the
 * client's Notifee/Headless JS handler is responsible for rendering the
 * heads-up notification or refreshing the Glance widget state).
 */
async function sendDataMessage(fcmToken, data) {
    if (!fcmToken) {
        console.warn('[fcm] Skipping send -- recipient has no fcmToken registered yet.');
        return;
    }
    if (!ensureInitialized())
        return;
    try {
        await firebase_admin_1.default.messaging().send({
            token: fcmToken,
            data,
            android: { priority: 'high' },
        });
    }
    catch (err) {
        console.error('[fcm] Failed to send message:', err);
    }
}
//# sourceMappingURL=fcmService.js.map