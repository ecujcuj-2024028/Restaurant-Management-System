import { useForm } from 'react-hook-form'
import useRestaurantStore from '../store/restaurantStore'

const RestaurantForm = ({ onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const createRestaurant = useRestaurantStore((state) => state.createRestaurant)

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('address[street]', data.street)
      formData.append('address[city]', data.city)
      formData.append('address[country]', data.country)
      formData.append('phone', data.phone)
      formData.append('category', data.category)
      if (data.description) formData.append('description', data.description)
      if (data.image && data.image[0]) formData.append('image', data.image[0])
      await createRestaurant(formData)
      onClose()
    } catch (error) {
      alert(error?.response?.data?.message || 'Error al crear el restaurante')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">Nuevo Restaurante</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Nombre *</label>
            <input
              {...register('name', { required: 'El nombre es requerido' })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nombre del restaurante"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Calle *</label>
            <input
              {...register('street', { required: 'La calle es requerida' })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Calle y número"
            />
            {errors.street && <p className="text-red-400 text-xs mt-1">{errors.street.message}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Ciudad *</label>
            <input
              {...register('city', { required: 'La ciudad es requerida' })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ciudad"
            />
            {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">País *</label>
            <input
              {...register('country', { required: 'El país es requerido' })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Guatemala"
            />
            {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country.message}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Teléfono *</label>
            <input
              {...register('phone', { required: 'El teléfono es requerido' })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="12345678"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Categoría *</label>
            <select
            {...register('category', { required: 'La categoría es requerida' })}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
            <option value="">Selecciona una categoría</option>
            <option value="Comida rapida">Comida rapida</option>
            <option value="Italiana">Italiana</option>
            <option value="Mexicana">Mexicana</option>
            <option value="Asiatica">Asiática</option>
            <option value="Other">Otra</option>
            </select>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Descripción</label>
            <textarea
              {...register('description')}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Descripción del restaurante"
              rows={3}
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Imagen</label>
            <input
              {...register('image')}
              type="file"
              accept="image/*"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
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
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Restaurante'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default RestaurantForm