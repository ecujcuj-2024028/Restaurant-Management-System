import { create } from 'zustand'
import {
    getProducts,
    createProduct as createProductRequest,
    updateProduct as updateProductRequest,
    deleteProduct as deleteProductRequest,
} from '../../../shared/api/products'

const getProductId = (product) => product?._id || product?.id

const getErrorMessage = (error) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Ocurrió un error al procesar la solicitud'
    )
}

const useProductStore = create((set) => ({
    products: [],
    loading: false,
    error: null,

    fetchProducts: async (params = {}) => {
        set({ loading: true, error: null })

        try {
            const response = await getProducts(params)

            set({
                products: response.data?.products || [],
                loading: false,
            })
        } catch (error) {
            set({
                error: getErrorMessage(error),
                loading: false,
            })
        }
    },

    createProduct: async (data) => {
        set({ loading: true, error: null })

        try {
            const response = await createProductRequest(data)
            const newProduct = response.data?.product

            set((state) => ({
                products: newProduct
                    ? [...state.products, newProduct]
                    : state.products,
                loading: false,
            }))

            return newProduct
        } catch (error) {
            const message = getErrorMessage(error)

            set({
                error: message,
                loading: false,
            })

            throw new Error(message)
        }
    },

    updateProduct: async (id, data) => {
        set({ loading: true, error: null })

        try {
            const response = await updateProductRequest(id, data)
            const updatedProduct = response.data?.product

            set((state) => ({
                products: state.products.map((product) =>
                    getProductId(product) === id ? updatedProduct : product
                ),
                loading: false,
            }))

            return updatedProduct
        } catch (error) {
            const message = getErrorMessage(error)

            set({
                error: message,
                loading: false,
            })

            throw new Error(message)
        }
    },

    deleteProduct: async (id) => {
        set({ loading: true, error: null })

        try {
            await deleteProductRequest(id)

            set((state) => ({
                products: state.products.filter(
                    (product) => getProductId(product) !== id
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

    clearProductError: () => {
        set({ error: null })
    },
}))

export default useProductStore