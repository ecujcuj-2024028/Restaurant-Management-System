import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { X, MapPin, Users, Calendar, Clock, Mail, Phone, User, MessageSquare, Save, Loader2 } from 'lucide-react'
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

const ReservationForm = ({ reservationToEdit = null, onClose, onSuccess, defaultRestaurantId = null }) => {
  const isEditing = Boolean(reservationToEdit)
  const user = useAuthStore((state) => state.user)
  
  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN_SISTEMA' || role === 'ADMIN_RESTAURANTE'
  )

  const createReservation = useReservationStore((state) => state.createReservation)
  const updateReservation = useReservationStore((state) => state.updateReservation)
  const fetchAvailableHours = useReservationStore((state) => state.fetchAvailableHours)

  const { restaurants, fetchRestaurants } = useRestaurantStore()
  const { tables, fetchTablesByRestaurant } = useTableStore()

  const [availableHours, setAvailableHours] = useState([])
  const [loadingHours, setLoadingHours] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      restaurantId: defaultRestaurantId || '',
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
  const selectedTableId = watch('tableId')
  const selectedDate = watch('date')
  const selectedTime = watch('time')

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // Cargar mesas cuando cambia el restaurante seleccionado
  useEffect(() => {
    if (selectedRestaurantId) {
        fetchTablesByRestaurant(selectedRestaurantId)
    }
  }, [selectedRestaurantId, fetchTablesByRestaurant])

  // Cargar horas disponibles cuando cambia la mesa o la fecha
  useEffect(() => {
    const loadHours = async () => {
      if (selectedTableId && selectedDate && selectedRestaurantId) {
        setLoadingHours(true)
        try {
          const slots = await fetchAvailableHours({
            tableId: selectedTableId,
            restaurantId: selectedRestaurantId,
            date: selectedDate
          })
          setAvailableHours(slots)
          
          // Si la hora seleccionada no está disponible en los nuevos slots, buscar la primera disponible
          if (slots.length > 0) {
            const isCurrentAvailable = slots.find(s => s.time === selectedTime && s.available)
            if (!isCurrentAvailable) {
              const firstAvailable = slots.find(s => s.available)
              if (firstAvailable) {
                setValue('time', firstAvailable.time)
              }
            }
          }
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingHours(false)
        }
      } else {
        setAvailableHours([])
      }
    }

    loadHours()
  }, [selectedTableId, selectedDate, selectedRestaurantId, fetchAvailableHours, setValue])

  useEffect(() => {
    if (!isEditing && !defaultRestaurantId) {
        setValue('tableId', '')
    }
  }, [selectedRestaurantId, setValue, isEditing, defaultRestaurantId])

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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 p-6 bg-zinc-800/20 rounded-[2rem] border border-white/5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                <Calendar size={12} className="text-orange-500" /> Fecha de Reserva
              </label>
              <input 
                type="date" 
                {...register('date', { required: true })} 
                min={getDefaultDate()}
                className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 outline-none [color-scheme:dark] cursor-pointer" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">
              <Clock size={12} className="text-orange-500" /> Horarios Disponibles
            </label>
            
            {!selectedTableId ? (
              <div className="p-8 bg-zinc-900/50 rounded-2xl border border-dashed border-white/5 text-center">
                <p className="text-zinc-500 text-xs">Selecciona una mesa para ver horarios</p>
              </div>
            ) : loadingHours ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="text-orange-500 animate-spin" />
                <p className="text-zinc-500 text-xs">Consultando disponibilidad...</p>
              </div>
            ) : availableHours.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availableHours.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setValue('time', slot.time)}
                    className={`
                      py-3 rounded-xl text-sm font-bold transition-all border
                      ${selectedTime === slot.time 
                        ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20 scale-105' 
                        : slot.available 
                          ? 'bg-zinc-800/50 border-white/5 text-zinc-300 hover:bg-zinc-700' 
                          : 'bg-zinc-900/30 border-transparent text-zinc-600 opacity-40 cursor-not-allowed'}
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-zinc-900/50 rounded-2xl border border-white/5 text-center">
                <p className="text-zinc-400 text-xs font-medium">No hay horarios disponibles para esta fecha.</p>
              </div>
            )}
            <input type="hidden" {...register('time', { required: true })} />
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
          <button type="submit" disabled={isSubmitting || (availableHours.length > 0 && !availableHours.find(s => s.time === selectedTime)?.available)} className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <Save size={18} /> {isEditing ? 'Actualizar' : 'Confirmar Reserva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ReservationForm
