import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { COLORS } from '../../../shared/constants/colors';
import { COMMON_STYLES } from '../../../shared/constants/theme';
import { register } from '../../../api/auth';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email, password });
      Alert.alert('Éxito', 'Cuenta creada con éxito. Por favor, verifica tu correo electrónico.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Error de Registro', error.response?.data?.message || 'Ocurrió un error al registrar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={[COMMON_STYLES.container, styles.container]}>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Únete a la mejor experiencia gastronómica</Text>

        <TextInput
          style={COMMON_STYLES.input}
          placeholder="Nombre"
          value={formData.firstName}
          onChangeText={(val) => handleChange('firstName', val)}
        />

        <TextInput
          style={COMMON_STYLES.input}
          placeholder="Apellido"
          value={formData.lastName}
          onChangeText={(val) => handleChange('lastName', val)}
        />

        <TextInput
          style={COMMON_STYLES.input}
          placeholder="Correo electrónico"
          value={formData.email}
          onChangeText={(val) => handleChange('email', val)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={COMMON_STYLES.input}
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(val) => handleChange('password', val)}
          secureTextEntry
        />

        <TextInput
          style={COMMON_STYLES.input}
          placeholder="Confirmar contraseña"
          value={formData.confirmPassword}
          onChangeText={(val) => handleChange('confirmPassword', val)}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[COMMON_STYLES.primaryButton, styles.button]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={COMMON_STYLES.buttonText}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
  },
  linkText: {
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 14,
  },
  linkBold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  }
});

export default RegisterScreen;
