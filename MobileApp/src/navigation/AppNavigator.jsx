import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import AdminSystemStack from './AdminSystemStack';
import AdminRestaurantStack from './AdminRestaurantStack';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import useAuthStore from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../shared/constants/colors';
import { ROLES } from '../shared/constants/roles';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user, hasSeenOnboarding, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderMainStack = () => {
    // Si el usuario tiene múltiples roles, tomamos el primero
    const userRole = user?.roles?.[0] || user?.role;

    switch (userRole) {
      case ROLES.ADMIN_SISTEMA:
        return <Stack.Screen name="AdminSystem" component={AdminSystemStack} />;
      case ROLES.ADMIN_RESTAURANTE:
        return <Stack.Screen name="AdminRestaurant" component={AdminRestaurantStack} />;
      case ROLES.CLIENTE:
      default:
        return <Stack.Screen name="Main" component={MainTab} />;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          renderMainStack()
        ) : !hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
