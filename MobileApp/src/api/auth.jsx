import api from './api';

export const login = async (credentials) => {
  const payload = {
    emailOrUsername: credentials.email,
    password: credentials.password
  };
  const response = await api.post('/auth/login', payload);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};
