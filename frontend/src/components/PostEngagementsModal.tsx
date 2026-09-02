import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Eye, Users, Search, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useWallStore } from '../store/useWallStore';
import { PostReactionUser, PostReader } from '../types';

interface PostEngagementsModalProps {
  postId: string;
  initialTab?: 'likes' | 'reads';
  isOpen: boolean;
  onClose: () => void;
}

export const PostEngagementsModal: React.FC<PostEngagementsModalProps> = ({
  postId,
  initialTab = 'likes',
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'likes' | 'reads'>(initialTab);
  const [reactions, setReactions] = useState<PostReactionUser[]>([]);
  const [readers, setReaders] = useState<PostReader[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab(initialTab);
      setSearchQuery('');
      fetchEngagements();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, postId, initialTab]);

  // Real-time synchronization for readers and reactions while modal is open
  useEffect(() => {
    if (!isOpen || !postId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleLiveNewRead = (data: { postId: string; readsCount: number; reader?: PostReader }) => {
      if (data.postId === postId && data.reader) {
        setReaders((prev) => {
          const alreadyInList = prev.some(
            (r) => r.user.id === data.reader?.user.id || r.user.email === data.reader?.user.email
          );
          if (alreadyInList) return prev;
          return [data.reader!, ...prev];
        });
      }
    };

    const handleLiveReactionUpdate = (data: any) => {
      if (data.postId === postId && data.userReaction) {
        const { userReaction } = data;
        setReactions((prev) => {
          if (!userReaction.emoji) {
            return prev.filter((r) => r.user.id !== userReaction.userId);
          }
          const remaining = prev.filter((r) => r.user.id !== userReaction.userId);
          const newReactionItem: PostReactionUser = {
            _id: `react-${userReaction.userId}-${Date.now()}`,
            emoji: userReaction.emoji,
            createdAt: userReaction.createdAt || new Date().toISOString(),
            user: userReaction.user,
          };
          return [newReactionItem, ...remaining];
        });
      }
    };

    socket.on('new_read', handleLiveNewRead);
    socket.on('reaction_update', handleLiveReactionUpdate);

    return () => {
      socket.off('new_read', handleLiveNewRead);
      socket.off('reaction_update', handleLiveReactionUpdate);
    };
  }, [isOpen, postId]);

  const fetchEngagements = async () => {
    setIsLoading(true);
    try {
      const [reactionsRes, readsRes] = await Promise.all([
        api.get(`/posts/${postId}/reactions`),
        api.get(`/posts/${postId}/reads`),
      ]);
      setReactions(reactionsRes.data.data || []);
      setReaders(readsRes.data.data?.readers || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        onClose();
        useWallStore.getState().triggerToast('Please sign in to view post activity', 'info');
        useWallStore.getState().setAuthModalOpen(true);
      } else {
        console.error('Failed to fetch post activity:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const filteredReactions = reactions.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.user.fullName?.toLowerCase().includes(q) ||
      r.user.email?.toLowerCase().includes(q) ||
      r.user.team?.toLowerCase().includes(q)
    );
  });

  const filteredReaders = readers.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.user.fullName?.toLowerCase().includes(q) ||
      r.user.email?.toLowerCase().includes(q) ||
      r.user.team?.toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#fffcf9] rounded-3xl shadow-2xl border border-black/10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-black/5 bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100/70 text-[#0058bd] flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#191c1d] leading-tight">Post Activity</h3>
              <p className="text-xs text-slate-500">People who appreciated and read this note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 pb-2 bg-white/50">
          <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'likes'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${activeTab === 'likes' ? 'fill-current text-rose-600' : 'text-slate-400'}`} />
              <span>Liked by</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'likes'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-300/60 text-slate-600'
                }`}
              >
                {reactions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reads')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reads'
                  ? 'bg-white text-[#0058bd] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className={`w-3.5 h-3.5 ${activeTab === 'reads' ? 'text-[#0058bd]' : 'text-slate-400'}`} />
              <span>Read by</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'reads'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-300/60 text-slate-600'
                }`}
              >
                {readers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar (if list is lengthy) */}
        {(reactions.length > 4 || readers.length > 4) && (
          <div className="px-6 pt-1 pb-2 bg-white/50 border-b border-black/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, email, or team..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0058bd]/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-44 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#0058bd]" />
              <span className="text-xs font-medium">Loading activity...</span>
            </div>
          ) : activeTab === 'likes' ? (
            filteredReactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mb-2 shadow-inner">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No reactions yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Be the first to share love on this gratitude note!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReactions.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/5 shadow-2xs transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                        style={{ backgroundColor: r.user.avatarColor || '#0058bd' }}
                      >
                        {r.user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{r.user.fullName}</p>
                          {r.user.team && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold shrink-0">
                              {r.user.team}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{r.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-lg bg-slate-50 border border-black/5 rounded-full w-7 h-7 flex items-center justify-center shadow-2xs">
                        {r.emoji || '❤️'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTime(r.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filteredReaders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center mb-2 shadow-inner">
                <Eye className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No readers logged yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Read receipts are recorded when signed-in team members view this post.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReaders.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/5 shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: r.user.avatarColor || '#0058bd' }}
                    >
                      {r.user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{r.user.fullName}</p>
                        {r.user.team && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold shrink-0">
                            {r.user.team}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{r.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-blue-500/70" />
                    <span className="text-[10px] font-medium">
                      {formatTime(r.readAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white/80 border-t border-black/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
