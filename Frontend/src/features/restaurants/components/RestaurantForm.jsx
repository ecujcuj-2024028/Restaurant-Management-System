import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import useRestaurantStore from '../store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const RestaurantForm = ({ onClose, restaurant }) => {
  const isEditing = !!restaurant
  const [preview, setPreview] = useState(null)
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEditing ? {
      name: restaurant.name,
      street: restaurant.address?.street,
      city: restaurant.address?.city,
      country: restaurant.address?.country,
      phone: restaurant.phone,
      category: restaurant.category,
      description: restaurant.description
    } : {}
  })

  const selectedImage = watch('image')

  useEffect(() => {
    if (selectedImage && selectedImage[0]) {
      const url = URL.createObjectURL(selectedImage[0])
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [selectedImage])
  
  const createRestaurant = useRestaurantStore((state) => state.createRestaurant)
  const updateRestaurant = useRestaurantStore((state) => state.updateRestaurant)

  const onSubmit = async (data) => {
    const toastId = toast.loading(isEditing ? 'Actualizando restaurante...' : 'Creando restaurante...')
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
      
      if (isEditing) {
        await updateRestaurant(restaurant.id, formData)
        toast.success('Restaurante actualizado correctamente', { id: toastId })
      } else {
        await createRestaurant(formData)
        toast.success('Restaurante creado correctamente', { id: toastId })
      }
      onClose()
    } catch (error) {
      const message = error?.response?.data?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el restaurante`
      toast.error(message, { id: toastId })
    }
  }

  return (
    <Modal 
      title={isEditing ? 'Editar Restaurante' : 'Nuevo Restaurante'} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Nombre del restaurante</label>
          <input
            {...register('name', { required: 'El nombre es requerido' })}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
            placeholder="Ej. La Parrilla de Edvin"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Calle y Número</label>
            <input
              {...register('street', { required: 'La calle es requerida' })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
              placeholder="Calle 123..."
            />
            {errors.street && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.street.message}</p>}
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Ciudad</label>
            <input
              {...register('city', { required: 'La ciudad es requerida' })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
              placeholder="Ciudad"
            />
            {errors.city && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">País</label>
            <input
              {...register('country', { required: 'El país es requerido' })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
              placeholder="Guatemala"
            />
            {errors.country && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.country.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Teléfono</label>
            <input
              {...register('phone', { required: 'El teléfono es requerido' })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
              placeholder="12345678"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Categoría</label>
            <select
              {...register('category', { required: 'La categoría es requerida' })}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-zinc-500">Seleccionar...</option>
              <option value="Comida rapida" className="bg-zinc-900">Comida rápida</option>
              <option value="Italiana" className="bg-zinc-900">Italiana</option>
              <option value="Mexicana" className="bg-zinc-900">Mexicana</option>
              <option value="Asiatica" className="bg-zinc-900">Asiática</option>
              <option value="Other" className="bg-zinc-900">Otra</option>
            </select>
            {errors.category && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block">Descripción</label>
          <textarea
            {...register('description')}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none placeholder:text-zinc-600"
            placeholder="Breve descripción..."
            rows={3}
          />
        </div>

        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">Imagen de portada</label>
          
          <div className="mt-2 flex flex-col items-center gap-4 p-6 border-2 border-dashed border-zinc-700 rounded-3xl bg-zinc-800/30 transition-all hover:border-orange-500/50">
            {(preview || (restaurant?.photos && restaurant.photos[0])) ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg ring-1 ring-zinc-700">
                <img 
                  src={preview || restaurant.photos[0]} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                {preview && (
                  <button 
                    type="button"
                    onClick={() => setPreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <ImageIcon size={40} strokeWidth={1} />
                <p className="text-xs">No hay imagen seleccionada</p>
              </div>
            )}

            <input
              {...register('image')}
              type="file"
              accept="image/*"
              className="w-full text-xs text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20 cursor-pointer transition-all"
            />
          </div>
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
            disabled={isSubmitting}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {isSubmitting ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Restaurante')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default RestaurantForm
