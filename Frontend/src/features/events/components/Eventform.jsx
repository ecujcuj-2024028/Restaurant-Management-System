import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { ImagePlus, Loader2 } from 'lucide-react'
import useEventStore from '../store/eventStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import Modal from '../../../shared/components/ui/Modal'

const getEventId = (event) => event?._id || event?.id

const getRestaurantId = (event) => {
  if (!event?.restaurant) return ''
  if (typeof event.restaurant === 'object')
    return event.restaurant._id || event.restaurant.id || ''
  return event.restaurant
}

const EventForm = ({ eventToEdit = null, onClose, onSuccess }) => {
  const isEditing = Boolean(eventToEdit)

  const createEvent = useEventStore((state) => state.createEvent)
  const updateEvent = useEventStore((state) => state.updateEvent)

  const restaurants = useRestaurantStore((state) => state.restaurants)
  const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

  const [imagePreview, setImagePreview] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantId: '',
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      capacity: '',
      price: '',
    },
  })

  useEffect(() => {
    fetchRestaurants().finally(() => setInitialLoading(false))
  }, [fetchRestaurants])

  useEffect(() => {
    if (!initialLoading && eventToEdit) {
      const toISOLocal = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - offset * 60000)
        return local.toISOString().slice(0, 16)
      }

      reset({
        restaurantId: getRestaurantId(eventToEdit),
        name: eventToEdit.name || '',
        description: eventToEdit.description || '',
        startDate: toISOLocal(eventToEdit.startDate),
        endDate: toISOLocal(eventToEdit.endDate),
        capacity: eventToEdit.capacity ?? '',
        price: eventToEdit.price ?? '',
      })
      if (eventToEdit.image) setImagePreview(eventToEdit.image)
    }
  }, [eventToEdit, initialLoading, reset])

  const imageFile = watch('image')
  useEffect(() => {
    if (imageFile && imageFile[0]) {
      const url = URL.createObjectURL(imageFile[0])
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  const onSubmit = async (data) => {
  const toastId = toast.loading(
    isEditing ? 'Actualizando evento...' : 'Creando evento...'
  )
  try {
    const payload = {
      restaurantId: data.restaurantId,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    }

    if (data.capacity) payload.capacity = Number(data.capacity)
    if (data.price !== '' && data.price !== undefined) payload.price = Number(data.price)

    if (isEditing) {
      await updateEvent(getEventId(eventToEdit), payload)
      toast.success('Evento actualizado correctamente', { id: toastId })
    } else {
      await createEvent(payload)
      toast.success('Evento creado correctamente', { id: toastId })
    }

    if (onSuccess) onSuccess()
    onClose()
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Error al guardar el evento'
    toast.error(message, { id: toastId })
  }
}

  const inputCls =
    'w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 disabled:opacity-50'
  const labelCls =
    'text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70'
  const errorCls = 'text-red-400 text-[10px] mt-1 font-medium'

  return (
    <Modal
      title={isEditing ? 'Editar evento' : 'Nuevo evento'}
      onClose={onClose}
    >
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">
            Cargando información necesaria...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Información general ── */}
          <div className="space-y-4">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
              Información General
            </h3>

            {/* Restaurante */}
            <div>
              <label className={labelCls}>Restaurante *</label>
              <select
                {...register('restaurantId', { required: 'Requerido' })}
                className={`${inputCls} appearance-none cursor-pointer`}
              >
                <option value="">Selecciona...</option>
                {restaurants.map((r) => (
                  <option
                    key={r._id || r.id}
                    value={r._id || r.id}
                    className="bg-zinc-900"
                  >
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.restaurantId && (
                <p className={errorCls}>{errors.restaurantId.message}</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className={labelCls}>Nombre del evento *</label>
              <input
                {...register('name', { required: 'El nombre es requerido' })}
                className={inputCls}
                placeholder="Ej. Noche de Jazz & Vinos"
              />
              {errors.name && (
                <p className={errorCls}>{errors.name.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className={labelCls}>Descripción</label>
              <textarea
                {...register('description')}
                rows="3"
                className={`${inputCls} resize-none`}
                placeholder="Describe el evento, actividades, temática..."
              />
            </div>
          </div>

          {/* ── Fechas ── */}
          <div className="space-y-4">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
              Fechas y Horarios
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fecha de inicio *</label>
                <input
                  type="datetime-local"
                  {...register('startDate', { required: 'Requerida' })}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                {errors.startDate && (
                  <p className={errorCls}>{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Fecha de fin *</label>
                <input
                  type="datetime-local"
                  {...register('endDate', { required: 'Requerida' })}
                  className={`${inputCls} [color-scheme:dark]`}
                />
                {errors.endDate && (
                  <p className={errorCls}>{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Capacidad y precio ── */}
          <div className="space-y-4">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
              Capacidad y Precio
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Aforo máximo</label>
                <input
                  type="number"
                  min="1"
                  {...register('capacity')}
                  className={inputCls}
                  placeholder="Ej. 50"
                />
              </div>
              <div>
                <label className={labelCls}>Precio entrada (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price')}
                  className={inputCls}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* ── Imagen ── */}
          <div className="space-y-4">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
              Imagen del Evento
            </h3>

            <label className="flex flex-col items-center justify-center gap-3 w-full border-2 border-dashed border-zinc-700 hover:border-orange-500/50 rounded-3xl py-8 cursor-pointer transition-all bg-zinc-800/20">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-40 h-28 object-cover rounded-2xl shadow-xl ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
                  <ImagePlus size={32} />
                </div>
              )}
              <span className="text-zinc-500 text-xs font-medium">
                {imagePreview
                  ? 'Cambiar imagen del evento'
                  : 'Subir imagen del evento'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                {...register('image')}
              />
            </label>
          </div>

          {/* ── Botones ── */}
          <div className="flex gap-4 pt-6 border-t border-zinc-800">
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
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Crear Evento'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default EventForm