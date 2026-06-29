import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, AndroidVisibility} from '@notifee/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {COLORS} from './src/utils/theme';
import {NOTIFICATION_CHANNELS} from './src/utils/constants';

function App(): React.JSX.Element {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        await notifee.requestPermission(); // Explicitly request Android 13+ POST_NOTIFICATIONS
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted');
          


          const channelId = await notifee.createChannel({
                      id: NOTIFICATION_CHANNELS.HYDRATION_REMINDERS,
                      name: 'Hydration Reminders',
                      importance: AndroidImportance.HIGH,
                      sound: 'default',
                      vibration: true,
                      vibrationPattern: [0, 500, 200, 500, 200, 500],
                      visibility: AndroidVisibility.PUBLIC,
                    });

          const unsubscribe = messaging().onMessage(async remoteMessage => {
            console.log('Foreground Message:', remoteMessage);
            
            try {
              // Only show system notification if it's an actual hydration alert
              if (remoteMessage.data?.type !== 'HYDRATION_ALERT') {
                console.log('Ignoring non-alert FCM foreground message:', remoteMessage.data?.type);
                return;
              }

              // 🚀 FIX: Data packet se dynamic sender name nikalo
              const senderName = remoteMessage.data?.senderName || 'Someone';

              await notifee.displayNotification({
                title: 'Hydration Alert! 💧',
                body: `${senderName} wants you to drink water right now!`, // Foreground dynamic text
                android: {
                  channelId,
                  importance: AndroidImportance.HIGH,
                  sound: 'default',
                  vibrationPattern: [0, 500, 200, 500, 200, 500],
                  visibility: AndroidVisibility.PUBLIC,
                  pressAction: { id: 'default' },
                },
              });
            } catch (err) {
              console.error('Failed to display foreground FCM notification:', err);
            }
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
        if (unsubscribe) unsubscribe();
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