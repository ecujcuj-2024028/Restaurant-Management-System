import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Typography from '../../../shared/components/common/Typography';
import { useTranslation } from 'react-i18next';

const MenuScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, isDarkMode, toggleTheme } = useAuthStore();
  const [view, setView] = useState('menu'); // 'menu' o 'preferences'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  const currentLanguageName = () => {
    switch(i18n.language) {
      case 'en': return 'English';
      case 'pt': return 'Português';
      case 'zh': return '简体中文';
      case 'es':
      default: return 'Español';
    }
  };

  const MENU_OPTIONS = [
    { id: 'perfil', title: t('menu.myProfile'), icon: 'person-outline' },
    { id: 'reservas', title: t('menu.myReservations'), icon: 'calendar-outline' },
    { id: 'pedidos', title: t('menu.myOrders'), icon: 'list-outline' },
    { id: 'eventos', title: t('menu.events'), icon: 'star-outline' },
    { id: 'notificaciones', title: t('menu.notifications'), icon: 'notifications-outline' },
    { id: 'carrito', title: t('menu.cart'), icon: 'cart-outline' },
    { id: 'preferencias', title: t('menu.preferences'), icon: 'settings-outline', action: () => setView('preferences') },
    { id: 'ayuda', title: t('menu.help'), icon: 'help-circle-outline' },
  ];

  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  // Foto de perfil real o placeholder
  const profileImage = user?.profilePicture || user?.avatar;

  if (view === 'preferences') {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <SafeAreaView>
            <TouchableOpacity style={styles.backButton} onPress={() => setView('menu')}>
              <Ionicons name="chevron-back" size={20} color="white" />
              <Typography variant="body" color="white">{t('menu.backMenu')}</Typography>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Typography variant="h2" color="white" style={styles.viewTitle}>{t('menu.preferences')}</Typography>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 15 }}>
            {t('menu.appearance')}
          </Typography>

          {/* Dropdown (Dropnav) para el Tema */}
          <View style={[styles.dropdownContainer, { backgroundColor: cardColor, borderColor }]}>
            <TouchableOpacity 
              style={styles.dropdownHeader} 
              onPress={() => { setIsDropdownOpen(!isDropdownOpen); setIsLangDropdownOpen(false); }}
            >
              <View style={styles.dropdownHeaderLeft}>
                <Ionicons 
                  name={isDarkMode ? "moon-outline" : "sunny-outline"} 
                  size={22} 
                  color={COLORS.primary} 
                />
                <Typography variant="body" color={textColor} style={{ marginLeft: 10 }}>
                  {t('menu.theme')}: {isDarkMode ? t('menu.dark') : t('menu.light')}
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
                    {t('menu.light')}
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
                    {t('menu.dark')}
                  </Typography>
                  {isDarkMode && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Dropdown para Idioma */}
          <View style={[styles.dropdownContainer, { backgroundColor: cardColor, borderColor, marginTop: 15 }]}>
            <TouchableOpacity 
              style={styles.dropdownHeader} 
              onPress={() => { setIsLangDropdownOpen(!isLangDropdownOpen); setIsDropdownOpen(false); }}
            >
              <View style={styles.dropdownHeaderLeft}>
                <Ionicons 
                  name="language-outline" 
                  size={22} 
                  color={COLORS.primary} 
                />
                <Typography variant="body" color={textColor} style={{ marginLeft: 10 }}>
                  {t('menu.language')}: {currentLanguageName()}
                </Typography>
              </View>
              <Ionicons 
                name={isLangDropdownOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={textSecondary} 
              />
            </TouchableOpacity>

            {isLangDropdownOpen && (
              <View style={styles.dropdownContent}>
                {[
                  { code: 'es', label: 'Español' },
                  { code: 'en', label: 'English' },
                  { code: 'pt', label: 'Português' },
                  { code: 'zh', label: '简体中文' }
                ].map((lang) => {
                  const isActive = i18n.language === lang.code;
                  return (
                    <TouchableOpacity 
                      key={lang.code}
                      style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                      onPress={() => changeLanguage(lang.code)}
                    >
                      <Typography color={isActive ? COLORS.primary : textColor} style={{ marginLeft: 10 }}>
                        {lang.label}
                      </Typography>
                      {isActive && <Ionicons name="checkmark" size={20} color={COLORS.primary} style={{ marginLeft: 'auto' }}/>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          
          <Typography variant="small" color={textSecondary} style={{ marginTop: 10, paddingHorizontal: 5 }}>
            {t('menu.appearanceDesc')}
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
            <Typography variant="body" color="white">{t('menu.back')}</Typography>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
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
                <Ionicons name="chevron-forward" size={16} color={textSecondary} />
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
});

export default MenuScreen;
