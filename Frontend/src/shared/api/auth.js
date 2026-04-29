import api from './api'

export const login = (data) => api.post('/auth/login', data)
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const verifyEmail = (token) => api.post('/auth/verify-email', { token })
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, newPassword })