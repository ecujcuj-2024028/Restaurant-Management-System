import { create } from 'zustand'
import { createReview, getReviewsByProduct } from '../../../shared/api/reviews'

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  'Ocurrió un error al procesar la reseña'

const useReviewStore = create((set, get) => ({
  // Reviews por platoId cacheadas: { [platoId]: { reviews, promedioRating, totalReviews } }
  reviewsByProduct: {},
  submitting: false,
  error: null,

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

      return nuevaReview
    } catch (error) {
      const message = getErrorMessage(error)
      set({ submitting: false, error: message })
      throw new Error(message)
    }
  },

  clearError: () => set({ error: null }),
}))

export default useReviewStore