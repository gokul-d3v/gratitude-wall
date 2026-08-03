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

const whatsappEmojis = [
  { symbol: '❤️', label: 'Love' },
  { symbol: '🙏', label: 'Thankful' },
  { symbol: '🌟', label: 'Star' },
  { symbol: '🎉', label: 'Celebrate' },
  { symbol: '🔥', label: 'Fire' },
  { symbol: '💡', label: 'Inspired' },
];

export const StickyNoteCard: React.FC<StickyNoteCardProps> = ({ post }) => {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen, triggerToast } = useWallStore();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('❤️');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setLikesCount(post.likesCount || 0);
    if (post.hasLiked !== undefined) {
      setHasLiked(post.hasLiked);
    }
  }, [post.likesCount, post.hasLiked]);

  const handleSelectReaction = async (emojiSymbol: string) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    setSelectedEmoji(emojiSymbol);
    setShowPicker(false);

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
      triggerToast('Could not update reaction. Please try again.', 'error');
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
      } p-6 flex flex-col justify-between rounded-lg font-sans transition-all relative group`}
    >
      {/* Top Header with Gratified Person Avatar & Label */}
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

      {/* Card Footer: WhatsApp-Style Quick Reaction Bar */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-black/5 relative">
        <div className="relative">
          {/* Floating WhatsApp-Style Emoji Picker Popover */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 bg-slate-900/90 text-white p-2 rounded-full shadow-2xl backdrop-blur-md z-40 animate-fade-slide-up border border-slate-700">
              {whatsappEmojis.map((e) => (
                <button
                  key={e.symbol}
                  onClick={() => handleSelectReaction(e.symbol)}
                  className="text-lg hover:scale-130 transition-transform cursor-pointer px-1 active:scale-95"
                  title={e.label}
                >
                  {e.symbol}
                </button>
              ))}
            </div>
          )}

          {/* Active Reaction Badge (WhatsApp Style) */}
          <button
            onClick={() => {
              if (!hasLiked) {
                setShowPicker(!showPicker);
              } else {
                handleSelectReaction(selectedEmoji);
              }
            }}
            onMouseEnter={() => setShowPicker(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
              hasLiked
                ? 'bg-white border-rose-200 text-slate-900 font-bold scale-105'
                : 'bg-white/70 hover:bg-white border-black/10 text-slate-700'
            }`}
            title="Hover or click to react (WhatsApp style)"
          >
            <span className="text-base">{selectedEmoji}</span>
            <span className="text-xs font-bold">{likesCount}</span>
          </button>
        </div>

        <span className="text-[10px] font-bold text-[#424753] opacity-60">#gratitude</span>
      </div>
    </div>
  );
};
