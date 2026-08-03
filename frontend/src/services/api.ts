import axios from 'axios';
import { useWallStore } from '../store/useWallStore';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Restore token from localStorage session cache
let accessToken: string | null = localStorage.getItem('gratitude_wall_access_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('gratitude_wall_access_token', token);
  } else {
    localStorage.removeItem('gratitude_wall_access_token');
  }
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Intercept Rate Limit headers
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
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newAccessToken = res.data.data.accessToken;
        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
