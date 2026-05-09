import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useInventoryStore from '../store/inventoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const getInventoryItemId = (item) => item?.Id || item?.id || item?._id

const getRestaurantId = (item) => {
  if (!item) return ''

  return (
    item.RestaurantId ||
    item.restaurantId?._id ||
    item.restaurantId ||
    item.restaurant ||
    ''
  )
}

const InventoryForm = ({ itemToEdit = null, onClose }) => {
  const isEditing = Boolean(itemToEdit)

  const createInventoryItem = useInventoryStore((state) => state.createInventoryItem)
  const updateInventoryItem = useInventoryStore((state) => state.updateInventoryItem)
  const selectedRestaurantId = useInventoryStore((state) => state.selectedRestaurantId)

  const restaurants = useRestaurantStore((state) => state.restaurants)
  const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantId: selectedRestaurantId || '',
      name: '',
      quantity: 0,
      minStock: 5,
      cost: 0,
      unit: 'unidades',
    },
  })

  useEffect(() => {
    if (restaurants.length === 0) {
      fetchRestaurants()
    }
  }, [restaurants.length, fetchRestaurants])

  useEffect(() => {
    if (itemToEdit) {
      reset({
        restaurantId: getRestaurantId(itemToEdit),
        name: itemToEdit.Name || itemToEdit.name || '',
        quantity: Number(itemToEdit.Quantity ?? itemToEdit.quantity ?? 0),
        minStock: Number(itemToEdit.MinStock ?? itemToEdit.minStock ?? 5),
        cost: Number(itemToEdit.CostPerUnit ?? itemToEdit.costPerUnit ?? itemToEdit.cost ?? 0),
        unit: itemToEdit.Unit || itemToEdit.unit || 'unidades',
      })
      return
    }

    reset({
      restaurantId: selectedRestaurantId || '',
      name: '',
      quantity: 0,
      minStock: 5,
      cost: 0,
      unit: 'unidades',
    })
  }, [itemToEdit, selectedRestaurantId, reset])

  const onSubmit = async (formData) => {
    const payload = {
      ...formData,
      restaurantId: formData.restaurantId || selectedRestaurantId,
    }

    if (!payload.restaurantId) {
      toast.error('Debe seleccionar un restaurante')
      return
    }

    const toastId = toast.loading(
      isEditing ? 'Actualizando insumo...' : 'Agregando insumo...'
    )

    try {
      if (isEditing) {
        const itemId = getInventoryItemId(itemToEdit)

        if (!itemId) {
          throw new Error('No se encontró el ID del insumo a editar')
        }

        await updateInventoryItem(itemId, payload)
        toast.success('Insumo actualizado correctamente', { id: toastId })
      } else {
        await createInventoryItem(payload)
        toast.success('Insumo agregado correctamente', { id: toastId })
      }

      onClose()
    } catch (error) {
      toast.error(error?.message || 'Error al guardar el insumo', { id: toastId })
    }
  }

  return (
    <Modal
      title={isEditing ? 'Editar Insumo' : 'Nuevo Insumo de Inventario'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
            Restaurante
          </label>

          <select
            {...register('restaurantId', {
              required: 'El restaurante es requerido',
            })}
            disabled={isEditing}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar restaurante...</option>
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

          {errors.restaurantId && (
            <p className="text-red-400 text-xs mt-1">
              {errors.restaurantId.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
            Nombre del Insumo
          </label>

          <input
            {...register('name', {
              required: 'El nombre es requerido',
              maxLength: {
                value: 100,
                message: 'El nombre no puede superar 100 caracteres',
              },
            })}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            placeholder="Ej. Tomates, Harina, Queso..."
          />

          {errors.name && (
            <p className="text-red-400 text-xs mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Costo Unitario (Q)
            </label>

            <input
              type="number"
              step="0.01"
              {...register('cost', {
                required: 'El costo es requerido',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'El costo no puede ser negativo',
                },
              })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="0.00"
            />

            {errors.cost && (
              <p className="text-red-400 text-xs mt-1">
                {errors.cost.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Unidad de Medida
            </label>

            <select
              {...register('unit', {
                required: 'La unidad de medida es requerida',
              })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
            >
              <option value="unidades" className="bg-zinc-900">Unidades</option>
              <option value="kg" className="bg-zinc-900">Kilogramos (kg)</option>
              <option value="g" className="bg-zinc-900">Gramos (g)</option>
              <option value="l" className="bg-zinc-900">Litros (l)</option>
              <option value="ml" className="bg-zinc-900">Mililitros (ml)</option>
            </select>

            {errors.unit && (
              <p className="text-red-400 text-xs mt-1">
                {errors.unit.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Cantidad Stock
            </label>

            <input
              type="number"
              step="0.001"
              {...register('quantity', {
                required: 'La cantidad es requerida',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'La cantidad no puede ser negativa',
                },
              })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="0"
            />

            {errors.quantity && (
              <p className="text-red-400 text-xs mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">
              Stock Mínimo
            </label>

            <input
              type="number"
              step="0.001"
              {...register('minStock', {
                required: 'El stock mínimo es requerido',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'El stock mínimo no puede ser negativo',
                },
              })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="5"
            />

            {errors.minStock && (
              <p className="text-red-400 text-xs mt-1">
                {errors.minStock.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default InventoryForm