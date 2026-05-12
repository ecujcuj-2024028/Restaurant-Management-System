import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, MapPin, XCircle, AlertCircle, CheckCircle2, Plus, Utensils, Timer } from 'lucide-react'
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
  const [, setTick] = useState(0)

  useEffect(() => {
    fetchReservations()
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [fetchReservations])

  const canCancel = useCallback((res) => {
    // Verificamos ambas posibilidades de nombre de campo debido a la configuración underscored del backend
    const createdTime = res.created_at || res.createdAt
    if (!createdTime) return false

    const start = new Date(createdTime).getTime()
    const now = Date.now()
    const diff = now - start
    
    // Log para debuguear en consola si es necesario
    // console.log(`Reserva ${res.id} | Diff: ${diff}ms | New: ${diff < 60000}`)
    
    return diff < 60000 // 60 segundos (1 minuto)
  }, [])

  const handleCancel = async () => {
    const toastId = toast.loading('Cancelando reservación...')
    try {
      await cancelReservation(reservationToCancel._id || reservationToCancel.id)
      setReservationToCancel(null)
      toast.success('Reservación cancelada', { id: toastId })
      fetchReservations()
    } catch (err) {
      toast.error(err.message || 'No se pudo cancelar', { id: toastId })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      {showForm && (
        <ReservationForm onClose={() => { setShowForm(false); fetchReservations(); }} />
      )}

      {reservationToCancel && (
        <ConfirmDialog
          message="¿Seguro que deseas cancelar esta solicitud? (Esta acción es irreversible)"
          onConfirm={handleCancel}
          onCancel={() => setReservationToCancel(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Mis Visitas</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium italic">Gestiona tus experiencias culinarias.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> Nueva Reserva
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && reservations.length === 0 ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)
        ) : reservations.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900/30 border border-dashed border-white/5 rounded-[2.5rem]">
            <Calendar size={40} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-bold">Aún no tienes reservaciones registradas.</p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {reservations.map((res) => {
              const status = STATUS_MAP[res.status] || STATUS_MAP.pendiente
              const StatusIcon = status.icon
              const isNew = canCancel(res)
              
              return (
                <motion.div
                  key={res._id || res.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                >
                  {isNew && (
                    <div className="absolute top-0 right-0 p-4">
                      <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full border border-orange-500/20 shadow-lg shadow-orange-500/5">
                        <Timer size={10} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Gracia Activa</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-6 group-hover:text-orange-500 transition-colors">
                    {res.restaurant?.name || 'Restaurante'}
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Calendar size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">{res.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Clock size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">{res.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Utensils size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">Mesa #{res.table?.number || '?'}</span>
                    </div>
                  </div>

                  {res.status === 'pendiente' && (
                    isNew ? (
                      <button 
                        onClick={() => setReservationToCancel(res)}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                      >
                        <XCircle size={16} /> Cancelar Solicitud
                      </button>
                    ) : (
                      <div className="p-4 bg-zinc-800/30 rounded-2xl flex items-start gap-3 border border-white/5">
                        <AlertCircle size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-500 font-medium italic leading-tight">
                          El tiempo de cancelación automática ha expirado. Por favor, contacta a la sede para realizar cambios.
                        </p>
                      </div>
                    )
                  )}

                  {res.status === 'confirmada' && (
                    <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-xs text-emerald-500/80 font-bold uppercase tracking-tight">¡Mesa Asegurada!</span>
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
