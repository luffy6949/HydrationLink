import {StyleSheet} from 'react-native';

export const COLORS = {
  // Glacier Light Theme Colors
  background: '#F7F9FB', 
  surface: 'rgba(255, 255, 255, 0.6)', // Frosted glass translucency
  border: 'rgba(255, 255, 255, 0.3)', // Frost border
  text: '#191C1E', // Deep Navy text/headings
  textSecondary: '#45464D', // Slate grey variant
  primary: '#000000', // Deep Navy
  secondary: '#006686', // Sky Blue primary
  secondaryContainer: '#7ED4FD', // Light sky blue
  secondaryFixed: '#C0E8FF', // Glacial accent
  tertiary: '#002111', // Dark mint green
  tertiaryFixed: '#B4F0C9', // Mint green background
  tertiaryFixedDim: '#99D4AE', // Mint green accent
  tertiaryDim: '#578F6E', // Mint green accent variant
  orange: '#FF8C00', // Alert Orange (Urgent Sync)
  orangeLight: '#FFDAD6', // Alert Container
  red: '#BA1A1A', // Error
  green: '#38A169', 
  card: '#FFFFFF', // Fallback card solid background
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
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  h2: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  h3: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  label: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.2,
  },
  button: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
