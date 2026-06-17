import { create } from 'zustand'
import { createReview, getReviewsByProduct, updateReview, deleteReview } from '../../../shared/api/reviews'
import api from '../../../shared/api/api'

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  'Ocurrió un error al procesar la reseña'

const useReviewStore = create((set, get) => ({
  // Reviews por platoId cacheadas: { [platoId]: { reviews, promedioRating, totalReviews } }
  reviewsByProduct: {},
  restaurantStats: {}, // Cache: { [restaurantId]: { promedioRating, totalReviews } }
  submitting: false,
  error: null,

  fetchRestaurantStats: async (restaurantId) => {
    try {
      const response = await api.get(`/analytics/reviews/restaurant/${restaurantId}`)
      const data = response.data?.data
      
      // 1. Actualizar estadísticas generales del restaurante
      set((state) => ({
        restaurantStats: {
          ...state.restaurantStats,
          [restaurantId]: {
            promedioRating: data?.promedioRating || 0,
            totalReviews: data?.totalReviews || 0,
          }
        }
      }))

      // 2. Poblar caché de productos para mostrar estrellas en las tarjetas inmediatamente
      if (data?.products) {
        const productUpdates = {}
        data.products.forEach(p => {
          productUpdates[p.platoId] = {
            promedioRating: p.promedioRating,
            totalReviews: p.totalReviews,
            reviews: [] // Los comentarios se cargarán al abrir el modal
          }
        })

        set((state) => ({
          reviewsByProduct: {
            ...state.reviewsByProduct,
            ...productUpdates
          }
        }))
      }

    } catch (error) {
      console.error('Error fetching restaurant stats:', error)
    }
  },

  fetchReviewsByProduct: async (platoId) => {
    try {
      const response = await getReviewsByProduct(platoId)
      const data = response.data?.data
      set((state) => ({
        reviewsByProduct: {
          ...state.reviewsByProduct,
          [platoId]: {
            reviews: data?.reviews || [],
            promedioRating: data?.promedioRating || 0,
            totalReviews: data?.totalReviews || 0,
          },
        },
      }))
    } catch (error) {
      // Si falla silenciosamente, dejamos el estado vacío para ese plato
      set((state) => ({
        reviewsByProduct: {
          ...state.reviewsByProduct,
          [platoId]: { reviews: [], promedioRating: 0, totalReviews: 0 },
        },
      }))
    }
  },

  submitReview: async ({ usuarioId, restauranteId, platoId, rating, comentario }) => {
    set({ submitting: true, error: null })
    try {
      const response = await createReview({
        usuarioId,
        restauranteId,
        platoId,
        rating,
        comentario,
      })
      const nuevaReview = response.data?.data

      // Actualizar caché local del plato reseñado
      set((state) => {
        const existing = state.reviewsByProduct[platoId] || {
          reviews: [],
          promedioRating: 0,
          totalReviews: 0,
        }
        const updatedReviews = nuevaReview
          ? [nuevaReview, ...existing.reviews]
          : existing.reviews
        const total = updatedReviews.length
        const avg = total > 0
          ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) / total
          : 0

        return {
          submitting: false,
          reviewsByProduct: {
            ...state.reviewsByProduct,
            [platoId]: {
              reviews: updatedReviews,
              promedioRating: parseFloat(avg.toFixed(2)),
              totalReviews: total,
            },
          },
        }
      })

      // Actualizar stats generales del restaurante para que se refleje el cambio en el Dashboard/Grid
      get().fetchRestaurantStats(restauranteId)

      return nuevaReview
    } catch (error) {
      const message = getErrorMessage(error)
      set({ submitting: false, error: message })
      throw new Error(message)
    }
  },

  updateReview: async (reviewId, data) => {
    set({ submitting: true, error: null })
    try {
      const response = await updateReview(reviewId, data)
      const updatedReview = response.data?.data
      const platoId = updatedReview.platoId

      set((state) => {
        const existing = state.reviewsByProduct[platoId]
        if (!existing) return { submitting: false }

        const updatedReviews = existing.reviews.map(r => 
          (r._id || r.id) === reviewId ? updatedReview : r
        )
        const total = updatedReviews.length
        const avg = total > 0
          ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) / total
          : 0

        return {
          submitting: false,
          reviewsByProduct: {
            ...state.reviewsByProduct,
            [platoId]: {
              ...existing,
              reviews: updatedReviews,
              promedioRating: parseFloat(avg.toFixed(2))
            },
          },
        }
      })

      // Actualizar stats generales del restaurante
      if (updatedReview.restauranteId) {
        get().fetchRestaurantStats(updatedReview.restauranteId)
      }

      return updatedReview
    } catch (error) {
      const message = getErrorMessage(error)
      set({ submitting: false, error: message })
      throw new Error(message)
    }
  },

  deleteReview: async (reviewId, platoId) => {
    set({ submitting: true, error: null })
    try {
      // Obtener la reseña antes de borrarla para saber el restauranteId
      const state = get()
      const existing = state.reviewsByProduct[platoId]
      const reviewToDelete = existing?.reviews.find(r => (r._id || r.id) === reviewId)
      const restauranteId = reviewToDelete?.restauranteId

      await deleteReview(reviewId)

      set((state) => {
        const existing = state.reviewsByProduct[platoId]
        if (!existing) return { submitting: false }

        const updatedReviews = existing.reviews.filter(r => (r._id || r.id) !== reviewId)
        const total = updatedReviews.length
        const avg = total > 0
          ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) / total
          : 0

        return {
          submitting: false,
          reviewsByProduct: {
            ...state.reviewsByProduct,
            [platoId]: {
              ...existing,
              reviews: updatedReviews,
              promedioRating: parseFloat(avg.toFixed(2)),
              totalReviews: total
            },
          },
        }
      })

      // Actualizar stats generales del restaurante
      if (restauranteId) {
        get().fetchRestaurantStats(restauranteId)
      }
    } catch (error) {
      const message = getErrorMessage(error)
      set({ submitting: false, error: message })
      throw new Error(message)
    }
  },

  clearError: () => set({ error: null }),
}))

export default useReviewStore