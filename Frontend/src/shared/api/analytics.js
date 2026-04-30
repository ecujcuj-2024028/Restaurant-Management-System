import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/restaurantManagement/v1'

const analyticsApi = axios.create({
  baseURL: `${API_URL}/analytics`,
})

analyticsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getChartData = async (params = {}) => {
  const { data } = await analyticsApi.get('/chart-data', { params })
  return data.data || []
}

export const getStatsAdmin = async () => {
  const { data } = await analyticsApi.get('/stats')
  return data.data || {}
}

export default analyticsApi
