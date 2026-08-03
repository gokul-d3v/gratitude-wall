import React, { useEffect, useState, useMemo } from 'react';
import { DottedBackground } from './components/DottedBackground';
import { Header } from './components/Header';
import { StickyNoteCard } from './components/StickyNoteCard';
import { FloatingActionButton } from './components/FloatingActionButton';
import { CreateNoteModal } from './components/CreateNoteModal';
import { AuthModal } from './components/AuthModal';
import { NotificationToast } from './components/NotificationToast';
import { useWallStore } from './store/useWallStore';
import { useAuthStore } from './store/useAuthStore';
import { api } from './services/api';
import { initSocketClient } from './services/socket';
import { Sparkles, HeartHandshake } from 'lucide-react';

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const {
    posts,
    setPosts,
    addPost,
    updateLikeCount,
    activeColor,
    searchQuery,
    isCreateModalOpen,
    setCreateModalOpen,
    addNotification,
    setNotifications,
  } = useWallStore();

  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth & Real-Time Wall
  useEffect(() => {
    checkAuth();
    fetchPosts();

    const socket = initSocketClient();

    // Real-Time Socket Event Listeners
    socket.on('new_post', (post) => {
      addPost(post);
    });

    socket.on('like_update', ({ postId, likesCount }) => {
      updateLikeCount(postId, likesCount);
    });

    socket.on('notification', (notif) => {
      addNotification(notif);
    });

    return () => {
      socket.off('new_post');
      socket.off('like_update');
      socket.off('notification');
    };
  }, [checkAuth, setPosts, addPost, updateLikeCount, addNotification]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/posts');
      setPosts(res.data.posts || []);
    } catch {
      // Fallback empty posts
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts based on active color filter and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesColor = activeColor === 'all' || post.color === activeColor;
      const matchesSearch =
        !searchQuery.trim() ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesColor && matchesSearch;
    });
  }, [posts, activeColor, searchQuery]);

  return (
    <DottedBackground>
      <Header />
      <NotificationToast />

      {/* Main Wall Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 min-h-[calc(100vh-80px)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
            <Sparkles className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Loading gratitude wall...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white/50 backdrop-blur-xs rounded-3xl border border-dashed border-slate-300 max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Gratitude Notes Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Be the first to share appreciation today on the wall!
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-5 px-5 py-2.5 rounded-full bg-[#0066FF] text-white text-xs font-semibold shadow-md hover:bg-[#0052CC] transition-all cursor-pointer"
            >
              + Create First Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
            {filteredPosts.map((post) => (
              <StickyNoteCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button (+) */}
      <FloatingActionButton onClick={() => setCreateModalOpen(true)} />

      {/* Modals */}
      {isCreateModalOpen && <CreateNoteModal />}
      <AuthModal />
    </DottedBackground>
  );
};
