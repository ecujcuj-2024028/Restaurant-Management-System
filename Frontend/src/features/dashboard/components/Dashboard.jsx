import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useAnalyticsStore from '../store/analyticsStore'
import { getInventoryByRestaurant } from '../../../shared/api/inventory'
import { useNavigate } from 'react-router-dom'
import { 
  Utensils, 
  ShoppingCart, 
  Calendar, 
  Package, 
  BarChart3,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react'
import Skeleton from '../../../shared/components/ui/Skeleton'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const { restaurants, fetchRestaurants, loading: restaurantsLoading } = useRestaurantStore()
  const { 
    chartData, 
    fetchChartData, 
    globalStats, 
    fetchGlobalStats, 
    loading: analyticsLoading 
  } = useAnalyticsStore()

  const [lowStockItems, setLowStockItems] = useState([])
  const [loadingStock, setLoadingStock] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('sales')

  useEffect(() => {
    fetchRestaurants()
    fetchChartData()
    fetchGlobalStats()
  }, [fetchRestaurants, fetchChartData, fetchGlobalStats])

  useEffect(() => {
    const fetchDetailedLowStock = async () => {
      if (restaurants.length === 0) return

      setLoadingStock(true)
      try {
        let allLowStock = []
        const inventoryPromises = restaurants.map(r => getInventoryByRestaurant(r._id || r.id))
        const inventories = await Promise.all(inventoryPromises)

        inventories.forEach((items, index) => {
          const restaurantName = restaurants[index].name
          const low = items.filter(item => 
            !item.MongoProductId && 
            parseFloat(item.Quantity || item.quantity) <= parseFloat(item.MinStock || item.minStock)
          ).map(i => ({ ...i, restaurantName }))

          allLowStock = [...allLowStock, ...low]
        })

        setLowStockItems(allLowStock.slice(0, 3)) // Solo mostrar los 3 más críticos
      } catch (error) {
        console.error('Error fetching low stock:', error)
      } finally {
        setLoadingStock(false)
      }
    }

    if (restaurants.length > 0) {
      fetchDetailedLowStock()
    }
  }, [restaurants])

  const cards = [
    { 
      label: 'Restaurantes', 
      value: restaurants.length, 
      loading: restaurantsLoading,
      icon: Utensils, 
      color: 'orange' 
    },
    { 
      label: 'Pedidos totales', 
      value: globalStats?.pedidosTotales || '0', 
      loading: analyticsLoading,
      icon: ShoppingCart, 
      color: 'orange' 
    },
    { 
      label: 'Ingresos Totales', 
      value: `Q${globalStats?.ingresosTotales?.toLocaleString() || '0.00'}`, 
      loading: analyticsLoading,
      icon: BarChart3, 
      color: 'orange' 
    },
    { 
      label: 'Insumos Críticos', 
      value: lowStockItems.length > 0 ? lowStockItems.length : '0', 
      loading: loadingStock,
      icon: Package, 
      color: lowStockItems.length > 0 ? 'red' : 'orange' 
    },
  ]

  const quickAccess = [
    { label: 'Restaurantes', icon: Utensils, path: '/restaurants', color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Pedidos', icon: ShoppingCart, path: '/orders', color: 'bg-emerald-500/10 text-emerald-500' },
    { label: 'Inventario', icon: Package, path: '/inventory', color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Reportes', icon: BarChart3, path: '/reports', color: 'bg-purple-500/10 text-purple-500' },
  ]

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 variants={itemVariants} className="text-3xl font-bold text-white mb-1">
            ¡Hola, {user?.username || 'Admin'}!
          </motion.h1>
          <motion.p variants={itemVariants} className="text-zinc-500 text-sm font-medium">
            Aquí tienes el resumen operativo de hoy en tiempo real.
          </motion.p>
        </div>
        <motion.div variants={itemVariants} className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border border-white/5 rounded-2xl">
          <Clock size={16} className="text-orange-500" />
          <span className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </motion.div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <motion.div 
            key={card.label} 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 transition-all hover:bg-zinc-800/50"
          >
            {card.loading ? (
              <div className="space-y-4">
                <Skeleton className="w-10 h-10 rounded-2xl" />
                <Skeleton className="w-20 h-8" />
                <Skeleton className="w-24 h-4" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${card.color === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    <card.icon size={22} />
                  </div>
                  {card.color === 'red' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter bg-red-500/20 text-red-400 px-2 py-1 rounded-full animate-pulse">
                      <AlertCircle size={10} /> Crítico
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-white mb-1 truncate">{card.value}</p>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{card.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white text-xl font-bold">Rendimiento</h3>
              <p className="text-zinc-500 text-xs font-medium mt-1 flex items-center gap-1">
                Visualización de los últimos 7 días
              </p>
            </div>
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-zinc-800 border-none text-zinc-400 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="sales">Ventas (Q)</option>
              <option value="orders">Pedidos</option>
            </select>
          </div>

          <div className="h-[250px] w-full">
            {analyticsLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px' }}
                    itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#f97316" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                <BarChart3 size={40} className="opacity-20" />
                <p className="text-sm font-medium">No hay datos suficientes para mostrar la gráfica.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Acciones Urgentes (Stock Bajo) */}
        <motion.div variants={itemVariants} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white text-xl font-bold">Acciones Críticas</h3>
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Urgente</span>
          </div>

          <div className="space-y-4 flex-1">
            {loadingStock ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            ) : lowStockItems.length > 0 ? (
              lowStockItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl group hover:bg-red-500/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{item.Name || item.name}</p>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">{item.restaurantName}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/inventory')}
                    className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-white transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                <Package size={40} className="text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm font-medium">Todo bajo control.<br/>No hay stock crítico.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/inventory')}
            className="w-full mt-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all"
          >
            Ver Inventario Completo
          </button>
        </motion.div>
      </div>

      {/* Accesos Rápidos con diseño mejorado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickAccess.map((item) => (
          <motion.button
            key={item.label}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-4 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 hover:bg-zinc-800 transition-all group"
          >
            <div className={`p-4 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <span className="text-zinc-300 text-sm font-bold group-hover:text-white">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export default Dashboard
