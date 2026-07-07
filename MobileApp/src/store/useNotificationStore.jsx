import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },

    markAsRead: (id) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
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