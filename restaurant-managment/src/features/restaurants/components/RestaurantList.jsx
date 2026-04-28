import { useEffect, useState } from 'react'
import useRestaurantStore from '../store/restaurantStore'
import RestaurantForm from './RestaurantForm'
import Spinner from '../../../shared/components/layout/Spinner'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const RestaurantList = () => {
  const { restaurants, loading, error, fetchRestaurants, deleteRestaurant } = useRestaurantStore()
  const [showForm, setShowForm] = useState(false)
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

  if (loading) return <Spinner />
  if (error) return <div className="text-red-400 text-center mt-10">Error: {error}</div>

  return (
    <div>
      {showForm && (
        <RestaurantForm onClose={() => {
          setShowForm(false)
          fetchRestaurants()
        }} />
      )}

      {confirmId && (
        <ConfirmDialog
          message="Esta acción eliminará el restaurante permanentemente."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Restaurantes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + Nuevo Restaurante
        </button>
      </div>

      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm px-6 py-4">Restaurante</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4">Dirección</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4">Teléfono</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4">Estado</th>
              <th className="text-left text-gray-400 text-sm px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No hay restaurantes registrados
                </td>
              </tr>
            ) : (
              restaurants.map((restaurant) => (
                <tr key={restaurant.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {restaurant.logo ? (
                        <img src={restaurant.logo} alt={restaurant.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                          {restaurant.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{restaurant.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{restaurant.address?.street || 'N/A'}, {restaurant.address?.city || ''}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm">{restaurant.phone || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${restaurant.isActive ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'}`}>
                      {restaurant.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmId(restaurant.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Eliminar
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