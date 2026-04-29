import api from './api'

export const getProfile = () => api.get('/users/profile')
export const updateProfile = (data) => api.put('/users/profile', data)
export const updateProfilePicture = (data) => api.patch('/users/profile/picture', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})