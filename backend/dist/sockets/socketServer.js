"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
exports.isUserConnected = isUserConnected;
exports.emitToUser = emitToUser;
exports.getConnectedUsers = getConnectedUsers;
const socket_io_1 = require("socket.io");
const User_1 = require("../models/User");
let io = null;
const connectedUsers = new Map(); // userId -> socketId
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: { origin: '*' },
    });
    // Client connects with: io(url, { auth: { deviceToken } })
    io.use(async (socket, next) => {
        const deviceToken = socket.handshake.auth?.deviceToken;
        console.log("[DEBUG] Handshake Token Received:", deviceToken);
        if (!deviceToken) {
            next(new Error('Missing deviceToken in socket auth'));
            return;
        }
        const user = await User_1.User.findOne({ deviceToken });
        if (!user) {
            console.log("[DEBUG] Target User DB Token: Not found for this deviceToken");
            next(new Error('TOKEN_MISMATCH'));
            return;
        }
        console.log("[DEBUG] Target User DB Token:", user.deviceToken);
        socket.userId = String(user._id);
        next();
    });
    io.on('connection', async (socket) => {
        const userId = socket.userId;
        connectedUsers.set(userId, socket.id);
        console.log(`[socket] user ${userId} connected (${socket.id})`);
        // Force-update the socket ID in the DB user record immediately
        try {
            await User_1.User.findByIdAndUpdate(userId, { socketId: socket.id });
            console.log(`[socket] successfully force-updated socketId in DB for user ${userId}`);
        }
        catch (dbErr) {
            console.error(`[socket] failed to update socketId in DB for user ${userId}:`, dbErr);
        }
        socket.on('disconnect', async () => {
            if (connectedUsers.get(userId) === socket.id) {
                connectedUsers.delete(userId);
            }
            try {
                await User_1.User.findByIdAndUpdate(userId, { socketId: null });
                console.log(`[socket] successfully cleared socketId in DB for user ${userId}`);
            }
            catch (dbErr) {
                console.error(`[socket] failed to clear socketId in DB for user ${userId}:`, dbErr);
            }
            console.log(`[socket] user ${userId} disconnected`);
        });
    });
    return io;
}
function getIO() {
    if (!io)
        throw new Error('Socket.io not initialized');
    return io;
}
function isUserConnected(userId) {
    return connectedUsers.has(userId);
}
function emitToUser(userId, event, payload) {
    const socketId = connectedUsers.get(userId);
    if (!socketId || !io)
        return false;
    io.to(socketId).emit(event, payload);
    return true;
}
function getConnectedUsers() {
    return connectedUsers;
}
//# sourceMappingURL=socketServer.js.map