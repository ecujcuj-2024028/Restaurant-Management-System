import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, MapPin, Phone, Clock, Star, 
  ShoppingCart, Plus, Info, ChevronRight, UtensilsCrossed 
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useRestaurantStore from '../store/restaurantStore'
import useProductStore from '../../product/store/productStore'
import useMenuStore from '../../menu/store/menuStore'
import Skeleton from '../../../shared/components/ui/Skeleton'
import CreateOrderForm from '../../orders/components/CreateOrderForm'
import useAuthStore from '../../auth/store/authStore'
import ProductReviews from '../../reviews/components/ProductReviews'
import ReviewModal from '../../reviews/components/ReviewModal'
import Modal from '../../../shared/components/ui/Modal'
import useReviewStore from '../../reviews/store/reviewStore'

const StarDisplay = ({ value, size = 12 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= Math.round(value) ? 'fill-orange-400 text-orange-400' : 'fill-zinc-700 text-zinc-700'}
      />
    ))}
  </div>
)

const RestaurantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const { products, fetchProducts, loading: loadingProducts } = useProductStore()
  const { menus, fetchMenus, loading: loadingMenus } = useMenuStore()
  const { reviewsByProduct, fetchReviewsByProduct, fetchRestaurantStats, restaurantStats } = useReviewStore()
  
  const [restaurant, setRestaurant] = useState(null)
  const [selectedMenuId, setSelectedMenuId] = useState('all')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [initialOrderItems, setInitialOrderItems] = useState([])
  const [selectedProductForReview, setSelectedProductForReview] = useState(null)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [reviewToEdit, setReviewToEdit] = useState(null)

  const { user } = useAuthStore()
  const isCliente = user?.roles?.includes('CLIENTE')
  const currentStats = restaurantStats[id] || { promedioRating: 0, totalReviews: 0 }

  useEffect(() => {
    if (restaurants.length === 0) fetchRestaurants()
    else setRestaurant(restaurants.find(r => (r._id || r.id) === id))
  }, [id, restaurants, fetchRestaurants])

  useEffect(() => {
    fetchProducts({ restaurant: id })
    fetchMenus({ restaurant: id }) 
    fetchRestaurantStats(id)
  }, [id, fetchProducts, fetchMenus, fetchRestaurantStats])

  // Los menús ya vienen filtrados por la API gracias al cambio anterior
  const restaurantMenus = menus.filter(m => m.isActive)
  
  // Determinar qué productos mostrar
  let displayProducts = []
  if (selectedMenuId === 'all') {
    displayProducts = products.filter(p => (p.restaurant?._id || p.restaurant || p.restaurantId) === id)
  } else {
    const selectedMenu = restaurantMenus.find(m => (m._id || m.id) === selectedMenuId)
    const productIdsInMenu = selectedMenu?.items?.map(i => i.product?._id || i.product) || []
    displayProducts = products.filter(p => productIdsInMenu.includes(p._id || p.id))
  }

  const handleQuickAdd = (item, isMenu = false) => {
    if (!isCliente) return toast.error('Solo los clientes pueden realizar pedidos')
    
    const orderItem = {
      productId: item._id || item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      isMenu: isMenu
    }

    setInitialOrderItems([orderItem])
    setShowOrderForm(true)
  }

  if (!restaurant && !loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Info size={48} className="mb-4 opacity-20" />
        <p className="text-xl font-bold">No se encontró el restaurante.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-orange-500 font-bold flex items-center gap-2">
          <ArrowLeft size={18} /> Volver
        </button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      {/* Banner */}
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group">
        <img 
          src={restaurant?.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white hover:bg-orange-500 transition-all shadow-xl">
          <ArrowLeft size={20} />
        </button>
        <div className="absolute bottom-8 left-8 right-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">{restaurant?.category}</span>
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg text-white">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold">{currentStats.promedioRating || 'Nuevo'} ({currentStats.totalReviews})</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">{restaurant?.name}</h1>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: MapPin, label: 'Ubicación', value: restaurant?.address?.city },
          { icon: Phone, label: 'Contacto', value: restaurant?.phone },
          { icon: Clock, label: 'Horario', value: `${restaurant?.openingTime} - ${restaurant?.closingTime}` },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"><item.icon size={20} /></div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{item.label}</p>
              <p className="text-white text-sm font-bold truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Menús / Categorías */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="text-orange-500" size={24} />
            <h2 className="text-2xl font-black text-white italic">Nuestra Carta</h2>
            
            {/* Si hay un menú seleccionado y tiene precio, mostrarlo aquí con botón de compra */}
            {selectedMenuId !== 'all' && restaurantMenus.find(m => (m._id || m.id) === selectedMenuId)?.price && (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex items-center gap-3 ml-4 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-2xl"
               >
                 <span className="text-orange-500 font-black text-sm">
                   Combo: Q{restaurantMenus.find(m => (m._id || m.id) === selectedMenuId).price}
                 </span>
                 <button 
                   onClick={() => handleQuickAdd(restaurantMenus.find(m => (m._id || m.id) === selectedMenuId), true)}
                   className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-xl transition-all active:scale-95"
                 >
                   Pedir Menú
                 </button>
               </motion.div>
            )}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedMenuId('all')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedMenuId === 'all' ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-900/50 text-zinc-400'}`}
            >
              Todos los Platos
            </button>
            {restaurantMenus.map((menu) => (
              <button
                key={menu._id || menu.id}
                onClick={() => setSelectedMenuId(menu._id || menu.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedMenuId === (menu._id || menu.id) ? 'bg-orange-500 text-white shadow-lg' : 'bg-zinc-900/50 text-zinc-400'}`}
              >
                {menu.name}
              </button>
            ))}
          </div>
        </div>

        {/* Productos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingProducts || loadingMenus ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)
          ) : displayProducts.length > 0 ? (
            displayProducts.map((product) => (
              <motion.div key={product.id || product._id} layout className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 hover:bg-zinc-900/60 transition-all group relative overflow-hidden">
                <div className="flex gap-5">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 cursor-pointer" onClick={() => setSelectedProductForReview(product)}>
                    <img src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="cursor-pointer" onClick={() => setSelectedProductForReview(product)}>
                      <h3 className="text-white font-bold mb-1 truncate group-hover:text-orange-500 transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <StarDisplay value={reviewsByProduct[product._id || product.id]?.promedioRating || 0} />
                        {product.preparationTime && (
                           <span className="flex items-center gap-1 text-[9px] font-black text-zinc-500 uppercase bg-zinc-800/50 px-2 py-0.5 rounded-md">
                             <Clock size={10} /> {product.preparationTime} min
                           </span>
                        )}
                      </div>
                    </div>
                    <p className="text-zinc-500 text-[11px] line-clamp-2 mb-3 leading-relaxed">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 font-black">Q {product.price}</span>
                      <button onClick={() => handleQuickAdd(product)} className="p-2 bg-zinc-800 hover:bg-orange-500 rounded-xl text-white transition-all active:scale-90"><Plus size={16} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-zinc-500 font-bold">No hay platillos en esta selección.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selectedProductForReview && (
          <Modal title={selectedProductForReview.name} onClose={() => setSelectedProductForReview(null)}>
            <div className="space-y-6">
              <img src={selectedProductForReview.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'} className="w-full h-48 object-cover rounded-3xl" alt="" />
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Reseñas</h3>
                {isCliente && <button onClick={() => setShowWriteReview(true)} className="text-orange-500 text-sm font-bold flex items-center gap-1"><Plus size={16} /> Escribir</button>}
              </div>
              <ProductReviews platoId={selectedProductForReview._id || selectedProductForReview.id} onEdit={(r) => { setReviewToEdit(r); setShowWriteReview(true); }} />
            </div>
          </Modal>
        )}
        {showWriteReview && selectedProductForReview && (
          <ReviewModal product={selectedProductForReview} restauranteId={id} reviewToEdit={reviewToEdit} onClose={() => { setShowWriteReview(false); setReviewToEdit(null); }} onSuccess={() => { fetchReviewsByProduct(selectedProductForReview._id || selectedProductForReview.id); fetchRestaurantStats(id); }} />
        )}
      </AnimatePresence>

      {isCliente && (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setInitialOrderItems([]); setShowOrderForm(true); }} className="fixed bottom-8 right-8 bg-orange-500 text-white px-8 py-4 rounded-3xl font-black shadow-2xl z-50 flex items-center gap-3">
          <ShoppingCart size={20} /><span>Hacer Pedido</span>
        </motion.button>
      )}

      {showOrderForm && <CreateOrderForm restaurantId={id} initialItems={initialOrderItems} onClose={() => setShowOrderForm(false)} />}
    </motion.div>
  )
}

export default RestaurantDetail