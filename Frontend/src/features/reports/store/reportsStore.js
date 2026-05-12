import { create } from 'zustand'
import {
  exportReportsExcel,
  exportReportsPdf,
  getReportsData,
} from '../../../shared/api/reports'

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrió un error al procesar los reportes'
  )
}

const getChartsFromResponse = (response) => {
  return response?.data?.charts || {}
}

const getVentasPorDiaFormateadas = (ventasPorDia = []) => {
  return ventasPorDia.map((venta) => ({
    ...venta,
    fecha: venta.fecha,
    ventas: Number(venta.ventas || 0),
    pedidos: Number(venta.pedidos || 0),
    ticketPromedio: Number(venta.ticketPromedio || 0),
  }))
}

const getTopProductosFormateados = (topProductos = []) => {
  return topProductos.map((producto) => ({
    ...producto,
    cantidadVendida: Number(producto.cantidadVendida || 0),
    ingresos: Number(producto.ingresos || 0),
  }))
}

const useReportsStore = create((set, get) => ({
  resumen: {
    totalIngresos: 0,
    totalPedidos: 0,
    ticketPromedio: 0,
  },
  ventasPorDia: [],
  topProductos: [],
  estadosPedidos: [],
  inventarioBajo: 0,
  filtros: {
    restaurantId: '',
    startDate: '',
    endDate: '',
  },
  loading: false,
  exporting: false,
  error: null,

  setFiltros: (filtros) => {
    set((state) => ({
      filtros: {
        ...state.filtros,
        ...filtros,
      },
    }))
  },

  fetchReportsData: async (params = {}) => {
    set({ loading: true, error: null })

    try {
      const filtrosActuales = get().filtros
      const filtrosConsulta = {
        ...filtrosActuales,
        ...params,
      }

      const response = await getReportsData(filtrosConsulta)
      const charts = getChartsFromResponse(response)

      set({
        resumen: {
          totalIngresos: Number(charts.resumen?.totalIngresos || 0),
          totalPedidos: Number(charts.resumen?.totalPedidos || 0),
          ticketPromedio: Number(charts.resumen?.ticketPromedio || 0),
        },
        ventasPorDia: getVentasPorDiaFormateadas(charts.ventasPorDia),
        topProductos: getTopProductosFormateados(charts.topProductos),
        estadosPedidos: charts.estadosPedidos || [],
        inventarioBajo: Number(charts.inventarioBajo || 0),
        filtros: filtrosConsulta,
        loading: false,
      })

      return charts
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  exportPdf: async (params = {}) => {
    set({ exporting: true, error: null })

    try {
      const filtrosConsulta = {
        ...get().filtros,
        ...params,
      }

      await exportReportsPdf(filtrosConsulta)

      set({ exporting: false })
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        exporting: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  exportExcel: async (params = {}) => {
    set({ exporting: true, error: null })

    try {
      const filtrosConsulta = {
        ...get().filtros,
        ...params,
      }

      await exportReportsExcel(filtrosConsulta)

      set({ exporting: false })
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        exporting: false,
      })

      throw new Error(message, { cause: error })
    }
  },

  clearReportsError: () => {
    set({ error: null })
  },
}))

export default useReportsStore