import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CalendarClock, Edit3, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useReservationStore from '../store/reservationStore'
import ReservationForm from './ReservationForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getReservationId = (r) => r?._id || r?.id

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  },
  confirmada: {
    label: 'Confirmada',
    className: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  },
  completada: {
    label: 'Completada',
    className: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20',
  },
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (timeStr) => {
  if (!timeStr) return '—'
  // If it's already a HH:MM string, return as-is; otherwise parse from ISO
  if (/^\d{2}:\d{2}/.test(timeStr)) return timeStr.slice(0, 5)
  const date = new Date(timeStr)
  return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const ReservationList = () => {
  const { reservations, loading, error, fetchReservations, cancelReservation } =
    useReservationStore()

  const [showForm, setShowForm] = useState(false)
  const [reservationToEdit, setReservationToEdit] = useState(null)
  const [reservationToCancel, setReservationToCancel] = useState(null)

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const openCreateForm = () => {
    setReservationToEdit(null)
    setShowForm(true)
  }

  const openEditForm = (reservation) => {
    setReservationToEdit(reservation)
    setShowForm(true)
  }

  const closeForm = () => {
    setReservationToEdit(null)
    setShowForm(false)
  }

  const handleCancel = async () => {
    const toastId = toast.loading('Cancelando reservación...')
    try {
      const id = getReservationId(reservationToCancel)
      await cancelReservation(id)
      setReservationToCancel(null)
      toast.success('Reservación cancelada', { id: toastId })
    } catch (err) {
      toast.error(err?.message || 'Error al cancelar la reservación', { id: toastId })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      {showForm && (
        <ReservationForm
          reservationToEdit={reservationToEdit}
          onClose={closeForm}
          onSuccess={fetchReservations}
        />
      )}

      {reservationToCancel && (
        <ConfirmDialog
          message={`Se cancelará la reservación de "${reservationToCancel.customerName || 'este cliente'}". Esta acción no se puede deshacer.`}
          onConfirm={handleCancel}
          onCancel={() => setReservationToCancel(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Reservaciones</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Administra las reservaciones del restaurante.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Nueva Reservación
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">
                  Cliente
                </th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">
                  Fecha
                </th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">
                  Hora
                </th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">
                  Mesa
                </th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">
                  Estado
                </th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading && reservations.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-8 py-5">
                      <Skeleton className="h-5 w-32 rounded-xl" />
                    </td>
                    <td className="px-8 py-5">
                      <Skeleton className="h-5 w-24 rounded-lg" />
                    </td>
                    <td className="px-8 py-5">
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </td>
                    <td className="px-8 py-5">
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </td>
                    <td className="px-8 py-5">
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Skeleton className="h-8 w-20 ml-auto rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-zinc-500 py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-zinc-800 rounded-full">
                        <CalendarClock size={40} className="opacity-20" />
                      </div>
                      <p className="font-medium">No hay reservaciones registradas aún.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {reservations.map((reservation, index) => {
                    const id = getReservationId(reservation)
                    const statusKey = reservation.status || 'pendiente'
                    const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendiente
                    const isCancelled = statusKey === 'cancelada'

                    const tableLabel =
                      reservation.table?.number != null
                        ? `Mesa #${reservation.table.number}`
                        : reservation.tableId
                        ? `#${reservation.tableId}`
                        : '—'

                    return (
                      <motion.tr
                        key={id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <p className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                            {reservation.customerName || '—'}
                          </p>
                          {reservation.customerPhone && (
                            <p className="text-zinc-500 text-xs mt-0.5">
                              {reservation.customerPhone}
                            </p>
                          )}
                        </td>

                        <td className="px-8 py-5">
                          <span className="text-zinc-300 text-xs font-semibold">
                            {formatDate(reservation.date)}
                          </span>
                        </td>

                        <td className="px-8 py-5">
                          <span className="text-zinc-300 text-xs font-semibold">
                            {formatTime(reservation.time || reservation.date)}
                          </span>
                        </td>

                        <td className="px-8 py-5">
                          <span className="text-zinc-300 text-xs font-bold bg-zinc-800/50 px-3 py-1 rounded-lg border border-white/5">
                            {tableLabel}
                          </span>
                        </td>

                        <td className="px-8 py-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditForm(reservation)}
                              disabled={isCancelled}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Editar"
                            >
                              <Edit3 size={18} />
                            </button>

                            <button
                              onClick={() => setReservationToCancel(reservation)}
                              disabled={isCancelled}
                              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Cancelar reservación"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && reservations.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-2 w-full max-w-md rounded-full" />
        </div>
      )}
    </motion.div>
  )
}

export default ReservationList