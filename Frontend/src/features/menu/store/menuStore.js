import { create } from 'zustand'

import {
  getMenus,
  createMenu as createMenuApi,
  updateMenu as updateMenuApi,
  deleteMenu as deleteMenuApi,
  toggleMenuStatus as toggleMenuStatusApi
} from '../../../shared/api/menus'

const useMenuStore = create((set) => ({
  menus: [],
  loading: false,
  error: null,

  fetchMenus: async (params = {}) => {
    set({ loading: true, error: null })

    try {
      const response = await getMenus(params)

      set({
        menus: response.data?.menus || [],
        loading: false
      })

    } catch (error) {
      console.log(error)

      set({
        loading: false,
        error:
          error?.response?.data?.message ||
          error.message
      })
    }
  },

  createMenu: async (data) => {
    set({ loading: true, error: null })

    try {
      const response = await createMenuApi(data)

      const newMenu = response.data.menu

      set((state) => ({
        menus: [newMenu, ...state.menus],
        loading: false
      }))

      return newMenu

    } catch (error) {
      set({
        loading: false,
        error:
          error?.response?.data?.message ||
          error.message
      })

      throw error
    }
  },

  updateMenu: async (id, data) => {
    set({ loading: true, error: null })

    try {
      const response = await updateMenuApi(id, data)

      const updatedMenu = response.data.menu

      set((state) => ({
        menus: state.menus.map((menu) =>
          (menu._id || menu.id) === id
            ? updatedMenu
            : menu
        ),
        loading: false
      }))

      return updatedMenu

    } catch (error) {
      set({
        loading: false,
        error:
          error?.response?.data?.message ||
          error.message
      })

      throw error
    }
  },

  deleteMenu: async (menu) => {
    set({ loading: true, error: null })

    try {
      await deleteMenuApi(
        menu._id || menu.id,
        menu.restaurant?._id || menu.restaurant
      )

      set((state) => ({
        menus: state.menus.filter(
          (m) =>
            (m._id || m.id) !==
            (menu._id || menu.id)
        ),
        loading: false
      }))

    } catch (error) {
      console.log("ERROR DELETE MENU:", error)

      set({
        loading: false,
        error:
          error?.response?.data?.message ||
          error.message
      })

      throw error
    }
  },

  toggleMenuStatus: async (id) => {
    try {
      const response =
        await toggleMenuStatusApi(id)

      const updatedMenu = response.data.menu

      set((state) => ({
        menus: state.menus.map((menu) =>
          (menu._id || menu.id) === id
            ? updatedMenu
            : menu
        )
      }))

      return updatedMenu

    } catch (error) {
      console.log(error)
      throw error
    }
  }
}))

export default useMenuStore