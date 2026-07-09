import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, Animated, Easing, Image, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Typography from '../../../shared/components/common/Typography';
import { useTranslation } from 'react-i18next';
import useOrderCartStore from '../../../store/useOrderCartStore';

const MenuScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, isDarkMode, toggleTheme, fetchProfile } = useAuthStore();
  const cartItems = useOrderCartStore((state) => state.items);
  // Refrescar el perfil cuando la pantalla gana el foco
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      t('menu.logout'),
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: t('menu.logout'), onPress: logout, style: 'destructive' }
      ]
    );
  };

  const MENU_OPTIONS = [
    { id: 'perfil', title: t('menu.myProfile'), icon: 'person-outline', action: () => navigation.navigate('Profile') },
    { id: 'reservas', title: t('menu.myReservations'), icon: 'calendar-outline', action: () => navigation.navigate('MyReservations') },
    { id: 'pedidos', title: t('menu.myOrders'), icon: 'list-outline', action: () => navigation.navigate('MyOrders') },
    { id: 'eventos', title: t('menu.events'), icon: 'star-outline', action: () => navigation.navigate('Events') },
    { id: 'notificaciones', title: t('menu.notifications'), icon: 'notifications-outline', action: () => navigation.navigate('NotificationHistory') },
    { id: 'carrito', title: t('menu.cart'), icon: 'cart-outline', action: () => navigation.navigate('CreateOrder') },
    { id: 'preferencias', title: t('menu.preferences'), icon: 'settings-outline', action: () => navigation.navigate('Preferences') },
    { id: 'ayuda', title: t('menu.help'), icon: 'help-circle-outline', action: () => navigation.navigate('HelpSupport') },
  ];

  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // Foto de perfil real o placeholder
  const profileImage = user?.profilePicture || user?.avatar;



  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <SafeAreaView>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="white" />
            <Typography variant="body" color="white">{t('menu.back')}</Typography>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  key={profileImage}
                  source={{ uri: profileImage }} 
                  style={styles.avatar} 
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person-circle-outline" size={80} color="white" />
              )}
            </View>
            <Typography variant="h2" color="white" style={styles.userName}>
              {user?.name || (user?.firstName ? `${user.firstName} ${user.lastName}` : 'Usuario')}
            </Typography>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {MENU_OPTIONS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.menuItem, { backgroundColor: cardColor }]}
              onPress={item.action}
            >
              <View style={styles.menuItemInner}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                  <Typography variant="bodyBold" color={textColor} style={styles.itemTitle}>
                    {item.title}
                  </Typography>
                </View>
                {item.id === 'carrito' && cartItems.length > 0 ? (
                  <View style={styles.cartBadge}>
                    <Typography variant="smallBold" color={COLORS.white}>{cartItems.length}</Typography>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={textSecondary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: cardColor }]} 
          onPress={handleLogout}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={{ marginRight: 10 }} />
            <Typography variant="bodyBold" color={COLORS.error}>{t('menu.logout')}</Typography>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </ScrollView>

      {/* Botón flotante: volver a Mis Pedidos */}
      <TouchableOpacity
        style={styles.ordersFab}
        onPress={() => navigation.navigate('MyOrders')}
        activeOpacity={0.85}
      >
        <Ionicons name="receipt-outline" size={22} color={COLORS.white} />
        <Typography variant="small" color={COLORS.white} style={{ fontWeight: '700', marginLeft: 6 }}>
          {t('menu.myOrders')}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    marginBottom: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  viewTitle: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    height: 80,
    borderRadius: 16,
    marginBottom: 15,
    padding: 15,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  menuItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    flex: 1,
  },
  logoutButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  // Estilos del Dropdown
  dropdownContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128,128,128,0.05)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  cartBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  ordersFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});

export default MenuScreen;
