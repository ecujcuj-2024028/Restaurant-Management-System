import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants/colors';
import { register as registerApi } from '../../../api/auth';

// Common Components
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import Typography from '../../../shared/components/common/Typography';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.username.trim()) newErrors.username = 'El usuario es requerido';
    if (!formData.email.trim()) newErrors.email = 'El correo es requerido';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerApi({
        name: formData.firstName,
        surname: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });
      
      Alert.alert('¡Éxito!', 'Cuenta creada correctamente. Por favor, inicia sesión.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error al registrarse';
      Alert.alert('Error de Registro', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome6 name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <Typography variant="h2" color="white">Crear Cuenta</Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.8)">Regístrate para comenzar</Typography>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.row}>
            <Input
              label="Nombre"
              placeholder="Juan"
              value={formData.firstName}
              onChangeText={(val) => handleChange('firstName', val)}
              error={errors.firstName}
              style={{ flex: 1, marginRight: 10 }}
            />
            <Input
              label="Apellido"
              placeholder="Pérez"
              value={formData.lastName}
              onChangeText={(val) => handleChange('lastName', val)}
              error={errors.lastName}
              style={{ flex: 1 }}
            />
          </View>

          <Input
            label="Nombre de Usuario"
            placeholder="usuario123"
            value={formData.username}
            onChangeText={(val) => handleChange('username', val)}
            error={errors.username}
            autoCapitalize="none"
          />

          <Input
            label="Correo Electrónico"
            placeholder="tu@correo.com"
            value={formData.email}
            onChangeText={(val) => handleChange('email', val)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Teléfono"
            placeholder="12345678"
            value={formData.phone}
            onChangeText={(val) => handleChange('phone', val)}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(val) => handleChange('password', val)}
            error={errors.password}
            isPassword={true}
          />

          <Input
            label="Confirmar Contraseña"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChangeText={(val) => handleChange('confirmPassword', val)}
            error={errors.confirmPassword}
            isPassword={true}
          />

          <Button 
            title="Registrarse" 
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.footer}>
            <Typography variant="caption">¿Ya tienes cuenta? </Typography>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Typography variant="bodyBold" color={COLORS.primary}>Inicia sesión</Typography>
            </TouchableOpacity>
          </View>
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
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  }
});

export default RegisterScreen;
