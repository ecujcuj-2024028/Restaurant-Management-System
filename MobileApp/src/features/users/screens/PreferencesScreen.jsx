import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../shared/constants/colors';
import useAuthStore from '../../../store/useAuthStore';
import Typography from '../../../shared/components/common/Typography';

const PreferencesScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const bgColor = isDarkMode ? COLORS.darkBackground : '#F5F5F5';
  const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  const currentLanguageName = () => {
    switch (i18n.language) {
      case 'en':
        return 'English';
      case 'pt':
        return 'Português';
      case 'zh':
        return '简体中文';
      case 'es':
      default:
        return 'Español';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <SafeAreaView edges={['top', 'left', 'right']}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color="white" />
            <Typography variant="body" color="white">{t('menu.backMenu') || 'Regresar al Menú'}</Typography>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Typography variant="h2" color="white" style={styles.viewTitle}>{t('menu.preferences')}</Typography>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Typography variant="bodyBold" color={textColor} style={{ marginBottom: 15 }}>
          {t('menu.appearance')}
        </Typography>

        {/* Dropdown for Theme */}
        <View style={[styles.dropdownContainer, { backgroundColor: cardColor, borderColor }]}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsLangDropdownOpen(false);
            }}
          >
            <View style={styles.dropdownHeaderLeft}>
              <Ionicons
                name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
                size={22}
                color={COLORS.primary}
              />
              <Typography variant="body" color={textColor} style={{ marginLeft: 10 }}>
                {t('menu.theme')}: {isDarkMode ? t('menu.dark') : t('menu.light')}
              </Typography>
            </View>
            <Ionicons
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
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

        {/* Dropdown for Language */}
        <View style={[styles.dropdownContainer, { backgroundColor: cardColor, borderColor, marginTop: 15 }]}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => {
              setIsLangDropdownOpen(!isLangDropdownOpen);
              setIsDropdownOpen(false);
            }}
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
              name={isLangDropdownOpen ? 'chevron-up' : 'chevron-down'}
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
                    {isActive && <Ionicons name="checkmark" size={20} color={COLORS.primary} style={{ marginLeft: 'auto' }} />}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  titleContainer: {
    marginTop: 5,
  },
  viewTitle: {
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
  },
  dropdownContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
});

export default PreferencesScreen;
