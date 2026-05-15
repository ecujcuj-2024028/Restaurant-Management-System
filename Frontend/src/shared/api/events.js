import api from './api'

const EVENTS_ENDPOINT = '/events'

export const getEvents = (params = {}) =>
  api.get(EVENTS_ENDPOINT, { params })

export const getEventById = (id) =>
  api.get(`${EVENTS_ENDPOINT}/${id}`)

export const createEvent = (data) =>
  api.post(EVENTS_ENDPOINT, data)

export const updateEvent = (id, data) =>
  api.put(`${EVENTS_ENDPOINT}/${id}`, data)

export const deleteEvent = (id) =>
  api.delete(`${EVENTS_ENDPOINT}/${id}`)

export const updateEventStatus = (id, status) =>
  api.patch(`${EVENTS_ENDPOINT}/${id}/status`, { status })