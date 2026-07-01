import React, {useState, useEffect, useCallback} from 'react';
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
import {sendReminder} from '../services/api';
import {storage} from '../utils/storage';
import {COLORS, SPACING, TYPOGRAPHY} from '../utils/theme';
import {getSocket} from '../services/socket';

type SenderDashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SenderDashboard'
>;

interface Props {
  navigation: SenderDashboardNavigationProp;
}

const SenderDashboard: React.FC<Props> = ({navigation}) => {
  const [remindersSent, setRemindersSent] = useState(0);
  const [lastAcknowledged, setLastAcknowledged] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      const handleAcknowledged = (data: {at?: string, timestamp?: string}) => {
        setLastAcknowledged(data.at || data.timestamp || new Date().toISOString());
        setRemindersSent(prev => prev + 1);
        Alert.alert('Hydration Success!', 'Receiver has drank water!');
      };

      socket.on('ackUpdated', handleAcknowledged);

      return () => {
        socket.off('ackUpdated', handleAcknowledged);
      };
    }
  }, []);

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      await sendReminder();
      Alert.alert('Success', 'Reminder sent!');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send reminder',
      );
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Luffy Dashboard</Text>
        <Text style={styles.subtitle}>Stay hydrated, keep your court on track.</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{remindersSent}</Text>
          <Text style={styles.statLabel}>Acknowledged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{lastAcknowledged ? '✓' : '-'}</Text>
          <Text style={styles.statLabel}>Last Ack</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.reminderButton}
        onPress={handleSendReminder}
        disabled={loading}>
        <Text style={styles.reminderButtonText}>
          {loading ? 'Sending...' : 'Send Reminder'}
        </Text>
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
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
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
  reminderButton: {
    width: '100%',
    backgroundColor: COLORS.orange,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    elevation: 8,
    shadowColor: COLORS.orange,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reminderButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 24,
  },
  logoutButton: {
    padding: SPACING.md,
  },
  logoutButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.red,
  },
});

export default SenderDashboard;
