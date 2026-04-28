import { create } from 'zustand'
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant } from '../../../shared/api/restaurants'

const useRestaurantStore = create((set) => ({
  restaurants: [],
  loading: false,
  error: null,

  fetchRestaurants: async () => {
    set({ loading: true, error: null })
    try {
      const response = await getRestaurants()
      set({ restaurants: response.data.restaurants, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  createRestaurant: async (data) => {
    const response = await createRestaurant(data)
    set((state) => ({ restaurants: [...state.restaurants, response.data.restaurant] }))
  },

  updateRestaurant: async (id, data) => {
    const response = await updateRestaurant(id, data)
    set((state) => ({
      restaurants: state.restaurants.map((r) => (r.id === id ? response.data.restaurant : r)),
    }))
  },

  deleteRestaurant: async (id) => {
    await deleteRestaurant(id)
    set((state) => ({
      restaurants: state.restaurants.filter((r) => r.id !== id),
    }))
  },
}))

export default useRestaurantStore