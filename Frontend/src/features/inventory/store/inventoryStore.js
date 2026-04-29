import { create } from 'zustand'
import { getInventoryByRestaurant, createInventoryItem as createItemApi, updateInventoryItem as updateItemApi, deleteInventoryItem as deleteItemApi } from '../../../shared/api/inventory'

const useInventoryStore = create((set) => ({
  items: [],
  loading: false,
  error: null,
  selectedRestaurantId: '',

  setSelectedRestaurant: (id) => set({ selectedRestaurantId: id }),

  fetchInventory: async (restaurantId) => {
    if (!restaurantId) return
    set({ loading: true, error: null })
    try {
      const items = await getInventoryByRestaurant(restaurantId)
      set({ items, loading: false })
    } catch (error) {
      set({ error: error.message, items: [], loading: false })
    }
  },

  createInventoryItem: async (data) => {
    set({ loading: true, error: null })
    try {
      const newItem = await createItemApi(data)
      set((state) => ({ 
        items: state.selectedRestaurantId === data.restaurantId ? [...state.items, newItem] : state.items, 
        loading: false 
      }))
      return newItem
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  updateInventoryItem: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updatedItem = await updateItemApi(id, data)
      set((state) => ({
        items: state.items.map((item) => {
            const itemId = item.id || item._id
            if (itemId === id) {
              // Combinamos el item viejo con el nuevo para no perder campos si el backend no los manda todos
              return { ...item, ...updatedItem }
            }
            return item
        }),
        loading: false
      }))
      return updatedItem
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  },

  deleteInventoryItem: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteItemApi(id)
      set((state) => ({
        items: state.items.filter((item) => (item.id !== id && item._id !== id)),
        loading: false
      }))
    } catch (error) {
      set({ error: error.message, loading: false })
      throw error
    }
  }
}))

export default useInventoryStore
