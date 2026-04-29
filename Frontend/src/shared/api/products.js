import api from './api'

const PRODUCT_ENDPOINT = '/products'

export const getProducts = (params = {}) => {
    return api.get(PRODUCT_ENDPOINT, { params })
}

export const createProduct = (data) => {
    return api.post(PRODUCT_ENDPOINT, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const updateProduct = (id, data) => {
    return api.put(`${PRODUCT_ENDPOINT}/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const deleteProduct = (id) => {
    return api.delete(`${PRODUCT_ENDPOINT}/${id}`)
}