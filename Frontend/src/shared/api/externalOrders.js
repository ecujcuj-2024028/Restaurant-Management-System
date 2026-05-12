import api from './api'

const EXTERNAL_ORDERS_ENDPOINT = '/external-orders'

export const getExternalOrders = (params = {}) => {
    return api.get(EXTERNAL_ORDERS_ENDPOINT, { params })
}

export const createExternalOrder = (data) => {
    return api.post(EXTERNAL_ORDERS_ENDPOINT, data)
}

export const updateExternalOrderStatus = (id, status) => {
    return api.patch(`${EXTERNAL_ORDERS_ENDPOINT}/${id}/status`, { status })
}

export const deleteExternalOrder = (id) => {
    return api.delete(`${EXTERNAL_ORDERS_ENDPOINT}/${id}`)
}
