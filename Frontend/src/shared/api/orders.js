import api from './api'

const ORDER_ENDPOINT = '/orders'

export const getOrders = (restaurantId) =>
  api.get(ORDER_ENDPOINT, { params: { restaurantId } })

export const getOrderHistory = (params = {}) =>
  api.get(`${ORDER_ENDPOINT}/history`, { params })

export const createOrder = (data) =>
  api.post(ORDER_ENDPOINT, data)

export const updateOrderStatus = (id, status) =>
  api.patch(`${ORDER_ENDPOINT}/${id}/status`, { status })

export const cancelOrder = (id) =>
  api.patch(`${ORDER_ENDPOINT}/${id}/cancel`)

export const getInvoice = (id) =>
  api.get(`${ORDER_ENDPOINT}/${id}/invoice`)