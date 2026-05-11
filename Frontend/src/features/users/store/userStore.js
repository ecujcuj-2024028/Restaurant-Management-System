import { create } from 'zustand'
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
  getUsers,
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from '../../../shared/api/users'
import useAuthStore from '../../auth/store/authStore'

const useUserStore = create((set, get) => ({
  // ── Perfil del usuario autenticado ─────────────────────────────────────────
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
      useAuthStore.getState().user = userData
      return userData
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  // ── Lista de todos los usuarios (ADMIN_SISTEMA) ─────────────────────────────
  users: [],
  usersLoading: false,
  usersError: null,

  fetchUsers: async (params = {}) => {
    set({ usersLoading: true, usersError: null })
    try {
      const response = await getUsers(params)
      // La API puede devolver { users } o { data } según el backend
      const users = response.data.users ?? response.data ?? []
      set({ users, usersLoading: false })
    } catch (error) {
      set({ usersError: error.message, usersLoading: false })
    }
  },

  // ── Solicitudes de cambio de rol (ADMIN_SISTEMA) ────────────────────────────
  roleRequests: [],
  roleRequestsLoading: false,
  roleRequestsError: null,

  fetchRoleRequests: async (params = {}) => {
    set({ roleRequestsLoading: true, roleRequestsError: null })
    try {
      const response = await getRoleRequests(params)
      const requests = response.data.requests ?? response.data ?? []
      set({ roleRequests: requests, roleRequestsLoading: false })
    } catch (error) {
      set({ roleRequestsError: error.message, roleRequestsLoading: false })
    }
  },

  approveRequest: async (id) => {
    try {
      await approveRoleRequest(id)
      // Actualizar el estado de la solicitud localmente para evitar refetch
      set((state) => ({
        roleRequests: state.roleRequests.map((r) =>
          r.Id === id ? { ...r, Status: 'APPROVED' } : r
        ),
      }))
    } catch (error) {
      throw error
    }
  },

  rejectRequest: async (id) => {
    try {
      await rejectRoleRequest(id)
      set((state) => ({
        roleRequests: state.roleRequests.map((r) =>
          r.Id === id ? { ...r, Status: 'REJECTED' } : r
        ),
      }))
    } catch (error) {
      throw error
    }
  },
}))

export default useUserStore