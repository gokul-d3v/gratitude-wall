import { api } from './api';
import { useAuthStore } from '../store/useAuthStore';

// In-memory cache of post IDs marked as read in the current session
const sessionSeenPostIds = new Set<string>();
let pendingPostIds: string[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const flushPendingReads = async () => {
  if (pendingPostIds.length === 0) return;

  const idsToSend = [...pendingPostIds];
  pendingPostIds = [];

  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;

  try {
    await api.post('/posts/batch-read', { postIds: idsToSend });
  } catch (error) {
    // If batch fails, we don't retry aggressively to prevent loop
  }
};

/**
 * Track a post as viewed/read automatically when visible on screen.
 * Debounces and batches requests to minimize network overhead.
 */
export const trackPostView = (postId: string) => {
  if (!postId) return;

  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;

  if (sessionSeenPostIds.has(postId)) return;

  sessionSeenPostIds.add(postId);
  pendingPostIds.push(postId);

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    flushPendingReads();
  }, 100);
};
