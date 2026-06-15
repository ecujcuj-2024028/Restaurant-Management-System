import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../shared/constants/colors';
import HomeStack from './HomeStack';
import ProfileScreen from '../features/users/screens/ProfileScreen';
import { View, Text } from 'react-native';
import useAuthStore from '../store/useAuthStore';

const Tab = createBottomTabNavigator();

const Placeholder = ({ name, isDark }) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: isDark ? COLORS.darkBackground : COLORS.background 
  }}>
    <Text style={{ color: isDark ? COLORS.white : COLORS.text }}>{name} Screen</Text>
  </View>
);

const MainTab = () => {
  const { isDarkMode } = useAuthStore();

  const bgColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;
  const inactiveColor = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Restaurantes') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Reservaciones') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'menu' : 'menu-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          height: 60,
          paddingBottom: 10,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Restaurantes">
        {(props) => <Placeholder {...props} name="Restaurantes" isDark={isDarkMode} />}
      </Tab.Screen>
      <Tab.Screen name="Reservaciones">
        {(props) => <Placeholder {...props} name="Reservaciones" isDark={isDarkMode} />}
      </Tab.Screen>
      <Tab.Screen name="Menu" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTab;
