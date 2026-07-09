import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) => {
        const notifId = notification.id || notification._id;
        const exists = get().notifications.some(
            (n) => n.id === notifId || n._id === notifId || n.id === notification._id || n._id === notification.id
        );
        if (exists) return;

        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
        }));
    },

    markAsRead: (id) => {
        set((state) => {
            let decremented = false;
            const updated = state.notifications.map((n) => {
                if (n.id === id || n._id === id) {
                    if (!n.isRead) {
                        decremented = true;
                    }
                    return { ...n, isRead: true };
                }
                return n;
            });
            return {
                notifications: updated,
                unreadCount: decremented ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            };
        });
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
        }));
    },

    setNotifications: (notifications) => {
        const unread = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount: unread });
    },

    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

    deleteNotification: (id) => {
        set((state) => {
            const notificationToDelete = state.notifications.find((n) => n.id === id || n._id === id);
            return {
                notifications: state.notifications.filter((n) => n.id !== id && n._id !== id),
                unreadCount: notificationToDelete && !notificationToDelete.isRead 
                    ? Math.max(0, state.unreadCount - 1) 
                    : state.unreadCount,
            };
        });
    },
}));

export default useNotificationStore;