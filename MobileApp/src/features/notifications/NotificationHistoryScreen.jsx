import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../shared/constants/colors';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import { useTranslation } from 'react-i18next';
import Typography from '../../shared/components/common/Typography';
import { getNotificationsHistory, markAsRead, markAllAsRead, deleteNotification } from '../../api/notifications';

const NotificationHistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { isDarkMode, getSocket } = useAuthStore();
    const {
        notifications,
        unreadCount,
        addNotification,
        markAsRead: markLocalAsRead,
        markAllAsRead: markAllLocalAsRead,
        setNotifications,
        deleteNotification: deleteLocalNotification,
    } = useNotificationStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const bgColor = isDarkMode ? COLORS.darkBackground : COLORS.background;
    const cardColor = isDarkMode ? COLORS.darkSurface : COLORS.white;
    const textColor = isDarkMode ? COLORS.darkText : COLORS.text;
    const textSecondary = isDarkMode ? COLORS.darkTextSecondary : COLORS.textSecondary;

    const loadNotifications = useCallback(async () => {
        try {
            const response = await getNotificationsHistory();
            setNotifications(response.notifications || []);
        } catch (error) {
            console.log('[Notifications] Error cargando historial:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleOrderStatusChange = (data) => {
            addNotification({
                id: Date.now().toString(),
                title: data.title || 'Actualización de pedido',
                message: data.message || `Tu pedido cambió a: ${data.status}`,
                type: 'order',
                isRead: false,
                createdAt: new Date().toISOString(),
            });
        };

        socket.on('order_status_changed', handleOrderStatusChange);
        socket.on('notification', handleOrderStatusChange);

        return () => {
            socket.off('order_status_changed', handleOrderStatusChange);
            socket.off('notification', handleOrderStatusChange);
        };
    }, [getSocket, addNotification]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            markLocalAsRead(id);
        } catch (error) {
            markLocalAsRead(id);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.log('[Notifications] Error marcando todas como leídas:', error);
        } finally {
            markAllLocalAsRead();
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await deleteNotification(id);
            deleteLocalNotification(id);
        } catch (error) {
            console.log('[Notifications] Error eliminando notificación:', error);
            deleteLocalNotification(id);
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
    <SafeAreaView style={[styles.container, { backgroundColor: cardColor }]}>            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Typography variant="h2" color={textColor}>
                    {t('menu.notifications')}
                </Typography>
                {unreadCount > 0 ? (
                    <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                        <Typography variant="small" color={COLORS.primary}>
                            {t('notifications.markAllRead', 'Marcar leídas')}
                        </Typography>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.markAllButton} />
                )}
            </View>

            {notifications.length === 0 ? (
                <View style={styles.emptyWrapper}>
                    <View style={[styles.emptyCard, { backgroundColor: cardColor }]}>
                        <Typography variant="h3" color={textColor} style={styles.emptyTitle}>
                            No tienes notificaciones
                        </Typography>
                        <Typography variant="caption" color={textSecondary} style={styles.emptySubtitle}>
                            Esta vacío la caja de notificaciones
                        </Typography>
                        <TouchableOpacity
                            style={styles.backButtonCard}
                            onPress={() => navigation.goBack()}
                        >
                            <Typography variant="bodyBold" color={COLORS.white}>
                                Regresar
                            </Typography>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    contentContainerStyle={{ paddingVertical: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.notificationCard,
                                { backgroundColor: cardColor },
                                !item.isRead && { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
                            ]}
                            onPress={() => handleMarkAsRead(item._id || item.id)}
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
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteNotification(item._id || item.id)}
                            >
                                <Ionicons name="close-circle" size={24} color={COLORS.error} />
                            </TouchableOpacity>
                            {!item.isRead && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    backButton: { padding: 8 },
    markAllButton: { padding: 8, minWidth: 80, alignItems: 'flex-end' },
    emptyWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyCard: {
        width: '100%',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyTitle: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    emptySubtitle: {
        textAlign: 'center',
        marginBottom: 24,
    },
    backButtonCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 40,
        alignItems: 'center',
        width: '100%',
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
    notificationIcon: { marginRight: 12, marginTop: 2 },
    notificationContent: { flex: 1 },
    deleteButton: { padding: 4, marginLeft: 8 },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
        marginTop: 6,
    },
});

export default NotificationHistoryScreen;