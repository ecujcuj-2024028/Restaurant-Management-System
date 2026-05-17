import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { X, MapPin, Users, Calendar, Clock, Mail, Phone, User, MessageSquare, Save } from 'lucide-react'
import useReservationStore from '../store/reservationStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import useTableStore from '../../tables/store/tableStore'
import useAuthStore from '../../auth/store/authStore'
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
  const user = useAuthStore((state) => state.user)
  
  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN_SISTEMA' || role === 'ADMIN_RESTAURANTE'
  )

  const createReservation = useReservationStore((state) => state.createReservation)
  const updateReservation = useReservationStore((state) => state.updateReservation)

  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const { tables, fetchTablesByRestaurant } = useTableStore()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantId: '',
      tableId: '',
      customerName: isAdmin ? '' : `${user?.name || ''} ${user?.surname || ''}`.trim(),
      customerPhone: user?.phone || '',
      customerEmail: isAdmin ? '' : user?.email || '',
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
  }, [fetchRestaurants])

  // Cargar mesas cuando cambia el restaurante seleccionado
  useEffect(() => {
    if (selectedRestaurantId) {
        fetchTablesByRestaurant(selectedRestaurantId)
    }
  }, [selectedRestaurantId, fetchTablesByRestaurant])

  useEffect(() => {
    if (!isEditing) {
        setValue('tableId', '')
    }
  }, [selectedRestaurantId, setValue, isEditing])

  useEffect(() => {
    if (reservationToEdit) {
      const tableId = typeof reservationToEdit.table === 'object' ? getTableId(reservationToEdit.table) : reservationToEdit.tableId || ''
      const restaurantId = typeof reservationToEdit.restaurant === 'object' ? reservationToEdit.restaurant?._id || '' : reservationToEdit.restaurantId || ''
      
      if (restaurantId) {
          fetchTablesByRestaurant(restaurantId)
      }

      reset({
        restaurantId,
        tableId,
        customerName: reservationToEdit.customerName || '',
        customerPhone: reservationToEdit.customerPhone || '',
        customerEmail: reservationToEdit.customerEmail || '',
        date: reservationToEdit.date || getDefaultDate(),
        time: reservationToEdit.time || getDefaultTime(),
        guests: reservationToEdit.guestCount || 2,
        notes: reservationToEdit.notes || '',
        status: reservationToEdit.status || 'pendiente',
      })
    }
  }, [reservationToEdit, reset, fetchTablesByRestaurant])

  const filteredTables = selectedRestaurantId
    ? tables.filter((t) => (t.restaurant?._id || t.restaurant || t.restaurantId) === selectedRestaurantId && t.isActive)
    : []

  const onSubmit = async (data) => {
    const toastId = toast.loading('Procesando...')
    try {
      const payload = {
        ...data,
        guestCount: Number(data.guests),
        customerEmail: isAdmin ? data.customerEmail?.trim() : user?.email,
      }

      if (isEditing) {
        await updateReservation(getReservationId(reservationToEdit), payload)
      } else {
        await createReservation(payload)
      }

      toast.success('¡Listo!', { id: toastId })
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      toast.error(error?.message || 'Error', { id: toastId })
    }
  }

  return (
    <Modal
      title={isEditing ? 'Gestionar Reserva' : 'Nueva Reserva'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-1">
        {/* Sede y Mesa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">
              <MapPin size={12} className="text-orange-500" /> Sede
            </label>
            <select
              {...register('restaurantId', { required: true })}
              className="w-full bg-zinc-800/50 border border-white/5 text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer"
            >
              <option value="">Seleccionar restaurante...</option>
              {restaurants.map((r) => (
                <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">
              <Users size={12} className="text-orange-500" /> Mesa
            </label>
            <select
              {...register('tableId', { required: true })}
              disabled={!selectedRestaurantId}
              className="w-full bg-zinc-800/50 border border-white/5 text-white rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer disabled:opacity-40"
            >
              <option value="">{selectedRestaurantId ? 'Seleccionar mesa...' : 'Primero elige sede'}</option>
              {filteredTables.map((t) => (
                <option key={getTableId(t)} value={getTableId(t)}>Mesa #{t.number} ({t.capacity}p)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Datos Cliente */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Nombre</label>
              <input type="text" {...register('customerName', { required: true })} disabled={!isAdmin} className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none disabled:opacity-60" />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Correo</label>
              <input type="email" {...register('customerEmail')} disabled={!isAdmin} className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none disabled:opacity-60" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Teléfono</label>
              <input type="tel" {...register('customerPhone')} className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Invitados</label>
              <input type="number" {...register('guests', { required: true, min: 1 })} className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none" />
            </div>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-2 gap-6 p-6 bg-zinc-800/20 rounded-[2rem] border border-white/5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
              <Calendar size={12} className="text-orange-500" /> Fecha
            </label>
            <input type="date" {...register('date', { required: true })} className="w-full bg-transparent border-none text-white focus:ring-0 outline-none [color-scheme:dark]" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
              <Clock size={12} className="text-orange-500" /> Hora
            </label>
            <input type="time" {...register('time', { required: true })} className="w-full bg-transparent border-none text-white focus:ring-0 outline-none [color-scheme:dark]" />
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">
            <MessageSquare size={12} className="text-orange-500" /> Notas
          </label>
          <textarea {...register('notes')} rows={2} className="w-full bg-zinc-800/30 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none resize-none" placeholder="Ocasión especial, alergias..." />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-4 rounded-2xl font-bold transition-all">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <Save size={18} /> {isEditing ? 'Actualizar' : 'Confirmar Reserva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ReservationForm
