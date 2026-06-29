import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../shared/constants/colors";
import useAuthStore from "../../store/useAuthStore";
import { useTranslation } from "react-i18next";
import Typography from "../../shared/components/common/Typography";
import { getNotificationsHistory, markAsRead, markAllAsRead } from "../../api/notifications";

const NotificationHistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { isDarkMode } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
    const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
    const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
    const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;

    const loadNotifications = useCallback(async () => {
        try {
            const response = await getNotificationsHistory();
            setNotifications(response.notifications || []);
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.log(error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.log(error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order': return 'receipt-outline';
            case 'reservation': return 'calendar-outline';
            case 'inventory': return 'alert-circle-outline';
            default: return 'notifications-outline';
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Typography variant="h2" color={textColor}>
                    {t('menu.notifications')}
                </Typography>
                {unreadCount > 0 && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Typography variant="small" color={COLORS.primary}>
                            {t('notifications.markAllRead', 'Marcar leídas')}
                        </Typography>
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color={textSecondary} />
                    <Typography variant="body" color={textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
                        {t('notifications.empty', 'No tienes notificaciones')}
                    </Typography>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.notificationCard,
                                { backgroundColor: cardColor },
                                !item.isRead && { borderLeftWidth: 4, borderLeftColor: COLORS.primary }
                            ]}
                            onPress={() => handleMarkAsRead(item._id)}
                        >
                            <View style={styles.notificationIcon}>
                                <Ionicons
                                    name={getNotificationIcon(item.type)}
                                    size={24}
                                    color={COLORS.primary}
                                />
                            </View>
                            <View style={styles.notificationContent}>
                                <Typography variant="bodyBold" color={textColor}>
                                    {item.title}
                                </Typography>
                                <Typography variant="caption" color={textSecondary} style={{ marginTop: 4 }}>
                                    {item.message}
                                </Typography>
                                <Typography variant="small" color={textSecondary} style={{ marginTop: 8 }}>
                                    {formatDate(item.createdAt)}
                                </Typography>
                            </View>
                            {!item.isRead && (
                                <View style={styles.unreadDot} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    markAllButton: {
        padding: 8,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    notificationIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    notificationContent: {
        flex: 1,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
        marginTop: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
});

export default NotificationHistoryScreen;