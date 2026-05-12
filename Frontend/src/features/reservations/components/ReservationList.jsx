import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  CalendarClock, 
  Edit3, 
  XCircle, 
  CheckCircle2, 
  Search, 
  Utensils, 
  Filter,
  User,
  Clock,
  MoreVertical,
  Check
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useReservationStore from '../store/reservationStore'
import useRestaurantStore from '../../restaurants/store/restaurantStore'
import ReservationForm from './ReservationForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const STATUS_COLORS = {
  pendiente: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  confirmada: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelada: 'bg-red-500/10 text-red-500 border-red-500/20',
  completada: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const ReservationList = () => {
  const { reservations, loading, fetchReservations, updateReservation } = useReservationStore()
  const { restaurants, fetchRestaurants } = useRestaurantStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  useEffect(() => {
    // Si hay restaurante, filtramos por él, sino llamamos a la ruta global
    // que ahora en el backend devuelve todo para administradores
    fetchReservations(selectedRestaurant ? { restaurantId: selectedRestaurant } : {})
  }, [selectedRestaurant, fetchReservations])

  const handleStatusUpdate = async (id, newStatus) => {
    const toastId = toast.loading(`Cambiando estado a ${newStatus}...`)
    try {
      await updateReservation(id, { status: newStatus })
      toast.success(`Reservación ${newStatus} correctamente`, { id: toastId })
      fetchReservations(selectedRestaurant ? { restaurantId: selectedRestaurant } : {})
    } catch (err) {
      toast.error(err.message, { id: toastId })
    }
  }

  const filtered = reservations.filter(r => 
    r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.table?.number?.toString().includes(searchTerm)
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {(showForm || editingReservation) && (
        <ReservationForm 
          reservationToEdit={editingReservation}
          onClose={() => { setShowForm(false); setEditingReservation(null); }} 
          onSuccess={() => fetchReservations(selectedRestaurant ? { restaurantId: selectedRestaurant } : {})}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white">Libro de Reservas</h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium">Gestiona las visitas y disponibilidad de mesas en tiempo real.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
        >
          <Plus size={20} /> Nueva Reserva
        </button>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/50 p-4 rounded-[2.5rem] border border-white/5">
        <div className="relative group">
          <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <select 
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-orange-500/50 outline-none"
          >
            <option value="">Todos los restaurantes</option>
            {restaurants.map(r => (
              <option key={r._id || r.id} value={r._id || r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 md:col-span-2 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Buscar por cliente, email o número de mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
          />
        </div>
      </div>

      {/* Table / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading && reservations.length === 0 ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-50">
            <CalendarClock size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-bold">No se encontraron reservaciones activas.</p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {filtered.map((res) => (
              <motion.div
                key={res._id || res.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 hover:border-orange-500/30 transition-all group relative overflow-hidden shadow-xl"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[res.status] || STATUS_COLORS.pendiente}`}>
                    {res.status}
                  </span>
                  
                  <div className="flex gap-2">
                    {res.status === 'pendiente' && (
                      <button 
                        onClick={() => handleStatusUpdate(res._id || res.id, 'confirmada')}
                        className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-90"
                        title="Confirmar Reserva"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => setEditingReservation(res)}
                      className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors truncate">
                      {res.customerName || 'Cliente sin nombre'}
                    </h3>
                    {res.customerEmail && (
                      <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                        <User size={12} className="text-orange-500" />
                        <span>{res.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CalendarClock size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">{res.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">{res.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Utensils size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">Mesa #{res.table?.number || '?'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <User size={16} className="text-orange-500" />
                      <span className="text-sm font-bold">{res.guestCount || 2} pers.</span>
                    </div>
                  </div>

                  {/* Acciones de Liberación */}
                  {res.status === 'confirmada' && (
                    <button 
                      onClick={() => handleStatusUpdate(res._id || res.id, 'completada')}
                      className="w-full mt-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                    >
                      Marcar como Finalizada
                    </button>
                  )}
                  {res.status !== 'cancelada' && res.status !== 'completada' && (
                    <button 
                      onClick={() => handleStatusUpdate(res._id || res.id, 'cancelada')}
                      className="w-full py-3 text-red-500/60 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Cancelar Reservación
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

export default ReservationList
