import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Eye } from 'lucide-react'
import useOrderStore from '../store/orderStore'
import OrderStatusBadge from './OrderStatusBadge'
import OrderDetailModal from './OrderDetailModal'
import Skeleton from '../../../shared/components/ui/Skeleton'

const MyOrders = () => {
  const { history, loading, error, fetchOrderHistory, cancelOrder } = useOrderStore()
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrderHistory()
  }, [fetchOrderHistory])

  const handleCancel = async (id) => {
    const toastId = toast.loading('Cancelando pedido...')
    try {
      await cancelOrder(id)
      toast.success('Pedido cancelado', { id: toastId })
      setSelectedOrder(null)
      fetchOrderHistory()
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
          onStatusChange={null}
          onCancel={handleCancel}
          isClient
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mis Pedidos</h1>
        <p className="text-zinc-500 text-sm mt-1">Historial de tus pedidos</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6">
          {error}
        </div>
      )}

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
            {loading && history.length === 0 ? (
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
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-20 text-zinc-500">
                  No tienes pedidos registrados aún.
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {history.map((order) => (
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
                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default MyOrders