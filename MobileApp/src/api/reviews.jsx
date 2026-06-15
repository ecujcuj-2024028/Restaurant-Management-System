import api from './api';

export const getRestaurantStats = async (restaurantId) => {
  const response = await api.get(`/analytics/reviews/restaurant/${restaurantId}`);
  return response.data;
};

export const getProductReviews = async (productId) => {
  const response = await api.get(`/analytics/reviews/product/${productId}`);
  return response.data;
};
