import {io, Socket} from 'socket.io-client';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {storage} from '../utils/storage';
import {NOTIFICATION_CHANNELS} from '../utils/constants';

const SOCKET_URL = 'https://hydrationlink.onrender.com'; 

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket | null> => {
  try {
    // DUPLICATE GUARD: Prevent creating multiple connections or using stale ones
    if (socket?.connected) {
      console.log('Socket already connected, returning existing instance.');
      return socket;
    }
    if (socket) {
      console.log('Cleaning up stale disconnected socket instance...');
      socket.disconnect();
      socket = null;
    }

    const token = await storage.getToken();
    if (!token) {
      console.warn('❌ Cannot connect socket: No token found in storage.');
      return null;
    }
    
    console.log("[DEBUG] Handshake Token Sent:", token);
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        deviceToken: token,
      },
    });

    socket.on('newAlert', async (payload: {senderName?: string}) => {
      console.log("⚡ SOCKET EVENT 'newAlert' ARRIVED. PAYLOAD:", JSON.stringify(payload));
      console.log('Socket Foreground Alert:', payload);
      try {
        const channelId = await notifee.createChannel({
          id: NOTIFICATION_CHANNELS.HYDRATION_REMINDERS,
          name: 'Hydration Reminders',
          importance: AndroidImportance.HIGH,
        });
        
        await notifee.displayNotification({
          title: 'Hydration Alert! 💧',
          body: `${payload.senderName || 'Someone'} wants you to drink water right now!`,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
          },
        });
      } catch (err) {
        console.error('Failed to display foreground socket notification:', err);
      }
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', async (error) => {
      console.error('Socket connection error:', error.message);
      if (error.message === 'TOKEN_MISMATCH' || error.message === 'Unrecognized deviceToken') {
        console.warn('❌ Token mismatch detected. Clearing local storage to force re-login.');
        await storage.saveToken('');
        await storage.saveRole(null);
        disconnectSocket();
      }
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
    socket.off('newAlert');
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
