import { create } from 'zustand'
import { getProfile, updateProfile, updateProfilePicture } from '../../../shared/api/users'
import useAuthStore from '../../auth/store/authStore'

const useUserStore = create((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null })
    try {
      const response = await getProfile()
      const userData = response.data.user
      set({ profile: userData, loading: false })
      // Sincronizar con authStore
      useAuthStore.getState().user = userData
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  updateProfile: async (data) => {
    set({ loading: true })
    try {
      const response = await updateProfile(data)
      const userData = response.data.user
      set({ profile: userData, loading: false })
      // Sincronizar con authStore
      useAuthStore.getState().user = userData
      return userData
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateProfilePicture: async (formData) => {
    set({ loading: true })
    try {
      const response = await updateProfilePicture(formData)
      const userData = response.data.user
      set({ profile: userData, loading: false })
      // Sincronizar con authStore
      useAuthStore.getState().user = userData
      return userData
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
}))

export default useUserStore