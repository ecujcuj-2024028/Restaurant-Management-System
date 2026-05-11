import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../../../shared/api/api'
import { registerUser, forgotPassword, verifyEmail, resetPassword } from '../../../shared/api/auth'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      register: async (data) => {
        await registerUser(data)
      },

      login: async (email, password) => {
      const response = await api.post('/auth/login', { emailOrUsername: email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      set({ user, token, isAuthenticated: true })
      return user
    },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      forgotPassword: async (email) => {
        await forgotPassword(email)
      },

      verifyEmail: async (token) => {
        await verifyEmail(token)
      },

      resetPassword: async (token, newPassword) => {
        await resetPassword(token, newPassword)
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore