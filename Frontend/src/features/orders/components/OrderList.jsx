import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Eye, XCircle } from 'lucide-react'
import useOrderStore from '../store/orderStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import OrderStatusBadge from './OrderStatusBadge'
import OrderDetailModal from './OrderDetailModal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Skeleton from '../../../shared/components/ui/Skeleton'

const OrderList = () => {
  const { orders, loading, error, fetchOrders, updateOrderStatus, cancelOrder } = useOrderStore()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [restaurantId, setRestaurantId] = useState('')

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    if (restaurantId) fetchOrders(restaurantId)
  }, [restaurantId])

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
          <h1 className="text-3xl font-bold text-white">Pedidos</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestiona los pedidos del restaurante</p>
        </div>
        <button
          onClick={() => restaurantId && fetchOrders(restaurantId)}
          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-zinc-300 text-sm transition-colors"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="mb-6">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
          Selecciona un restaurante
        </label>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="w-full md:w-80 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">-- Selecciona un restaurante --</option>
          {restaurants.map((r) => (
            <option key={r._id || r.id} value={r._id || r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {!restaurantId ? (
        <div className="text-center py-20 text-zinc-500">
          Selecciona un restaurante para ver sus pedidos.
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6">
          {error}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Pedido</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Mesa</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Items</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Total</th>
                <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Estado</th>
                <th className="px-8 py-5 text-right text-zinc-400 text-xs font-black uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && orders.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-12" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-28" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-zinc-500">
                    No hay pedidos para este restaurante.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.tr
                      key={order._id || order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <span className="font-mono text-white font-bold text-sm">
                          #{(order._id || order.id)?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-zinc-300">Mesa #{order.tableNumber}</td>
                      <td className="px-8 py-5 text-zinc-300">{order.items?.length || 0} items</td>
                      <td className="px-8 py-5 text-white font-semibold">Q{order.total?.toFixed(2)}</td>
                      <td className="px-8 py-5"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          {['recibido', 'en_preparacion'].includes(order.status) && (
                            <button
                              onClick={() => setOrderToCancel(order)}
                              className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-all"
                            >
                              <XCircle size={18} />
                            </button>
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