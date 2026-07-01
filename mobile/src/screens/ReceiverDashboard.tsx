import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {acknowledgeReminder, snoozeReminder} from '../services/api';
import {storage} from '../utils/storage';
import {COLORS, SPACING, TYPOGRAPHY} from '../utils/theme';
import {getSocket} from '../services/socket';
import {MeshBackground} from '../components/MeshBackground';

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
  const [buttonState, setButtonState] = useState<'idle' | 'success'>('idle');

  // Bouncing alert icon animation
  const bounceAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (currentReminder) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
    }
  }, [currentReminder, bounceAnim]);

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
      
      setButtonState('success');
      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
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
    <View style={styles.container}>
      <MeshBackground />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Receiver Dashboard</Text>
          <Text style={styles.headerSubtitle}>Stay hydrated, your partner is watching! 💧</Text>
        </View>
        <View style={styles.avatarButton}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>TODAY'S PROGRESS</Text>
          <View style={styles.progressCounterWrapper}>
            <Text style={styles.progressCount}>{drinksLogged}</Text>
            <Text style={styles.progressMax}>/ 12</Text>
          </View>
          <Text style={styles.progressDesc}>Total Drinks Logged Today</Text>
        </View>

        {/* Conditional Alert Card (Dynamic auto-height) */}
        {currentReminder && (
          <View style={styles.alertCardWrapper}>
            {/* Soft background glow */}
            <View style={styles.alertGlow} />
            <View style={styles.alertCard}>
              <Animated.View style={[styles.alertIconWrapper, {transform: [{translateY: bounceAnim}]}]}>
                <Text style={styles.alertIcon}>💧</Text>
              </Animated.View>
              <View style={styles.alertTextWrapper}>
                <Text style={styles.alertText}>{currentReminder}</Text>
                <View style={styles.badgeWrapper}>
                  <View style={styles.badgePing} />
                  <Text style={styles.badgeText}>URGENT SYNC</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Central I Drank It Button Section */}
        <View style={styles.centerSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.drankButton,
              buttonState === 'success' && styles.drankButtonSuccess,
            ]}
            onPress={handleDrankIt}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : (
              <View style={styles.buttonInner}>
                <View style={styles.dropWrapper}>
                  <Text style={styles.dropEmoji}>
                    {buttonState === 'success' ? '✅' : '💧'}
                  </Text>
                </View>
                <Text style={styles.drankButtonText}>
                  {buttonState === 'success' ? 'Great Job!' : 'I Drank It! 💧'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.confirmText}>CONFIRM HYDRATION</Text>
        </View>
      </ScrollView>

      {/* Footer Snooze and Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.snoozeButton}
          onPress={handleSnooze}>
          <Text style={styles.snoozeText}>SNOOZE 30M</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
    marginBottom: 10,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 160,
    gap: 16,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    marginTop: 10,
  },
  progressLabel: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: 2,
  },
  progressCounterWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
    gap: 4,
  },
  progressCount: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
  },
  progressMax: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(0, 102, 134, 0.4)',
  },
  progressDesc: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  alertCardWrapper: {
    position: 'relative',
    width: '100%',
  },
  alertGlow: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 140, 0, 0.15)',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.25)',
    gap: 16,
    // Strictly auto-height (no hardcoded height property here to prevent content clipping)
  },
  alertIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIcon: {
    fontSize: 20,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5C2D00',
    lineHeight: 18,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  badgePing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.orange,
  },
  badgeText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.orange,
    letterSpacing: 1.2,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  drankButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  drankButtonSuccess: {
    backgroundColor: COLORS.tertiaryDim,
    shadowColor: COLORS.tertiaryDim,
  },
  buttonInner: {
    alignItems: 'center',
  },
  dropWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
  },
  dropEmoji: {
    fontSize: 28,
  },
  drankButtonText: {
    color: '#FFF',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 16,
    opacity: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  snoozeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.red,
    letterSpacing: 2,
    opacity: 0.6,
  },
});

export default ReceiverDashboard;
