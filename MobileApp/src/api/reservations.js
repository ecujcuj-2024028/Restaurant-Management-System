import api from './api';

export const createReservation = async (reservationData) => {
  const response = await api.post('/reservations', reservationData);
  return response.data;
};

export const getMyReservations = async () => {
  const response = await api.get('/reservations/my-reservations');
  return response.data;
};

export const cancelReservation = async (id) => {
  const response = await api.delete(`/reservations/${id}`);
  return response.data;
};
