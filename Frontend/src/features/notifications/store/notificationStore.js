import { create } from 'zustand'
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../../shared/api/notifications'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (restaurantId = null) => {
    set({ loading: true, error: null })
    try {
      const params = {}
      if (restaurantId) params.restaurantId = restaurantId
      
      const response = await getNotifications(false, params)
      set({
        notifications: response.data?.notifications || [],
        unreadCount: response.data?.unreadCount || 0,
        loading: false,
      })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  markAsRead: async (id) => {
    try {
      await markNotificationAsRead(id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },

  markAllRead: async () => {
    try {
      await markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  },

  removeNotification: async (id) => {
    try {
      await deleteNotification(id)
      const notification = get().notifications.find((n) => n._id === id)
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
        unreadCount:
          notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
      }))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  },

  // Handler para WebSockets
  handleSocketNewNotification: (notification) => {
    set((state) => {
      // Evitar duplicados
      if (state.notifications.some(n => n._id === notification._id)) return state;
      
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }
    })
  }
}))

export default useNotificationStore
