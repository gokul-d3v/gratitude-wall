import React, { useState, useEffect, useRef } from 'react';
import { Post, StickyColor } from '../types';
import { api, updatePostApi, deletePostApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface StickyNoteCardProps {
  post: Post;
}

const colorClassMap: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  blue: 'bg-sticky-blue',
  pink: 'bg-sticky-pink',
  green: 'bg-sticky-green',
  purple: 'bg-sticky-purple',
};

const getInitials = (name?: string): string => {
  if (!name) return 'GW';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const formatTimeAgo = (dateStr: string): string => {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({ post }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { setAuthModalOpen, triggerToast } = useWallStore();

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(!!(post.hasLiked || post.userEmoji));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Heart burst animation state
  const [showBurst, setShowBurst] = useState(false);
  const [burstPos, setBurstPos] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Options menu state
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if user can edit/delete (within 10 minutes and is author, or admin)
  const getAuthorId = (author: any): string => {
    if (!author) return '';
    if (typeof author === 'string') return author;
    if (author._id) return author._id.toString();
    if (author.id) return author.id.toString();
    return author.toString();
  };

  const getUserId = (u: any): string => {
    if (!u) return '';
    if (u.id) return u.id.toString();
    if (u._id) return u._id.toString();
    return '';
  };

  const currentUserId = getUserId(user);
  const authorId = getAuthorId(post.author);
  const isAuthor = Boolean(currentUserId && authorId && currentUserId === authorId);
  const isAdmin = user?.role === 'ADMIN';
  const postAgeMs = Date.now() - new Date(post.createdAt).getTime();
  const canModify = (isAuthor && postAgeMs < 10 * 60 * 1000) || isAdmin;

  // Options dropdown menu click-outside ref
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  useEffect(() => {
    setLikesCount(post.likesCount || 0);
    setHasLiked(!!(post.hasLiked || post.userEmoji));
  }, [post.likesCount, post.hasLiked, post.userEmoji]);

  const triggerHeartBurst = (x: number, y: number) => {
    setBurstPos({ x, y });
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 900);
  };

  const handleToggleLike = async (x?: number, y?: number) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    // Trigger burst animation when liking
    if (nextLiked && x !== undefined && y !== undefined) {
      triggerHeartBurst(x, y);
    }

    try {
      const res = await api.post(`/posts/${post._id}/like`, { emoji: '❤️' });
      if (res.data?.data) {
        setLikesCount(res.data.data.likesCount);
        setHasLiked(!!res.data.data.userEmoji);
      }
    } catch {
      setHasLiked(!nextLiked);
      setLikesCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
      triggerToast('Could not update like', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = () => {
    useWallStore.getState().setEditingPost(post);
    setShowOptions(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowOptions(false);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await deletePostApi(post._id);
      // Remove post from store
      useWallStore.getState().setPosts(useWallStore.getState().posts.filter((p) => p._id !== post._id));
      setShowDeleteConfirm(false);
      triggerToast('Post deleted successfully', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to delete post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Double-tap to like (Instagram reel style)
  const handleCardDoubleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = cardRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.nativeEvent.offsetX;
    const y = rect ? e.clientY - rect.top : e.nativeEvent.offsetY;

    if (now - lastTap.current < 350) {
      // Double tap — always like (never unlike on double tap, Instagram style)
      if (!hasLiked) {
        handleToggleLike(x, y);
      } else {
        // Still show burst even if already liked
        triggerHeartBurst(x, y);
      }
    }
    lastTap.current = now;
  };

  const firstTagged = post.taggedUsers && post.taggedUsers.length > 0 ? post.taggedUsers[0] : null;
  const avatarInitials = firstTagged ? getInitials(firstTagged.fullName) : 'GW';

  return (
    <div
      ref={cardRef}
      onDoubleClick={handleCardDoubleTap}
      className={`sticky-note ${
        colorClassMap[post.color || 'yellow']
      } p-6 flex flex-col justify-between rounded-lg font-sans transition-all relative group select-none`}
      style={{ cursor: 'default' }}
    >
      {/* Instagram-style heart burst on double tap */}
      {showBurst && (
        <div
          className="absolute pointer-events-none z-50"
          style={{ left: burstPos.x - 40, top: burstPos.y - 40 }}
        >
          <svg
            viewBox="0 0 24 24"
            width="80"
            height="80"
            style={{
              display: 'block',
              animation: 'heartBurst 0.9s ease-out forwards',
              filter: 'drop-shadow(0 0 12px rgba(220,38,38,0.7))',
            }}
          >
            <path
              d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
              fill="#dc2626"
              stroke="#dc2626"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          {avatarInitials}
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#0058bd] bg-white/80 px-1.5 py-0.5 rounded-md border border-black/5">
            Gratified Person
          </span>
          <h4 className="text-sm font-bold text-[#191c1d] mt-0.5">
            {firstTagged ? `@${firstTagged.fullName}` : 'General Appreciation'}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-tighter text-[#424753]">
              {formatTimeAgo(post.createdAt)}
            </span>
            {post.team && (
              <span className="text-[9px] font-semibold text-slate-600 bg-white/60 px-1.5 py-0.2 rounded-full border border-black/5">
                {post.team}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message Body */}
      <p className="text-base text-[#191c1d] italic flex-grow leading-relaxed break-words whitespace-pre-wrap">
        "{post.content}"
      </p>

      {/* Tagged user chips */}
      {post.taggedUsers && post.taggedUsers.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {post.taggedUsers.slice(1).map((u) => (
            <span
              key={u.id || u.employeeCode}
              className="text-[10px] font-semibold bg-white/70 text-slate-700 px-2 py-0.5 rounded-full border border-black/5"
            >
              @{u.fullName}
            </span>
          ))}
        </div>
      )}

      {/* Options Menu Button */}
      {canModify && (
        <div className="absolute top-2 right-2" ref={optionsRef}>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-xs"
            title="Post options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Options Dropdown */}
          {showOptions && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[120px] z-20">
              <button
                onClick={handleStartEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isSubmitting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Card Footer: Like Button */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/5">
        <button
          onClick={(e) => {
            const rect = cardRef.current?.getBoundingClientRect();
            const x = rect ? e.clientX - rect.left : 24;
            const y = rect ? e.clientY - rect.top : 24;
            handleToggleLike(x, y);
          }}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 group/like cursor-pointer select-none"
          title={hasLiked ? 'Unlike' : 'Like'}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            className="transition-all duration-200"
            style={{
              animation: hasLiked ? 'heartPop 0.3s ease-out' : 'none',
              filter: hasLiked ? 'drop-shadow(0 0 4px rgba(220,38,38,0.5))' : 'none',
              transform: hasLiked ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <path
              d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
              fill={hasLiked ? '#dc2626' : 'none'}
              stroke={hasLiked ? '#dc2626' : '#9ca3af'}
              strokeWidth="1.5"
              className="transition-all duration-200 group-hover/like:stroke-rose-500"
            />
          </svg>
          <span className={`text-xs font-bold transition-colors ${hasLiked ? 'text-rose-600' : 'text-[#9ca3af] group-hover/like:text-rose-500'}`}>
            {likesCount}
          </span>
        </button>

        <span className="text-[10px] font-bold text-[#424753] opacity-60">#gratitude</span>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Gratitude Post?"
        message="Are you sure you want to delete this gratitude post from the wall? This action cannot be undone."
        confirmText="Delete Post"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isSubmitting}
      />

      <style>{`
        @keyframes heartBurst {
          0%   { transform: scale(0.3); opacity: 1; }
          40%  { transform: scale(1.2); opacity: 1; }
          70%  { transform: scale(0.95); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.4); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};
