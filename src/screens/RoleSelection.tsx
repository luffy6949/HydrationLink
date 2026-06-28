import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {claimRole} from '../services/api';
import {connectSocket} from '../services/socket';
import {storage} from '../utils/storage';
import {COLORS, SPACING, TYPOGRAPHY} from '../utils/theme';

type RoleSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RoleSelection'
>;

interface Props {
  navigation: RoleSelectionNavigationProp;
}

const RoleSelection: React.FC<Props> = ({navigation}) => {
  const [loading, setLoading] = useState<'sender' | 'receiver' | null>(null);

  const handleRoleSelection = async (role: 'sender' | 'receiver') => {
    setLoading(role);
    try {
      const deviceToken = await storage.getDeviceToken();
      const response = await claimRole(role, deviceToken || 'unknown');

      await storage.saveToken(response.deviceToken);
      await storage.saveRole(role);

      await connectSocket();

      if (role === 'sender') {
        navigation.replace('SenderDashboard');
      } else {
        navigation.replace('ReceiverDashboard');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to connect to server',
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HydrationLink</Text>
      <Text style={styles.subtitle}>Select Your Role</Text>

      <TouchableOpacity
        style={styles.senderButton}
        onPress={() => handleRoleSelection('sender')}
        disabled={loading !== null}>
        {loading === 'sender' ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.buttonText}>I am Prince (Sender)</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.receiverButton}
        onPress={() => handleRoleSelection('receiver')}
        disabled={loading !== null}>
        {loading === 'receiver' ? (
          <ActivityIndicator color={COLORS.text} />
        ) : (
          <Text style={styles.buttonText}>I am Receiver</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.orange,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.xxl,
  },
  senderButton: {
    width: '100%',
    backgroundColor: COLORS.steel,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  receiverButton: {
    width: '100%',
    backgroundColor: COLORS.orange,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.button,
  },
});

export default RoleSelection;
