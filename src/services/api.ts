import apiClient from '../api/config';
import messaging from '@react-native-firebase/messaging';

// Generate a unique key per request so the backend idempotency middleware
// can safely replay or deduplicate retried responses.
function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface ClaimResponse {
  deviceToken: string;
  role: 'SENDER' | 'RECEIVER';
  userId: string;
  displayName: string;
  pairedUserId: string | null;
}

// First-launch role claim: "I am Prince Sender"
export const claimRole = async (
  role: 'SENDER' | 'RECEIVER',
  deviceToken: string
): Promise<ClaimResponse> => {
  
  // 1. Pehle server par user ka role claim/login hit karo
  const response = await apiClient.post('/api/users/claim', {
    role: role.toUpperCase(),
  });
  
  // Response ka data save karke rakho jo aakhiri me return karna hai
  const data = response.data;

  // 2. Ab login hone ke baad token fetch karke sahi authed route par post karo
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('Generated FCM Token:', fcmToken);
      
      // Sahi route jo userRoutes.ts me '/me/fcm-token' hai with '/api/users' base
      await apiClient.post(
      '/api/users/me/fcm-token', 
      { fcmToken },
      { 
        headers: { 
          Authorization: `Bearer ${data.deviceToken}`,
        } 
      }
    );
      console.log('FCM Token successfully synced to Atlas!');
    }
  } catch (fcmErr: any) {
    console.error('❌ Firebase token sync failed during login step:');
    if (fcmErr.response) {
      console.error(`Status: ${fcmErr.response.status}`);
      console.error(`Data:`, fcmErr.response.data);
    } else if (fcmErr.request) {
      console.error('Network Error / Timeout. No response received.');
    } else {
      console.error(`Error Message: ${fcmErr.message}`);
    }
  }

  // Aakhiri me login data controller ko return kar do
  return data;
};

// Sender taps the button to send a hydration reminder/alert
export const sendReminder = async (): Promise<{widgetState: string; retryAt?: string}> => {
  // Backend is app.use('/api/widget', widgetRoutes) + router.post('/tap')
  const res = await apiClient.post('/api/widget/tap');
  return res.data;
};

// Receiver responds (DRANK / SNOOZE) from the alert
export const acknowledgeReminder = async (): Promise<void> => {
  // Backend is app.use('/api/actions', actionRoutes) + router.post('/respond')
  // Idempotency-Key header is required by the backend middleware
  await apiClient.post(
    '/api/actions/respond',
    { action: 'DRANK' },
    { headers: { 'Idempotency-Key': generateIdempotencyKey() } },
  );
};

export const snoozeReminder = async (duration: number): Promise<void> => {
  // Backend respond route with SNOOZE action
  // Idempotency-Key header is required by the backend middleware
  await apiClient.post(
    '/api/actions/respond',
    { action: 'SNOOZE' },
    { headers: { 'Idempotency-Key': generateIdempotencyKey() } },
  );
};

export const syncDeviceState = async (): Promise<any> => {
  // 1. Verify device token validity by calling /api/users/me
  const meResponse = await apiClient.get('/api/users/me');
  
  // 2. Fetch and register fresh FCM Token
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('Syncing fresh FCM Token:', fcmToken);
      await apiClient.post('/api/users/me/fcm-token', { fcmToken });
    }
  } catch (fcmErr) {
    console.error('FCM Token sync error during startup:', fcmErr);
  }
  
  return meResponse.data;
};