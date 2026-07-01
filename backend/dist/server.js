"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const db_1 = require("./config/db");
const seedUsers_1 = require("./seed/seedUsers");
const socketServer_1 = require("./sockets/socketServer");
const snoozeChecker_1 = require("./jobs/snoozeChecker");
const env_1 = require("./config/env");
const cronService_1 = require("./services/cronService");
async function main() {
    await (0, db_1.connectDB)();
    await (0, seedUsers_1.seedUsers)();
    const app = (0, app_1.createApp)();
    const httpServer = http_1.default.createServer(app);
    (0, socketServer_1.initSocket)(httpServer);
    (0, snoozeChecker_1.startSnoozeChecker)();
    // Start the circadian auto-reminder cron scheduler
    (0, cronService_1.startCronScheduler)();
    httpServer.listen(env_1.env.port, '0.0.0.0', () => {
        console.log(`[server] HydrationLink backend listening on port ${env_1.env.port}`);
    });
}
main().catch((err) => {
    console.error('[server] fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map