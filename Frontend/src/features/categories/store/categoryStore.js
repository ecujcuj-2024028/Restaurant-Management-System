import { create } from 'zustand'
import {
  getCategories,
  createCategory as createCategoryRequest,
  updateCategory as updateCategoryRequest,
  deleteCategory as deleteCategoryRequest,
} from '../../../shared/api/categories'

const getCategoryId = (category) => category?._id || category?.id

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Ocurrió un error al procesar la solicitud'
  )
}

const useCategoryStore = create((set) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null })

    try {
      const response = await getCategories()

      set({
        categories: response.data?.categories || [],
        loading: false,
      })
    } catch (error) {
      set({
        error: getErrorMessage(error),
        loading: false,
      })
    }
  },

  createCategory: async (data) => {
    set({ loading: true, error: null })

    try {
      const response = await createCategoryRequest(data)
      const newCategory = response.data?.category

      set((state) => ({
        categories: newCategory
          ? [...state.categories, newCategory]
          : state.categories,
        loading: false,
      }))

      return newCategory
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message)
    }
  },

  updateCategory: async (id, data) => {
    set({ loading: true, error: null })

    try {
      const response = await updateCategoryRequest(id, data)
      const updatedCategory = response.data?.category

      set((state) => ({
        categories: state.categories.map((category) =>
          getCategoryId(category) === id ? updatedCategory : category
        ),
        loading: false,
      }))

      return updatedCategory
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message)
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null })

    try {
      await deleteCategoryRequest(id)

      set((state) => ({
        categories: state.categories.filter(
          (category) => getCategoryId(category) !== id
        ),
        loading: false,
      }))
    } catch (error) {
      const message = getErrorMessage(error)

      set({
        error: message,
        loading: false,
      })

      throw new Error(message)
    }
  },

  clearCategoryError: () => {
    set({ error: null })
  },
}))

export default useCategoryStore