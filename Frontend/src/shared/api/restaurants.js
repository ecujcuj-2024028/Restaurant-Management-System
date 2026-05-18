import api from './api'

export const getRestaurants = () => api.get('/restaurants')
export const getRestaurantById = (id) => api.get(`/restaurants/${id}`)
export const createRestaurant = (data) => api.post('/restaurants/create', data, {
  headers: { 'Content-Type': undefined }
})
export const updateRestaurant = (id, data) => api.put(`/restaurants/${id}`, data, {
  headers: { 'Content-Type': undefined }
})
export const deleteRestaurant = (id) => api.delete(`/restaurants/${id}`)