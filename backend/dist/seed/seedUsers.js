"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = seedUsers;
const User_1 = require("../models/User");
const db_1 = require("../config/db");
/**
 * Seeds exactly two users (Sender "Prince" and "Receiver") if they don't
 * already exist, and links their pairedUserId fields. Safe to call on
 * every server startup -- it's a no-op once both exist.
 */
async function seedUsers() {
    // Auto-migrate any existing SENDER with the name 'Prince' to 'Luffy'
    await User_1.User.updateMany({ role: 'SENDER', displayName: 'Prince' }, { displayName: 'Luffy' });
    const existingSender = await User_1.User.findOne({ role: 'SENDER' });
    const existingReceiver = await User_1.User.findOne({ role: 'RECEIVER' });
    if (existingSender && existingReceiver) {
        console.log('[seed] Sender and Receiver already exist, skipping seed.');
        return;
    }
    const sender = existingSender ??
        (await User_1.User.create({
            displayName: 'Luffy',
            role: 'SENDER',
            timezone: 'Asia/Kolkata',
        }));
    const receiver = existingReceiver ??
        (await User_1.User.create({
            displayName: 'Receiver',
            role: 'RECEIVER',
            timezone: 'Asia/Kolkata',
        }));
    sender.pairedUserId = receiver._id;
    receiver.pairedUserId = sender._id;
    await sender.save();
    await receiver.save();
    console.log('[seed] Seeded Sender (Luffy) and Receiver, and paired them.');
}
// Allow running standalone via `npm run seed`
if (require.main === module) {
    (0, db_1.connectDB)()
        .then(() => seedUsers())
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('[seed] failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seedUsers.js.map