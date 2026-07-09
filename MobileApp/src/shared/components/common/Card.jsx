import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { THEME } from '../../constants/theme';

/**
 * Custom Card Component
 * @param {boolean} shadow - Whether to show shadow (default true)
 * @param {object} style - Custom container styles
 */
const Card = ({ children, shadow = true, style }) => {
  return (
    <View style={[
      styles.card, 
      shadow && styles.shadow, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  shadow: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
});

export default Card;
