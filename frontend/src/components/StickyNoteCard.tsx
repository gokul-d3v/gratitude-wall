import React, { useState, useEffect, useRef } from 'react';
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
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen, triggerToast } = useWallStore();

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(!!(post.hasLiked || post.userEmoji));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Heart burst animation state
  const [showBurst, setShowBurst] = useState(false);
  const [burstPos, setBurstPos] = useState({ x: 0, y: 0 });
  const lastTap = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

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
          <span
            style={{
              fontSize: '80px',
              display: 'block',
              animation: 'heartBurst 0.9s ease-out forwards',
              filter: 'drop-shadow(0 0 12px rgba(244,63,94,0.7))',
              lineHeight: 1,
            }}
          >
            ❤️
          </span>
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

      {/* Card Footer: Insta-style Like Button */}
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
          <span
            className={`text-xl transition-all duration-200 ${
              hasLiked
                ? 'scale-125 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                : 'opacity-60 group-hover/like:opacity-100 group-hover/like:scale-110'
            }`}
            style={{
              display: 'inline-block',
              animation: hasLiked ? 'heartPop 0.3s ease-out' : 'none',
            }}
          >
            {hasLiked ? '❤️' : '🤍'}
          </span>
          <span className={`text-xs font-bold transition-colors ${hasLiked ? 'text-rose-600' : 'text-[#424753]'}`}>
            {likesCount}
          </span>
        </button>

        <span className="text-[10px] font-bold text-[#424753] opacity-60">#gratitude</span>
      </div>

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
          100% { transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
};
