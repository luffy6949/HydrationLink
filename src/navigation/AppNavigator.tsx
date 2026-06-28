import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RoleSelection from '../screens/RoleSelection';
import SenderDashboard from '../screens/SenderDashboard';
import ReceiverDashboard from '../screens/ReceiverDashboard';
import {storage} from '../utils/storage';
import {connectSocket} from '../services/socket';
import {ActivityIndicator, View} from 'react-native';
import {COLORS} from '../utils/theme';

export type RootStackParamList = {
  RoleSelection: undefined;
  SenderDashboard: undefined;
  ReceiverDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('RoleSelection');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getToken();
        const role = await storage.getRole();
        if (token && role) {
          setInitialRoute(role === 'sender' ? 'SenderDashboard' : 'ReceiverDashboard');
          await connectSocket();
        }
      } catch (e) {
        console.error('Auth check failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background}}>
        <ActivityIndicator size="large" color={COLORS.orange} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
        <Stack.Screen name="SenderDashboard" component={SenderDashboard} />
        <Stack.Screen name="ReceiverDashboard" component={ReceiverDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
