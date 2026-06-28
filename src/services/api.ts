import apiClient from '../api/config';

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
  // Backend is app.use('/api/users', userRoutes) + router.post('/claim')
  // Body expects { role }, deviceToken is automatically handled later or via schema
  const response = await apiClient.post('/api/users/claim', {
    role: role.toUpperCase(), // Backend checks strictly for 'SENDER' or 'RECEIVER'
  });
  return response.data;
};

// Sender taps the button to send a hydration reminder/alert
export const sendReminder = async (): Promise<void> => {
  // Backend is app.use('/api/widget', widgetRoutes) + router.post('/tap')
  await apiClient.post('/api/widget/tap');
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