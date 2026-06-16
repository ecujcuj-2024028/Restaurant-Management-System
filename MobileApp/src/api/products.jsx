import api from './api';

export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getAdminProducts = async (restaurantId) => {
  const response = await api.get(`/products/restaurant/${restaurantId}`);
  return response.data;
};

export const updateProductStatus = async (id, isAvailable) => {
  const response = await api.patch(`/products/${id}/status`, { isAvailable });
  return response.data;
};