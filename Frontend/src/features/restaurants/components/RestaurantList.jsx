import { useEffect, useState } from 'react'
import { Edit3, Trash2, Plus, MapPin, Phone } from 'lucide-react'
import useRestaurantStore from '../store/restaurantStore'
import RestaurantForm from './RestaurantForm'
import Spinner from '../../../shared/components/layout/Spinner'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const RestaurantList = () => {
  const { restaurants, loading, error, fetchRestaurants, deleteRestaurant } = useRestaurantStore()
  const [showForm, setShowForm] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const handleDelete = async () => {
    try {
      await deleteRestaurant(confirmId)
      setConfirmId(null)
      fetchRestaurants()
    } catch (error) {
      alert('Error al eliminar el restaurante')
    }
  }

  const handleEdit = (restaurant) => {
    setEditingRestaurant(restaurant)
    setShowForm(true)
  }

  if (loading) return <Spinner />
  if (error) return <div className="text-red-400 text-center mt-10">Error: {error}</div>

  return (
    <div className="animate-in fade-in duration-500">
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Restaurantes</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestiona las sedes y la información de tu cadena.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo Restaurante
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-800/50 border-b border-zinc-800">
              <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Restaurante</th>
              <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Ubicación</th>
              <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Contacto</th>
              <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Estado</th>
              <th className="text-right text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-zinc-500 py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Utensils size={40} className="text-zinc-700" />
                    <p>No hay restaurantes registrados aún.</p>
                  </div>
                </td>
              </tr>
            ) : (
              restaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {restaurant.logo ? (
                        <img src={restaurant.logo} alt={restaurant.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-zinc-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {restaurant.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">{restaurant.name}</span>
                        <span className="text-zinc-500 text-xs mt-0.5">{restaurant.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <MapPin size={14} className="text-zinc-500" />
                      <span>{restaurant.address?.street || 'N/A'}, {restaurant.address?.city || ''}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Phone size={14} className="text-zinc-500" />
                      <span>{restaurant.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${restaurant.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {restaurant.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(restaurant)}
                        className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmId(restaurant.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RestaurantList