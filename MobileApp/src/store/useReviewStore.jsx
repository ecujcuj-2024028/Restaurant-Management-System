import { create } from 'zustand';
import { getRestaurantStats } from '../api/reviews';

const useReviewStore = create((set, get) => ({
  restaurantStats: {}, // { [restaurantId]: { promedioRating, totalReviews } }
  productStats: {},    // { [productId]: { promedioRating, totalReviews } }
  isLoading: false,

  fetchRestaurantStats: async (restaurantId) => {
    // Si ya tenemos las stats, no volvemos a pedir (opcional, depende de si queremos fresh data)
    if (get().restaurantStats[restaurantId]) return;

    try {
      const response = await getRestaurantStats(restaurantId);
      const data = response.data;

      set((state) => ({
        restaurantStats: {
          ...state.restaurantStats,
          [restaurantId]: {
            promedioRating: data?.promedioRating || 0,
            totalReviews: data?.totalReviews || 0,
          }
        },
        // También aprovechamos si vienen stats de productos
        productStats: {
          ...state.productStats,
          ...(data?.products || []).reduce((acc, p) => {
            acc[p.platoId] = {
              promedioRating: p.promedioRating,
              totalReviews: p.totalReviews
            };
            return acc;
          }, {})
        }
      }));
    } catch (error) {
      console.error(`Error fetching stats for restaurant ${restaurantId}:`, error);
    }
  },

  clearCache: () => set({ restaurantStats: {}, productStats: {} })
}));

export default useReviewStore;
