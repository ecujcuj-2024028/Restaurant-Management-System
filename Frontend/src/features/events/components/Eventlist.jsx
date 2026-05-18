import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CalendarDays, 
  Edit3, 
  Trash2, 
  Plus, 
  ImageOff, 
  Clock, 
  Users, 
  Ticket, 
  Sparkles, 
  Building, 
  MapPin,
  Filter,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import useEventStore from '../store/eventStore'
import useAuthStore from '../../auth/store/authStore'
import EventForm from './EventForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getEventId = (event) => event?._id || event?.id

const getRestaurantName = (restaurant) => {
  if (!restaurant) return '—'
  if (typeof restaurant === 'object') return restaurant?.name || '—'
  return restaurant
}

const STATUS_CONFIG = {
  scheduled: { label: 'Programado', color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  ongoing:   { label: 'En curso',   color: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  completed: { label: 'Finalizado', color: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-500/10 text-red-400 ring-red-500/20' },
}

const TYPE_CONFIG = {
  morning:   { label: 'Mañana',   color: 'bg-amber-500/10 text-amber-500 ring-amber-500/20' },
  afternoon: { label: 'Tarde',    color: 'bg-orange-500/10 text-orange-500 ring-orange-500/20' },
  night:     { label: 'Noche',    color: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20' },
  all_day:   { label: 'Todo el día', color: 'bg-sky-500/10 text-sky-400 ring-sky-500/20' },
  special:   { label: 'Especial',  color: 'bg-purple-500/10 text-purple-400 ring-purple-500/20' },
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const EventCard = ({ event, onEdit, onDelete, index, isAdmin }) => {
  const eventId = getEventId(event)
  const status = STATUS_CONFIG[event.status] || STATUS_CONFIG.scheduled
  const restaurantName = getRestaurantName(event.restaurant)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden hover:border-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5"
    >
      {/* Image */}
      <div className="relative h-44 bg-zinc-800 overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-700">
            <Sparkles size={36} />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ring-1 ${status.color}`}
          >
            {status.label}
          </span>
          {event.type && TYPE_CONFIG[event.type] && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ring-1 ${TYPE_CONFIG[event.type].color}`}
            >
              {TYPE_CONFIG[event.type].label}
            </span>
          )}
        </div>

        {/* Action buttons - Only for Admins */}
        {isAdmin && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(event)}
              className="p-2 bg-zinc-900/80 backdrop-blur-sm text-zinc-300 hover:text-white rounded-xl transition-all hover:bg-zinc-800 active:scale-90"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(event)}
              className="p-2 bg-zinc-900/80 backdrop-blur-sm text-zinc-300 hover:text-red-400 rounded-xl transition-all hover:bg-red-500/10 active:scale-90"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-white font-black text-lg leading-tight group-hover:text-orange-400 transition-colors">
            {event.name}
          </h3>
        </div>

        {event.description && (
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 font-medium">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-bold">
              <CalendarDays size={13} className="text-orange-500 flex-shrink-0" />
              <span className="truncate">{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-bold">
              <Clock size={13} className="text-orange-500 flex-shrink-0" />
              <span className="truncate">
                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-white/5 pt-3">
            {event.capacity && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-bold">
                <Users size={13} className="text-orange-500" />
                <span>{event.capacity} cupos</span>
              </div>
            )}
            {event.price > 0 ? (
              <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-black uppercase">
                <Ticket size={13} />
                <span>Q {Number(event.price).toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-black uppercase">
                <Sparkles size={13} />
                <span>Entrada Libre</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const EventList = () => {
  const { user } = useAuthStore()
  const { events, loading, error, fetchEvents, deleteEvent } = useEventStore()

  const isAdmin = user?.roles?.some(role => 
    role === 'ADMIN_SISTEMA' || role === 'ADMIN_RESTAURANTE'
  )

  const [showForm, setShowForm] = useState(false)
  const [eventToEdit, setEventToEdit] = useState(null)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const statusMatch = statusFilter === 'all' || event.status === statusFilter
    return statusMatch
  })

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const openCreateForm = () => {
    setEventToEdit(null)
    setShowForm(true)
  }

  const openEditForm = (event) => {
    setEventToEdit(event)
    setShowForm(true)
  }

  const closeForm = () => {
    setEventToEdit(null)
    setShowForm(false)
  }

  const handleDelete = async () => {
    const toastId = toast.loading('Cancelando evento...')
    try {
      await deleteEvent(getEventId(eventToDelete))
      setEventToDelete(null)
      toast.success('Evento cancelado correctamente', { id: toastId })
    } catch (err) {
      toast.error(err?.message || 'Error al cancelar el evento', { id: toastId })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      {showForm && (
        <EventForm
          eventToEdit={eventToEdit}
          onClose={closeForm}
          onSuccess={fetchEvents}
        />
      )}

      {eventToDelete && (
        <ConfirmDialog
          message={`Esta acción cancelará el evento "${eventToDelete.name}" permanentemente.`}
          onConfirm={handleDelete}
          onCancel={() => setEventToDelete(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Eventos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {isAdmin 
              ? 'Gestiona los eventos especiales y promociones de tu restaurante.'
              : 'Descubre los eventos especiales y promociones que tenemos para ti.'}
          </p>
        </div>
        
        {isAdmin && (
          <button
            onClick={openCreateForm}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            Nuevo Evento
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
          <Filter size={16} className="text-orange-500" />
          Filtros:
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-800 border border-white/10 text-white text-sm rounded-lg hover:border-orange-500/30 transition-colors focus:outline-none focus:border-orange-500"
        >
          <option value="all">Todos los estados</option>
          <option value="scheduled">Programado</option>
          <option value="ongoing">En curso</option>
          <option value="completed">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {statusFilter !== 'all' && (
          <button
            onClick={() => {
              setStatusFilter('all')
            }}
            className="ml-auto px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading && events.length === 0 && filteredEvents.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/50 rounded-3xl overflow-hidden border border-white/5"
            >
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
                <Skeleton className="h-3 w-2/3 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="p-5 bg-zinc-800/60 rounded-full ring-1 ring-white/5">
            <Sparkles size={48} className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">
            {events.length === 0 ? 'No hay eventos registrados aún.' : 'No hay eventos que coincidan con los filtros seleccionados.'}
          </p>
          {isAdmin && events.length === 0 && (
            <button
              onClick={openCreateForm}
              className="mt-2 text-orange-500 text-sm font-bold hover:text-orange-400 transition-colors"
            >
              Crear primer evento →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {filteredEvents.map((event, index) => (
              <EventCard
                key={getEventId(event)}
                event={event}
                index={index}
                onEdit={openEditForm}
                onDelete={setEventToDelete}
                isAdmin={isAdmin}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

export default EventList