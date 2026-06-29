import { create } from 'zustand';
import { Platform } from 'react-native';
import { login as loginApi } from '../api/auth';
import { saveExpoToken } from "../api/notifications";
import { getProfile } from '../api/users';
import { ROLES } from '../shared/constants/roles';

let storage;
if (Platform.OS !== "web") {
    storage = require('expo-secure-store');
}

// Simple storage fallback for web
const webStorage = {
    getItemAsync: (key) => Promise.resolve(localStorage.getItem(key)),
    setItemAsync: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    deleteItemAsync: (key) => Promise.resolve(localStorage.removeItem(key)),
};

const storage = storage || webStorage;

let registerForPushNotificationsAsync = null;
if (Platform.OS !== "web") {
    registerForPushNotificationsAsync = require('../features/notifications/notificationService').registerForPushNotificationsAsync;
}

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasSeenOnboarding: false,
  isLoading: true,
  isDarkMode: true,

  initialize: async () => {
    try {
      const token = await storage.getItemAsync('userToken');
      const userStr = await storage.getItemAsync('userData');
      const hasSeenOnboarding = await storage.getItemAsync('hasSeenOnboarding');
      const theme = await storage.getItemAsync('theme');

      let parsedUser = userStr ? JSON.parse(userStr) : null;
      
      set({ 
        token: token || null, 
        user: parsedUser, 
        isAuthenticated: !!token,
        hasSeenOnboarding: hasSeenOnboarding === 'true',
        isDarkMode: theme === null ? true : theme === 'dark',
      });

      if (token) {
        // Register for push notifications and save token
        if (registerForPushNotificationsAsync) {
          const expoToken = await registerForPushNotificationsAsync();
          if (expoToken) {
            try {
              await saveExpoToken(expoToken);
            } catch (error) {
              console.log('[Initialize] Error saving expo token:', error);
            }
          }
        }
        get().fetchProfile();
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const response = await getProfile();
      const userData = response.user;
      if (userData) {
        await storage.setItemAsync('userData', JSON.stringify(userData));
        set({ user: userData });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleTheme: async () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      storage.setItemAsync('theme', newMode ? 'dark' : 'light');
      return { isDarkMode: newMode };
    });
  },

  setHasSeenOnboarding: async (value) => {
    await storage.setItemAsync('hasSeenOnboarding', value ? 'true' : 'false');
    set({ hasSeenOnboarding: value });
  },

  login: async (credentials, expoToken = null) => {
    const data = await loginApi(credentials);
    const { token, user } = data;
    const userRole = user?.roles?.[0] || user?.role;

    if (userRole !== ROLES.CLIENTE) {
      const error = new Error('Acceso restringido en la App Móvil');
      error.code = 'ADMIN_ACCESS_RESTRICTED';
      throw error;
    }

    await storage.setItemAsync("userToken", token);
    await storage.setItemAsync(
      "userData",
      JSON.stringify(user)
    );

    if (expoToken) {
      try {
        await saveExpoToken(expoToken);
      } catch (error) {
        console.log(error);
      }
    }

    set({
      user,
      token,
      isAuthenticated: true,
    });

    // Fetch full profile to get details like profilePicture which are not in login response
    get().fetchProfile();
  },

  logout: async () => {
    await storage.deleteItemAsync('userToken');
    await storage.deleteItemAsync('userData');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: async (user) => {
    await storage.setItemAsync('userData', JSON.stringify(user));
    set({ user });
  }
}));

export default useAuthStore;
