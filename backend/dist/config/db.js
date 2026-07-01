"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDB() {
    mongoose_1.default.set('strictQuery', true);
    await mongoose_1.default.connect(env_1.env.mongoUri);
    console.log(`[db] connected to MongoDB at ${env_1.env.mongoUri}`);
    console.log('[db] NOTE: the widget-tap throttle uses a Mongo transaction, which requires ' +
        'Mongo to be running as a replica set (even a single local node). See README.md.');
}
//# sourceMappingURL=db.js.map