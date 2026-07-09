import React, { useEffect, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../shared/constants/colors';
import HomeStack from './HomeStack';
import MenuScreen from '../features/users/screens/MenuScreen';
import HelpSupportScreen from '../features/users/screens/HelpSupportScreen';
import MyReservationsScreen from '../features/reservations/screens/MyReservationsScreen';
import RestaurantsStack from './RestaurantsStack';
import ReservationsStack from './ReservationsStack';
import MyOrdersScreen from '../features/orders/screens/MyOrdersScreen';
import CreateOrderScreen from '../features/orders/screens/CreateOrderScreen';
import NotificationHistoryScreen from '../features/notifications/NotificationHistoryScreen';
import EventsStack from './EventsStack';
import PreferencesScreen from '../features/users/screens/PreferencesScreen';
import ProfileScreen from '../features/users/screens/ProfileScreen';
import { View, Text, Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import useSocket from '../shared/hooks/useSocket';
import useNotificationStore from '../store/useNotificationStore';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import Typography from '../shared/components/common/Typography';
import { navigationRef } from './AppNavigator';

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

const MainTab = ({ navigation }) => {
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;
  const socketRooms = useMemo(() => (userId ? [`user_${userId}`] : []), [userId]);
  const { on } = useSocket(socketRooms);
  const { addNotification } = useNotificationStore();
  const { t } = useTranslation();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!userId) return;

    const handleNewNotification = (notification) => {
      addNotification({
        id: notification._id || notification.id || Date.now().toString(),
        title: notification.title || 'Notificación',
        message: notification.message || '',
        type: notification.type || 'info',
        isRead: notification.isRead || false,
        createdAt: notification.createdAt || new Date().toISOString(),
      });
      setToast({
        title: notification.title || 'Nueva Notificación',
        message: notification.message || '',
      });
    };

    const STATUS_LABELS_ES = {
      recibido: 'Pedido recibido 🟡',
      confirmado: 'Pedido confirmado ✅',
      en_preparacion: 'En preparación 🍳',
      listo: 'Listo para servir 🟢',
      en_camino: 'En camino 🛵',
      entregado: 'Entregado 🎉',
      cancelado: 'Pedido cancelado ❌',
    };

    const handleOrderStatusChange = (data) => {
      const statusRaw = data.status || data.estado || '';
      const statusLabel = STATUS_LABELS_ES[statusRaw] || statusRaw;
      const restaurantName = data.restaurantId?.name || data.restaurant?.name || 'el restaurante';
      const shortId = (data._id || data.id || '').slice(-4).toUpperCase();
      const title = 'Actualización de pedido';
      const msg = `${statusLabel} — Pedido #${shortId} en ${restaurantName}`;

      addNotification({
        id: `order_${data._id || data.id}_${statusRaw}_${Date.now()}`,
        title,
        message: msg,
        type: 'order',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      setToast({ title, message: msg });
    };


    const handleReservationUpdate = (data) => {
      const statusLabel = data.status ? data.status.toUpperCase() : 'pendiente';
      const msg = `Tu reserva ha sido actualizada a: ${statusLabel}`;
      addNotification({
        id: data._id || data.id || Date.now().toString(),
        title: 'Reserva Actualizada',
        message: msg,
        type: 'booking',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      setToast({ title: 'Reserva Actualizada', message: msg });
    };

    const handleReservationCancel = (data) => {
      const msg = `Tu reserva ha sido cancelada.`;
      addNotification({
        id: data._id || data.id || Date.now().toString(),
        title: 'Reserva Cancelada',
        message: msg,
        type: 'booking',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      setToast({ title: 'Reserva Cancelada', message: msg });
    };

    const unsubNew = on('new_notification', handleNewNotification);
    const unsubOrderUpdate = on('order_status_updated', handleOrderStatusChange);
    const unsubOrderCancel = on('order_cancelled', handleOrderStatusChange);
    const unsubReservationUpdate = on('reservation_updated', handleReservationUpdate);
    const unsubReservationCancel = on('reservation_cancelled', handleReservationCancel);

    return () => {
      unsubNew();
      unsubOrderUpdate();
      unsubOrderCancel();
      unsubReservationUpdate();
      unsubReservationCancel();
    };
  }, [userId, on, addNotification]);

  return (
    <>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={BottomTabs} />
        <RootStack.Screen name="MyOrders" component={MyOrdersScreen} />
        <RootStack.Screen name="CreateOrder" component={CreateOrderScreen} />
        <RootStack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <RootStack.Screen name="MyReservations" component={MyReservationsScreen} />
        <RootStack.Screen name="NotificationHistory" component={NotificationHistoryScreen} />
        <RootStack.Screen name="Events" component={EventsStack} />
        <RootStack.Screen name="Preferences" component={PreferencesScreen} />
        <RootStack.Screen name="Profile" component={ProfileScreen} />
      </RootStack.Navigator>

      {toast && (
        <View style={styles.toastContainer}>
          <TouchableOpacity 
            style={styles.toastCard}
            activeOpacity={0.9}
            onPress={() => {
              setToast(null);
              if (navigationRef.isReady()) {
                navigationRef.navigate('NotificationHistory');
              } else {
                navigation.navigate('NotificationHistory');
              }
            }}
          >
            <View style={styles.toastIconCircle}>
              <Ionicons name="notifications" size={20} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography variant="bodyBold" color={COLORS.white} numberOfLines={1}>
                {toast.title}
              </Typography>
              <Typography variant="small" color="rgba(255,255,255,0.9)" numberOfLines={2} style={{ marginTop: 2 }}>
                {toast.message}
              </Typography>
            </View>
            <TouchableOpacity onPress={() => setToast(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MainTab;
