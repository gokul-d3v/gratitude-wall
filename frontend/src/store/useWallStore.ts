import { create } from 'zustand';
import { Post, StickyColor, NotificationItem } from '../types';
import { api } from '../services/api';

interface WallState {
  posts: Post[];
  activeColor: StickyColor | 'all';
  activeTab: 'latest' | 'trending';
  searchQuery: string;
  isCreateModalOpen: boolean;
  editingPost: Post | null;
  isAuthModalOpen: boolean;
  isAdminViewOpen: boolean;
  isNotifModalOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  toastNotification: NotificationItem | null;
  rateLimitInfo: { remaining: number; limit: number } | null;

  setPosts: (posts: Post[]) => void;
  fetchPosts: () => Promise<void>;
  addPost: (post: Post) => void;
  updateLikeCount: (postId: string, likesCount: number) => void;
  setActiveColor: (color: StickyColor | 'all') => void;
  setActiveTab: (tab: 'latest' | 'trending') => void;
  setSearchQuery: (query: string) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditingPost: (post: Post | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAdminViewOpen: (open: boolean) => void;
  setNotifModalOpen: (open: boolean) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  triggerToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  setRateLimitInfo: (info: { remaining: number; limit: number }) => void;
}

export const useWallStore = create<WallState>((set) => ({
  posts: [],
  activeColor: 'all',
  activeTab: 'latest',
  searchQuery: '',
  isCreateModalOpen: false,
  editingPost: null,
  isAuthModalOpen: false,
  isAdminViewOpen: false,
  isNotifModalOpen: false,
  notifications: [],
  unreadCount: 0,
  toastNotification: null,
  rateLimitInfo: null,

  setPosts: (posts) => set({ posts }),

  fetchPosts: async () => {
    try {
      const res = await api.get('/posts');
      set({ posts: res.data.posts || [] });
    } catch {
      // Silence
    }
  },

  addPost: (newPost) =>
    set((state) => {
      if (state.posts.some((p) => p._id === newPost._id)) {
        return state;
      }
      return { posts: [newPost, ...state.posts] };
    }),

  updateLikeCount: (postId, likesCount) =>
    set((state) => ({
      posts: state.posts.map((p) => (p._id === postId ? { ...p, likesCount } : p)),
    })),

  setActiveColor: (activeColor) => set({ activeColor }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),

  setEditingPost: (editingPost) => set({ editingPost }),

  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

  setAdminViewOpen: (isAdminViewOpen) => set({ isAdminViewOpen }),

  setNotifModalOpen: (isNotifModalOpen) => set({ isNotifModalOpen }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (notification) =>
    set((state) => {
      const notifId = notification.id || (notification as any)._id;
      const existingIndex = state.notifications.findIndex(
        (n) => (n.id || (n as any)._id) === notifId
      );

      let updatedList = [...state.notifications];
      if (existingIndex !== -1) {
        updatedList[existingIndex] = { ...notification, isRead: false };
      } else {
        updatedList = [{ ...notification, isRead: false }, ...state.notifications];
      }

      return {
        notifications: updatedList,
        unreadCount: updatedList.filter((n) => !n.isRead).length,
        toastNotification: notification,
      };
    }),

  triggerToast: (message, variant = 'info') =>
    set({
      toastNotification: {
        id: Date.now().toString(),
        message,
        variant,
        senderName: variant === 'error' ? 'Error' : variant === 'success' ? 'Success' : 'Notice',
        createdAt: new Date().toISOString(),
      },
    }),

  clearToast: () => set({ toastNotification: null }),

  setRateLimitInfo: (rateLimitInfo) => set({ rateLimitInfo }),
}));
