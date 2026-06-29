import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import { registerForPushNotificationsAsync } from '../../../features/notifications/notificationService';

// Common Components
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';

const LoginScreen = ({ navigation }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expoPushToken, setExpoPushToken] = useState(null);

  const login = useAuthStore((state) => state.login);
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);
  const isDarkMode = useAuthStore((state) => state.isDarkMode);
  const toggleTheme = useAuthStore((state) => state.toggleTheme);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });
  }, []);

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
      await login({ email: emailOrUsername, password }, expoPushToken);
    } catch (error) {
      if (error.code === 'ADMIN_ACCESS_RESTRICTED') {
        Alert.alert(
          'Acceso Restringido',
          'Esta aplicación móvil es exclusiva para clientes. Para gestionar tus restaurantes o el sistema, por favor inicia sesión desde nuestra plataforma web.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Ir a la Web', 
              onPress: () => Linking.openURL(process.env.EXPO_PUBLIC_WEB_URL || 'http://192.168.0.3:5173')
            }
          ]
        );
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Credenciales incorrectas';
        Alert.alert('Error de Inicio de Sesión', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.themeToggle} 
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={isDarkMode ? "light-mode" : "dark-mode"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="restaurant" size={40} color={COLORS.primary} />
            </View>
            <Typography variant="h2" color="white">GastroManager</Typography>
          </View>
        </View>

        <View style={[styles.formContainer, { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }]}>
          <Typography variant="h2" color={isDarkMode ? COLORS.darkText : COLORS.text}>Bienvenido de vuelta</Typography>
          <Typography variant="caption" color={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary} style={{ marginBottom: 30 }}>Inicia sesión para continuar</Typography>

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
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({...errors, password: null});
            }}
            isPassword={true}
            error={errors.password}
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
            <Typography variant="caption" color={isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary}>¿No tienes cuenta? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Typography variant="bodyBold" color={COLORS.primary}>Regístrate</Typography>
            </TouchableOpacity>
          </View>

          {/* BOTÓN SOLO PARA PRUEBAS */}
          <Button
            title="Reiniciar Onboarding (Solo Pruebas)"
            variant="outline"
            style={[styles.debugButton, { borderColor: isDarkMode ? COLORS.darkBorder : COLORS.border }]}
            textStyle={[styles.debugButtonText, { color: isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary }]}
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
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
