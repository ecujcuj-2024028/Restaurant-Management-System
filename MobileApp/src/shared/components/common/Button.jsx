import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { THEME } from '../../constants/theme';

/**
 * Custom Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'ghost'
 * @param {string} title - Button text
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Loading state
 * @param {object} style - Custom container styles
 * @param {object} textStyle - Custom text styles
 * @param {React.ReactNode} icon - Optional icon component
 */
const Button = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  disabled = false, 
  loading = false, 
  style, 
  textStyle,
  icon,
  ...props 
}) => {
  
  const getVariantStyles = (pressed) => {
    switch (variant) {
      case 'secondary':
        return {
          container: [
            styles.secondaryContainer,
            pressed && styles.secondaryPressed,
            disabled && styles.disabledContainer
          ],
          text: styles.secondaryText
        };
      case 'outline':
        return {
          container: [
            styles.outlineContainer,
            pressed && styles.outlinePressed,
            disabled && styles.disabledOutlineContainer
          ],
          text: [styles.outlineText, pressed && styles.outlineTextPressed]
        };
      case 'ghost':
        return {
          container: [
            styles.ghostContainer,
            pressed && styles.ghostPressed,
            disabled && styles.disabledGhostContainer
          ],
          text: styles.ghostText
        };
      case 'primary':
      default:
        return {
          container: [
            styles.primaryContainer,
            pressed && styles.primaryPressed,
            disabled && styles.disabledContainer
          ],
          text: styles.primaryText
        };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.baseContainer,
        getVariantStyles(pressed).container,
        style
      ]}
      {...props}
    >
      {({ pressed }) => (
        <>
          {loading ? (
            <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : 'white'} />
          ) : (
            <View style={styles.content}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <Text style={[
                styles.baseText, 
                getVariantStyles(pressed).text, 
                textStyle,
                disabled && styles.disabledText
              ]}>
                {title}
              </Text>
            </View>
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  baseText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Primary
  primaryContainer: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryPressed: {
    backgroundColor: '#E66000', // Darker orange
    transform: [{ scale: 0.98 }],
  },
  primaryText: {
    color: 'white',
  },
  // Secondary
  secondaryContainer: {
    backgroundColor: COLORS.secondary,
  },
  secondaryPressed: {
    backgroundColor: '#1A1A1A',
    transform: [{ scale: 0.98 }],
  },
  secondaryText: {
    color: 'white',
  },
  // Outline
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlinePressed: {
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderColor: '#E66000',
  },
  outlineText: {
    color: COLORS.primary,
  },
  outlineTextPressed: {
    color: '#E66000',
  },
  // Ghost
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  ghostText: {
    color: COLORS.text,
  },
  // States
  disabledContainer: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledOutlineContainer: {
    borderColor: COLORS.border,
  },
  disabledGhostContainer: {
    opacity: 0.5,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
});

export default Button;
