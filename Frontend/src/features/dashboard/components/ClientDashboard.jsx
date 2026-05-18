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
  X,
  Plus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../auth/store/authStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useProductStore from '../../product/store/productStore'
import Skeleton from '../../../shared/components/ui/Skeleton'
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
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [selectedProductForReview, setSelectedProductForReview] = useState(null)
  const [showWriteReview, setShowWriteReview] = useState(false)

  useEffect(() => {
    fetchRestaurants()
    fetchProducts()
  }, [fetchRestaurants, fetchProducts])

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
    }).slice(0, 8)
  }, [products, searchTerm, selectedCategory])

  const categories = ['Todos', ...new Set(restaurants.map(r => r.category).filter(Boolean))]

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-20"
    >
      {/* Hero Section Rediseñada */}
      <section className="relative overflow-hidden rounded-[3rem] bg-zinc-900 border border-white/5 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center min-h-[400px]">
          
          {/* Columna Izquierda: Texto y Buscador */}
          <div className="relative z-10 p-8 md:p-16 lg:pr-0">
            <motion.div variants={itemVariants}>
            </motion.div>
            
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
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1}}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 w-full max-w-md aspect-square rounded-[3rem] overflow-hidden  border-4 border-white/5"
            >
              <img 
                src="https://res.cloudinary.com/dscti2jte/image/upload/v1779063294/36251f0b543c447bdd4e9925b1861023_zpnwlz.webp" 
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

      {/* Filtro de Categorías */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Filter size={18} className="text-orange-500" />
          Explorar Categorías
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Platillos (Dinámicos según búsqueda) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-orange-500" />
            {searchTerm ? `Platillos relacionados con "${searchTerm}"` : 'Platillos Recomendados'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingProducts ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-3xl" />)
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <motion.div 
                key={product.id || product._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ y: -5 }}
                className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:bg-zinc-900/60 transition-all group cursor-pointer"
                onClick={() => setSelectedProductForReview(product)}
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg">
                    Q {product.price}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold mb-1 truncate text-sm group-hover:text-orange-500 transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-500 text-[10px] font-medium line-clamp-1">
                      {product.restaurant?.name || 'Ver restaurante'}
                    </p>
                    <StarDisplay value={reviewsByProduct[product._id || product.id]?.promedioRating || 0} size={10} />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
              <p className="text-zinc-600 text-sm italic">No se encontraron platillos que coincidan.</p>
            </div>
          )}
        </div>
      </section>

      {/* Modales de Reseñas */}
      <AnimatePresence>
        {selectedProductForReview && (
          <Modal 
            title={selectedProductForReview.name} 
            onClose={() => setSelectedProductForReview(null)}
          >
            <div className="space-y-6">
              <img 
                src={selectedProductForReview.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'} 
                className="w-full h-48 object-cover rounded-3xl"
                alt=""
              />
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Reseñas de la comunidad</h3>
                <button 
                  onClick={() => setShowWriteReview(true)}
                  className="text-orange-500 text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Escribir reseña
                </button>
              </div>

              <ProductReviews platoId={selectedProductForReview._id || selectedProductForReview.id} />
            </div>
          </Modal>
        )}

        {showWriteReview && selectedProductForReview && (
          <ReviewModal 
            product={selectedProductForReview}
            restauranteId={selectedProductForReview.restaurant?._id || selectedProductForReview.restaurant}
            onClose={() => setShowWriteReview(false)}
            onSuccess={() => {
                fetchReviewsByProduct(selectedProductForReview._id || selectedProductForReview.id)
            }}
          />
        )}
      </AnimatePresence>

      {/* Restaurantes (Dinámicos según búsqueda) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Utensils size={24} className="text-orange-500" />
            Restaurantes
          </h2>
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{filteredRestaurants.length} Resultados</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loadingRestaurants ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />)
          ) : filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id || restaurant._id}
                layout
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/restaurants/${restaurant.id || restaurant._id}`)}
              >
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-orange-500/30 transition-all shadow-xl">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={restaurant.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-4 left-6">
                      <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                        {restaurant.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-2 text-zinc-400 mb-6 text-sm">
                      <MapPin size={16} className="text-orange-500" />
                      <span className="line-clamp-1">{restaurant.address?.city}, {restaurant.address?.street}</span>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Clock size={16} />
                        <span className="text-xs font-bold">20-30 min</span>
                      </div>
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-lg">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Search size={40} className="text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 font-bold">No encontramos resultados para tu búsqueda.</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  )
}

export default ClientDashboard
