import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Typography from './Typography';
import useNotificationStore from '../../../store/useNotificationStore';
import useAuthStore from '../../../store/useAuthStore';

const Header = ({ title, showNotification = true, navigation, showBack = false, rightComponent, onTitlePress }) => {
  const { isDarkMode } = useAuthStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
  const borderColor = isDarkMode ? COLORS.darkBorder : COLORS.border;
  const surfaceColor = isDarkMode ? COLORS.darkSurface : COLORS.white;

  return (
    <View style={[styles.header, { borderBottomColor: borderColor }]}>
      <View style={styles.headerTop}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={textColor} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            activeOpacity={onTitlePress ? 0.7 : 1} 
            onPress={onTitlePress}
          >
            <Typography variant="h2" color={textColor}>
              {title}
            </Typography>
          </TouchableOpacity>
        </View>
        
        {rightComponent ? rightComponent : (showNotification && (
          <TouchableOpacity
            style={[styles.notificationIcon, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => navigation?.navigate('NotificationHistory')}
          >
            <Ionicons name="notifications" size={22} color={textColor} />
            {unreadCount > 0 && (
              <View style={[styles.notificationDot, { backgroundColor: COLORS.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Header;
