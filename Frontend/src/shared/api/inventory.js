import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/restaurantManagement/v1'

const inventoryApi = axios.create({
  baseURL: `${API_URL}/inventory`,
})

inventoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getInventoryByRestaurant = async (restaurantId) => {
  const { data } = await inventoryApi.get(`/${restaurantId}`)
  return data.items || []
}

export const createInventoryItem = async (inventoryData) => {
  const payload = {
    name: inventoryData.name,
    restaurantId: inventoryData.restaurantId,
    quantity: Number(inventoryData.quantity),
    minStock: Number(inventoryData.minStock),
    costPerUnit: Number(inventoryData.cost || 0),
    unit: inventoryData.unit || 'unidades'
  }
  const { data } = await inventoryApi.post('/', payload)
  return data.item || data
}

export const updateInventoryItem = async (id, inventoryData) => {
  const payload = {
    name: inventoryData.name,
    minStock: Number(inventoryData.minStock),
    costPerUnit: Number(inventoryData.cost || 0),
    unit: inventoryData.unit,
    quantity: Number(inventoryData.quantity)
  }
  const { data } = await inventoryApi.put(`/${id}`, payload)
  return data.item || data
}

export const deleteInventoryItem = async (id) => {
  const { data } = await inventoryApi.delete(`/${id}`)
  return data
}

export default inventoryApi
