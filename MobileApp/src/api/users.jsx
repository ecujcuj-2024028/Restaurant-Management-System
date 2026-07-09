import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};

export const deleteAccount = async () => {
  const response = await api.delete('/users/account');
  return response.data;
};

export const updatePassword = async (passwordData) => {
  const response = await api.patch('/users/profile/password', passwordData);
  return response.data;
};

export const requestRoleUpgrade = async (requestedRole) => {
  const response = await api.post('/auth/role-upgrade', { requestedRole });
  return response.data;
};
