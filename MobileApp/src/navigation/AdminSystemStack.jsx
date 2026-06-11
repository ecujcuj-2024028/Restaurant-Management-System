import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../shared/constants/colors';
import useAuthStore from '../store/useAuthStore';

const Stack = createNativeStackNavigator();

const AdminDashboard = () => {
  const logout = useAuthStore(state => state.logout);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.primary }}>Panel Admin Sistema</Text>
      <Text style={{ marginVertical: 20 }}>Bienvenido, Super Administrador</Text>
      <TouchableOpacity 
        onPress={logout}
        style={{ backgroundColor: COLORS.error, padding: 15, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const AdminSystemStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    </Stack.Navigator>
  );
};

export default AdminSystemStack;
