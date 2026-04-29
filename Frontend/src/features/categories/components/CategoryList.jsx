import { useEffect, useState } from 'react'
import { Edit3, Trash2, Plus, Tag } from 'lucide-react'
import useCategoryStore from '../store/categoryStore'
import CategoryForm from './CategoryForm'
import Spinner from '../../../shared/components/layout/Spinner'
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
    try {
      const categoryId = getCategoryId(categoryToDelete)
      await deleteCategory(categoryId)
      setCategoryToDelete(null)
    } catch (error) {
      alert(error?.message || 'Error al eliminar la categoría')
    }
  }

  if (loading && categories.length === 0) return <Spinner />

  return (
    <div className="animate-in fade-in duration-500">
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Categorías</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Administra las categorías disponibles para los productos del restaurante.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Categoría
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
              <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Categoría</th>
              <th className="text-left text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Estado</th>
              <th className="text-right text-zinc-400 text-xs uppercase tracking-wider px-8 py-5 font-bold">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-zinc-500 py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Tag size={40} className="text-zinc-700" />
                    <p>No hay categorías registradas aún.</p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const categoryId = getCategoryId(category)
                const isActive = category.isActive !== false

                return (
                  <tr key={categoryId} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-white text-sm font-bold group-hover:text-orange-500 transition-colors">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-zinc-500 text-xs mt-1 line-clamp-1 italic">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(category)}
                          className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 size={18} />
                        </button>

                        <button
                          onClick={() => setCategoryToDelete(category)}
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

      {loading && categories.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  )
}

export default CategoryList