import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {sendReminder} from '../services/api';
import {storage} from '../utils/storage';
import {COLORS, SPACING, TYPOGRAPHY} from '../utils/theme';
import {getSocket} from '../services/socket';
import {MeshBackground} from '../components/MeshBackground';

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
  const [buttonState, setButtonState] = useState<'idle' | 'success'>('idle');

  // Pulsing active indicator logic
  const pulseAnim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      const handleAcknowledged = (data: {at?: string; timestamp?: string}) => {
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
      setButtonState('success');
      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
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

  const formatLastActivity = (isoString: string | null) => {
    if (!isoString) return '-';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    return `${diffHrs}h`;
  };

  return (
    <View style={styles.container}>
      <MeshBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrapper}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOjb9oLsL82F_o7qFQ897a1UXTE2s5HRq338rudnCLARE6ulLob4MRaqRDgZmGIDj3s_SPVVw8uvg0_VqCqmhGFTDtp5NFszMCr4Bx8er_RSpPjVVM--6v7sp9LvIP7hNCUo7v3k80aNhXUORC801MU11Ezd6aAEpGKHRWWAy-bS5LTBLg4c5TJtbmM-H3r5_drscqxLGcImSqI4uffuL2XrSAzDWMVBqpRh4FMln5YYYicelRS1qeMPiH92SD0jNN65YZ_mMash6G-v8',
              }}
              style={styles.logo}
            />
          </View>
          <View>
            <Text style={styles.brandTitle}>luffy</Text>
            <Text style={styles.brandSubtitle}>stay in sync</Text>
          </View>
        </View>

        {/* Blinking Active Badge */}
        <View style={styles.activeBadge}>
          <Animated.View style={[styles.pulseDot, {opacity: pulseAnim}]} />
          <Text style={styles.activeText}>ACTIVE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* 2-Column Metrics using 100% Flex layouts to prevent collisions */}
        <View style={styles.metricsWrapper}>
          <View style={styles.metricCard}>
            <View>
              <Text style={styles.metricLabel}>HISTORY</Text>
              <Text style={styles.metricTitle} numberOfLines={2}>total acknowledged</Text>
            </View>
            <View style={styles.metricValueWrapper}>
              <Text style={styles.metricValue}>{remindersSent}</Text>
              <Text style={styles.metricSuffix}>strikes</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View>
              <Text style={styles.metricLabel}>SYNC</Text>
              <Text style={styles.metricTitle} numberOfLines={2}>last activity</Text>
            </View>
            <View style={styles.lastActivityWrapper}>
              <View style={styles.boltWrapper}>
                <Text style={styles.boltIcon}>⚡</Text>
              </View>
              <View>
                <Text style={styles.activityTime}>
                  {formatLastActivity(lastAcknowledged)}
                </Text>
                {lastAcknowledged && <Text style={styles.activityAgo}>ago</Text>}
              </View>
            </View>
          </View>
        </View>

        {/* Central Pulse Button Section */}
        <View style={styles.centerSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.sendButton,
              buttonState === 'success' && styles.sendButtonSuccess,
            ]}
            onPress={handleSendReminder}
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
                <Text style={styles.sendButtonText}>
                  {buttonState === 'success' ? 'sent' : 'send reminder'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.readyText}>READY FOR FLOW</Text>
        </View>
      </ScrollView>

      {/* Footer Logout */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoutButton}
          onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>LOGOUT ACCOUNT</Text>
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
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  brandTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'lowercase',
    lineHeight: 24,
  },
  brandSubtitle: {
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.tertiaryDim,
  },
  activeText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 100,
  },
  metricsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  metricCard: {
    flex: 1, // 100% flex-based layout for perfect side-by-side distribution
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'space-between',
    height: 128,
  },
  metricLabel: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metricTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'lowercase',
    lineHeight: 15,
  },
  metricValueWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metricValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
  },
  metricSuffix: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  lastActivityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boltWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boltIcon: {
    fontSize: 18,
  },
  activityTime: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    lineHeight: 24,
  },
  activityAgo: {
    fontFamily: 'JetBrains Mono',
    fontSize: 8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 8,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    marginVertical: 40,
  },
  sendButton: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  sendButtonSuccess: {
    backgroundColor: COLORS.tertiaryDim,
    shadowColor: COLORS.tertiaryDim,
  },
  buttonInner: {
    alignItems: 'center',
  },
  dropWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 12,
  },
  dropEmoji: {
    fontSize: 36,
  },
  sendButtonText: {
    color: '#FFF',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'lowercase',
  },
  readyText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 16,
    opacity: 0.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutIcon: {
    fontSize: 14,
    opacity: 0.4,
  },
  logoutText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    opacity: 0.4,
  },
});

export default SenderDashboard;
