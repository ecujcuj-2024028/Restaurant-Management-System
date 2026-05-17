import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Star, ChevronDown, ChevronUp } from 'lucide-react'
import useOrderStore from '../store/orderStore'
import useAuthStore from '../../auth/store/authStore'
import OrderStatusBadge from './OrderStatusBadge'
import OrderDetailModal from './OrderDetailModal'
import ReviewModal from '../../reviews/components/ReviewModal'
import ProductReviews from '../../reviews/components/ProductReviews'
import Skeleton from '../../../shared/components/ui/Skeleton'

// ── Fila expandible con items reseñables ─────────────────────────────────────
const OrderRow = ({ order }) => {
  const [expanded, setExpanded] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [viewingReviews, setViewingReviews] = useState(null)

  const isEntregado = order.status === 'entregado'

  return (
    <>
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={null}
          isClient
        />
      )}

      {reviewTarget && (
        <ReviewModal
          product={reviewTarget.product}
          restauranteId={reviewTarget.restauranteId}
          onClose={() => setReviewTarget(null)}
        />
      )}

      <motion.tr
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
              title="Ver detalle"
            >
              <Eye size={18} />
            </button>
            {isEntregado && order.items?.length > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-2 hover:bg-orange-500/10 rounded-xl text-zinc-400 hover:text-orange-400 transition-all"
                title="Reseñar platos"
              >
                {expanded ? <ChevronUp size={18} /> : <Star size={18} />}
              </button>
            )}
          </div>
        </td>
      </motion.tr>

      {isEntregado && expanded && (
        <tr>
          <td colSpan={6} className="px-8 pb-6 pt-0">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                  Platos de este pedido — toca ⭐ para reseñar
                </p>
              </div>

              <div className="divide-y divide-white/5">
                {order.items.map((item, idx) => {
                  const platoId = item.productId || item._id || item.id
                  const isViewingThis = viewingReviews === platoId

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between px-5 py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                            <p className="text-zinc-500 text-xs">x{item.quantity}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setViewingReviews(isViewingThis ? null : platoId)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors flex items-center gap-1"
                          >
                            {isViewingThis ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            Ver reseñas
                          </button>
                          <button
                            onClick={() =>
                              setReviewTarget({
                                product: {
                                  _id: platoId,
                                  name: item.name,
                                  image: item.image,
                                },
                                restauranteId: order.restaurantId,
                              })
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                          >
                            <Star size={12} />
                            Reseñar
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isViewingThis && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-1 bg-zinc-950/30">
                              <ProductReviews platoId={platoId} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
const MyOrders = () => {
  const { history, loading, error, fetchOrderHistory } = useOrderStore()

  useEffect(() => {
    fetchOrderHistory()
  }, [fetchOrderHistory])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Mis Pedidos</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Historial de tus pedidos — en los entregados puedes reseñar cada plato
        </p>
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
                  <OrderRow key={order._id || order.id} order={order} />
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