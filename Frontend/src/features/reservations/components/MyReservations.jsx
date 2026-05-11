import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, XCircle, AlertCircle, CheckCircle2, MoreVertical, Plus, Utensils } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useReservationStore from '../store/reservationStore'
import useAuthStore from '../../auth/store/authStore'
import ReservationForm from './ReservationForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const STATUS_MAP = {
  pendiente: { label: 'Pendiente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
  confirmada: { label: 'Confirmada', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
  completada: { label: 'Completada', color: 'text-zinc-500', bg: 'bg-zinc-500/10', icon: CheckCircle2 },
}

const MyReservations = () => {
  const user = useAuthStore(state => state.user)
  const { reservations, loading, fetchReservations, cancelReservation } = useReservationStore()
  const [showForm, setShowForm] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState(null)

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  // Filtrar reservaciones del usuario si el backend no lo hace por defecto
  const myReservations = reservations.filter(r => 
    r.userId === user?.id || r.userId === user?._id || r.customerEmail === user?.email
  )

  const handleCancel = async () => {
    const toastId = toast.loading('Cancelando reservación...')
    try {
      await cancelReservation(reservationToCancel._id || reservationToCancel.id)
      setReservationToCancel(null)
      toast.success('Reservación cancelada correctamente', { id: toastId })
    } catch (err) {
      toast.error(err.message || 'Error al cancelar', { id: toastId })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-20"
    >
      {showForm && (
        <ReservationForm onClose={() => { setShowForm(false); fetchReservations(); }} />
      )}

      {reservationToCancel && (
        <ConfirmDialog
          message="¿Estás seguro de que deseas cancelar esta reservación?"
          onConfirm={handleCancel}
          onCancel={() => setReservationToCancel(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Mis Reservaciones</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Gestiona tus próximas visitas a nuestros restaurantes.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-95"
        >
          <Plus size={18} />
          Nueva Reservación
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && myReservations.length === 0 ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)
        ) : myReservations.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900/30 border border-white/5 rounded-[2.5rem]">
            <div className="inline-flex p-6 bg-zinc-800 rounded-full mb-4">
              <Calendar size={40} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-bold text-lg">Aún no tienes reservaciones.</p>
            <p className="text-zinc-600 text-sm mt-1">¡Anímate a visitar uno de nuestros restaurantes!</p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {myReservations.map((res) => {
              const status = STATUS_MAP[res.status || 'pendiente'] || STATUS_MAP.pendiente
              const StatusIcon = status.icon
              const resDate = new Date(res.date)

              return (
                <motion.div
                  key={res._id || res.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 hover:border-orange-500/30 transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                    {res.status === 'pendiente' && (
                      <button 
                        onClick={() => setReservationToCancel(res)}
                        className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Cancelar reservación"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-500 transition-colors">
                    {res.restaurant?.name || 'Restaurante'}
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Calendar size={16} className="text-orange-500" />
                      <span className="text-sm font-medium">
                        {resDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock size={16} className="text-orange-500" />
                      <span className="text-sm font-medium">{res.time || resDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Utensils size={16} className="text-orange-500" />
                      <span className="text-sm font-medium">
                        Mesa para {res.numberOfPeople || 2} personas
                      </span>
                    </div>
                  </div>

                  {res.status === 'confirmada' && (
                    <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-emerald-500/80 font-medium italic">
                        Tu mesa ya está confirmada. ¡Te esperamos!
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

export default MyReservations
