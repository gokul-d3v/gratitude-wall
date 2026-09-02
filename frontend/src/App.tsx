import React, { useEffect, useState, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { Header } from './components/Header';
import { StickyNoteCard } from './components/StickyNoteCard';
import { StickyNoteCardSkeleton } from './components/StickyNoteCardSkeleton';
import { CreateNoteModal } from './components/CreateNoteModal';
import { AuthModal } from './components/AuthModal';
import { ViewNoteModal } from './components/ViewNoteModal';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { AdminDashboard } from './components/AdminDashboard';

import { NotificationModal } from './components/NotificationModal';
import { TopGratitudeSpotlight } from './components/TopGratitudeSpotlight';
import { useWallStore } from './store/useWallStore';
import { useAuthStore } from './store/useAuthStore';
import { api } from './services/api';
import { initSocketClient } from './services/socket';
import { registerAndSubscribePush } from './services/pushService';
import { playNotificationSound } from './utils/audio';

export const App: React.FC = () => {
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const {
    posts,
    setPosts,
    activeColor,
    activeTab,
    searchQuery,
    isCreateModalOpen,
    editingPost,
    setCreateModalOpen,
    setAuthModalOpen,
    isAdminViewOpen,
    setAdminViewOpen,
    isTaggedMeFilter,
  } = useWallStore();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname.toLowerCase());

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

  // URL Router Sync
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Web Push Subscription
  useEffect(() => {
    if (isAuthenticated) {
      registerAndSubscribePush();
    }
  }, [isAuthenticated]);

  // Cold Start & Realtime Connection Management
  useEffect(() => {
    fetchPosts();
    checkAuth();

    const socket = initSocketClient();

    const handleConnect = () => {

      fetchPosts();
    };

    const handleNewPost = (post: any) => {
      useWallStore.getState().addPost(post);
      
      playNotificationSound();
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('New Gratitude Post!', {
              body: `A new gratitude post is posted.`,
              icon: '/vite.svg'
            });
          });
        } else {
          new Notification('New Gratitude Post!', {
            body: `A new gratitude post is posted.`,
            icon: '/vite.svg'
          });
        }
      }
    };

    const handleLikeUpdate = ({ postId, likesCount }: { postId: string; likesCount: number }) => {
      useWallStore.getState().updateLikeCount(postId, likesCount);
    };

    const handleReadsUpdate = ({ postId, readsCount }: { postId: string; readsCount: number }) => {
      useWallStore.getState().updateReadsCount(postId, readsCount);
    };

    const handleReactionUpdate = ({ postId, reactions, likesCount }: any) => {
      useWallStore.setState((state) => ({
        posts: state.posts.map((p) => (p._id === postId ? { ...p, reactions, likesCount } : p)),
      }));
    };


    const handleNotification = (notif: any) => {
      useWallStore.getState().addNotification(notif);
      
      // Play Sound
      playNotificationSound();

      // Native Browser Push Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = notif.type === 'like' ? 'New Like on your Note!' : 'New Gratitude!';
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body: notif.message,
              icon: '/vite.svg'
            });
          });
        } else {
          new Notification(title, {
            body: notif.message,
            icon: '/vite.svg',
          });
        }
      }
    };

    const handlePostUpdate = (updatedPost: any) => {
      useWallStore.getState().setPosts(
        useWallStore.getState().posts.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p))
      );
    };

    const handlePostDelete = ({ postId }: { postId: string }) => {
      useWallStore.getState().setPosts(useWallStore.getState().posts.filter((p) => p._id !== postId));
    };

    socket.on('connect', handleConnect);
    socket.on('new_post', handleNewPost);
    socket.on('like_update', handleLikeUpdate);
    socket.on('reads_update', handleReadsUpdate);
    socket.on('reaction_update', handleReactionUpdate);
    socket.on('notification', handleNotification);
    socket.on('post_update', handlePostUpdate);
    socket.on('post_delete', handlePostDelete);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('new_post', handleNewPost);
      socket.off('like_update', handleLikeUpdate);
      socket.off('reads_update', handleReadsUpdate);
      socket.off('reaction_update', handleReactionUpdate);
      socket.off('notification', handleNotification);
      socket.off('post_update', handlePostUpdate);
      socket.off('post_delete', handlePostDelete);
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]);

  useEffect(() => {
    if (posts.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if (postId) {
        const postToView = posts.find((p) => p._id === postId);
        if (postToView && !useWallStore.getState().viewingPost) {
          useWallStore.getState().setViewingPost(postToView);
          
          // Optionally clean up URL so it doesn't stay in the address bar
          // window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [posts.length]);

  const handleOpenAddPost = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      setCreateModalOpen(true);
    }
  };

  const filteredPosts = useMemo(() => {
    const list = posts.filter((post) => {
      const matchesColor = activeColor === 'all' || post.color === activeColor;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.authorName?.toLowerCase().includes(searchLower) ||
        post.author?.team?.toLowerCase().includes(searchLower) ||
        post.authorEmail?.toLowerCase().includes(searchLower);
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

  // Dedicated Route 1: http://localhost:5173/admin-login -> Admin Login Screen
  if (currentPath === '/admin-login' || currentPath === '/admin/login') {
    return (
      <>
        <AdminLoginScreen />
      </>
    );
  }

  // Dedicated Route 2: http://localhost:5173/admin -> Admin Console
  if (currentPath === '/admin' || isAdminViewOpen) {
    return (
      <>
        <AdminDashboard />
      </>
    );
  }

  // Default Route: http://localhost:5173/ -> BROTIFY Gratitude Wall (User Home Page)
  return (
    <div className="min-h-screen">

      <main className="p-4 sm:p-8 md:p-12 flex flex-col gap-8 max-w-7xl mx-auto">
        <Header />
        
        <div className="flex justify-center md:justify-start">
          <TopGratitudeSpotlight />
        </div>

        {/* Wall Workspace */}
        {isLoading && posts.length === 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <StickyNoteCardSkeleton key={i} />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 grid-notes animate-fade-slide-up stagger-2 items-start">
            {/* Add New Note Card */}
            {!isTaggedMeFilter && (
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
            )}

            {/* Gratitude Sticky Notes Grid */}
            {filteredPosts.map((post) => (
              <StickyNoteCard key={post._id} post={post} />
            ))}
          </section>
        )}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] w-full text-center col-span-full">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
              <Inbox className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No gratitude notes found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery 
                ? "We couldn't find any notes matching your search criteria. Try adjusting your filters or search terms."
                : isTaggedMeFilter 
                ? "You haven't been tagged in any gratitude notes yet. Spread some positivity and it will come back to you!"
                : "The wall is currently empty. Be the first to share your appreciation and brighten someone's day!"}
            </p>
          </div>
        )}
      </main>

      {/* User Auth, Announcement Toast & Modals */}
      {(isCreateModalOpen || Boolean(editingPost)) && <CreateNoteModal />}
      <AuthModal />
      <ViewNoteModal />
      <NotificationModal />
    </div>
  );
};
