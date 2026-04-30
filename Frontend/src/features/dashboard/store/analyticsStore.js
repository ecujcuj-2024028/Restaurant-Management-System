import { create } from 'zustand'
import { getChartData, getStatsAdmin } from '../../../shared/api/analytics'

const useAnalyticsStore = create((set) => ({
  chartData: [],
  globalStats: null,
  loading: false,
  error: null,

  fetchChartData: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const data = await getChartData(params)
      // Formatear nombres de fecha para que se vean mejor (ej: 2024-04-29 -> 29 Abr)
      const formattedData = data.map(item => {
        const date = new Date(item.name)
        return {
          ...item,
          name: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        }
      })
      set({ chartData: formattedData, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  fetchGlobalStats: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getStatsAdmin()
      set({ globalStats: data, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  }
}))

export default useAnalyticsStore
