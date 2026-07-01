import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {COLORS} from './src/utils/theme';
import {NOTIFICATION_CHANNELS} from './src/utils/constants';
import {acknowledgeReminder} from './src/services/api';

function App(): React.JSX.Element {
  useEffect(() => {
    const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'log-hydration') {
        try {
          await acknowledgeReminder();
          console.log('✅ Foreground notification quick action acknowledged.');
        } catch (err) {
          console.error('❌ Foreground quick action error:', err);
        }
        if (detail.notification?.id) {
          await notifee.cancelNotification(detail.notification.id);
        }
      }
    });

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
                      vibration: true,
                      sound: 'default',
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
                  pressAction: { id: 'default' },
                  actions: [
                    {
                      title: 'I Drank It! 💧',
                      pressAction: { id: 'log-hydration' },
                    },
                  ],
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
      unsubscribeForeground();
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