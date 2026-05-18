import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Utensils, 
  MapPin, 
  Star, 
  Search, 
  ChevronRight, 
  Clock, 
  Heart,
  TrendingUp,
  Filter,
  BarChart3,
  X,
  PartyPopper
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useProductStore from '../../product/store/productStore'
import useReviewStore from '../../reviews/store/reviewStore'
import useEventStore from '../../events/store/eventStore'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ProductReviews from '../../reviews/components/ProductReviews'
import ReviewModal from '../../reviews/components/ReviewModal'
import Modal from '../../../shared/components/ui/Modal'

const StarDisplay = ({ value, size = 12 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={
          star <= Math.round(value)
            ? 'fill-orange-400 text-orange-400'
            : 'fill-zinc-700 text-zinc-700'
        }
      />
    ))}
  </div>
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

const ClientDashboard = () => {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  
  const { restaurants, fetchRestaurants, loading: loadingRestaurants } = useRestaurantStore()
  const { products, fetchProducts, loading: loadingProducts } = useProductStore()
  const { reviewsByProduct, fetchReviewsByProduct, fetchRestaurantStats } = useReviewStore()
  const { events, fetchEvents, loading: loadingEvents } = useEventStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [selectedProductForReview, setSelectedProductForReview] = useState(null)
  const [showWriteReview, setShowWriteReview] = useState(false)

  useEffect(() => {
    fetchRestaurants()
    fetchProducts()
    fetchEvents() // Cargar eventos
  }, [fetchRestaurants, fetchProducts, fetchEvents])

  // Cargar estadísticas de reseñas para cada restaurante una vez cargados
  useEffect(() => {
    if (restaurants.length > 0) {
      restaurants.forEach(res => {
        fetchRestaurantStats(res._id || res.id)
      })
    }
  }, [restaurants, fetchRestaurantStats])

  // Filtrado inteligente de restaurantes
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.category?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'Todos' || r.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [restaurants, searchTerm, selectedCategory])

  // Filtrado inteligente de productos
  const filteredProducts = useMemo(() => {
    if (!searchTerm && selectedCategory === 'Todos') return products.slice(0, 4)
    
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const categoryName = p.category?.name || p.category || ''
      const matchesCategory = selectedCategory === 'Todos' || categoryName === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  const categories = ['Todos', 'Comida rapida', 'Italiana', 'Mexicana', 'Asiatica']

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-24"
    >
      {/* Hero Section Rediseñada */}
      <section className="relative overflow-hidden rounded-[3rem] bg-zinc-900 border border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center min-h-[400px]">
          
          {/* Columna Izquierda: Texto y Buscador */}
          <div className="relative z-10 p-8 md:p-16 lg:pr-0">
            
            <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
              El sabor que <span className="text-orange-500 italic">mereces</span>, {user?.name?.split(' ')[0] || user?.username?.split(' ')[0] || 'Gourmet'}.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-zinc-400 text-lg mb-10 font-medium max-w-md leading-relaxed">
              Descubre experiencias gastronómicas únicas y reserva en los lugares más exclusivos de la ciudad.
            </motion.p>
            
            <motion.div variants={itemVariants} className="relative max-w-lg group">
              <div className="absolute inset-0 bg-orange-500/20 blur-2xl group-focus-within:bg-orange-500/30 transition-all opacity-0 group-focus-within:opacity-100" />
              <div className="relative flex items-center">
                <Search className={`absolute left-5 transition-colors ${searchTerm ? 'text-orange-500' : 'text-zinc-500'}`} size={22} />
                <input 
                  type="text" 
                  placeholder="Busca tu comida favorita..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-800/80 backdrop-blur-md border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-14 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-orange-500/50 focus:bg-zinc-800 transition-all outline-none text-base shadow-2xl"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-5 p-1 bg-zinc-700/50 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Columna Derecha: Visual */}
          <div className="relative h-full hidden lg:flex items-center justify-center p-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0}}
              animate={{ scale: 1, opacity: 1}}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 w-full max-w-md aspect-square rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(249,115,22,0.15)] border-4 border-white/5"
            >
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800" 
                className="w-full h-full object-cover scale-110"
                alt="Delicious food"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent mix-blend-overlay" />
            </motion.div>

            
          </div>
        </div>
        
        {/* Decoración de fondo extendida */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px]" />
      </section>

      {/* Próximos Eventos (Nueva Sección para Clientes) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <PartyPopper size={24} className="text-orange-500" />
            Eventos Especiales
          </h2>
          <button 
            onClick={() => navigate('/events')}
            className="text-orange-500 text-xs font-black uppercase tracking-widest hover:underline"
          >
            Ver todos
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {loadingEvents ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="min-w-[300px] h-40 rounded-[2rem]" />)
          ) : events.length > 0 ? (
            events.map((event) => (
              <motion.div
                key={event._id || event.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/events')}
                className="min-w-[300px] md:min-w-[400px] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group cursor-pointer"
              >
                <div className="relative z-10">
                  <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black px-3 py-1 rounded-full border border-orange-500/20 uppercase">
                    {event.type || 'Especial'}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-4 mb-2 group-hover:text-orange-500 transition-colors">{event.name || event.title}</h3>
                  <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5"><Clock size={14} className="text-orange-500" /> {new Date(event.startDate || event.date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-500" /> {event.restaurant?.name || 'Varios'}</div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <PartyPopper size={80} className="text-orange-500 rotate-12" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="w-full py-10 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
              <p className="text-zinc-600 text-sm italic font-medium">No hay eventos programados por ahora.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categorías */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-orange-500" />
          <h2 className="text-xl font-bold text-white">Categorías</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Restaurantes */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Utensils className="text-orange-500" size={24} />
            Restaurantes Populares
          </h2>
          <button onClick={() => navigate('/restaurants')} className="text-zinc-500 text-xs font-bold hover:text-white transition-colors flex items-center gap-1">
            Explorar todos <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingRestaurants ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)
          ) : filteredRestaurants.map((res) => {
              return (
                <motion.div 
                  key={res.id || res._id}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/restaurants/${res.id || res._id}`)}
                  className="bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden group cursor-pointer"
                >
                  <div className="relative h-48">
                    <img 
                      src={res.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[10px] font-black flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      {reviewsByProduct[res.id || res._id]?.promedioRating || 'Nuevo'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">{res.name}</h3>
                    <div className="flex items-center gap-4 text-zinc-500 text-xs">
                      <div className="flex items-center gap-1"><MapPin size={14} /> {res.address?.city}</div>
                      <div className="flex items-center gap-1"><Clock size={14} /> {res.openingTime} - {res.closingTime}</div>
                    </div>
                  </div>
                </motion.div>
              )
          })}
        </div>
      </section>

      {/* Sugerencias de Platos */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Heart className="text-orange-500" size={24} />
            Platos Sugeridos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingProducts ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)
          ) : filteredProducts.map((p) => (
            <motion.div 
              key={p.id || p._id}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/restaurants/${p.restaurant?._id || p.restaurant}`)}
              className="bg-zinc-900/40 border border-white/5 p-4 rounded-3xl flex gap-4 cursor-pointer hover:bg-zinc-800/60 transition-all"
            >
              <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" alt="" />
              <div className="flex flex-col justify-center min-w-0">
                <h4 className="text-white font-bold text-sm truncate">{p.name}</h4>
                <div className="flex items-center gap-1 mb-1">
                   <StarDisplay value={reviewsByProduct[p._id || p.id]?.promedioRating || 0} size={10} />
                </div>
                <p className="text-orange-500 font-black text-xs">Q {p.price}</p>
              </div>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && !loadingProducts && (
            <div className="col-span-full py-10 text-center">
              <Search size={40} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-bold">No encontramos resultados para tu búsqueda.</p>
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedProductForReview && (
          <Modal title={selectedProductForReview.name} onClose={() => setSelectedProductForReview(null)}>
            <div className="space-y-6">
              <img src={selectedProductForReview.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'} className="w-full h-48 object-cover rounded-3xl" alt="" />
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Reseñas</h3>
                {user?.roles?.includes('CLIENTE') && <button onClick={() => setShowWriteReview(true)} className="text-orange-500 text-sm font-bold flex items-center gap-1"><PartyPopper size={16} /> Escribir</button>}
              </div>
              <ProductReviews platoId={selectedProductForReview._id || selectedProductForReview.id} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ClientDashboard
