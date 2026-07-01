"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const widgetRoutes_1 = __importDefault(require("./routes/widgetRoutes"));
const actionRoutes_1 = __importDefault(require("./routes/actionRoutes"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
    app.use('/api/users', userRoutes_1.default);
    app.use('/api/widget', widgetRoutes_1.default);
    app.use('/api/actions', actionRoutes_1.default);
    return app;
}
//# sourceMappingURL=app.js.map