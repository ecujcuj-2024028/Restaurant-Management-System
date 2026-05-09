import api from './api'

const RESERVATIONS_ENDPOINT = '/reservations'

export const getReservations = (params = {}) => {
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