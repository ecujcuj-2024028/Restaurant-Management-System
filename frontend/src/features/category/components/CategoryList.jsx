import { useEffect, useState } from 'react'
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

  if (error && categories.length === 0) {
    return (
      <div className="text-red-400 text-center mt-10">
        Error: {error}
      </div>
    )
  }

  return (
    <div>
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Categorías
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Administra las categorías disponibles para los productos del restaurante.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      {error && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-sm px-6 py-4">
                Nombre
              </th>
              <th className="text-left text-gray-400 text-sm px-6 py-4">
                Estado
              </th>
              <th className="text-left text-gray-400 text-sm px-6 py-4">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="text-center text-gray-400 py-10"
                >
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              categories.map((category) => {
                const categoryId = getCategoryId(category)
                const isActive = category.isActive !== false

                return (
                  <tr
                    key={categoryId}
                    className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isActive
                            ? 'bg-green-500 bg-opacity-20 text-green-400'
                            : 'bg-red-500 bg-opacity-20 text-red-400'
                        }`}
                      >
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(category)}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => setCategoryToDelete(category)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          Eliminar
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
        <div className="mt-4">
          <Spinner />
        </div>
      )}
    </div>
  )
}

export default CategoryList