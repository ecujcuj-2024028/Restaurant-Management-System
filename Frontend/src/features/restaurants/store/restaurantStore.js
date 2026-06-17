import { create } from 'zustand'
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant } from '../../../shared/api/restaurants'
import { getReviewsByRestaurant } from '../../../shared/api/reviews'

const useRestaurantStore = create((set) => ({
  restaurants: [],
  loading: false,
  error: null,

  fetchRestaurants: async () => {
    set({ loading: true, error: null })
    try {
      const response = await getRestaurants()
      const restaurantList = response.data.restaurants

      // Obtener reseñas para cada restaurante
      const restaurantsWithStats = await Promise.all(
        restaurantList.map(async (res) => {
          try {
            const statsRes = await getReviewsByRestaurant(res._id || res.id)
            return {
              ...res,
              rating: statsRes.data?.data?.promedioRating || 0,
              totalReviews: statsRes.data?.data?.totalReviews || 0
            }
          } catch (err) {
            console.error(`Error loading stats for ${res.name}:`, err.message)
            return { ...res, rating: 0, totalReviews: 0 }
          }
        })
      )

      set({ restaurants: restaurantsWithStats, loading: false })
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
    const updatedRestaurant = response.data.restaurant
    set((state) => ({
      restaurants: state.restaurants.map((r) => 
        (r.id === id || r._id === id) ? updatedRestaurant : r
      ),
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