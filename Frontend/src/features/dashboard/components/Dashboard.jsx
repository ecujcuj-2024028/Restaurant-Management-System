import { useEffect, useState } from 'react'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useInventoryStore from '../../inventory/store/inventoryStore'
import { getInventoryByRestaurant } from '../../../shared/api/inventory'
import { useNavigate } from 'react-router-dom'
import { 
  Utensils, 
  ShoppingCart, 
  Calendar, 
  Package, 
  BarChart3,
  ArrowRight,
  Loader2
} from 'lucide-react'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  
  const { restaurants, fetchRestaurants, loading: restaurantsLoading } = useRestaurantStore()
  const [lowStockCount, setLowStockCount] = useState(0)
  const [loadingStock, setLoadingStock] = useState(false)

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    const calculateLowStock = async () => {
      if (restaurants.length === 0) return
      
      setLoadingStock(true)
      try {
        let totalLowStock = 0
        // Para el dashboard, consultamos el stock bajo de cada restaurante
        const inventoryPromises = restaurants.map(r => getInventoryByRestaurant(r._id || r.id))
        const inventories = await Promise.all(inventoryPromises)
        
        inventories.forEach(items => {
          const lowStockItems = items.filter(item => 
            !item.MongoProductId && // Solo ingredientes base
            parseFloat(item.Quantity || item.quantity) <= parseFloat(item.MinStock || item.minStock)
          )
          totalLowStock += lowStockItems.length
        })
        
        setLowStockCount(totalLowStock)
      } catch (error) {
        console.error('Error fetching low stock:', error)
      } finally {
        setLoadingStock(false)
      }
    }

    if (restaurants.length > 0) {
      calculateLowStock()
    }
  }, [restaurants])

  const cards = [
    { 
      label: 'Restaurantes', 
      value: restaurantsLoading ? <Loader2 className="animate-spin w-6 h-6" /> : restaurants.length, 
      icon: Utensils, 
      color: 'orange' 
    },
    { 
      label: 'Pedidos activos', 
      value: '—', 
      icon: ShoppingCart, 
      color: 'orange' 
    },
    { 
      label: 'Reservaciones hoy', 
      value: '—', 
      icon: Calendar, 
      color: 'orange' 
    },
    { 
      label: 'Stock bajo', 
      value: loadingStock ? <Loader2 className="animate-spin w-6 h-6" /> : lowStockCount, 
      icon: Package, 
      color: lowStockCount > 0 ? 'red' : 'orange' 
    },
  ]

  const quickAccess = [
    { label: 'Restaurantes', icon: Utensils, path: '/restaurants' },
    { label: 'Pedidos', icon: ShoppingCart, path: '/orders' },
    { label: 'Inventario', icon: Package, path: '/inventory' },
    { label: 'Reportes', icon: BarChart3, path: '/reports' },
  ]

  const activity = [
    { text: 'Sistema iniciado correctamente', time: 'Ahora mismo' },
    { text: 'Root Admin autenticado', time: 'Hace 5 min' },
    { text: 'Base de datos conectada', time: 'Hace 10 min' },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          ¡Hola, {user?.username || 'Admin'}! 
        </h1>
        <p className="text-zinc-500 text-base">Aquí tienes el resumen operativo de hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 transition-all hover:border-zinc-700">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${card.color === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  <Icon size={24} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${card.color === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  {card.color === 'red' ? 'Crítico' : 'Normal'}
                </span>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-zinc-500 text-sm font-medium">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white text-xl font-bold">Actividad reciente</h3>
            <button className="text-orange-500 text-sm font-semibold hover:underline flex items-center gap-1">
              Ver todo <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-6">
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                <div>
                  <p className="text-zinc-200 text-sm font-medium">{item.text}</p>
                  <p className="text-zinc-500 text-xs mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-white text-xl font-bold mb-8">Accesos rápidos</h3>
          <div className="space-y-3">
            {quickAccess.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between group bg-zinc-800/50 hover:bg-orange-500 border border-zinc-700/50 hover:border-orange-400 rounded-2xl px-5 py-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Icon size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                    <span className="text-zinc-300 group-hover:text-white text-sm font-semibold transition-colors">{item.label}</span>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard