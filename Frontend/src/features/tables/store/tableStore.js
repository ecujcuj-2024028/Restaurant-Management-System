import { create } from 'zustand'
import {
    getTables,
    getTablesByRestaurant,
    createTable as createTableRequest,
    updateTable as updateTableRequest,
    deleteTable as deleteTableRequest,
} from '../../../shared/api/tables'

const getTableId = (table) => table?._id || table?.id

const getErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Ocurrió un error al procesar la solicitud'
    )
}

const useTableStore = create((set) => ({
    tables: [],
    loading: false,
    error: null,

    fetchTables: async () => {
        set({ loading: true, error: null })
        try {
            const response = await getTables()
            set({
                tables: response.data?.tables || [],
                loading: false,
            })
        } catch (error) {
            set({
                error: getErrorMessage(error),
                loading: false,
            })
        }
    },

    fetchTablesByRestaurant: async (restaurantId) => {
        if (!restaurantId) return
        set({ loading: true, error: null })
        try {
            const response = await getTablesByRestaurant(restaurantId)
            set({
                tables: response.data?.tables || [],
                loading: false,
            })
        } catch (error) {
            set({
                error: getErrorMessage(error),
                loading: false,
            })
        }
    },

    createTable: async (data) => {
        set({ loading: true, error: null })
        try {
            const response = await createTableRequest(data)
            const newTable = response.data?.table
            set((state) => ({
                tables: newTable ? [...state.tables, newTable] : state.tables,
                loading: false,
            }))
            return newTable
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    updateTable: async (id, data) => {
        set({ loading: true, error: null })
        try {
            const response = await updateTableRequest(id, data)
            const updatedTable = response.data?.table
            set((state) => ({
                tables: state.tables.map((table) =>
                    getTableId(table) === id ? updatedTable : table
                ),
                loading: false,
            }))
            return updatedTable
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    deleteTable: async (id) => {
        set({ loading: true, error: null })
        try {
            await deleteTableRequest(id)
            set((state) => ({
                tables: state.tables.filter((table) => getTableId(table) !== id),
                loading: false,
            }))
        } catch (error) {
            const message = getErrorMessage(error)
            set({ error: message, loading: false })
            throw new Error(message)
        }
    },

    clearTableError: () => {
        set({ error: null })
    },
}))

export default useTableStore