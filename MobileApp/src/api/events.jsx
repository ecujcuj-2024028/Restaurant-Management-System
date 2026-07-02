import api from './api';

export const getEvents = async (params) => {
  const response = await api.get('/events', { params });
  return response.data;
};

export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const getEventsByRestaurant = async (restaurantId) => {
  const response = await api.get(`/events/restaurant/${restaurantId}`);
  return response.data;
};

export const searchEvents = async (query) => {
  const response = await api.get('/events/search', { params: { q: query } });
  return response.data;
};

export const registerEventAttendance = async (eventId) => {
  const response = await api.post(`/events/${eventId}/attend`);
  return response.data;
};

export const cancelEventAttendance = async (eventId) => {
  const response = await api.delete(`/events/${eventId}/attend`);
  return response.data;
};
