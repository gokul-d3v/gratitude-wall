import { create } from 'zustand';
import { User } from '../types';
import { api, setAccessToken } from '../services/api';
import { updateSocketAuth } from '../services/socket';
import { useWallStore } from './useWallStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  forgotPassword: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const fetchAndSetNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    const notifs = res.data.data || [];
    useWallStore.getState().setNotifications(notifs.map((n: any) => ({
      id: n._id,
      type: n.type,
      senderName: n.senderName,
      message: n.message,
      postId: n.postId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })));
  } catch {
    // Silence — user may not be authenticated yet
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { user, accessToken, refreshToken } = res.data.data;
    setAccessToken(accessToken, refreshToken);
    updateSocketAuth(accessToken);
    set({ user, isAuthenticated: true });
    useWallStore.getState().fetchPosts();
    fetchAndSetNotifications();
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { user, accessToken, refreshToken } = res.data.data;
    setAccessToken(accessToken, refreshToken);
    updateSocketAuth(accessToken);
    set({ user, isAuthenticated: true });
    useWallStore.getState().fetchPosts();
    fetchAndSetNotifications();
  },

  forgotPassword: async (data) => {
    await api.post('/auth/forgot-password', data);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silence
    }
    setAccessToken(null, null);
    updateSocketAuth(null);
    set({ user: null, isAuthenticated: false });
    useWallStore.getState().fetchPosts();
    useWallStore.getState().setNotifications([]);
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const userRes = await api.get('/auth/me');
      set({ user: userRes.data.data, isAuthenticated: true, isLoading: false });
      useWallStore.getState().fetchPosts();
      fetchAndSetNotifications();
    } catch {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data.data.accessToken;
        const refToken = refreshRes.data.data.refreshToken;
        setAccessToken(token, refToken);
        updateSocketAuth(token);

        const userRes = await api.get('/auth/me');
        set({ user: userRes.data.data, isAuthenticated: true, isLoading: false });
        useWallStore.getState().fetchPosts();
        fetchAndSetNotifications();
      } catch {
        setAccessToken(null, null);
        updateSocketAuth(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));

