import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Typography from '../../../shared/components/common/Typography';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, isDarkMode, toggleTheme } = useAuthStore();
  const [view, setView] = useState('menu'); // 'menu' o 'preferences'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const MENU_OPTIONS = [
    { id: 'perfil', title: 'Mi Perfil', icon: 'person-outline' },
    { id: 'reservas', title: 'Mis Reservas', icon: 'calendar-outline' },
    { id: 'pedidos', title: 'Mis Pedidos', icon: 'list-outline' },
    { id: 'eventos', title: 'Eventos', icon: 'star-outline' },
    { id: 'notificaciones', title: 'Notificaciones', icon: 'notifications-outline' },
    { id: 'carrito', title: 'Carrito', icon: 'cart-outline' },
    { id: 'preferencias', title: 'Preferencias', icon: 'settings-outline', action: () => setView('preferences') },
    { id: 'ayuda', title: 'Ayuda y Soporte', icon: 'help-circle-outline' },
  ];

  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  if (view === 'preferences') {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <SafeAreaView>
            <TouchableOpacity style={styles.backButton} onPress={() => setView('menu')}>
              <Ionicons name="chevron-back" size={20} color="white" />
              <Typography variant="body" color="white">Volver al Menú</Typography>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Typography variant="h2" color="white" style={styles.viewTitle}>Preferencias</Typography>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 15 }}>
            Configuración de Apariencia
          </Typography>

          {/* Dropdown (Dropnav) para el Tema */}
          <View style={[styles.dropdownContainer, { backgroundColor: cardColor, borderColor }]}>
            <TouchableOpacity 
              style={styles.dropdownHeader} 
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <View style={styles.dropdownHeaderLeft}>
                <Ionicons 
                  name={isDarkMode ? "moon-outline" : "sunny-outline"} 
                  size={22} 
                  color={COLORS.primary} 
                />
                <Typography variant="body" color={textColor} style={{ marginLeft: 10 }}>
                  Tema: {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
                </Typography>
              </View>
              <Ionicons 
                name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={textSecondary} 
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownContent}>
                <TouchableOpacity 
                  style={[styles.dropdownItem, !isDarkMode && styles.dropdownItemActive]}
                  onPress={() => {
                    if (isDarkMode) toggleTheme();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Ionicons name="sunny-outline" size={20} color={!isDarkMode ? COLORS.primary : textSecondary} />
                  <Typography color={!isDarkMode ? COLORS.primary : textColor} style={{ marginLeft: 10 }}>
                    Modo Claro
                  </Typography>
                  {!isDarkMode && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dropdownItem, isDarkMode && styles.dropdownItemActive]}
                  onPress={() => {
                    if (!isDarkMode) toggleTheme();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Ionicons name="moon-outline" size={20} color={isDarkMode ? COLORS.primary : textSecondary} />
                  <Typography color={isDarkMode ? COLORS.primary : textColor} style={{ marginLeft: 10 }}>
                    Modo Oscuro
                  </Typography>
                  {isDarkMode && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <Typography variant="small" color={textSecondary} style={{ marginTop: 10, paddingHorizontal: 5 }}>
            Personaliza cómo se ve la aplicación en tu dispositivo.
          </Typography>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <SafeAreaView>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="white" />
            <Typography variant="body" color="white">Volver</Typography>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle-outline" size={80} color="white" />
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
                <Typography variant="bodyBold" color={textColor} style={styles.itemTitle}>
                  {item.title}
                </Typography>
                <Ionicons name="chevron-forward" size={16} color={textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: cardColor }]} 
          onPress={handleLogout}
        >
          <Typography variant="bodyBold" color={COLORS.error}>Cerrar Sesión</Typography>
          <Ionicons name="chevron-forward" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </ScrollView>
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
  itemTitle: {
    fontSize: 15,
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
});

export default ProfileScreen;
