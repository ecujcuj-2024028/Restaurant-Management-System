import api from './api';

export const getRestaurants = async (params) => {
  const response = await api.get('/restaurants', { params });
  return response.data;
};

export const getRestaurantById = async (id) => {
  const response = await api.get(`/restaurants/${id}`);
  return response.data;
};

export const getRestaurantMenus = async (restaurantId) => {
  const response = await api.get(`/menus`, { params: { restaurant: restaurantId } });
  return response.data;
};

export const getRestaurantProducts = async (restaurantId) => {
  const response = await api.get(`/products`, { params: { restaurant: restaurantId } });
  return response.data;
};

export const searchItems = async (query) => {
  const response = await api.get('/search', { params: { q: query } });
  return response.data;
};
