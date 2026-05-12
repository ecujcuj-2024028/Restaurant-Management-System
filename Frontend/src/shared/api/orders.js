import api from './api'

const ORDERS_ENDPOINT = '/orders'

export const getOrders = (restaurantId) =>
  api.get(ORDERS_ENDPOINT, { params: { restaurantId } })

export const getOrderHistory = () =>
  api.get(`${ORDERS_ENDPOINT}/history`)

export const createOrder = (data) =>
  api.post(ORDERS_ENDPOINT, data)

export const updateOrderStatus = (id, status) =>
  api.patch(`${ORDERS_ENDPOINT}/${id}/status`, { status })

export const cancelOrder = (id) =>
  api.patch(`${ORDERS_ENDPOINT}/${id}/cancel`)

export const getInvoice = (id) =>
  api.get(`${ORDERS_ENDPOINT}/${id}/invoice`)