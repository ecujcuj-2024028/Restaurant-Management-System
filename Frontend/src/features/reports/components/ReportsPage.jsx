import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useReportsStore from '../store/reportsStore'
import Skeleton from '../../../shared/components/ui/Skeleton'

const tabs = [
  {
    id: 'ventas',
    label: 'Ventas',
    icon: BarChart3,
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: Package,
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: Users,
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const getRestaurantId = (restaurant) => restaurant?._id || restaurant?.id

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  })
}

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('es-GT')
}

const formatDateLabel = (date) => {
  if (!date) return 'Sin fecha'

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) return date

  return parsedDate.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  const currentValue = payload[0]?.value || 0

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-white text-sm font-bold">
        {formatCurrency(currentValue)}
      </p>
    </div>
  )
}

const ReportsPage = () => {
  const { user } = useAuthStore()
  const {
  restaurants,
  fetchRestaurants,
} = useRestaurantStore()

  const {
    resumen,
    ventasPorDia,
    topProductos,
    estadosPedidos,
    inventarioBajo,
    filtros,
    loading,
    exporting,
    error,
    setFiltros,
    fetchReportsData,
    exportPdf,
    exportExcel,
    clearReportsError,
  } = useReportsStore()

  const [activeTab, setActiveTab] = useState('ventas')

  const isAdminSistema = user?.roles?.includes('ADMIN_SISTEMA')

  const ventasGrafica = useMemo(() => {
    return ventasPorDia.map((venta) => ({
      ...venta,
      dia: formatDateLabel(venta.fecha),
    }))
  }, [ventasPorDia])

  const restauranteSeleccionado = useMemo(() => {
    return restaurants.find((restaurant) => getRestaurantId(restaurant) === filtros.restaurantId)
  }, [restaurants, filtros.restaurantId])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
  if (isAdminSistema) return
  if (filtros.restaurantId) return
  if (restaurants.length === 0) return

  setFiltros({
    restaurantId: getRestaurantId(restaurants[0]),
  })
}, [isAdminSistema, restaurants, filtros.restaurantId, setFiltros])

  useEffect(() => {
    const canFetchReports = isAdminSistema || filtros.restaurantId

    if (!canFetchReports) return

    fetchReportsData()
  }, [
    isAdminSistema,
    filtros.restaurantId,
    filtros.startDate,
    filtros.endDate,
    fetchReportsData,
  ])

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    clearReportsError()
    setFiltros({
      [name]: value,
    })
  }

  const handleRefresh = async () => {
    try {
      await fetchReportsData()
      toast.success('Reportes actualizados correctamente')
    } catch (refreshError) {
      toast.error(refreshError.message)
    }
  }

  const handleExportPdf = async () => {
    try {
      await exportPdf()
      toast.success('Reporte PDF generado correctamente')
    } catch (exportError) {
      toast.error(exportError.message)
    }
  }

  const handleExportExcel = async () => {
    try {
      await exportExcel()
      toast.success('Reporte Excel generado correctamente')
    } catch (exportError) {
      toast.error(exportError.message)
    }
  }

  const renderResumenCards = () => {
    const cards = [
      {
        label: 'Ingresos totales',
        value: formatCurrency(resumen.totalIngresos),
        icon: TrendingUp,
      },
      {
        label: 'Pedidos totales',
        value: formatNumber(resumen.totalPedidos),
        icon: ShoppingCart,
      },
      {
        label: 'Ticket promedio',
        value: formatCurrency(resumen.ticketPromedio),
        icon: BarChart3,
      },
      {
        label: 'Inventario bajo',
        value: formatNumber(inventarioBajo),
        icon: Package,
      },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            variants={cardVariants}
            className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6"
          >
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="w-28 h-7" />
                <Skeleton className="w-24 h-4" />
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-5">
                  <card.icon size={24} />
                </div>
                <p className="text-2xl font-black text-white mb-1">
                  {card.value}
                </p>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  {card.label}
                </p>
              </>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  const renderVentasTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-zinc-900/60 border border-white/5 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-black text-white">
              Ventas por día
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Gráfica de barras basada en el endpoint de reportes.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
            <CalendarDays size={16} />
            {filtros.startDate || 'Inicio'} — {filtros.endDate || 'Hoy'}
          </div>
        </div>

        <div className="h-85">
          {loading ? (
            <Skeleton className="w-full h-full rounded-2xl" />
          ) : ventasGrafica.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasGrafica}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="dia"
                  stroke="#71717a"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `Q${Number(value).toLocaleString('es-GT')}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="ventas"
                  name="Ventas"
                  fill="#f97316"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
              <BarChart3 size={42} className="mb-3 opacity-30" />
              <p className="font-medium">
                No hay ventas para mostrar con los filtros actuales.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6">
        <h2 className="text-xl font-black text-white mb-1">
          Top productos
        </h2>
        <p className="text-zinc-500 text-sm mb-6">
          Productos con mayor cantidad vendida.
        </p>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-14 rounded-2xl" />
            <Skeleton className="w-full h-14 rounded-2xl" />
            <Skeleton className="w-full h-14 rounded-2xl" />
          </div>
        ) : topProductos.length > 0 ? (
          <div className="space-y-3">
            {topProductos.slice(0, 6).map((producto, index) => (
              <div
                key={`${producto.nombre}-${index}`}
                className="flex items-center justify-between gap-4 bg-zinc-950/50 border border-white/5 rounded-2xl p-4"
              >
                <div>
                  <p className="text-white text-sm font-bold">
                    {producto.nombre || 'Producto sin nombre'}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {formatNumber(producto.cantidadVendida)} unidades
                  </p>
                </div>

                <p className="text-orange-400 text-sm font-black whitespace-nowrap">
                  {formatCurrency(producto.ingresos)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-zinc-500 text-sm bg-zinc-950/50 border border-white/5 rounded-2xl p-5 text-center">
            No hay productos vendidos en el período seleccionado.
          </div>
        )}
      </div>
    </div>
  )

  const renderInventarioTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
          <AlertCircle size={28} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          Inventario bajo
        </h2>

        <p className="text-zinc-500 text-sm leading-relaxed mb-8">
          El backend de reportes devuelve el total de insumos en bajo stock para
          el restaurante seleccionado.
        </p>

        {loading ? (
          <Skeleton className="w-32 h-12 rounded-2xl" />
        ) : (
          <p className="text-5xl font-black text-white">
            {formatNumber(inventarioBajo)}
          </p>
        )}
      </div>

      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
          <Package size={28} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          Lectura operativa
        </h2>

        <p className="text-zinc-500 text-sm leading-relaxed">
          Si el indicador es mayor a cero, conviene revisar el módulo de inventario
          para identificar los insumos específicos que están por debajo del mínimo.
          Actualmente el endpoint de reportes expone el conteo general, no el
          detalle de cada insumo.
        </p>
      </div>
    </div>
  )

  const renderClientesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
          <Users size={28} />
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          Clientes
        </h2>

        <p className="text-zinc-500 text-sm leading-relaxed">
          Esta pestaña queda preparada para métricas de clientes. El endpoint
          actual de reportes no devuelve todavía clientes frecuentes, clientes
          nuevos o clientes recurrentes.
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-8">
        <h2 className="text-xl font-black text-white mb-6">
          Estados de pedidos
        </h2>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-12 rounded-2xl" />
            <Skeleton className="w-full h-12 rounded-2xl" />
            <Skeleton className="w-full h-12 rounded-2xl" />
          </div>
        ) : estadosPedidos.length > 0 ? (
          <div className="space-y-3">
            {estadosPedidos.map((estado) => (
              <div
                key={estado.estado || 'sin-estado'}
                className="flex items-center justify-between bg-zinc-950/50 border border-white/5 rounded-2xl p-4"
              >
                <span className="text-white text-sm font-bold capitalize">
                  {estado.estado || 'Sin estado'}
                </span>
                <span className="text-orange-400 text-sm font-black">
                  {formatNumber(estado.total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-zinc-500 text-sm bg-zinc-950/50 border border-white/5 rounded-2xl p-5 text-center">
            No hay estados de pedidos para mostrar.
          </div>
        )}
      </div>
    </div>
  )

  const renderActiveTab = () => {
    if (activeTab === 'inventario') return renderInventarioTab()
    if (activeTab === 'clientes') return renderClientesTab()

    return renderVentasTab()
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <motion.h1
            variants={cardVariants}
            className="text-3xl font-black text-white mb-2"
          >
            Reportes
          </motion.h1>
          <motion.p
            variants={cardVariants}
            className="text-zinc-500 text-sm"
          >
            Analiza ventas, inventario y comportamiento operativo del restaurante.
          </motion.p>
        </div>

        <motion.div
          variants={cardVariants}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white px-5 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            PDF
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white px-5 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </motion.div>
      </div>

      <motion.div
        variants={cardVariants}
        className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">
              Restaurante
            </label>
            <select
              name="restaurantId"
              value={filtros.restaurantId}
              onChange={handleFilterChange}
              disabled={!isAdminSistema && restaurants.length <= 1}
              className="w-full bg-zinc-950 border border-white/5 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer disabled:opacity-60"
            >
              {isAdminSistema && (
                <option value="">Todos los restaurantes</option>
              )}

              {restaurants.map((restaurant) => (
                <option
                  key={getRestaurantId(restaurant)}
                  value={getRestaurantId(restaurant)}
                  className="bg-zinc-950"
                >
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">
              Fecha inicial
            </label>
            <input
              type="date"
              name="startDate"
              value={filtros.startDate}
              onChange={handleFilterChange}
              className="w-full bg-zinc-950 border border-white/5 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">
              Fecha final
            </label>
            <input
              type="date"
              name="endDate"
              value={filtros.endDate}
              onChange={handleFilterChange}
              className="w-full bg-zinc-950 border border-white/5 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
        </div>

        {restauranteSeleccionado && (
          <p className="text-zinc-500 text-xs mt-4">
            Restaurante seleccionado:{' '}
            <span className="text-zinc-300 font-bold">
              {restauranteSeleccionado.name}
            </span>
          </p>
        )}
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl text-center">
          {error}
        </div>
      )}

      {renderResumenCards()}

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderActiveTab()}
    </motion.div>
  )
}

export default ReportsPage