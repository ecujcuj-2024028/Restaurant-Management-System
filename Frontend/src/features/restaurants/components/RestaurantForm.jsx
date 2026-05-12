import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { Image as ImageIcon, X, ShieldAlert, Save } from 'lucide-react'
import useRestaurantStore from '../store/restaurantStore'
import useAuthStore from '../../auth/store/authStore'
import Modal from '../../../shared/components/ui/Modal'

const RestaurantForm = ({ onClose, restaurant }) => {
  const isEditing = !!restaurant
  const [preview, setPreview] = useState(null)
  const user = useAuthStore((state) => state.user)
  
  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN_SISTEMA' || role === 'ADMIN_RESTAURANTE'
  )

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEditing ? {
      name: restaurant.name,
      street: restaurant.address?.street,
      city: restaurant.address?.city,
      country: restaurant.address?.country,
      phone: restaurant.phone,
      category: restaurant.category,
      description: restaurant.description,
      ownerId: restaurant.ownerId // Cargamos el ID del propietario actual
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
      
      // Enviamos el ownerId si es edición y el usuario es admin
      if (isAdmin && data.ownerId) {
        formData.append('ownerId', data.ownerId)
      }

      if (data.description) formData.append('description', data.description)
      if (data.image && data.image[0]) formData.append('image', data.image[0])
      
      if (isEditing) {
        await updateRestaurant(restaurant.id || restaurant._id, formData)
        toast.success('Restaurante actualizado correctamente', { id: toastId })
      } else {
        await createRestaurant(formData)
        toast.success('Restaurante creado correctamente', { id: toastId })
      }
      onSuccess?.()
      onClose()
    } catch (error) {
      const message = error?.response?.data?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el restaurante`
      toast.error(message, { id: toastId })
    }
  }

  return (
    <Modal 
      title={isEditing ? 'Configuración de Restaurante' : 'Nuevo Restaurante'} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-1">
        {/* Identificación Básica */}
        <div className="space-y-4">
          <div>
            <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block">Nombre Comercial</label>
            <input
              {...register('name', { required: 'El nombre es requerido' })}
              className="w-full bg-zinc-800/50 border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 transition-all outline-none"
              placeholder="Ej. La Parrilla de Edvin"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block">Teléfono</label>
              <input
                {...register('phone', { required: true })}
                className="w-full bg-zinc-800/50 border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block">Categoría</label>
              <select
                {...register('category', { required: true })}
                className="w-full bg-zinc-800/50 border border-white/5 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer"
              >
                <option value="">Seleccionar...</option>
                <option value="Comida rapida">Comida rápida</option>
                <option value="Italiana">Italiana</option>
                <option value="Mexicana">Mexicana</option>
                <option value="Asiatica">Asiática</option>
                <option value="Gourmet">Gourmet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="p-6 bg-zinc-800/20 rounded-[2rem] border border-white/5 space-y-4">
          <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2 block text-center">Dirección Física</label>
          <input
            {...register('street', { required: true })}
            className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/50 outline-none"
            placeholder="Calle y Número..."
          />
          <div className="grid grid-cols-2 gap-4">
            <input {...register('city', { required: true })} className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/50 outline-none" placeholder="Ciudad" />
            <input {...register('country', { required: true })} className="w-full bg-zinc-900/50 border border-white/5 text-white rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-orange-500/50 outline-none" placeholder="País" />
          </div>
        </div>

        {/* Gestión de Propiedad (Solo Admins) */}
        {isAdmin && isEditing && (
          <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <ShieldAlert size={16} />
              <label className="text-[10px] font-black uppercase tracking-widest">Gestión de Propietario</label>
            </div>
            <input
              {...register('ownerId')}
              className="w-full bg-zinc-900/80 border border-orange-500/20 text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none"
              placeholder="ID del nuevo propietario..."
            />
            <p className="text-[9px] text-zinc-500 italic ml-2">* Ingrese el ID de usuario para transferir la gestión del restaurante.</p>
          </div>
        )}

        <div>
          <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1 mb-2 block">Imagen de Portada</label>
          <div className="relative group rounded-[2rem] overflow-hidden border-2 border-dashed border-white/5 bg-zinc-800/30 p-4 transition-all hover:border-orange-500/30">
            {(preview || (restaurant?.photos && restaurant.photos[0])) ? (
              <img src={preview || restaurant.photos[0]} alt="Preview" className="w-full aspect-video object-cover rounded-2xl" />
            ) : (
              <div className="py-12 flex flex-col items-center text-zinc-600">
                <ImageIcon size={48} strokeWidth={1} />
                <p className="text-[10px] font-bold uppercase mt-2">Cargar Fotografía</p>
              </div>
            )}
            <input {...register('image')} type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="flex gap-4 pt-4 pb-2">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-4 rounded-2xl font-bold transition-all">Cancelar</button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> {isEditing ? 'Guardar Cambios' : 'Registrar Restaurante'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default RestaurantForm
