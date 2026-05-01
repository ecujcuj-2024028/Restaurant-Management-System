import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Trash2, Plus, Tag } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useCategoryStore from '../store/categoryStore'
import CategoryForm from './CategoryForm'
import Skeleton from '../../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'

const getCategoryId = (category) => category?._id || category?.id

const CategoryList = () => {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    deleteCategory,
  } = useCategoryStore()

  const [showForm, setShowForm] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openCreateForm = () => {
    setCategoryToEdit(null)
    setShowForm(true)
  }

  const openEditForm = (category) => {
    setCategoryToEdit(category)
    setShowForm(true)
  }

  const closeForm = () => {
    setCategoryToEdit(null)
    setShowForm(false)
  }

  const handleDelete = async () => {
    const toastId = toast.loading('Eliminando categoría...')
    try {
      const categoryId = getCategoryId(categoryToDelete)
      await deleteCategory(categoryId)
      setCategoryToDelete(null)
      toast.success('Categoría eliminada correctamente', { id: toastId })
    } catch (error) {
      toast.error(error?.message || 'Error al eliminar la categoría', { id: toastId })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-10"
    >
      {showForm && (
        <CategoryForm
          categoryToEdit={categoryToEdit}
          onClose={closeForm}
          onSuccess={fetchCategories}
        />
      )}

      {categoryToDelete && (
        <ConfirmDialog
          message={`Esta acción eliminará la categoría "${categoryToDelete.name}" permanentemente.`}
          onConfirm={handleDelete}
          onCancel={() => setCategoryToDelete(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Categorías</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Administra las categorías disponibles para los productos del restaurante.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Categoría</th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5">Estado</th>
                <th className="text-zinc-400 text-[10px] font-black uppercase tracking-widest px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading && categories.length === 0 ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="px-8 py-5"><Skeleton className="h-10 w-64 rounded-xl" /></td>
                    <td className="px-8 py-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-8 py-5 text-right"><Skeleton className="h-8 w-20 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-zinc-500 py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-zinc-800 rounded-full">
                        <Tag size={40} className="opacity-20" />
                      </div>
                      <p className="font-medium">No hay categorías registradas aún.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {categories.map((category, index) => {
                    const categoryId = getCategoryId(category)
                    const isActive = category.isActive !== false

                    return (
                      <motion.tr 
                        key={categoryId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div>
                            <p className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                              {category.name}
                            </p>
                            {category.description && (
                              <p className="text-zinc-500 text-[10px] mt-0.5 line-clamp-1 italic font-medium">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${isActive ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'}`}>
                            {isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditForm(category)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
                              title="Editar"
                            >
                              <Edit3 size={18} />
                            </button>

                            <button
                              onClick={() => setCategoryToDelete(category)}
                              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                              title="Eliminar"
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
    </motion.div>
  )
}

export default CategoryList