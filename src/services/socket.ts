import {io, Socket} from 'socket.io-client';
import {storage} from '../utils/storage';

const SOCKET_URL = 'https://hydrationlink.onrender.com'; 

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket | null> => {
  try {
    const token = await storage.getToken();
    
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        deviceToken: token,
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return socket;
  } catch (error) {
    console.error('Failed to connect socket:', error);
    return null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string): void => {
  if (socket) {
    socket.emit('join:room', roomId);
  }
};

export const leaveRoom = (roomId: string): void => {
  if (socket) {
    socket.emit('leave:room', roomId);
  }
};
