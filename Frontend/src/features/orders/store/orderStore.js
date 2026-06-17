import { create } from 'zustand'
import {
  getOrders,
  getOrderHistory,
  createOrder as createOrderApi,
  updateOrderStatus as updateOrderStatusApi,
  cancelOrder as cancelOrderApi,
} from '../../../shared/api/orders'

const useOrderStore = create((set) => ({
  orders: [],
  history: [],
  loading: false,
  error: null,

  fetchOrders: async (restaurantId) => {
  set({ loading: true, error: null })
  try {
    const response = await getOrders(restaurantId)
    set({ orders: response.data?.orders || [], loading: false })
  } catch (error) {
    set({ loading: false, error: error?.response?.data?.message || error.message })
  }
},

  fetchOrderHistory: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await getOrderHistory(params)
      set({ history: response.data?.orders || [], loading: false })
    } catch (error) {
      set({ loading: false, error: error?.response?.data?.message || error.message })
    }
  },

  createOrder: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await createOrderApi(data)
      const newOrder = response.data?.order
      set((state) => ({ orders: [newOrder, ...state.orders], loading: false }))
      return newOrder
    } catch (error) {
      set({ loading: false, error: error?.response?.data?.message || error.message })
      throw error
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const response = await updateOrderStatusApi(id, status)
      const updatedOrder = response.data?.order
      set((state) => ({
        orders: state.orders.map((o) =>
          (o._id || o.id) === id ? updatedOrder : o
        ),
      }))
      return updatedOrder
    } catch (error) {
      throw error
    }
  },

  cancelOrder: async (id) => {
    try {
      await cancelOrderApi(id)
      set((state) => ({
        orders: state.orders.map((o) =>
          (o._id || o.id) === id ? { ...o, status: 'cancelado' } : o
        ),
      }))
    } catch (error) {
      throw error
    }
  },

  // Handlers para WebSockets
  handleSocketUpdate: (updatedOrder) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        (o._id || o.id) === (updatedOrder._id || updatedOrder.id) ? updatedOrder : o
      ),
    }))
  },

  handleSocketNewOrder: (newOrder) => {
    set((state) => ({
      orders: [newOrder, ...state.orders]
    }))
  },

  handleSocketHistoryUpdate: (updatedOrder) => {
    set((state) => ({
      history: state.history.map((o) =>
        (o._id || o.id) === (updatedOrder._id || updatedOrder.id) ? updatedOrder : o
      ),
    }))
  },
}))

export default useOrderStore