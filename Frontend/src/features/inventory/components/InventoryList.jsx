import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Search,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useInventoryStore from '../store/inventoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import InventoryForm from './InventoryForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getInventoryItemId = (item) => item?.Id || item?.id || item?._id

const getInventoryName = (item) => item?.Name || item?.name || 'Sin nombre'

const getQuantity = (item) => Number(item?.Quantity ?? item?.quantity ?? 0)

const getMinStock = (item) => Number(item?.MinStock ?? item?.minStock ?? 0)

const getCost = (item) => Number(item?.CostPerUnit ?? item?.costPerUnit ?? item?.cost ?? 0)

const getUnit = (item) => item?.Unit || item?.unit || 'unidades'

const formatNumber = (value) => {
  const number = Number(value)

  if (Number.isNaN(number)) return '0'

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(3).replace(/\.?0+$/, '')
}

const InventoryList = () => {
  const {
    items,
    loading,
    error,
    fetchInventory,
    deleteInventoryItem,
    selectedRestaurantId,
    setSelectedRestaurant,
  } = useInventoryStore()

  const {
    restaurants,
    fetchRestaurants,
  } = useRestaurantStore()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchInventory(selectedRestaurantId)
    }
  }, [selectedRestaurantId, fetchInventory])

  const lowStockItems = useMemo(() => {
    return items.filter((item) => getQuantity(item) <= getMinStock(item))
  }, [items])

  const openCreateForm = () => {
    setItemToEdit(null)
    setIsFormOpen(true)
  }

  const openEditForm = (item) => {
    setItemToEdit(item)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setItemToEdit(null)
    setIsFormOpen(false)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    const itemId = getInventoryItemId(itemToDelete)
    const toastId = toast.loading('Eliminando insumo...')

    try {
      await deleteInventoryItem(itemId)
      setItemToDelete(null)
      toast.success('Insumo eliminado del inventario', { id: toastId })
    } catch (error) {
      toast.error(error?.message || 'Error al eliminar el insumo', { id: toastId })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      {isFormOpen && (
        <InventoryForm
          itemToEdit={itemToEdit}
          onClose={closeForm}
        />
      )}

      {itemToDelete && (
        <ConfirmDialog
          message={`Esta acción eliminará el insumo "${getInventoryName(itemToDelete)}" del inventario.`}
          onConfirm={handleDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package size={30} className="text-orange-500" />
              Inventario
            </h1>

            {selectedRestaurantId && lowStockItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-tighter ring-1 ring-red-500/20 animate-pulse">
                <AlertTriangle size={13} />
                {lowStockItems.length} en stock bajo
              </span>
            )}

            {selectedRestaurantId && lowStockItems.length === 0 && items.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-tighter ring-1 ring-emerald-500/20">
                Stock estable
              </span>
            )}
          </div>

          <p className="text-zinc-400 mt-1 text-sm">
            Control de stock e insumos por restaurante.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={selectedRestaurantId}
            onChange={(event) => setSelectedRestaurant(event.target.value)}
            className="bg-zinc-900 border border-white/5 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer min-w-55"
          >
            <option value="">Selecciona un restaurante...</option>
            {restaurants.map((restaurant) => (
              <option
                key={restaurant._id || restaurant.id}
                value={restaurant._id || restaurant.id}
                className="bg-zinc-900"
              >
                {restaurant.name}
              </option>
            ))}
          </select>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95"
          >
            <Plus size={20} />
            Nuevo Insumo
          </button>
        </div>
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
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                  Nombre
                </th>
                <th className="px-6 py-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center">
                  Costo Unit.
                </th>
                <th className="px-6 py-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center">
                  Stock Actual
                </th>
                <th className="px-6 py-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest text-center">
                  Estado
                </th>
                <th className="px-6 py-4 text-zinc-400 text-[10px] font-black uppercase tracking-widest text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {!selectedRestaurantId ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-zinc-800 rounded-full">
                        <Search size={40} className="opacity-20" />
                      </div>
                      <p className="font-medium">
                        Selecciona un restaurante para ver su inventario.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : loading && items.length === 0 ? (
                [1, 2, 3, 4, 5].map((index) => (
                  <tr key={index}>
                    <td className="px-6 py-5">
                      <Skeleton className="h-10 w-40 rounded-xl" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-6 w-16 mx-auto rounded-lg" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-6 w-24 mx-auto rounded-lg" />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Skeleton className="h-8 w-20 ml-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-zinc-800 rounded-full">
                        <Package size={40} className="opacity-20" />
                      </div>
                      <p className="font-medium">
                        No hay insumos registrados en este restaurante.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {items.map((item, index) => {
                    const itemId = getInventoryItemId(item)
                    const name = getInventoryName(item)
                    const quantity = getQuantity(item)
                    const minStock = getMinStock(item)
                    const cost = getCost(item)
                    const unit = getUnit(item)
                    const isLowStock = quantity <= minStock

                    return (
                      <motion.tr
                        key={itemId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <p className="text-white font-bold group-hover:text-orange-500 transition-colors">
                            {name}
                          </p>
                          <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter mt-0.5">
                            {unit}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-center text-zinc-400 font-mono font-medium">
                          Q {cost.toFixed(2)}
                        </td>

                        <td className="px-6 py-5 text-center">
                          <span className={`text-sm font-black ${isLowStock ? 'text-red-400' : 'text-zinc-200'}`}>
                            {formatNumber(quantity)}
                            <span className="text-zinc-500 font-bold text-[10px]">
                              {' '} / MIN {formatNumber(minStock)}
                            </span>
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex justify-center">
                            {isLowStock ? (
                              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-tighter ring-1 ring-red-500/20 animate-pulse">
                                <AlertTriangle size={12} />
                                Stock Bajo
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-tighter ring-1 ring-emerald-500/20">
                                Estable
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(item)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && items.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-2 w-full max-w-md rounded-full" />
        </div>
      )}
    </motion.div>
  )
}

export default InventoryList