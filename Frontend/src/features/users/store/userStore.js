import { create } from 'zustand'
import { getProfile, updateProfile } from '../../../shared/api/users'

const useUserStore = create((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null })
    try {
      const response = await getProfile()
      // Extraemos .user de la respuesta según tu Postman
      set({ profile: response.data.user, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  updateProfile: async (data) => {
    set({ loading: true })
    try {
      const response = await updateProfile(data)
      // Extraemos .user para mantener consistencia en el estado
      set({ profile: response.data.user, loading: false })
      return response.data.user
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateProfilePicture: async (formData) => {
    set({ loading: true })
    try {
      const response = await updateProfilePicture(formData)
      // Extraemos .user para mantener consistencia en el estado
      set({ profile: response.data.user, loading: false })
      return response.data.user
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
}))

export default useUserStore