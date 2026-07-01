import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {acknowledgeReminder, snoozeReminder} from '../services/api';
import {storage} from '../utils/storage';
import {COLORS, SPACING, TYPOGRAPHY} from '../utils/theme';
import {getSocket} from '../services/socket';

type ReceiverDashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ReceiverDashboard'
>;

interface Props {
  navigation: ReceiverDashboardNavigationProp;
}

const ReceiverDashboard: React.FC<Props> = ({navigation}) => {
  const [currentReminder, setCurrentReminder] = useState<string | null>(null);
  const [drinksLogged, setDrinksLogged] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      const handleIncoming = (data: {message: string; timestamp: string}) => {
        setCurrentReminder(data.message);
      };

      socket.on('reminder:incoming', handleIncoming);

      return () => {
        socket.off('reminder:incoming', handleIncoming);
      };
    }
  }, []);

  const handleDrankIt = async () => {
    setLoading(true);
    try {
      await acknowledgeReminder();
      setDrinksLogged(prev => prev + 1);
      setCurrentReminder(null);
      Alert.alert('Success', 'Hydration logged!');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to log drink',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async () => {
    try {
      await snoozeReminder(30);
      setCurrentReminder(null);
      Alert.alert('Snoozed', 'Reminder snoozed for 30 minutes');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to snooze',
      );
    }
  };

  const handleLogout = async () => {
    await storage.saveToken('');
    await storage.saveRole(null);
    navigation.replace('RoleSelection');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Receiver Dashboard</Text>
        <Text style={styles.subtitle}>Stay hydrated, your partner is watching! 💧</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{drinksLogged}</Text>
          <Text style={styles.statLabel}>Drinks Logged</Text>
        </View>
      </View>

      {currentReminder && (
        <View style={styles.reminderCard}>
          <Text style={styles.reminderText}>{currentReminder}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.drankButton}
        onPress={handleDrankIt}
        disabled={loading}>
        <Text style={styles.drankButtonText}>
          {loading ? 'Logging...' : 'I Drank It!'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.snoozeButton} onPress={handleSnooze}>
        <Text style={styles.snoozeButtonText}>Snooze 30m</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.orange,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.sm,
  },
  statsContainer: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  statCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.orange,
  },
  statLabel: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.xs,
  },
  reminderCard: {
    width: '100%',
    backgroundColor: COLORS.steelDark,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },
  reminderText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    textAlign: 'center',
  },
  drankButton: {
    width: '100%',
    backgroundColor: COLORS.orange,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 8,
    shadowColor: COLORS.orange,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  drankButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 24,
  },
  snoozeButton: {
    width: '100%',
    backgroundColor: COLORS.steel,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  snoozeButtonText: {
    ...TYPOGRAPHY.button,
  },
  logoutButton: {
    padding: SPACING.md,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.red,
  },
});

export default ReceiverDashboard;
