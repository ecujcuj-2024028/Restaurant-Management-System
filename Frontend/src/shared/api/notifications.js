import api from './api'

const NOTIFICATIONS_ENDPOINT = '/notifications'

export const getNotifications = (unreadOnly = false, additionalParams = {}) =>
  api.get(NOTIFICATIONS_ENDPOINT, { 
    params: { unreadOnly, ...additionalParams } 
  })

export const markNotificationAsRead = (id) =>
  api.patch(`${NOTIFICATIONS_ENDPOINT}/${id}/read`)

export const markAllAsRead = () =>
  api.patch(`${NOTIFICATIONS_ENDPOINT}/mark-all-read`)

export const deleteNotification = (id) =>
  api.delete(`${NOTIFICATIONS_ENDPOINT}/${id}`)
