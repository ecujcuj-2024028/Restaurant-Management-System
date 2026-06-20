import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { login as loginApi } from '../api/auth';
import { saveExpoToken } from "../api/notifications";
import { getProfile } from '../api/users';
import { ROLES } from '../shared/constants/roles';

const useAuthStore = create((set, get) => ({
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

      let parsedUser = userStr ? JSON.parse(userStr) : null;
      
      set({ 
        token: token || null, 
        user: parsedUser, 
        isAuthenticated: !!token,
        hasSeenOnboarding: hasSeenOnboarding === 'true',
        isDarkMode: theme === null ? true : theme === 'dark',
      });

      if (token) {
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
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
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
    const userRole = user?.roles?.[0] || user?.role;

    if (userRole !== ROLES.CLIENTE) {
      const error = new Error('Acceso restringido en la App Móvil');
      error.code = 'ADMIN_ACCESS_RESTRICTED';
      throw error;
    }

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

    // Fetch full profile to get details like profilePicture which are not in login response
    get().fetchProfile();
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
