import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useCategoryStore from '../store/categoryStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const getCategoryId = (category) => category?._id || category?.id

const getRestaurantId = (category) => {
  if (!category?.restaurantId) return ''

  if (typeof category.restaurantId === 'object') {
    return category.restaurantId._id || category.restaurantId.id || ''
  }

  return category.restaurantId
}

const CategoryForm = ({ categoryToEdit = null, onClose, onSuccess }) => {
  const isEditing = Boolean(categoryToEdit)

  const createCategory = useCategoryStore((state) => state.createCategory)
  const updateCategory = useCategoryStore((state) => state.updateCategory)

  const restaurants = useRestaurantStore((state) => state.restaurants)
  const restaurantsLoading = useRestaurantStore((state) => state.loading)
  const restaurantsError = useRestaurantStore((state) => state.error)
  const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantId: '',
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    if (categoryToEdit) {
      reset({
        restaurantId: getRestaurantId(categoryToEdit),
        name: categoryToEdit.name || '',
        description: categoryToEdit.description || '',
      })
    }
  }, [categoryToEdit, reset])

  const onSubmit = async (data) => {
    const toastId = toast.loading(isEditing ? 'Actualizando categoría...' : 'Creando categoría...')
    try {
      const payload = {
        restaurantId: data.restaurantId,
        name: data.name.trim(),
        description: data.description.trim(),
      }

      if (isEditing) {
        const categoryId = getCategoryId(categoryToEdit)
        await updateCategory(categoryId, payload)
        toast.success('Categoría actualizada correctamente', { id: toastId })
      } else {
        await createCategory(payload)
        toast.success('Categoría creada correctamente', { id: toastId })
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      const message = error?.message || 'Error al guardar la categoría'
      toast.error(message, { id: toastId })
    }
  }

  return (
    <Modal
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
            Restaurante *
          </label>

          <select
            {...register('restaurantId', {
              required: 'El restaurante es requerido',
            })}
            disabled={restaurantsLoading}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer disabled:opacity-60"
          >
            <option value="" className="bg-zinc-900">
              {restaurantsLoading
                ? 'Cargando restaurantes...'
                : 'Selecciona un restaurante'}
            </option>

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
            <p className="text-red-400 text-xs mt-1.5 ml-1">
              {errors.restaurantId.message}
            </p>
          )}

          {restaurantsError && (
            <p className="text-red-400 text-xs mt-1.5 ml-1">
              Error al cargar restaurantes: {restaurantsError}
            </p>
          )}
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
            Nombre *
          </label>

          <input
            {...register('name', {
              required: 'El nombre es requerido',
              minLength: {
                value: 2,
                message: 'El nombre debe tener al menos 2 caracteres',
              },
              maxLength: {
                value: 60,
                message: 'El nombre no puede exceder 60 caracteres',
              },
            })}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
            placeholder="Ej. Bebidas, Entradas..."
          />

          {errors.name && (
            <p className="text-red-400 text-xs mt-1.5 ml-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
            Descripción *
          </label>

          <textarea
            {...register('description', {
              required: 'La descripción es requerida',
              minLength: {
                value: 3,
                message: 'La descripción debe tener al menos 3 caracteres',
              },
              maxLength: {
                value: 255,
                message: 'La descripción no puede exceder 255 caracteres',
              },
            })}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none placeholder:text-zinc-600"
            placeholder="Describe brevemente esta categoría"
            rows={4}
          />

          {errors.description && (
            <p className="text-red-400 text-xs mt-1.5 ml-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl text-sm font-semibold transition-all"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting || restaurantsLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Actualizar'
                : 'Crear Categoría'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryForm