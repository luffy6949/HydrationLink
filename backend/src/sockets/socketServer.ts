import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { User } from '../models/User';

type AuthedSocket = Socket & { userId?: string };

let io: Server | null = null;
const connectedUsers = new Map<string, string>(); // userId -> socketId

export function initSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Client connects with: io(url, { auth: { deviceToken } })
  io.use(async (socket: AuthedSocket, next) => {
    const deviceToken = socket.handshake.auth?.deviceToken as string | undefined;
    console.log("[DEBUG] Handshake Token Received:", deviceToken);
    
    if (!deviceToken) {
      next(new Error('Missing deviceToken in socket auth'));
      return;
    }
    const user = await User.findOne({ deviceToken });
    if (!user) {
      console.log("[DEBUG] Target User DB Token: Not found for this deviceToken");
      next(new Error('TOKEN_MISMATCH'));
      return;
    }
    console.log("[DEBUG] Target User DB Token:", user.deviceToken);
    socket.userId = String(user._id);
    next();
  });

  io.on('connection', (socket: AuthedSocket) => {
    const userId = socket.userId as string;
    connectedUsers.set(userId, socket.id);
    console.log(`[socket] user ${userId} connected (${socket.id})`);

    socket.on('disconnect', () => {
      if (connectedUsers.get(userId) === socket.id) {
        connectedUsers.delete(userId);
      }
      console.log(`[socket] user ${userId} disconnected`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function isUserConnected(userId: string): boolean {
  return connectedUsers.has(userId);
}

export function emitToUser(userId: string, event: string, payload: unknown): boolean {
  const socketId = connectedUsers.get(userId);
  if (!socketId || !io) return false;
  io.to(socketId).emit(event, payload);
  return true;
}

export function getConnectedUsers(): Map<string, string> {
  return connectedUsers;
}
