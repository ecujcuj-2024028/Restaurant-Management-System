import api from './api'

const RESERVATIONS_ENDPOINT = '/reservations'

export const getReservations = (params = {}) => {
  // Si enviamos restaurantId, usamos la ruta específica del backend para evitar el error 400
  if (params.restaurantId) {
    return api.get(`${RESERVATIONS_ENDPOINT}/restaurant/${params.restaurantId}`, { params })
  }
  // De lo contrario, usamos el endpoint base (Mis Reservaciones)
  return api.get(RESERVATIONS_ENDPOINT, { params })
}

export const createReservation = (data) => {
  return api.post(RESERVATIONS_ENDPOINT, data)
}

export const updateReservation = (id, data) => {
  return api.put(`${RESERVATIONS_ENDPOINT}/${id}`, data)
}

export const cancelReservation = (id) => {
  return api.patch(`${RESERVATIONS_ENDPOINT}/${id}/cancel`)
}
