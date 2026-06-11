import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';

// Common Components
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';

const LoginScreen = ({ navigation }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const login = useAuthStore((state) => state.login);
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  const validateForm = () => {
    let newErrors = {};
    if (!emailOrUsername.trim()) newErrors.emailOrUsername = 'El correo o usuario es requerido';
    if (!password) newErrors.password = 'La contraseña es requerida';
    else if (password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // El backend espera emailOrUsername
      await login({ email: emailOrUsername, password });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Credenciales incorrectas';
      Alert.alert('Error de Inicio de Sesión', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="restaurant" size={40} color={COLORS.primary} />
            </View>
            <Typography variant="h2" color="white">GastroManager</Typography>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Typography variant="h2">Bienvenido de vuelta</Typography>
          <Typography variant="caption" style={{ marginBottom: 30 }}>Inicia sesión para continuar</Typography>

          <Input
            label="Correo o Usuario"
            placeholder="tu@correo.com o usuario"
            value={emailOrUsername}
            onChangeText={(text) => {
              setEmailOrUsername(text);
              if (errors.emailOrUsername) setErrors({...errors, emailOrUsername: null});
            }}
            autoCapitalize="none"
            error={errors.emailOrUsername}
            leftIcon={<MaterialIcons name="person" size={20} color={COLORS.textSecondary} />}
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({...errors, password: null});
            }}
            secureTextEntry
            error={errors.password}
            leftIcon={<MaterialIcons name="lock" size={20} color={COLORS.textSecondary} />}
          />

          <Button
            title="¿Olvidaste tu contraseña?"
            variant="ghost"
            style={styles.forgotPassword}
            textStyle={styles.forgotPasswordText}
            onPress={() => navigation.navigate('ForgotPassword')}
          />

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Typography variant="caption">¿No tienes cuenta? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Typography variant="bodyBold" color={COLORS.primary}>Regístrate</Typography>
            </TouchableOpacity>
          </View>

          {/* BOTÓN SOLO PARA PRUEBAS */}
          <Button
            title="Reiniciar Onboarding (Solo Pruebas)"
            variant="outline"
            style={styles.debugButton}
            textStyle={styles.debugButtonText}
            onPress={() => setHasSeenOnboarding(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    height: 280,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
    marginTop: -30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    minHeight: 0,
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  loginButton: {
    marginVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  debugButton: {
    marginTop: 40,
    borderStyle: 'dashed',
  },
  debugButtonText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default LoginScreen;
