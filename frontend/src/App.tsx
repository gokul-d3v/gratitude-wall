import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { StickyNoteCard } from './components/StickyNoteCard';
import { FloatingActionButton } from './components/FloatingActionButton';
import { CreateNoteModal } from './components/CreateNoteModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TopGratitudeSpotlight } from './components/TopGratitudeSpotlight';
import { NotificationToast } from './components/NotificationToast';
import { useWallStore } from './store/useWallStore';
import { useAuthStore } from './store/useAuthStore';
import { api } from './services/api';
import { initSocketClient } from './services/socket';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const {
    posts,
    setPosts,
    activeColor,
    activeTab,
    searchQuery,
    isCreateModalOpen,
    setCreateModalOpen,
    setAuthModalOpen,
    isAdminViewOpen,
  } = useWallStore();

  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      if (res.data && Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
      }
    } catch (error) {
      console.warn('⚠️ Initial post fetch retry queued...', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cold Start & Realtime Connection Management
  useEffect(() => {
    // 1. Initial Post Fetch & Auth Check
    fetchPosts();
    checkAuth();

    // 2. Fallback Polling if Server was restarting or MongoDB connecting
    const retryTimers = [
      setTimeout(fetchPosts, 800),
      setTimeout(fetchPosts, 2000),
      setTimeout(fetchPosts, 4000),
    ];

    // 3. Socket Gateway Setup with Reconnect Auto-Fetch
    const socket = initSocketClient();

    const handleConnect = () => {
      console.log('⚡ Connected/Reconnected to Gateway - Auto Refetching Wall Posts');
      fetchPosts();
    };

    const handleNewPost = (post: any) => {
      console.log('⚡ [Realtime Socket] new_post received:', post);
      useWallStore.getState().addPost(post);
      useWallStore.getState().addNotification({
        id: Date.now().toString(),
        type: 'NEW_POST',
        senderName: 'Gratitude Wall',
        message: 'Someone shared a love!',
        postId: post._id,
        createdAt: new Date().toISOString(),
      });
    };

    const handleLikeUpdate = ({ postId, likesCount }: { postId: string; likesCount: number }) => {
      console.log('⚡ [Realtime Socket] like_update received:', postId, likesCount);
      useWallStore.getState().updateLikeCount(postId, likesCount);
    };

    const handleReactionUpdate = ({ postId, reactions, likesCount }: any) => {
      console.log('⚡ [Realtime Socket] reaction_update received:', postId, reactions, likesCount);
      useWallStore.setState((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? { ...p, reactions, likesCount } : p)),
      }));
    };

    const handleNotification = (notif: any) => {
      console.log('⚡ [Realtime Socket] notification received:', notif);
      useWallStore.getState().addNotification(notif);
    };

    socket.on('connect', handleConnect);
    socket.on('new_post', handleNewPost);
    socket.on('like_update', handleLikeUpdate);
    socket.on('reaction_update', handleReactionUpdate);
    socket.on('notification', handleNotification);

    return () => {
      retryTimers.forEach(clearTimeout);
      socket.off('connect', handleConnect);
      socket.off('new_post', handleNewPost);
      socket.off('like_update', handleLikeUpdate);
      socket.off('reaction_update', handleReactionUpdate);
      socket.off('notification', handleNotification);
    };
  }, []);

  // Re-fetch posts whenever authentication state changes
  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]);

  const handleOpenAddPost = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      setCreateModalOpen(true);
    }
  };

  // Filter & Sort posts based on active color filter, search query, and Latest / Trending tab
  const filteredPosts = useMemo(() => {
    const list = posts.filter((post) => {
      const matchesColor = activeColor === 'all' || post.color === activeColor;
      const matchesSearch =
        !searchQuery.trim() ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesColor && matchesSearch;
    });

    if (activeTab === 'trending') {
      return [...list].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      return [...list].sort(
        (a, b) => new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
      );
    }
  }, [posts, activeColor, activeTab, searchQuery]);

  return (
    <div className="min-h-screen">
      <NotificationToast />

      <main className="p-4 sm:p-8 md:p-12 flex flex-col gap-8 max-w-7xl mx-auto">
        <Header />

        {/* Most Appreciated / Tagged Person Spotlight */}
        <TopGratitudeSpotlight />

        {/* Wall Workspace */}
        {isLoading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-slate-400">
            <Sparkles className="w-8 h-8 animate-spin text-[#0058bd]" />
            <p className="text-sm font-medium">Loading gratitude wall...</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 grid-notes animate-fade-slide-up stagger-2">
            {/* Add New Note Card */}
            <div
              onClick={handleOpenAddPost}
              className="sticky-note bg-blue-50/50 border-2 border-dashed border-[#0058bd]/30 p-8 rounded-lg flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-blue-100/50 transition-all min-h-[220px]"
            >
              <div className="w-14 h-14 rounded-full bg-[#0058bd] text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <p className="font-display font-bold text-lg text-[#0058bd]">Post your gratitude</p>
              <p className="text-xs text-[#424753] mt-0.5">Spread some positivity</p>
            </div>

            {/* Gratitude Sticky Notes Grid */}
            {filteredPosts.map((post) => (
              <StickyNoteCard key={post._id} post={post} />
            ))}
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={handleOpenAddPost} />

      {/* Modals & Dashboard Overlay */}
      {isCreateModalOpen && <CreateNoteModal />}
      <AuthModal />
      {isAdminViewOpen && <AdminDashboard />}
    </div>
  );
};
