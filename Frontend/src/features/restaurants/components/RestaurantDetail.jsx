import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  ShoppingCart, 
  Plus, 
  Minus,
  Info,
  ChevronRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useRestaurantStore from '../store/restaurantStore'
import useProductStore from '../../product/store/productStore'
import Skeleton from '../../../shared/components/ui/Skeleton'

const RestaurantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const { products, fetchProducts, loading: loadingProducts } = useProductStore()
  
  const [restaurant, setRestaurant] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  useEffect(() => {
    if (restaurants.length === 0) {
      fetchRestaurants()
    } else {
      const found = restaurants.find(r => (r._id || r.id) === id)
      setRestaurant(found)
    }
  }, [id, restaurants, fetchRestaurants])

  useEffect(() => {
    // Filtrar productos por restaurante si el API lo soporta, 
    // sino filtramos localmente por ahora
    fetchProducts({ restaurantId: id })
  }, [id, fetchProducts])

  const restaurantProducts = products.filter(p => 
    (p.restaurantId === id || p.restaurant?._id === id || p.restaurant === id)
  )

  const categories = ['Todos', ...new Set(restaurantProducts.map(p => p.category?.name || p.category).filter(Boolean))]

  const filteredProducts = restaurantProducts.filter(p => 
    selectedCategory === 'Todos' || (p.category?.name || p.category) === selectedCategory
  )

  if (!restaurant && !loadingProducts) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Info size={48} className="mb-4 opacity-20" />
        <p className="text-xl font-bold">No se encontró el restaurante.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-orange-500 font-bold flex items-center gap-2">
          <ArrowLeft size={18} /> Volver a la página principal
        </button>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      {/* Header / Banner */}
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group">
        <img 
          src={restaurant?.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200'} 
          alt={restaurant?.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white hover:bg-orange-500 transition-all shadow-xl"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="absolute bottom-8 left-8 right-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
              {restaurant?.category}
            </span>
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-lg text-white">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold">4.8 (120+ reseñas)</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">{restaurant?.name}</h1>
        </div>
      </div>

      {/* Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: MapPin, label: 'Ubicación', value: `${restaurant?.address?.city}, ${restaurant?.address?.street}` },
          { icon: Phone, label: 'Contacto', value: restaurant?.phone || 'No disponible' },
          { icon: Clock, label: 'Horario', value: 'Abierto • Cierra 22:00' },
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{item.label}</p>
              <p className="text-white text-sm font-bold truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Section */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-white">Menú Digital</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingProducts ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id || product._id}
                layout
                className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 hover:bg-zinc-900/60 transition-all group"
              >
                <div className="flex gap-5">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold mb-1 truncate">{product.name}</h3>
                    <p className="text-zinc-500 text-[11px] line-clamp-2 mb-3 leading-relaxed">
                      {product.description || 'Preparado con los ingredientes más frescos del día.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 font-black">Q {product.price}</span>
                      <button className="p-2 bg-zinc-800 hover:bg-orange-500 rounded-xl text-white transition-all active:scale-90">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center opacity-50">
              <p className="text-zinc-500 font-bold">No hay platillos disponibles en esta categoría.</p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button (Cart) */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 bg-orange-500 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-orange-500/40 flex items-center gap-3 z-50"
      >
        <ShoppingCart size={20} />
        <span>Ver Pedido</span>
        <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">0</span>
      </motion.button>
    </motion.div>
  )
}

export default RestaurantDetail
