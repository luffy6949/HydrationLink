import {StyleSheet} from 'react-native';

export const COLORS = {
  background: '#0A0A0A',
  card: '#151515',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#8A8A8A',
  steel: '#4A5568',
  steelDark: '#2D3748',
  orange: '#FF6B00',
  orangeDark: '#CC5500',
  red: '#E53E3E',
  green: '#38A169',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  button: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
