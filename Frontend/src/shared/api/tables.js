import api from './api'

const TABLE_ENDPOINT = '/tables'

export const getTables = () => {
    return api.get(TABLE_ENDPOINT)
}

export const getTablesByRestaurant = (restaurantId) => {
    return api.get(`${TABLE_ENDPOINT}/restaurant/${restaurantId}`)
}

export const createTable = (data) => {
    return api.post(`${TABLE_ENDPOINT}/create`, data)
}

export const updateTable = (id, data) => {
    return api.put(`${TABLE_ENDPOINT}/${id}`, data)
}

export const deleteTable = (id) => {
    return api.delete(`${TABLE_ENDPOINT}/${id}`)
}