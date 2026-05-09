import api from './api'

const INVENTORY_ENDPOINT = '/inventory'

const toNumber = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return fallback

  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const buildCreatePayload = (data = {}) => ({
  restaurantId: data.restaurantId || data.RestaurantId,
  mongoProductId: data.mongoProductId || data.MongoProductId || null,
  name: data.name || data.Name,
  quantity: toNumber(data.quantity ?? data.Quantity, 0),
  unit: data.unit || data.Unit || 'unidades',
  costPerUnit: toNumber(data.costPerUnit ?? data.CostPerUnit ?? data.cost, 0),
  minStock: toNumber(data.minStock ?? data.MinStock, 5),
})

const buildUpdatePayload = (data = {}) => ({
  name: data.name || data.Name,
  quantity: toNumber(data.quantity ?? data.Quantity, 0),
  unit: data.unit || data.Unit || 'unidades',
  costPerUnit: toNumber(data.costPerUnit ?? data.CostPerUnit ?? data.cost, 0),
  minStock: toNumber(data.minStock ?? data.MinStock, 5),
})

export const getInventoryByRestaurant = (restaurantId, params = {}) => {
  return api.get(`${INVENTORY_ENDPOINT}/${restaurantId}`, { params })
}

export const getLowStockInventoryByRestaurant = (restaurantId) => {
  return api.get(`${INVENTORY_ENDPOINT}/${restaurantId}`, {
    params: { lowStock: true },
  })
}

export const createInventoryItem = (data) => {
  return api.post(INVENTORY_ENDPOINT, buildCreatePayload(data))
}

export const updateInventoryItem = (id, data) => {
  return api.put(`${INVENTORY_ENDPOINT}/${id}`, buildUpdatePayload(data))
}

export const updateInventoryQuantity = (id, data) => {
  return api.patch(`${INVENTORY_ENDPOINT}/${id}/quantity`, {
    quantity: toNumber(data.quantity, 0),
    operation: data.operation || 'set',
  })
}

export const deleteInventoryItem = (id) => {
  return api.delete(`${INVENTORY_ENDPOINT}/${id}`)
}