import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Utensils, MapPin, Star, Search, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useRestaurantStore from '../store/restaurantStore'
import Skeleton from '../../../shared/components/ui/Skeleton'

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

const ClientRestaurantGrid = () => {
  const navigate = useNavigate()
  const { restaurants, fetchRestaurants, loading } = useRestaurantStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white">Nuestros Restaurantes</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Explore la variedad gastronómica de nuestra red.</p>
        </div>
        
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white text-sm focus:ring-2 focus:ring-orange-500/50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />)
        ) : filtered.map((restaurant) => (
          <motion.div
            key={restaurant.id || restaurant._id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -12 }}
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
                <div className="absolute top-4 left-6">
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    {restaurant.category}
                  </span>
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                  {restaurant.name}
                </h3>
                <div className="flex items-center gap-2 text-zinc-400 mb-6 font-medium text-sm">
                  <MapPin size={16} className="text-orange-500" />
                  <span className="line-clamp-1">{restaurant.address?.city}, {restaurant.address?.street}</span>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs font-bold">4.8</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase">Cierra a las {restaurant.closingTime || '22:00'}</span>
                  </div>
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-lg">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ClientRestaurantGrid
