import { useEffect, useState } from 'react'
import { Edit3, Trash2, Plus, TableProperties } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useTableStore from '../store/tableStore'
import TableForm from './TableForm'
import Spinner from '../../../shared/components/layout/Spinner'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getTableId = (table) => table?._id || table?.id

const AVAILABILITY_CONFIG = {
    disponible: {
        label: 'Disponible',
        className: 'bg-green-500/10 text-green-500',
    },
    ocupado: {
        label: 'Ocupada',
        className: 'bg-red-500/10 text-red-500',
    },
    reservado: {
        label: 'Reservada',
        className: 'bg-yellow-500/10 text-yellow-500',
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

    if (loading && tables.length === 0) return <Spinner />

    return (
        <div className="animate-in fade-in duration-500">
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

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mesas</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        Administra las mesas disponibles en el restaurante.
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
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

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full">
                    <thead>
                        <tr className="bg-zinc-800/50 border-b border-zinc-800">
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">
                                Número de Mesa
                            </th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">
                                Capacidad
                            </th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">
                                Ubicación
                            </th>
                            <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">
                                Disponibilidad
                            </th>
                            <th className="text-right text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-800">
                        {tables.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center text-zinc-500 py-20">
                                    <div className="flex flex-col items-center gap-3">
                                        <TableProperties size={40} className="text-zinc-700" />
                                        <p>No hay mesas registradas aún.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            tables.map((table) => {
                                const tableId = getTableId(table)
                                const availability = AVAILABILITY_CONFIG[table.availability] ||
                                    AVAILABILITY_CONFIG.disponible

                                return (
                                    <tr
                                        key={tableId}
                                        className="hover:bg-zinc-800/30 transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <p className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                                                Mesa #{table.number}
                                            </p>
                                        </td>

                                        <td className="px-8 py-5">
                                            <p className="text-zinc-300 text-sm">
                                                {table.capacity} {table.capacity === 1 ? 'persona' : 'personas'}
                                            </p>
                                        </td>

                                        <td className="px-8 py-5">
                                            <p className="text-zinc-400 text-sm capitalize">
                                                {table.location || 'interior'}
                                            </p>
                                        </td>

                                        <td className="px-8 py-5">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${availability.className}`}
                                            >
                                                {availability.label}
                                            </span>
                                        </td>

                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditForm(table)}
                                                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={18} />
                                                </button>

                                                <button
                                                    onClick={() => setTableToDelete(table)}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {loading && tables.length > 0 && (
                <div className="mt-6 flex justify-center">
                    <Spinner />
                </div>
            )}
        </div>
    )
}

export default TableLists