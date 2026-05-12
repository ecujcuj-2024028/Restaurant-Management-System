import { create } from 'zustand'
import {
    getExternalOrders,
    createExternalOrder as createOrderRequest,
    updateExternalOrderStatus as updateStatusRequest,
    deleteExternalOrder as deleteOrderRequest,
} from '../../../shared/api/externalOrders'

const getErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Ocurrió un error al procesar el pedido externo'
    )
}

const useExternalOrderStore = create((set, get) => ({
    orders: [],
    loading: false,
    error: null,

    fetchOrders: async (params = {}) => {
        set({ loading: true, error: null })
        try {
            const response = await getExternalOrders(params)
            set({
                orders: response.data?.orders || [],
                loading: false,
            })
        } catch (error) {
            set({
                error: getErrorMessage(error),
                loading: false,
            })
        }
    },

    createOrder: async (data) => {
        set({ loading: true, error: null })
        try {
            const response = await createOrderRequest(data)
            const newOrder = response.data?.order
            
            set((state) => ({
                orders: newOrder ? [newOrder, ...state.orders] : state.orders,
                loading: false,
            }))
            return newOrder
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    updateOrderStatus: async (id, status) => {
        try {
            const response = await updateStatusRequest(id, status)
            const updatedOrder = response.data?.order

            set((state) => ({
                orders: state.orders.map((o) => 
                    (o._id || o.id) === id ? { ...o, ...updatedOrder, status } : o
                ),
            }))
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message })
            throw new Error(message)
        }
    },

    deleteOrder: async (id) => {
        set({ loading: true, error: null })
        try {
            await deleteOrderRequest(id)
            set((state) => ({
                orders: state.orders.filter((o) => (o._id || o.id) !== id),
                loading: false,
            }))
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    clearError: () => set({ error: null }),
}))

export default useExternalOrderStore
