import { create } from 'zustand';
import { Platform } from 'react-native';
import { login as loginApi } from '../api/auth';
import { getProfile } from '../api/users';
import { ROLES } from '../shared/constants/roles';
import { io } from 'socket.io-client';

let storage;
if (Platform.OS !== 'web') {
    storage = require('expo-secure-store');
} else {
    storage = {
        getItemAsync: (key) => Promise.resolve(localStorage.getItem(key)),
        setItemAsync: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
        deleteItemAsync: (key) => Promise.resolve(localStorage.removeItem(key)),
    };
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const SOCKET_URL = API_URL.split('/restaurantManagement')[0] || 'http://localhost:3000';

let socket = null;

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

            if (token && parsedUser) {
                get().connectSocket(parsedUser.id || parsedUser._id);
                get().fetchProfile();
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            set({ isLoading: false });
        }
    },

    connectSocket: (userId) => {
        if (socket?.connected) return;

        socket = io(SOCKET_URL, { autoConnect: false });
        socket.connect();

        socket.on('connect', () => {
            console.log('[Socket] Conectado — uniéndose a sala del usuario:', userId);
            socket.emit('join_room', `user_${userId}`);
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Desconectado');
        });
    },

    disconnectSocket: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => socket,

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

    login: async (credentials) => {
        const data = await loginApi(credentials);
        const { token, user } = data;
        const userRole = user?.roles?.[0] || user?.role;

        if (userRole !== ROLES.CLIENTE) {
            const error = new Error('Acceso restringido en la App Móvil');
            error.code = 'ADMIN_ACCESS_RESTRICTED';
            throw error;
        }

        await storage.setItemAsync('userToken', token);
        await storage.setItemAsync('userData', JSON.stringify(user));

        set({ user, token, isAuthenticated: true });

        const userId = user.id || user._id;
        get().connectSocket(userId);
        get().fetchProfile();
    },

    logout: async () => {
        get().disconnectSocket();
        await storage.deleteItemAsync('userToken');
        await storage.deleteItemAsync('userData');
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: async (user) => {
        await storage.setItemAsync('userData', JSON.stringify(user));
        set({ user });
    },
}));

export default useAuthStore;