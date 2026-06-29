import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_KEY = 'HYDRATION_ROLE';
const TOKEN_KEY = 'HYDRATION_TOKEN';
const DEVICE_TOKEN_KEY = 'HYDRATION_DEVICE_TOKEN';

export const storage = {
  saveRole: async (role: 'sender' | 'receiver' | null) => {
    try {
      if (role === null) {
        await AsyncStorage.removeItem(ROLE_KEY);
      } else {
        await AsyncStorage.setItem(ROLE_KEY, role);
      }
    } catch (e) {
      console.error('Failed to save role', e);
    }
  },
  getRole: async (): Promise<'sender' | 'receiver' | null> => {
    try {
      const role = await AsyncStorage.getItem(ROLE_KEY);
      return role as 'sender' | 'receiver' | null;
    } catch (e) {
      console.error('Failed to get role', e);
      return null;
    }
  },
  saveToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save token', e);
    }
  },
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get token', e);
      return null;
    }
  },
  saveDeviceToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save device token', e);
    }
  },
  getDeviceToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get device token', e);
      return null;
    }
  },
};
