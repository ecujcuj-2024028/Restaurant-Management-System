import { create } from 'zustand'
import {
  getEvents,
  createEvent as createEventRequest,
  updateEvent as updateEventRequest,
  deleteEvent as deleteEventRequest,
} from '../../../shared/api/events'

const getEventId = (event) => event?._id || event?.id

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  'Ocurrió un error al procesar la solicitud'

const useEventStore = create((set) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await getEvents(params)
      set({
        events: response.data?.events || [],
        loading: false,
      })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  createEvent: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await createEventRequest(data)
      const newEvent = response.data?.event
      set((state) => ({
        events: newEvent ? [...state.events, newEvent] : state.events,
        loading: false,
      }))
      return newEvent
    } catch (error) {
      const message = getErrorMessage(error)
      set({ error: message, loading: false })
      throw new Error(message)
    }
  },

  updateEvent: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const response = await updateEventRequest(id, data)
      const updatedEvent = response.data?.event
      set((state) => ({
        events: state.events.map((ev) =>
          getEventId(ev) === id ? updatedEvent : ev
        ),
        loading: false,
      }))
      return updatedEvent
    } catch (error) {
      const message = getErrorMessage(error)
      set({ error: message, loading: false })
      throw new Error(message)
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null })
    try {
      await deleteEventRequest(id)
      set((state) => ({
        events: state.events.filter((ev) => getEventId(ev) !== id),
        loading: false,
      }))
    } catch (error) {
      const message = getErrorMessage(error)
      set({ error: message, loading: false })
      throw new Error(message)
    }
  },

  clearEventError: () => set({ error: null }),
}))

export default useEventStore