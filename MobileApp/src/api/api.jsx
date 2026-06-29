import axios from 'axios';
import { Platform } from 'react-native';

let SecureStore;
if (Platform.OS !== "web") {
    SecureStore = require('expo-secure-store');
}

// Simple storage fallback for web
const webStorage = {
    getItemAsync: (key) => Promise.resolve(localStorage.getItem(key)),
};

const storage = SecureStore || webStorage;

// Lee la URL del archivo .env (prefijo EXPO_PUBLIC_)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token JWT a las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
