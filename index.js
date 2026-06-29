import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
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
    // Only show system notification if it's an actual hydration alert
    if (remoteMessage.data?.type !== 'HYDRATION_ALERT') {
      console.log('Ignoring non-alert FCM background message:', remoteMessage.data?.type);
      return;
    }

    const channelId = await notifee.createChannel({
      id: 'hydration-reminders',
      name: 'Hydration Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      visibility: AndroidVisibility.PUBLIC,
    });

  // Background me aane wale custom data payload ko handle karne ke liye check lagao
    const senderName = remoteMessage.data?.senderName || 'Someone';
    
    await notifee.displayNotification({
      title: 'Hydration Alert! 💧',
      body: `${senderName} wants you to drink water right now!`, // Sahi dynamic value map kari
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        visibility: AndroidVisibility.PUBLIC,
        pressAction: {
          id: 'default',
        },
      },
    });
  } catch (error) {
    console.error('Background message handler failed:', error);
  }
});

// Register background event handler for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee Background Event:', type, detail);
});

// Ye ek hi baar register hona chahiye
AppRegistry.registerComponent(appName, () => App);