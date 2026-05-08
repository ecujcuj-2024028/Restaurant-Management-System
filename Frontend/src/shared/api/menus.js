import api from './api'

const MENU_ENDPOINT = '/menus'

export const getMenus = () =>
  api.get(MENU_ENDPOINT)

export const getMenuById = (id) =>
  api.get(`${MENU_ENDPOINT}/${id}`)

export const createMenu = (data) =>
  api.post(MENU_ENDPOINT, data)

export const updateMenu = (id, data) =>
  api.put(`${MENU_ENDPOINT}/${id}`, data)

export const deleteMenu = (id, restaurantId) =>
  api.delete(`${MENU_ENDPOINT}/${id}`, {
    data: { restaurantId }
  })

export const toggleMenuStatus = (id) =>
  api.patch(`${MENU_ENDPOINT}/${id}/toggle-status`)