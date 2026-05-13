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

export const cancelExternalOrder = (id) => {
    return api.patch(`${EXTERNAL_ORDERS_ENDPOINT}/${id}/cancel`)
}

// Alias temporal para mantener compatibilidad con el store actual.
// El backend no elimina físicamente pedidos externos; los cancela.
export const deleteExternalOrder = cancelExternalOrder