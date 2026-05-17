import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useAnalyticsStore from '../store/analyticsStore'
import { getInventoryByRestaurant } from '../../../shared/api/inventory'
import { useNavigate } from 'react-router-dom'
import {
  Utensils, ShoppingCart, Package, BarChart3,
  ArrowRight, AlertCircle, TrendingUp, Clock,
  Sparkles, ChevronRight
} from 'lucide-react'
import Skeleton from '../../../shared/components/ui/Skeleton'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
}

const CARD_CONFIG = [
  {
    label: 'Restaurantes',
    icon: Utensils,
    gradient: 'from-orange-500/20 to-orange-600/5',
    border: 'border-orange-500/20',
    iconBg: 'bg-orange-500/20 text-orange-400',
    glow: 'shadow-orange-500/10',
    key: 'restaurants',
  },
  {
    label: 'Pedidos Totales',
    icon: ShoppingCart,
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/20 text-blue-400',
    glow: 'shadow-blue-500/10',
    key: 'orders',
  },
  {
    label: 'Ingresos Totales',
    icon: TrendingUp,
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    glow: 'shadow-emerald-500/10',
    key: 'revenue',
    prefix: 'Q',
  },
  {
    label: 'Insumos Críticos',
    icon: Package,
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/20',
    iconBg: 'bg-red-500/20 text-red-400',
    glow: 'shadow-red-500/10',
    key: 'stock',
    alert: true,
  },
]

const QUICK_ACCESS = [
  { label: 'Restaurantes', icon: Utensils, path: '/restaurants', from: 'from-orange-500', to: 'to-orange-700' },
  { label: 'Pedidos', icon: ShoppingCart, path: '/orders', from: 'from-blue-500', to: 'to-blue-700' },
  { label: 'Inventario', icon: Package, path: '/inventory', from: 'from-emerald-500', to: 'to-emerald-700' },
  { label: 'Reportes', icon: BarChart3, path: '/reports', from: 'from-purple-500', to: 'to-purple-700' },
]

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { restaurants, fetchRestaurants, loading: restaurantsLoading } = useRestaurantStore()
  const { chartData, fetchChartData, globalStats, fetchGlobalStats, loading: analyticsLoading } = useAnalyticsStore()
  const [lowStockItems, setLowStockItems] = useState([])
  const [loadingStock, setLoadingStock] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('sales')

  useEffect(() => {
    fetchRestaurants()
    fetchChartData()
    fetchGlobalStats()
  }, [fetchRestaurants, fetchChartData, fetchGlobalStats])

  useEffect(() => {
    const fetchLowStock = async () => {
      if (restaurants.length === 0) return
      setLoadingStock(true)
      try {
        let all = []
        const responses = await Promise.all(restaurants.map(r => getInventoryByRestaurant(r._id || r.id)))
        responses.forEach((res, i) => {
          const items = res.data?.items || []
          const low = items
            .filter(item => !item.MongoProductId && parseFloat(item.Quantity || 0) <= parseFloat(item.MinStock || 0))
            .map(i => ({ ...i, restaurantName: restaurants[i]?.name || '' }))
          all = [...all, ...low]
        })
        setLowStockItems(all.slice(0, 3))
      } catch { }
      finally { setLoadingStock(false) }
    }
    if (restaurants.length > 0) fetchLowStock()
  }, [restaurants])

  const cardValues = {
    restaurants: restaurants.length,
    orders: globalStats?.pedidosTotales || 0,
    revenue: globalStats?.ingresosTotales?.toLocaleString() || '0.00',
    stock: lowStockItems.length,
  }

  const isLoading = { restaurants: restaurantsLoading, orders: analyticsLoading, revenue: analyticsLoading, stock: loadingStock }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-10">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-orange-500" />
            <span className="text-orange-500 text-xs font-black uppercase tracking-widest">Panel de control</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            ¡Hola, <span className="text-orange-500">{user?.username || 'Admin'}</span>!
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Aquí tienes el resumen operativo de hoy en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl self-start">
          <Clock size={15} className="text-orange-500" />
          <span className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARD_CONFIG.map((card) => (
          <motion.div
            key={card.label}
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.01 }}
            className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} border ${card.border} rounded-3xl p-6 shadow-lg ${card.glow} cursor-default`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: 'radial-gradient(circle, currentColor, transparent)' }} />

            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl ${card.iconBg}`}>
                <card.icon size={22} />
              </div>
              {card.alert && lowStockItems.length > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full animate-pulse border border-red-500/20">
                  <AlertCircle size={10} /> Crítico
                </span>
              )}
            </div>

            {isLoading[card.key] ? (
              <div className="space-y-2">
                <Skeleton className="w-20 h-8 rounded-xl" />
                <Skeleton className="w-24 h-3 rounded-full" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-black text-white mb-1">
                  {card.prefix}{cardValues[card.key]}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{card.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Chart + Critical */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/60 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white text-xl font-black">Rendimiento</h3>
              <p className="text-zinc-500 text-xs font-medium mt-1">Últimos 7 días</p>
            </div>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 outline-none cursor-pointer focus:border-orange-500/50"
            >
              <option value="sales">Ventas (Q)</option>
              <option value="orders">Pedidos</option>
            </select>
          </div>

          <div className="h-[300px] w-full min-h-[300px]">
            {analyticsLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: 11, fontWeight: 700 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#52525b', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', padding: '12px 16px' }}
                    itemStyle={{ color: '#f97316', fontWeight: 'bold', fontSize: 13 }}
                    labelStyle={{ color: '#a1a1aa', fontSize: 11, marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey={selectedMetric}
                    stroke="#f97316" strokeWidth={3}
                    fillOpacity={1} fill="url(#colorMetric)"
                    animationDuration={1500}
                    dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-3 border-2 border-dashed border-zinc-800 rounded-2xl">
                <BarChart3 size={48} className="opacity-20" />
                <p className="text-sm font-medium text-zinc-500">No hay datos suficientes aún.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Critical Stock */}
        <motion.div variants={itemVariants} className="bg-zinc-900/60 border border-zinc-800/60 rounded-3xl p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-xl font-black">Stock Crítico</h3>
            {lowStockItems.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
                {lowStockItems.length} alerta{lowStockItems.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1">
            {loadingStock ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            ) : lowStockItems.length > 0 ? (
              lowStockItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/10 transition-colors group cursor-pointer"
                  onClick={() => navigate('/inventory')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <AlertCircle size={18} className="text-red-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{item.Name || item.name}</p>
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">{item.restaurantName}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Package size={28} className="text-emerald-500" />
                </div>
                <p className="text-zinc-400 text-sm font-bold">Todo bajo control</p>
                <p className="text-zinc-600 text-xs mt-1">No hay stock crítico</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/inventory')}
            className="w-full mt-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 group"
          >
            Ver inventario
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Quick Access */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-white font-black text-lg">Accesos Rápidos</h3>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACCESS.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.path)}
              className="relative overflow-hidden flex flex-col items-center justify-center gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-7 hover:border-zinc-700 transition-all group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.from} ${item.to} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.from} ${item.to} bg-opacity-10 shadow-lg`}>
                <item.icon size={24} className="text-white" />
              </div>
              <span className="text-zinc-400 text-sm font-bold group-hover:text-white transition-colors">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

    </motion.div>
  )
}

export default Dashboard