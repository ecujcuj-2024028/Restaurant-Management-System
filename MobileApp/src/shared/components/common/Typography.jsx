import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

/**
 * Custom Typography Component
 * @param {string} variant - 'h1' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'caption' | 'small'
 * @param {string} color - Custom color from COLORS
 */
const Typography = ({ 
  children, 
  variant = 'body', 
  color = COLORS.text, 
  style, 
  ...props 
}) => {
  return (
    <Text 
      style={[
        styles.base,
        styles[variant],
        { color },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
});

export default Typography;
