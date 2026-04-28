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
      set({ profile: response.data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  updateProfile: async (data) => {
    set({ loading: true })
    try {
      const response = await updateProfile(data)
      set({ profile: response.data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },
}))

export default useUserStore