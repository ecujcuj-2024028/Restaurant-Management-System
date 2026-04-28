import api from './api'

const CATEGORY_ENDPOINT = '/categories'

export const getCategories = () => {
  return api.get(CATEGORY_ENDPOINT)
}

export const createCategory = (data) => {
  return api.post(`${CATEGORY_ENDPOINT}/create`, data)
}

export const updateCategory = (id, data) => {
  return api.put(`${CATEGORY_ENDPOINT}/${id}`, data)
}

export const deleteCategory = (id) => {
  return api.delete(`${CATEGORY_ENDPOINT}/${id}`)
}