import React, { useState, useEffect } from 'react';
import { Post, StickyColor } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';

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
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
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
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({ post }) => {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen, triggerToast } = useWallStore();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    setLikesCount(post.likesCount || 0);
    if (post.hasLiked !== undefined) {
      setHasLiked(post.hasLiked);
    }
  }, [post.likesCount, post.hasLiked]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    const previousLikes = likesCount;
    const previousState = hasLiked;

    setLikesCount(hasLiked ? Math.max(0, likesCount - 1) : likesCount + 1);
    setHasLiked(!hasLiked);

    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLikesCount(res.data.data.likesCount);
      setHasLiked(res.data.data.hasLiked);
    } catch {
      setLikesCount(previousLikes);
      setHasLiked(previousState);
      triggerToast('Could not update like. Please try again.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const firstTagged = post.taggedUsers && post.taggedUsers.length > 0 ? post.taggedUsers[0] : null;
  const avatarInitials = firstTagged ? getInitials(firstTagged.fullName) : 'GW';

  return (
    <div
      className={`sticky-note ${
        colorClassMap[post.color || 'yellow']
      } p-6 flex flex-col justify-between rounded-lg font-sans transition-all`}
    >
      {/* Top Header with Avatar & Time */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {avatarInitials}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#191c1d]">
            {firstTagged ? `@${firstTagged.fullName}` : 'Gratitude Post'}
          </h4>
          <p className="text-[10px] uppercase tracking-tighter text-[#424753]">
            {formatTimeAgo(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Message Body */}
      <p className="text-base text-[#191c1d] italic flex-grow leading-relaxed break-words whitespace-pre-wrap">
        "{post.content}"
      </p>

      {/* Tagged users chips if any */}
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

      {/* Card Footer: Material Symbols Like Heart (Vibrant Red when liked) */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/5">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-1.5 transition-transform hover:scale-110 cursor-pointer ${
            hasLiked ? 'text-red-600' : 'text-[#424753] hover:text-red-600'
          }`}
          title="Like this post"
        >
          <span
            className="material-symbols-outlined text-xl transition-colors"
            style={{
              fontVariationSettings: hasLiked ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
              color: hasLiked ? '#dc2626' : 'inherit',
            }}
          >
            favorite
          </span>
          <span className={`text-xs font-bold ${hasLiked ? 'text-red-600' : 'text-[#424753]'}`}>
            {likesCount}
          </span>
        </button>

        <span className="text-[10px] font-bold text-[#424753] opacity-60">#gratitude</span>
      </div>
    </div>
  );
};
