import axios from 'axios';
import { useWallStore } from '../store/useWallStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = localStorage.getItem('gratitude_wall_access_token');
let refreshToken: string | null = localStorage.getItem('gratitude_wall_refresh_token');

export const setAccessToken = (token: string | null, refreshTok?: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('gratitude_wall_access_token', token);
  } else {
    localStorage.removeItem('gratitude_wall_access_token');
  }

  if (refreshTok !== undefined) {
    refreshToken = refreshTok;
    if (refreshTok) {
      localStorage.setItem('gratitude_wall_refresh_token', refreshTok);
    } else {
      localStorage.removeItem('gratitude_wall_refresh_token');
    }
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

// Post API methods
export const updatePostApi = async (postId: string, data: { content?: string; color?: string; taggedUserIds?: string[] }) => {
  const response = await api.put(`/posts/${postId}`, data);
  return response.data;
};

export const deletePostApi = async (postId: string) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (refreshToken) {
      config.headers['X-Refresh-Token'] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const remaining = response.headers['ratelimit-remaining'] || response.headers['x-ratelimit-remaining'];
    const limit = response.headers['ratelimit-limit'] || response.headers['x-ratelimit-limit'];

    if (remaining !== undefined && limit !== undefined) {
      useWallStore.getState().setRateLimitInfo({
        remaining: parseInt(remaining as string, 10),
        limit: parseInt(limit as string, 10),
      });
    }

    return response;
  },
  async (error) => {
    if (error.response?.headers) {
      const remaining = error.response.headers['ratelimit-remaining'] || error.response.headers['x-ratelimit-remaining'];
      const limit = error.response.headers['ratelimit-limit'] || error.response.headers['x-ratelimit-limit'];

      if (remaining !== undefined && limit !== undefined) {
        useWallStore.getState().setRateLimitInfo({
          remaining: parseInt(remaining as string, 10),
          limit: parseInt(limit as string, 10),
        });
      }
    }

    const originalRequest = error.config;
    const authUrls = ['/auth/login', '/auth/admin-login', '/auth/refresh', '/auth/register'];
    const isAuthUrl = authUrls.some((url) => originalRequest.url?.includes(url));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      originalRequest._retry = true;
      try {
        const storedRefresh = getRefreshToken();
        const res = await api.post(
          '/auth/refresh',
          { refreshToken: storedRefresh },
          {
            headers: storedRefresh ? { 'X-Refresh-Token': storedRefresh } : {},
          }
        );
        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken || storedRefresh;
        setAccessToken(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null, null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
