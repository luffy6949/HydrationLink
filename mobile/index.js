import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import firebase from '@react-native-firebase/app';

// Firebase ko synchronous tareeke se initialize karo, 
// kyunki AppRegistry ko turant load hona hai.
if (!firebase.apps.length) {
  firebase.initializeApp();
}

// Register background handler for Firebase Messaging
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background Message:', remoteMessage);

  try {
    const channelId = await notifee.createChannel({
      id: 'hydration-reminders',
      name: 'Hydration Reminders',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });

    const messageType = remoteMessage.data?.type;

    if (messageType === 'HYDRATION_ALERT') {
      const senderName = remoteMessage.data?.senderName || 'Someone';
      await notifee.displayNotification({
        title: 'Hydration Alert! 💧',
        body: `${senderName} wants you to drink water right now!`,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'I Drank It! 💧',
              pressAction: { id: 'log-hydration' },
            },
          ],
        },
      });
    } else if (messageType === 'ackUpdated') {
      await notifee.displayNotification({
        title: 'Hydration Success! 💧',
        body: 'Your partner has successfully logged a drink!',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });
    } else if (messageType === 'snoozed') {
      await notifee.displayNotification({
        title: 'Reminder Snoozed ⏳',
        body: 'Your partner has snoozed the reminder.',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });
    } else {
      console.log('Ignoring non-actionable FCM background message type:', messageType);
    }
  } catch (error) {
    console.error('Background message handler failed:', error);
  }
});

// Register background event handler for Notifee notification actions.
// When the user taps "I Drank It!" on the notification banner, this handler
// fires even if the app is killed, calling the backend acknowledge API.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee Background Event:', type, detail);

  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'log-hydration') {
    try {
      // Read the auth token from SharedPreferences (bridged from RN)
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('HYDRATION_TOKEN');
      
      if (token) {
        const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const response = await fetch('https://hydrationlink.onrender.com/api/actions/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ action: 'DRANK' }),
        });
        
        if (response.ok) {
          console.log('✅ Background hydration acknowledgment sent successfully.');
        } else {
          console.error('❌ Background acknowledge failed:', response.status);
        }
      }
    } catch (err) {
      console.error('❌ Background action handler error:', err);
    }

    // Dismiss the notification after handling the action
    if (detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  }
});

// Ye ek hi baar register hona chahiye
AppRegistry.registerComponent(appName, () => App);