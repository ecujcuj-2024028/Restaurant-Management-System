import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Eye, XCircle, ShoppingBag, Bell, CalendarClock, Store, Filter, Search } from 'lucide-react'
import useOrderStore from '../store/orderStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useSocket from '../../../shared/hooks/useSocket'
import OrderStatusBadge from './OrderStatusBadge'
import OrderDetailModal from './OrderDetailModal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Skeleton from '../../../shared/components/ui/Skeleton'

const OrderList = () => {
  const { 
    orders, 
    loading, 
    error, 
    fetchOrders, 
    updateOrderStatus, 
    cancelOrder,
    handleSocketUpdate,
    handleSocketNewOrder 
  } = useOrderStore()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [restaurantId, setRestaurantId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Conexión a WebSockets: Escucha siempre los restaurantes del admin
  const socketRooms = restaurantId 
    ? [`restaurant_${restaurantId}`] 
    : restaurants.map(r => `restaurant_${r._id || r.id}`);

  const { on } = useSocket(socketRooms)

  useEffect(() => {
    const unsubscribeCreated = on('order_created', (newOrder) => {
      toast.success((t) => (
        <div className="flex items-center justify-between gap-4 w-full">
          <span>Nuevo pedido: #{(newOrder._id || newOrder.id).slice(-6).toUpperCase()}</span>
          <button onClick={() => toast.dismiss(t.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <XCircle size={14} className="text-zinc-500" />
          </button>
        </div>
      ), {
        icon: <ShoppingBag className="text-orange-500" size={20} />,
        style: { borderRadius: '1.5rem', background: '#18181b', color: '#fff' },
        duration: 8000
      })
      handleSocketNewOrder(newOrder)
    })

    const unsubscribeUpdated = on('order_status_updated', (updatedOrder) => {
      handleSocketUpdate(updatedOrder)
    })

    const unsubscribeCancelled = on('order_cancelled', (cancelledOrder) => {
      handleSocketUpdate(cancelledOrder)
    })

    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeCancelled()
    }
  }, [on, handleSocketNewOrder, handleSocketUpdate])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    if (restaurantId) {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (statusFilter) params.status = statusFilter
      fetchOrders(restaurantId, params)
    }
  }, [restaurantId, startDate, endDate, statusFilter, fetchOrders])

  const handleStatusChange = async (id, status) => {
    const toastId = toast.loading('Actualizando estado...')
    try {
      await updateOrderStatus(id, status)
      toast.success('Estado actualizado', { id: toastId })
      setSelectedOrder(null)
    } catch {
      toast.error('Error al actualizar estado', { id: toastId })
    }
  }

  const handleCancel = async () => {
    if (!orderToCancel) return
    const toastId = toast.loading('Cancelando pedido...')
    try {
      await cancelOrder(orderToCancel._id || orderToCancel.id)
      setOrderToCancel(null)
      toast.success('Pedido cancelado', { id: toastId })
    } catch {
      toast.error('Error al cancelar el pedido', { id: toastId })
    }
  }

  // FILTRADO LOCAL (Para que el tiempo real respete los filtros)
  const filtered = orders.filter(o => {
    // Filtro de Texto (ID del pedido o Mesa)
    const orderId = (o._id || o.id || '').toLowerCase();
    const matchesSearch = !searchTerm || 
      orderId.includes(searchTerm.toLowerCase()) ||
      o.tableNumber?.toString().includes(searchTerm);
    
    // Filtro de Estado
    const matchesStatus = !statusFilter || o.status === statusFilter;

    // Filtro de Fecha
    const orderDate = o.createdAt?.split('T')[0];
    const matchesDate = (!startDate || orderDate >= startDate) && 
                        (!endDate || orderDate <= endDate);

    return matchesSearch && matchesStatus && matchesDate;
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-10">
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {orderToCancel && (
        <ConfirmDialog
          message={`¿Estás seguro de cancelar el pedido #${(orderToCancel._id || orderToCancel.id)?.slice(-6).toUpperCase()}?`}
          onConfirm={handleCancel}
          onCancel={() => setOrderToCancel(null)}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pedidos</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Gestiona los pedidos del restaurante en tiempo real.</p>
        </div>
        <button
          onClick={() => restaurantId && fetchOrders(restaurantId, { status: statusFilter, startDate, endDate })}
          className="bg-orange-500 hover:bg-orange-600 border border-orange-500 px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all shadow-lg active:scale-95"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-zinc-900/50 p-4 rounded-[2.5rem] border border-white/5">
        <div className="relative group">
          <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} className="w-full bg-zinc-800 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-700 transition-all">
            <option value="">Restaurante</option>
            {restaurants.map((r) => (
              <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-zinc-800 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-700 transition-all">
            <option value="">Estados</option>
            <option value="recibido">Recibido</option>
            <option value="en_preparacion">En preparación</option>
            <option value="listo">Listo</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelada</option>
          </select>
        </div>
        
        <div className="relative group">
          <CalendarClock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-zinc-800 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold transition-all hover:bg-zinc-700" style={{ colorScheme: 'dark' }} />
        </div>

        <div className="relative group">
          <CalendarClock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-zinc-800 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold transition-all hover:bg-zinc-700" style={{ colorScheme: 'dark' }} />
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-800 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs font-bold transition-all hover:bg-zinc-700" />
        </div>
      </div>

      {!restaurantId ? (
        <div className="text-center py-20 text-zinc-500 font-bold uppercase tracking-widest opacity-50">Selecciona un restaurante para ver sus pedidos.</div>
      ) : (
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-left text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Pedido</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Mesa</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Items</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Total</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Estado</th>
                <th className="px-8 py-5 text-right text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && orders.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-12 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-28 rounded-full" /></td>
                    <td className="px-8 py-5 text-right"><Skeleton className="h-10 w-10 rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-zinc-500">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest">Sin registros encontrados</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode='popLayout'>
                  {filtered.map((order) => (
                    <motion.tr key={order._id || order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5"><span className="font-mono text-white font-bold text-sm">#{(order._id || order.id)?.slice(-6).toUpperCase()}</span></td>
                      <td className="px-8 py-5 text-zinc-300 font-bold">Mesa #{order.tableNumber}</td>
                      <td className="px-8 py-5 text-zinc-300 font-medium">{order.items?.length || 0} platos</td>
                      <td className="px-8 py-5 text-white font-black tracking-tighter text-lg">Q{order.total?.toFixed(2)}</td>
                      <td className="px-8 py-5"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setSelectedOrder(order)} className="p-2.5 bg-zinc-800 hover:bg-orange-500 rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg active:scale-90"><Eye size={18} /></button>
                          {['recibido', 'en_preparacion'].includes(order.status) && (
                            <button onClick={() => setOrderToCancel(order)} className="p-2.5 bg-zinc-800 hover:bg-red-500 rounded-xl text-zinc-400 hover:text-white transition-all shadow-lg active:scale-90"><XCircle size={18} /></button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}

export default OrderList
