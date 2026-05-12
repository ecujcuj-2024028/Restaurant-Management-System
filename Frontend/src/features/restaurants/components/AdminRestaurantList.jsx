import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Plus, MapPin, Phone, Utensils } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useRestaurantStore from '../store/restaurantStore'
import RestaurantForm from './RestaurantForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const RestaurantList = () => {
  const { restaurants, loading, error, fetchRestaurants, deleteRestaurant } = useRestaurantStore()
  const [showForm, setShowForm] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  const handleDelete = async () => {
    const toastId = toast.loading('Eliminando restaurante...')
    try {
      await deleteRestaurant(confirmId)
      setConfirmId(null)
      fetchRestaurants()
      toast.success('Restaurante eliminado correctamente', { id: toastId })
    } catch (error) {
      toast.error(error?.message || 'Error al eliminar el restaurante', { id: toastId })
    }
  }

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant)
    setShowForm(true)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      {showForm && (
        <RestaurantForm 
          restaurant={editingRestaurant}
          onClose={() => {
            setShowForm(false)
            setEditingRestaurant(null)
            fetchRestaurants()
          }} 
        />
      )}

      {confirmId && (
        <ConfirmDialog
          message="Esta acción eliminará el restaurante permanentemente."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Restaurantes</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestiona las sedes y la información de tu cadena.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Nuevo Restaurante
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Restaurante</th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Ubicación</th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Contacto</th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Estado</th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && restaurants.length === 0 ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="px-8 py-5"><Skeleton className="h-12 w-48 rounded-xl" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-40 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-8 py-5 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : restaurants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-zinc-500 py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-zinc-800 rounded-full">
                        <Utensils size={40} className="opacity-20" />
                      </div>
                      <p className="font-medium">No hay restaurantes registrados aún.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {restaurants.map((restaurant, index) => (
                    <motion.tr 
                      key={restaurant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {restaurant.photos && restaurant.photos.length > 0 ? (
                            <img 
                              src={restaurant.photos[0]} 
                              alt={restaurant.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-white/5 group-hover:border-orange-500/30 transition-all shadow-lg" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                              {restaurant.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">{restaurant.name}</span>
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-tighter mt-0.5">{restaurant.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                          <MapPin size={14} className="text-zinc-500" />
                          <span className="line-clamp-1">{restaurant.address?.street || 'N/A'}, {restaurant.address?.city || ''}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                          <Phone size={14} className="text-zinc-500" />
                          <span>{restaurant.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${restaurant.isActive ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'}`}>
                          {restaurant.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(restaurant)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                            title="Editar"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmId(restaurant.id)}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
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
      </div>
    </motion.div>
  )
}

export default RestaurantList