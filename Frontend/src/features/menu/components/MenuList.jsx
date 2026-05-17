// src/features/menu/components/MenuList.jsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useMenuStore from '../store/menuStore'
import MenuForm from './MenuForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const MenuList = () => {
    const {
        menus = [],           // ← Protección por si viene undefined
        loading,
        error,
        fetchMenus,
        deleteMenu,
        toggleMenuStatus
    } = useMenuStore()

    const [showForm, setShowForm] = useState(false)
    const [editingMenu, setEditingMenu] = useState(null)
    const [menuToDelete, setMenuToDelete] = useState(null)

    useEffect(() => {
        fetchMenus()
    }, [fetchMenus])

    const handleToggle = async (id) => {
        try {
            await toggleMenuStatus(id)
            toast.success('Estado del menú actualizado')
        } catch (err) {
            toast.error('Error al cambiar estado')
        }
    }

    const handleDelete = async () => {
        if (!menuToDelete) return

        const toastId = toast.loading('Eliminando menú...')

        try {

            await deleteMenu(menuToDelete)

            setMenuToDelete(null)

            toast.success(
                'Menú eliminado correctamente',
                { id: toastId }
            )

        } catch (error) {

            toast.error(
                error?.response?.data?.message ||
                'Error al eliminar el menú',
                { id: toastId }
            )
        }
    }

    const openEdit = (menu) => {
        setEditingMenu(menu)
        setShowForm(true)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-10">
            {showForm && (
                <MenuForm
                    menuToEdit={editingMenu}
                    onClose={() => {
                        setShowForm(false)
                        setEditingMenu(null)
                    }}
                    onSuccess={fetchMenus}
                />
            )}

            {menuToDelete && (
                <ConfirmDialog
                    message={`¿Estás seguro de eliminar el menú "${menuToDelete.name}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setMenuToDelete(null)}
                />
            )}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Menús</h1>
                    <p className="text-zinc-500 text-sm mt-1">Gestiona los menús de tus restaurantes</p>
                </div>
                <button
                    onClick={() => {
                        setEditingMenu(null)
                        setShowForm(true)
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all"
                >
                    <Plus size={20} /> Nuevo Menú
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6">
                    {error}
                </div>
            )}

            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Menú</th>
                            <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Restaurante</th>
                            <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Tipo</th>
                            <th className="px-8 py-5 text-left text-zinc-400 text-xs font-black uppercase tracking-widest">Estado</th>
                            <th className="px-8 py-5 text-right text-zinc-400 text-xs font-black uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && menus.length === 0 ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-8 py-5"><Skeleton className="h-6 w-48" /></td>
                                    <td className="px-8 py-5"><Skeleton className="h-6 w-32" /></td>
                                    <td className="px-8 py-5"><Skeleton className="h-6 w-24" /></td>
                                    <td className="px-8 py-5"><Skeleton className="h-6 w-20" /></td>
                                    <td className="px-8 py-5"><Skeleton className="h-8 w-24 ml-auto" /></td>
                                </tr>
                            ))
                        ) : menus.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-zinc-500">
                                    No hay menús registrados aún.
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence>
                                {menus.map((menu) => (
                                    <motion.tr
                                        key={menu._id || menu.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-white">{menu.name}</p>
                                            {menu.description && <p className="text-zinc-500 text-sm line-clamp-1">{menu.description}</p>}
                                        </td>
                                        <td className="px-8 py-5 text-zinc-300">
                                            {menu.restaurant?.name || menu.restaurant || 'N/A'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="capitalize px-3 py-1 bg-zinc-800 rounded-full text-sm">
                                                {menu.menuType?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => handleToggle(menu._id || menu.id)}
                                                className={`flex items-center gap-1.5 text-sm ${menu.isActive ? 'text-emerald-500' : 'text-zinc-500'}`}
                                            >
                                                {menu.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                {menu.isActive ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(menu)}
                                                    className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setMenuToDelete(menu)}
                                                    className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}

export default MenuList