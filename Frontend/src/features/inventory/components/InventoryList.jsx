import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, Package, Search } from 'lucide-react'
import useInventoryStore from '../store/inventoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import InventoryForm from './InventoryForm'
import { toast } from 'react-hot-toast'

const InventoryList = () => {
  const { items, loading, fetchInventory, deleteInventoryItem, selectedRestaurantId, setSelectedRestaurant } = useInventoryStore()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchInventory(selectedRestaurantId)
    }
  }, [selectedRestaurantId, fetchInventory])

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este item?')) {
      try {
        await deleteInventoryItem(id)
        toast.success('Eliminado del inventario')
      } catch (error) {
        toast.error('Error al eliminar')
      }
    }
  }

  const handleEdit = (item) => {
    setItemToEdit(item)
    setIsFormOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Inventario
          </h1>
          <p className="text-zinc-400 mt-1">Control de stock e insumos por restaurante</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer min-w-[200px]"
          >
            <option value="">Selecciona un restaurante...</option>
            {restaurants.map(r => (
              <option key={r._id || r.id || `rest-${Math.random()}`} value={r._id || r.id}>{r.name}</option>
            ))}
          </select>

          <button
            onClick={() => { setItemToEdit(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            <Plus size={20} /> Nuevo Insumo
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/30">
              <th className="px-6 py-4 text-zinc-400 text-xs font-bold uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-4 text-zinc-400 text-xs font-bold uppercase tracking-wider text-center">Costo Unit. (Q)</th>
              <th className="px-6 py-4 text-zinc-400 text-xs font-bold uppercase tracking-wider text-center">Stock Actual</th>
              <th className="px-6 py-4 text-zinc-400 text-xs font-bold uppercase tracking-wider text-center">Estado</th>
              <th className="px-6 py-4 text-zinc-400 text-xs font-bold uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {!selectedRestaurantId ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-zinc-500">
                <div className="flex flex-col items-center gap-3">
                    <Search size={40} className="opacity-20" />
                    <p>Selecciona un restaurante para ver su inventario</p>
                </div>
              </td></tr>
            ) : loading ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-zinc-500">Cargando inventario...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-zinc-500">No hay insumos registrados en este restaurante</td></tr>
            ) : items.filter(item => !item.MongoProductId).map((item, index) => {
              const id = item.id || item._id || `inv-${index}`
              const name = item.Name || item.name || 'Sin nombre'
              const stock = Number(item.Quantity ?? item.quantity ?? 0)
              const minStock = Number(item.MinStock ?? item.minStock ?? 0)
              const cost = Number(item.CostPerUnit ?? item.cost ?? 0)
              const unit = item.Unit || item.unit || 'unidades'
              const isLowStock = stock <= minStock
              
              return (
                <tr key={id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-white font-semibold">{name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{unit}</p>
                  </td>
                  <td className="px-6 py-5 text-center text-zinc-400 font-mono">
                    {cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-sm font-bold ${isLowStock ? 'text-red-400' : 'text-zinc-300'}`}>
                      {stock} <span className="text-zinc-500 font-normal text-xs">/ min {minStock}</span>
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      {isLowStock ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase ring-1 ring-red-500/20">
                          <AlertTriangle size={12} /> Stock Bajo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase ring-1 ring-green-500/20">
                          Normal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <InventoryForm
          itemToEdit={itemToEdit}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  )
}

export default InventoryList
