import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useEffect } from 'react'
import useInventoryStore from '../store/inventoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const InventoryForm = ({ itemToEdit = null, onClose }) => {
  const isEditing = Boolean(itemToEdit)
  const createItem = useInventoryStore((state) => state.createInventoryItem)
  const updateItem = useInventoryStore((state) => state.updateInventoryItem)
  const selectedRestaurantId = useInventoryStore((state) => state.selectedRestaurantId)
  const restaurants = useRestaurantStore((state) => state.restaurants)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      quantity: '',
      minStock: '',
      cost: '',
      unit: 'unidades',
      restaurantId: selectedRestaurantId || ''
    }
  })


  
  // Normalización de datos para que el formulario se llene correctamente
  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.Name || itemToEdit.name || '',
        quantity: itemToEdit.Quantity ?? itemToEdit.stock ?? itemToEdit.quantity ?? 0,
        minStock: itemToEdit.MinStock ?? itemToEdit.minStock ?? 0,
        cost: itemToEdit.CostPerUnit ?? itemToEdit.cost ?? 0,
        unit: itemToEdit.Unit || itemToEdit.unit || 'unidades',
        restaurantId: itemToEdit.RestaurantId || itemToEdit.restaurantId?._id || itemToEdit.restaurantId || ''
      })
    }
  }, [itemToEdit, reset])

  const onSubmit = async (data) => {
    const toastId = toast.loading(isEditing ? 'Actualizando item...' : 'Agregando al inventario...')
    try {
      if (isEditing) {
        // Aseguramos que usamos el ID correcto (id, _id o Id)
        const id = itemToEdit.id || itemToEdit._id || itemToEdit.Id
        await updateItem(id, data)
        toast.success('Inventario actualizado', { id: toastId })
      } else {
        await createItem(data)
        toast.success('Item agregado correctamente', { id: toastId })
      }
      onClose()
    } catch (error) {
      toast.error(error.message || 'Error al procesar la solicitud', { id: toastId })
    }
  }

  return (
    <Modal title={isEditing ? 'Editar Item' : 'Nuevo Item de Inventario'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Restaurante</label>
          <select
            {...register('restaurantId', { required: 'El restaurante es requerido' })}
            disabled={isEditing}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">Seleccionar restaurante...</option>
            {restaurants.map(r => (
              <option key={r._id || r.id} value={r._id || r.id} className="bg-zinc-900">{r.name}</option>
            ))}
          </select>
          {errors.restaurantId && <p className="text-red-400 text-xs mt-1">{errors.restaurantId.message}</p>}
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Nombre del Insumo</label>
          <input
            {...register('name', { required: 'El nombre es requerido' })}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            placeholder="Ej. Tomates, Harina..."
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Costo Unitario (Q)</label>
            <input
              type="number"
              step="0.01"
              {...register('cost', { required: 'Requerido', min: 0 })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Unidad de Medida</label>
            <select
              {...register('unit')}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
            >
              <option value="unidades" className="bg-zinc-900">Unidades</option>
              <option value="kg" className="bg-zinc-900">Kilogramos (kg)</option>
              <option value="l" className="bg-zinc-900">Litros (l)</option>
              <option value="g" className="bg-zinc-900">Gramos (g)</option>
              <option value="ml" className="bg-zinc-900">Mililitros (ml)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Cantidad Stock</label>
            <input
              type="number"
              {...register('quantity', { required: 'Requerido', min: 0 })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Stock Mínimo</label>
            <input
              type="number"
              {...register('minStock', { required: 'Requerido', min: 0 })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-sm font-semibold transition-all">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50">
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Agregar')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default InventoryForm
