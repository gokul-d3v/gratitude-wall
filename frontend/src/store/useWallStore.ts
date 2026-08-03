import { create } from 'zustand';
import { Post, StickyColor, NotificationItem } from '../types';

interface WallState {
  posts: Post[];
  activeColor: StickyColor | 'all';
  activeTab: 'latest' | 'trending';
  searchQuery: string;
  isCreateModalOpen: boolean;
  isAuthModalOpen: boolean;
  isAdminViewOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  toastNotification: NotificationItem | null;

  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updateLikeCount: (postId: string, likesCount: number) => void;
  setActiveColor: (color: StickyColor | 'all') => void;
  setActiveTab: (tab: 'latest' | 'trending') => void;
  setSearchQuery: (query: string) => void;
  setCreateModalOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAdminViewOpen: (open: boolean) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  triggerToast: (message: string, variant?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useWallStore = create<WallState>((set) => ({
  posts: [],
  activeColor: 'all',
  activeTab: 'latest',
  searchQuery: '',
  isCreateModalOpen: false,
  isAuthModalOpen: false,
  isAdminViewOpen: false,
  notifications: [],
  unreadCount: 0,
  toastNotification: null,

  setPosts: (posts) => set({ posts }),

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

  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

  setAdminViewOpen: (isAdminViewOpen) => set({ isAdminViewOpen }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      toastNotification: notification,
    })),

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
}));
