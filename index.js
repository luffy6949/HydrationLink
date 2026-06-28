import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
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

  const channelId = await notifee.createChannel({
    id: 'hydration-reminders',
    name: 'Hydration Reminders',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Hydration Reminder',
    body: remoteMessage.notification?.body || 'Time to drink water!',
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    },
  });
});

// Register background event handler for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee Background Event:', type, detail);
});

// Ye ek hi baar register hona chahiye
AppRegistry.registerComponent(appName, () => App);