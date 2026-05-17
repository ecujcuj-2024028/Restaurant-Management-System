import api from './api'

export const getProfile = () => api.get('/users/profile')
export const updateProfile = (data) => api.put('/users/profile', data)
export const updateProfilePicture = (data) =>
  api.patch('/users/profile/picture', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const updatePassword = (data) => api.patch('/users/profile/password', data)
export const requestRoleUpgrade = (requestedRole) => api.post('/auth/role-upgrade', { requestedRole })
export const getUsers = (params = {}) => api.get('/users', { params })
export const getRoleRequests = (params = {}) =>
  api.get('/auth/role-requests', { params })
export const approveRoleRequest = (id) =>
  api.patch(`/auth/role-requests/${id}/approve`)
export const rejectRoleRequest = (id) =>
  api.patch(`/auth/role-requests/${id}/reject`)