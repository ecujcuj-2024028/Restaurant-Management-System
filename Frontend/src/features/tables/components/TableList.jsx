import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Plus, TableProperties } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useTableStore from '../store/tableStore'
import TableForm from './TableForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getTableId = (table) => table?._id || table?.id

const AVAILABILITY_CONFIG = {
    disponible: {
        label: 'Disponible',
        className: 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20',
    },
    ocupado: {
        label: 'Ocupada',
        className: 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20',
    },
    reservado: {
        label: 'Reservada',
        className: 'bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20',
    },
}

const TableList = () => {
    const { tables, loading, error, fetchTables, deleteTable } = useTableStore()

    const [showForm, setShowForm] = useState(false)
    const [tableToEdit, setTableToEdit] = useState(null)
    const [tableToDelete, setTableToDelete] = useState(null)

    useEffect(() => {
        fetchTables()
    }, [fetchTables])

    const openCreateForm = () => {
        setTableToEdit(null)
        setShowForm(true)
    }

    const openEditForm = (table) => {
        setTableToEdit(table)
        setShowForm(true)
    }

    const closeForm = () => {
        setTableToEdit(null)
        setShowForm(false)
    }

    const handleDelete = async () => {
        const toastId = toast.loading('Eliminando mesa...')
        try {
            const tableId = getTableId(tableToDelete)
            await deleteTable(tableId)
            setTableToDelete(null)
            toast.success('Mesa eliminada correctamente', { id: toastId })
        } catch (error) {
            toast.error(error?.message || 'Error al eliminar la mesa', { id: toastId })
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-10"
        >
            {showForm && (
                <TableForm
                    tableToEdit={tableToEdit}
                    onClose={closeForm}
                    onSuccess={fetchTables}
                />
            )}

            {tableToDelete && (
                <ConfirmDialog
                    message={`Esta acción eliminará la mesa #${tableToDelete.number} permanentemente.`}
                    onConfirm={handleDelete}
                    onCancel={() => setTableToDelete(null)}
                />
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mesas</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Administra las mesas disponibles en el restaurante.
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                    <Plus size={18} />
                    Nueva Mesa
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Número de Mesa</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Capacidad</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Ubicación</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Disponibilidad</th>
                                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/5">
                            {loading && tables.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-24 rounded-xl" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                                        <td className="px-8 py-5"><Skeleton className="h-6 w-24 rounded-full" /></td>
                                        <td className="px-8 py-5 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : tables.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-zinc-500 py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-zinc-800 rounded-full">
                                                <TableProperties size={40} className="opacity-20" />
                                            </div>
                                            <p className="font-medium">No hay mesas registradas aún.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {tables.map((table, index) => {
                                        const tableId = getTableId(table)
                                        const availability = AVAILABILITY_CONFIG[table.availability] || AVAILABILITY_CONFIG.disponible

                                        return (
                                            <motion.tr
                                                key={tableId}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="px-8 py-5">
                                                    <p className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                                                        Mesa #{table.number}
                                                    </p>
                                                </td>

                                                <td className="px-8 py-5">
                                                    <span className="text-zinc-300 text-xs font-bold bg-zinc-800/50 px-3 py-1 rounded-lg border border-white/5">
                                                        {table.capacity} {table.capacity === 1 ? 'persona' : 'personas'}
                                                    </span>
                                                </td>

                                                <td className="px-8 py-5">
                                                    <span className="text-zinc-300 text-xs font-bold bg-zinc-800/50 px-3 py-1 rounded-lg border border-white/5 capitalize">
                                                        {table.location || 'interior'}
                                                    </span>
                                                </td>

                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${availability.className}`}>
                                                        {availability.label}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditForm(table)}
                                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                                                        >
                                                            <Edit3 size={18} />
                                                        </button>

                                                        <button
                                                            onClick={() => setTableToDelete(table)}
                                                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                                        >
                                                            <Trash2 size={18} />
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

            {loading && tables.length > 0 && (
                <div className="mt-6 flex justify-center">
                    <Skeleton className="h-2 w-full max-w-md rounded-full" />
                </div>
            )}
        </motion.div>
    )
}

export default TableList