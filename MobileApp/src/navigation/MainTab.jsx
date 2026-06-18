import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../shared/constants/colors';
import HomeStack from './HomeStack';
import MenuScreen from '../features/users/screens/MenuScreen';
import RestaurantsStack from './RestaurantsStack';
import ReservationsStack from './ReservationsStack';
import MyOrdersScreen from '../features/orders/screens/MyOrdersScreen';
import { View, Text } from 'react-native';
import useAuthStore from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

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

// Bottom tabs
const BottomTabs = () => {
  const { isDarkMode } = useAuthStore();
  const { t } = useTranslation();

  const bgColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;
  const inactiveColor = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'InicioTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'RestaurantesTab') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'ReservacionesTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MenuTab') {
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
      <Tab.Screen
        name="InicioTab"
        component={HomeStack}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name="RestaurantesTab"
        component={RestaurantsStack}
        options={{ tabBarLabel: t('tabs.restaurants') }}
      />
      <Tab.Screen
        name="ReservacionesTab"
        component={ReservationsStack}
        options={{ tabBarLabel: t('tabs.reservations') }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuScreen}
        options={{ tabBarLabel: t('tabs.menu') }}
      />
    </Tab.Navigator>
  );
};

const MainTab = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Tabs" component={BottomTabs} />
      <RootStack.Screen name="MyOrders" component={MyOrdersScreen} />
    </RootStack.Navigator>
  );
};

export default MainTab;
