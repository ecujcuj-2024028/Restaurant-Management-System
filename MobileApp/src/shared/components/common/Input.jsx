import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { THEME } from '../../constants/theme';

/**
 * Custom Input Component
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {React.ReactNode} leftIcon - Optional icon at the left
 * @param {React.ReactNode} rightIcon - Optional icon at the right
 * @param {boolean} isPassword - If true, adds a toggle for secure text entry
 */
const Input = ({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  isPassword = false,
  style, 
  inputStyle,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determinar si el texto debe estar oculto
  // Si es password, depende del estado interno showPassword
  // Si no es password, respeta la prop secureTextEntry (si existe)
  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        inputStyle
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={styles.textInput}
          placeholderTextColor={COLORS.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconRight}>
            <FontAwesome6 
              name={showPassword ? "eye-slash" : "eye"} 
              size={18} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: THEME.borderRadius.md,
    height: 52,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    padding: 5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
