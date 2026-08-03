import { create } from 'zustand';
import { User } from '../types';
import { api, setAccessToken } from '../services/api';
import { updateSocketAuth } from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    updateSocketAuth(accessToken);
    set({ user, isAuthenticated: true });
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    updateSocketAuth(accessToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silence
    }
    setAccessToken(null);
    updateSocketAuth(null);
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Try verifying existing access token or refreshing cookie session
      const userRes = await api.get('/auth/me');
      set({ user: userRes.data.data, isAuthenticated: true, isLoading: false });
    } catch {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data.data.accessToken;
        setAccessToken(token);
        updateSocketAuth(token);

        const userRes = await api.get('/auth/me');
        set({ user: userRes.data.data, isAuthenticated: true, isLoading: false });
      } catch {
        setAccessToken(null);
        updateSocketAuth(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));
