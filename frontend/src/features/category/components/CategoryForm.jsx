import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
    try {
      const payload = {
        restaurantId: data.restaurantId,
        name: data.name.trim(),
        description: data.description.trim(),
      }

      if (isEditing) {
        const categoryId = getCategoryId(categoryToEdit)
        await updateCategory(categoryId, payload)
      } else {
        await createCategory(payload)
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      alert(error?.message || 'Error al guardar la categoría')
    }
  }

  return (
    <Modal
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-gray-300 text-sm mb-1 block">
            Restaurante *
          </label>

          <select
            {...register('restaurantId', {
              required: 'El restaurante es requerido',
            })}
            disabled={restaurantsLoading}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
          >
            <option value="">
              {restaurantsLoading
                ? 'Cargando restaurantes...'
                : 'Selecciona un restaurante'}
            </option>

            {restaurants.map((restaurant) => (
              <option
                key={restaurant._id || restaurant.id}
                value={restaurant._id || restaurant.id}
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

          {restaurantsError && (
            <p className="text-red-400 text-xs mt-1">
              Error al cargar restaurantes: {restaurantsError}
            </p>
          )}
        </div>

        <div>
          <label className="text-gray-300 text-sm mb-1 block">
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
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ej. Bebidas, Entradas, Platos fuertes"
          />

          {errors.name && (
            <p className="text-red-400 text-xs mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-gray-300 text-sm mb-1 block">
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
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Describe brevemente esta categoría"
            rows={4}
          />

          {errors.description && (
            <p className="text-red-400 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting || restaurantsLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Actualizar'
                : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryForm