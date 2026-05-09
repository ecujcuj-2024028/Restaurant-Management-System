import { create } from 'zustand'
import {
  getInventoryByRestaurant,
  createInventoryItem as createInventoryItemRequest,
  updateInventoryItem as updateInventoryItemRequest,
  updateInventoryQuantity as updateInventoryQuantityRequest,
  deleteInventoryItem as deleteInventoryItemRequest,
} from '../../../shared/api/inventory'

const getInventoryItemId = (item) => item?.Id || item?.id || item?._id

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrió un error al procesar la solicitud'
  )
}

const useInventoryStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  selectedRestaurantId: '',

  setSelectedRestaurant: (id) => {
    set({
      selectedRestaurantId: id,
      items: [],
      error: null,
    })
  },

  fetchInventory: async (restaurantId, params = {}) => {
    if (!restaurantId) {
      set({
        items: [],
        loading: false,
        error: null,
      })
      return
    }

    set({ loading: true, error: null })

    try {
      const response = await getInventoryByRestaurant(restaurantId, params)

      set({
        items: response.data?.items || [],
        loading: false,
      })
    } catch (error) {
      set({
        error: getErrorMessage(error),
        items: [],
        loading: false,
      })
    }
  },

  createInventoryItem: async (data) => {
    set({ loading: true, error: null })

    try {
      const response = await createInventoryItemRequest(data)
      const newItem = response.data?.item

      set((state) => ({
        items:
          newItem && String(state.selectedRestaurantId) === String(data.restaurantId)
            ? [...state.items, newItem]
            : state.items,
        loading: false,
      }))

      return newItem
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  updateInventoryItem: async (id, data) => {
    set({ loading: true, error: null })

    try {
      const response = await updateInventoryItemRequest(id, data)
      const updatedItem = response.data?.item

      set((state) => ({
        items: state.items.map((item) =>
          String(getInventoryItemId(item)) === String(id)
            ? { ...item, ...updatedItem }
            : item
        ),
        loading: false,
      }))

      return updatedItem
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  updateInventoryQuantity: async (id, data) => {
    set({ loading: true, error: null })

    try {
      const response = await updateInventoryQuantityRequest(id, data)
      const updatedItem = response.data?.item

      set((state) => ({
        items: state.items.map((item) =>
          String(getInventoryItemId(item)) === String(id)
            ? { ...item, ...updatedItem }
            : item
        ),
        loading: false,
      }))

      return updatedItem
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  deleteInventoryItem: async (id) => {
    set({ loading: true, error: null })

    try {
      await deleteInventoryItemRequest(id)

      set((state) => ({
        items: state.items.filter(
          (item) => String(getInventoryItemId(item)) !== String(id)
        ),
        loading: false,
      }))
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  refreshSelectedInventory: async () => {
    const restaurantId = get().selectedRestaurantId
    await get().fetchInventory(restaurantId)
  },

  clearInventoryError: () => {
    set({ error: null })
  },
}))

export default useInventoryStore