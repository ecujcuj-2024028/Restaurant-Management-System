import api from './api'

const REVIEWS_ENDPOINT = '/analytics/reviews'

export const createReview = (data) =>
  api.post(REVIEWS_ENDPOINT, data)

export const getReviewsByProduct = (platoId) =>
  api.get(`${REVIEWS_ENDPOINT}/plato/${platoId}`)