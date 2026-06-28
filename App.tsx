import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {COLORS} from './src/utils/theme';

function App(): React.JSX.Element {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted');
          const channelId = await notifee.createChannel({
            id: 'hydration-reminders',
            name: 'Hydration Reminders',
            importance: AndroidImportance.HIGH,
          });

          const unsubscribe = messaging().onMessage(async remoteMessage => {
            console.log('Foreground Message:', remoteMessage);
            await notifee.displayNotification({
              title: remoteMessage.notification?.title || 'Hydration Reminder',
              body: remoteMessage.notification?.body || 'Time to drink water!',
              android: {
                channelId,
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
              },
            });
          });
          return unsubscribe;
        }
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    };

    const unsubscribePromise = setupNotifications();
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) { unsubscribe(); }
      });
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
