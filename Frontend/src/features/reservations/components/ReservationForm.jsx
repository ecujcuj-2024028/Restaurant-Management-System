import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import useReservationStore from '../store/reservationStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useTableStore from '../../tables/store/tableStore'
import Modal from '../../../shared/components/ui/Modal'

const getReservationId = (r) => r?._id || r?.id

const getTableId = (table) => table?._id || table?.id

const getDefaultDate = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const getDefaultTime = () => '20:00'

const ReservationForm = ({ reservationToEdit = null, onClose, onSuccess }) => {
  const isEditing = Boolean(reservationToEdit)

  const createReservation = useReservationStore((state) => state.createReservation)
  const updateReservation = useReservationStore((state) => state.updateReservation)

  const restaurants = useRestaurantStore((state) => state.restaurants)
  const restaurantsLoading = useRestaurantStore((state) => state.loading)
  const fetchRestaurants = useRestaurantStore((state) => state.fetchRestaurants)

  const tables = useTableStore((state) => state.tables)
  const tablesLoading = useTableStore((state) => state.loading)
  const fetchTables = useTableStore((state) => state.fetchTables)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantId: '',
      tableId: '',
      customerName: '',
      customerPhone: '',
      date: getDefaultDate(),
      time: getDefaultTime(),
      guests: 2,
      notes: '',
      status: 'pendiente',
    },
  })

  const selectedRestaurantId = watch('restaurantId')

  useEffect(() => {
    fetchRestaurants()
    fetchTables()
  }, [fetchRestaurants, fetchTables])

  useEffect(() => {
    if (reservationToEdit) {
      const tableId =
        typeof reservationToEdit.table === 'object'
          ? getTableId(reservationToEdit.table)
          : reservationToEdit.tableId || reservationToEdit.table || ''

      const restaurantId =
        typeof reservationToEdit.restaurant === 'object'
          ? reservationToEdit.restaurant?._id || reservationToEdit.restaurant?.id || ''
          : reservationToEdit.restaurantId || reservationToEdit.restaurant || ''

      const dateVal = reservationToEdit.date
        ? new Date(reservationToEdit.date).toISOString().split('T')[0]
        : getDefaultDate()

      const timeVal = reservationToEdit.time || getDefaultTime()

      reset({
        restaurantId,
        tableId,
        customerName: reservationToEdit.customerName || '',
        customerPhone: reservationToEdit.customerPhone || '',
        date: dateVal,
        time: timeVal,
        guests: reservationToEdit.guests || reservationToEdit.numberOfGuests || 2,
        notes: reservationToEdit.notes || '',
        status: reservationToEdit.status || 'pendiente',
      })
    }
  }, [reservationToEdit, reset])

  // Filter tables by selected restaurant if the table has a restaurant reference
  const filteredTables = selectedRestaurantId
    ? tables.filter((t) => {
        const tRestaurantId =
          typeof t.restaurant === 'object'
            ? t.restaurant?._id || t.restaurant?.id
            : t.restaurant || t.restaurantId
        return !tRestaurantId || tRestaurantId === selectedRestaurantId
      })
    : tables

  const onSubmit = async (data) => {
    const toastId = toast.loading(
      isEditing ? 'Actualizando reservación...' : 'Creando reservación...'
    )
    try {
      const payload = {
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone?.trim() || undefined,
        date: data.date,
        time: data.time,
        guestCount: Number(data.guests),
        notes: data.notes?.trim() || undefined,
        ...(isEditing && { status: data.status }),
      }

      if (isEditing) {
        await updateReservation(getReservationId(reservationToEdit), payload)
        toast.success('Reservación actualizada', { id: toastId })
      } else {
        await createReservation(payload)
        toast.success('Reservación creada correctamente', { id: toastId })
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      toast.error(error?.message || 'Error al guardar la reservación', { id: toastId })
    }
  }

  return (
    <Modal
      title={isEditing ? 'Editar reservación' : 'Nueva reservación'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Sección: Restaurante & Mesa */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
            Lugar
          </h3>

          {/* Restaurante */}
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
              Restaurante *
            </label>
            <select
              {...register('restaurantId', { required: 'El restaurante es requerido' })}
              disabled={restaurantsLoading}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer disabled:opacity-60"
            >
              <option value="" className="bg-zinc-900">
                {restaurantsLoading ? 'Cargando...' : 'Selecciona un restaurante'}
              </option>
              {restaurants.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id} className="bg-zinc-900">
                  {r.name}
                </option>
              ))}
            </select>
            {errors.restaurantId && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.restaurantId.message}</p>
            )}
          </div>

          {/* Mesa */}
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
              Mesa *
            </label>
            <select
              {...register('tableId', { required: 'La mesa es requerida' })}
              disabled={tablesLoading}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer disabled:opacity-60"
            >
              <option value="" className="bg-zinc-900">
                {tablesLoading ? 'Cargando mesas...' : 'Selecciona una mesa'}
              </option>
              {filteredTables.map((t) => (
                <option key={getTableId(t)} value={getTableId(t)} className="bg-zinc-900">
                  Mesa #{t.number} — {t.capacity} {t.capacity === 1 ? 'persona' : 'personas'}
                  {t.location ? ` (${t.location})` : ''}
                </option>
              ))}
            </select>
            {errors.tableId && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.tableId.message}</p>
            )}
          </div>
        </div>

        {/* Sección: Datos del cliente */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
            Datos del Cliente
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                Nombre del cliente *
              </label>
              <input
                type="text"
                {...register('customerName', { required: 'El nombre es requerido' })}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                placeholder="Ej. Juan Pérez"
              />
              {errors.customerName && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                Teléfono
              </label>
              <input
                type="tel"
                {...register('customerPhone')}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                placeholder="Ej. 5555-0000"
              />
            </div>
          </div>
        </div>

        {/* Sección: Fecha, hora y personas */}
        <div className="space-y-4">
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2">
            Fecha y Hora
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                Fecha *
              </label>
              <input
                type="date"
                {...register('date', { required: 'La fecha es requerida' })}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all [color-scheme:dark]"
              />
              {errors.date && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                Hora *
              </label>
              <input
                type="time"
                {...register('time', { required: 'La hora es requerida' })}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all [color-scheme:dark]"
              />
              {errors.time && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.time.message}</p>
              )}
            </div>

            <div>
              <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
                N.º de personas *
              </label>
              <input
                type="number"
                {...register('guests', {
                  required: 'Requerido',
                  min: { value: 1, message: 'Mínimo 1' },
                  max: { value: 50, message: 'Máximo 50' },
                })}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600"
                placeholder="2"
              />
              {errors.guests && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.guests.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Estado (solo en edición) */}
        {isEditing && (
          <div>
            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
              Estado
            </label>
            <select
              {...register('status')}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer"
            >
              <option value="pendiente" className="bg-zinc-900">Pendiente</option>
              <option value="confirmada" className="bg-zinc-900">Confirmada</option>
              <option value="cancelada" className="bg-zinc-900">Cancelada</option>
              <option value="completada" className="bg-zinc-900">Completada</option>
            </select>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-2 block opacity-70">
            Notas adicionales
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 text-white rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-zinc-600 resize-none"
            placeholder="Alergias, ocasión especial, preferencias de mesa..."
          />
        </div>

        {/* Acciones */}
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
            disabled={isSubmitting || restaurantsLoading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Guardando...'
              : isEditing
              ? 'Guardar Cambios'
              : 'Crear Reservación'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ReservationForm