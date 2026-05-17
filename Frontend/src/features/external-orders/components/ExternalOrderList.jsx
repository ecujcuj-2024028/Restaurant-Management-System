import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, 
  Truck, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  PackageCheck,
  Utensils,
  AlertCircle,
  Hash,
  XCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useExternalOrderStore from '../store/externalOrderStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import ExternalOrderForm from './ExternalOrderForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const ORDER_TYPES = {
  domicilio: { label: 'A domicilio', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  para_llevar: { label: 'Para llevar', icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
}

const STATUS_CONFIG = {
  recibido: { label: 'Recibido', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Clock },
  confirmado: { label: 'Confirmado', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: CheckCircle2 },
  en_preparacion: { label: 'En Cocina', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: ChefHat },
  listo: { label: 'Listo', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: PackageCheck },
  en_camino: { label: 'En Camino', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Truck },
  entregado: { label: 'Entregado', color: 'text-zinc-500', bg: 'bg-zinc-500/10', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
}

const ExternalOrderList = () => {
  const { orders, loading, fetchOrders, updateOrderStatus } = useExternalOrderStore()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  
  const [showForm, setShowForm] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [orderToCancel, setOrderToCancel] = useState(null)

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchOrders({ restaurantId: selectedRestaurant })
    }
  }, [selectedRestaurant, fetchOrders])

  const handleStatusUpdate = async (id, currentStatus, orderType) => {
    const transitions = {
      domicilio: { recibido: 'confirmado', confirmado: 'en_preparacion', en_preparacion: 'listo', listo: 'en_camino', en_camino: 'entregado' },
      para_llevar: { recibido: 'confirmado', confirmado: 'en_preparacion', en_preparacion: 'listo', listo: 'entregado' }
    }
    
    const nextStatus = transitions[orderType]?.[currentStatus]
    if (!nextStatus) return toast.error('Flujo completado')

    const toastId = toast.loading(`Cambiando a ${nextStatus}...`)
    try {
      await updateOrderStatus(id, nextStatus)
      toast.success('Estado actualizado', { id: toastId })
    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  const handleCancelOrder = async () => {
    const toastId = toast.loading('Cancelando pedido...')
    try {
      await updateOrderStatus(orderToCancel._id || orderToCancel.id, 'cancelado')
      toast.success('Pedido cancelado', { id: toastId })
      setOrderToCancel(null)
    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  // Lógica de visibilidad del botón cancelar según reglas de negocio
  const canCancel = (order) => {
    if (order.status === 'cancelado' || order.status === 'entregado') return false
    if (order.orderType === 'domicilio') {
        return order.status === 'recibido' // Solo en recibido para domicilio
    }
    return true // Para llevar puede cancelarse siempre antes de la entrega
  }

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase()
    return (o.deliveryAddress?.phone || '').includes(term) || (o._id || o.id || '').toString().includes(term)
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20">
      {showForm && (
        <ExternalOrderForm 
          onClose={() => setShowForm(false)} 
          onSuccess={(newO) => { setSelectedRestaurant(newO.restaurantId); fetchOrders({ restaurantId: newO.restaurantId }); }}
        />
      )}

      {orderToCancel && (
        <ConfirmDialog
          message="¿Confirmar cancelación? Se notificará al sistema logístico."
          onConfirm={handleCancelOrder}
          onCancel={() => setOrderToCancel(null)}
        />
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white">Gestión de Pedidos</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Control operativo de entregas externas.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          <Plus size={20} /> Registrar Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1 block">Sede</label>
          <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-4 text-white outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer">
            <option value="">Seleccione sede...</option>
            {restaurants.map(r => <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input type="text" placeholder="Teléfono o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-orange-500/50" />
          </div>
        </div>
      </div>

      {!selectedRestaurant ? (
        <div className="py-24 text-center bg-zinc-900/30 border border-dashed border-white/5 rounded-[3rem]">
          <AlertCircle size={48} className="mx-auto text-zinc-800 mb-4" />
          <p className="text-zinc-600 font-bold">Selecciona una sede para monitorear.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode='popLayout'>
            {filteredOrders.map((order) => {
              const type = ORDER_TYPES[order.orderType] || ORDER_TYPES.para_llevar
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.recibido
              const isCancellable = canCancel(order)

              return (
                <motion.div
                  key={order._id || order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 shadow-xl transition-all ${order.status === 'cancelado' ? 'opacity-40 grayscale' : 'hover:border-orange-500/20'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${type.bg} ${type.color}`}>
                      <type.icon size={24} />
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                      <status.icon size={12} /> {status.label}
                    </div>
                  </div>

                  <div className="mb-6 space-y-1">
                    <span className="text-[10px] font-black text-orange-500/40 uppercase">#{(order._id || order.id).toString().slice(-6)}</span>
                    <h3 className="text-xl font-bold text-white truncate">{order.deliveryAddress?.phone || 'Cliente'}</h3>
                    <p className="text-zinc-500 text-xs italic line-clamp-1">{order.deliveryAddress?.street || 'Local'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <p className="text-2xl font-black text-orange-500">Q {Number(order.total).toFixed(2)}</p>
                    
                    <div className="flex gap-2">
                      {isCancellable && (
                        <button onClick={() => setOrderToCancel(order)} className="h-12 w-12 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center">
                          <XCircle size={20} />
                        </button>
                      )}
                      
                      {order.status !== 'entregado' && order.status !== 'cancelado' && (
                        <button onClick={() => handleStatusUpdate(order._id || order.id, order.status, order.orderType)} className="h-12 w-12 bg-zinc-800 hover:bg-orange-500 text-zinc-400 hover:text-white rounded-2xl transition-all flex items-center justify-center">
                          <Plus size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default ExternalOrderList
