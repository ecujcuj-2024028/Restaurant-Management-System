import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Star, ChevronDown, ChevronUp, Store, Clock, ShoppingBag, Bell, XCircle } from 'lucide-react'
import useOrderStore from '../store/orderStore'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useSocket from '../../../shared/hooks/useSocket'
import OrderStatusBadge from './OrderStatusBadge'
import OrderDetailModal from './OrderDetailModal'
import ReviewModal from '../../reviews/components/ReviewModal'
import ProductReviews from '../../reviews/components/ProductReviews'
import Skeleton from '../../../shared/components/ui/Skeleton'
import { toast } from 'react-hot-toast'

// ── Fila expandible con items reseñables ─────────────────────────────────────
const OrderRow = ({ order, onViewDetail, onOpenReview }) => {
  const [expanded, setExpanded] = useState(false)
  const [viewingReviews, setViewingReviews] = useState(null)

  const isEntregado = order.status === 'entregado'
  const restaurantName = order.restaurantId?.name || 'Restaurante'

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="hover:bg-white/5 transition-colors"
      >
        <td className="px-8 py-5">
          <div className="flex flex-col">
            <span className="font-mono text-white font-bold text-xs">
              #{(order._id || order.id)?.slice(-6).toUpperCase()}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
               <Store size={10} className="text-orange-500" />
               <span className="text-zinc-400 text-[10px] font-black uppercase tracking-tight">
                 {restaurantName}
               </span>
            </div>
          </div>
        </td>
        <td className="px-8 py-5 text-zinc-300">Mesa #{order.tableNumber}</td>
        <td className="px-8 py-5 text-zinc-300">{order.items?.length || 0} items</td>
        <td className="px-8 py-5 text-white font-semibold">Q{order.total?.toFixed(2)}</td>
        <td className="px-8 py-5"><OrderStatusBadge status={order.status} /></td>
        <td className="px-8 py-5">
          <div className="flex justify-end gap-2">
            <button
              onClick={onViewDetail}
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
                              onOpenReview({
                                product: {
                                  _id: platoId,
                                  name: item.name,
                                  image: item.image,
                                },
                                restauranteId: order.restaurantId?._id || order.restaurantId,
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
  const user = useAuthStore(state => state.user)
  const { history, loading, fetchOrderHistory, handleSocketHistoryUpdate } = useOrderStore()
  const { restaurants, fetchRestaurants } = useRestaurantStore()

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Conexión a WebSockets
  const userId = user?.id || user?._id
  const socketRooms = [`user_${userId}`]
  if (selectedRestaurant) socketRooms.push(`restaurant_${selectedRestaurant}`)

  const { on } = useSocket(socketRooms)

  useEffect(() => {
    const unsubscribeUpdated = on('order_status_updated', (updatedOrder) => {
      handleSocketHistoryUpdate(updatedOrder)
      
      const statusMessages = {
        recibido: "¡Recibimos tu pedido! Pronto empezaremos a prepararlo.",
        en_preparacion: "Tu pedido está en la cocina. ¡Ya se siente el aroma!",
        listo: "¡Prepárate! Ya casi llega tu pedido a la mesa.",
        entregado: "¡Buen provecho! Esperamos que te haya gustado.",
        cancelado: "Lo sentimos, tu pedido ha sido cancelado."
      }

      const statusIcons = {
        recibido: <Bell className="text-blue-400" size={20} />,
        en_preparacion: <Clock className="text-yellow-500" size={20} />,
        listo: <Bell className="text-orange-500" size={20} />,
        entregado: <Star className="text-emerald-500" size={20} />,
        cancelado: <XCircle className="text-red-500" size={20} />
      }

      toast.success((t) => (
        <div className="flex items-center justify-between gap-4 w-full">
          <span>{statusMessages[updatedOrder.status] || `Tu pedido está: ${updatedOrder.status}`}</span>
          <button onClick={() => toast.dismiss(t.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <XCircle size={14} className="text-zinc-500" />
          </button>
        </div>
      ), {
        icon: statusIcons[updatedOrder.status] || <Bell size={20} />,
        duration: 8000,
        id: `order-${updatedOrder._id}`,
      })
    })

    const unsubscribeCancelled = on('order_cancelled', (cancelledOrder) => {
      handleSocketHistoryUpdate(cancelledOrder)
      toast.error((t) => (
        <div className="flex items-center justify-between gap-4 w-full">
          <span>Tu pedido ha sido cancelado</span>
          <button onClick={() => toast.dismiss(t.id)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <XCircle size={14} className="text-zinc-500" />
          </button>
        </div>
      ), {
        icon: <XCircle className="text-red-500" size={20} />,
        id: `cancel-${cancelledOrder._id}`
      })
    })

    return () => {
      unsubscribeUpdated()
      unsubscribeCancelled()
    }
  }, [on, handleSocketHistoryUpdate])

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    const params = {}
    if (selectedRestaurant) params.restaurantId = selectedRestaurant
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    fetchOrderHistory(params)
  }, [selectedRestaurant, startDate, endDate, fetchOrderHistory])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-10">
      
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
          onSuccess={() => fetchOrderHistory(selectedRestaurant ? { restaurantId: selectedRestaurant } : {})}
        />
      )}

      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Mis Visitas</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">
            Revive tus mejores experiencias gastronómicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto">
          {/* Filtro Restaurante */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10 pointer-events-none">
              <Store size={18} />
            </div>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full lg:w-64 bg-zinc-900 border border-white/10 text-white pl-12 pr-10 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none transition-all hover:bg-zinc-800"
            >
              <option value="">Todas las visitas</option>
              {restaurants.map((res) => (
                <option key={res.id || res._id} value={res.id || res._id}>{res.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
          </div>

          {/* Filtro Fecha Inicio */}
          <div className="relative group">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10 pointer-events-none" size={18} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all hover:bg-zinc-800"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Filtro Fecha Fin */}
          <div className="relative group">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10 pointer-events-none" size={18} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-white pl-12 pr-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all hover:bg-zinc-800"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Referencia</th>
                <th className="px-8 py-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Ubicación</th>
                <th className="px-8 py-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Detalle</th>
                <th className="px-8 py-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Inversión</th>
                <th className="px-8 py-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Estado</th>
                <th className="px-8 py-6 text-right text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6"><Skeleton className="h-8 w-24 rounded-xl" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-16 rounded-lg" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-8 w-28 rounded-full" /></td>
                    <td className="px-8 py-6 text-right"><Skeleton className="h-10 w-10 rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-32">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <ShoppingBag size={64} className="text-zinc-500" />
                      <p className="text-lg font-black text-zinc-400 uppercase tracking-widest">Sin registros encontrados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {history.map((order) => (
                    <OrderRow 
                      key={order._id || order.id} 
                      order={order} 
                      onViewDetail={() => setSelectedOrder(order)}
                      onOpenReview={(target) => setReviewTarget(target)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

export default MyOrders
