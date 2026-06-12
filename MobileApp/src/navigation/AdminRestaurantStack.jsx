import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../shared/constants/colors';
import AdminProductsScreen from '../features/product/screens/AdminProductsScreen';

const Stack = createNativeStackNavigator();

const AdminRestaurantStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="AdminProducts"
        component={AdminProductsScreen}
        options={{ title: 'Mis Productos' }}
      />
    </Stack.Navigator>
  );
};

export default AdminRestaurantStack;