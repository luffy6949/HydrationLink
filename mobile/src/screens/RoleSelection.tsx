import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {claimRole} from '../services/api';
import {connectSocket} from '../services/socket';
import {storage} from '../utils/storage';
import {COLORS, SPACING, TYPOGRAPHY} from '../utils/theme';
import {MeshBackground} from '../components/MeshBackground';

type RoleSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RoleSelection'
>;

interface Props {
  navigation: RoleSelectionNavigationProp;
}

const RoleSelection: React.FC<Props> = ({navigation}) => {
  const [selectedRole, setSelectedRole] = useState<'sender' | 'receiver'>('sender');
  const [loading, setLoading] = useState<boolean>(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const deviceToken = await storage.getDeviceToken();
      const response = await claimRole(
        selectedRole.toUpperCase() as 'SENDER' | 'RECEIVER',
        deviceToken || 'unknown'
      );

      await storage.saveToken(response.deviceToken);
      await storage.saveRole(selectedRole);

      await connectSocket();

      if (selectedRole === 'sender') {
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
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MeshBackground />

      {/* Floating Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3ujYKLCtX5mAn-lZ879zgQq30R-qk9irfCkBR6bxXB6en0kVxJalwW_VzKYI07XsARzaovDyLTZxRiKlDl1K4XKUoquu9reOu4RTEqMte5enSLgRhxvooc2xkDSzoGHmSaLfwixt6ez5uwOHIAj-3_IkHbFEoiU_h9e-w-fkNRglasCcnjmOxSPZOM7_cdgC-_3U8lyG2u6FEaqOF8dqp5Wq__DrO9pBaxlTfik5rdmRYseuia_YXIJXdoGRKqWEDyuMH-NdVaJfLCFk',
            }}
            style={styles.logo}
          />
          <Text style={styles.brandName}>HydraLink</Text>
        </View>
        <Text style={styles.headerLabel}>ACTIVE</Text>
      </View>

      {/* Welcome Title */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome.</Text>
        <Text style={styles.welcomeSubtitle}>
          Select your path to begin navigating the ecosystem of HydrationLink.
        </Text>
      </View>

      {/* Role Selection Grid */}
      <View style={styles.grid}>
        {/* Card 1: Luffy (Sender) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.card,
            selectedRole === 'sender' && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole('sender')}>
          {selectedRole === 'sender' && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          )}
          <View style={[styles.avatarCircle, {backgroundColor: COLORS.tertiaryFixed}]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.cardTitle}>Luffy</Text>
          <Text style={styles.cardDesc}>
            Manage your personal hydration journey with precision.
          </Text>
          <View style={styles.tagWrapper}>
            <Text style={[styles.tag, {backgroundColor: 'rgba(153, 212, 174, 0.3)', color: COLORS.tertiary}]}>
              Sender
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Partner (Receiver) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.card,
            selectedRole === 'receiver' && styles.cardSelected,
          ]}
          onPress={() => setSelectedRole('receiver')}>
          {selectedRole === 'receiver' && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          )}
          <View style={[styles.avatarCircle, {backgroundColor: COLORS.secondaryFixed}]}>
            <Text style={styles.avatarEmoji}>🤝</Text>
          </View>
          <Text style={styles.cardTitle}>Partner</Text>
          <Text style={styles.cardDesc}>
            Connect and provide resources within the network.
          </Text>
          <View style={styles.tagWrapper}>
            <Text style={[styles.tag, {backgroundColor: 'rgba(126, 212, 253, 0.3)', color: COLORS.secondary}]}>
              Receiver
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Floating Bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.continueText}>Continue</Text>
              <Text style={styles.arrowIcon}>➔</Text>
            </View>
          )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  brandName: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerLabel: {
    fontFamily: 'JetBrains Mono',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: 'rgba(0,0,0,0.6)',
  },
  welcomeContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  welcomeTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 40,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    position: 'relative',
    minHeight: 220,
  },
  cardSelected: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.primary,
    marginBottom: 8,
  },
  cardDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 16,
    flexGrow: 1,
  },
  tagWrapper: {
    marginTop: 16,
  },
  tag: {
    fontFamily: 'JetBrains Mono',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  continueButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrowIcon: {
    color: '#FFF',
    fontSize: 18,
  },
});

export default RoleSelection;
