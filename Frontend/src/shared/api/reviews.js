import api from './api'

const REVIEWS_ENDPOINT = '/analytics/reviews'

export const createReview = (data) =>
  api.post(REVIEWS_ENDPOINT, data)

export const updateReview = (id, data) =>
  api.put(`${REVIEWS_ENDPOINT}/${id}`, data)

export const deleteReview = (id) =>
  api.delete(`${REVIEWS_ENDPOINT}/${id}`)

export const getReviewsByProduct = (platoId) =>
  api.get(`${REVIEWS_ENDPOINT}/plato/${platoId}`)

export const getReviewsByRestaurant = (restauranteId) =>
  api.get(`${REVIEWS_ENDPOINT}/restaurant/${restauranteId}`)