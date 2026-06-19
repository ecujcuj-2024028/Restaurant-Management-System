import api from './api';

export const createReservation = async (reservationData) => {
  const response = await api.post('/reservations', reservationData);
  return response.data;
};

export const getMyReservations = async () => {
  const response = await api.get('/reservations');
  return response.data;
};

export const cancelReservation = async (id) => {
  const response = await api.delete(`/reservations/${id}`);
  return response.data;
};

export const getTablesByRestaurant = async (restaurantId) => {
  const response = await api.get(`/tables/restaurant/${restaurantId}`);
  return response.data;
};

export const getAvailableHours = async (tableId, restaurantId, date) => {
  const response = await api.get('/reservations/available-hours', {
    params: { tableId, restaurantId, date },
  });
  return response.data;
};