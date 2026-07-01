"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const User_1 = require("../models/User");
/**
 * "Zero-login" auth: the client stores a deviceToken (issued at role-claim
 * time) in react-native-keychain and sends it as a Bearer token on every
 * request. We look up which of the two seeded users it belongs to.
 */
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing bearer token' });
        return;
    }
    const deviceToken = header.slice('Bearer '.length);
    const user = await User_1.User.findOne({ deviceToken });
    if (!user) {
        res.status(401).json({ error: 'Invalid device token' });
        return;
    }
    req.user = user;
    next();
}
function requireRole(role) {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            res.status(403).json({ error: `This action requires the ${role} role` });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map