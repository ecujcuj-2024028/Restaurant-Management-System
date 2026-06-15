import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { login as loginApi } from '../api/auth';
import { saveExpoToken } from "../api/notifications";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasSeenOnboarding: false,
  isLoading: true,
  isDarkMode: true,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userStr = await SecureStore.getItemAsync('userData');
      const hasSeenOnboarding = await SecureStore.getItemAsync('hasSeenOnboarding');
      const theme = await SecureStore.getItemAsync('theme');

      set({ 
        token: token || null, 
        user: userStr ? JSON.parse(userStr) : null, 
        isAuthenticated: !!token,
        hasSeenOnboarding: hasSeenOnboarding === 'true',
        isDarkMode: theme === null ? true : theme === 'dark',
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  toggleTheme: async () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      SecureStore.setItemAsync('theme', newMode ? 'dark' : 'light');
      return { isDarkMode: newMode };
    });
  },

  setHasSeenOnboarding: async (value) => {
    await SecureStore.setItemAsync('hasSeenOnboarding', value ? 'true' : 'false');
    set({ hasSeenOnboarding: value });
  },

  login: async (credentials, expoToken = null) => {
  const data = await loginApi(credentials);

  const { token, user } = data;

  await SecureStore.setItemAsync("userToken", token);
  await SecureStore.setItemAsync(
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
},

  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: async (user) => {
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    set({ user });
  }
}));

export default useAuthStore;
