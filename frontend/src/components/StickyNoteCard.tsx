import React, { useState, useEffect } from 'react';
import { Post, StickyColor } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { Plus } from 'lucide-react';

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

const defaultEmojis = ['❤️', '🙏', '🌟', '🎉', '🔥', '💡'];

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

  const [reactions, setReactions] = useState<Record<string, number>>(post.reactions || { '❤️': post.likesCount || 0 });
  const [myReactedEmojis, setMyReactedEmojis] = useState<string[]>(post.userReactedEmojis || []);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReactions(post.reactions || (post.likesCount ? { '❤️': post.likesCount } : {}));
    if (post.userReactedEmojis) {
      setMyReactedEmojis(post.userReactedEmojis);
    }
  }, [post.reactions, post.userReactedEmojis, post.likesCount]);

  const handleToggleReaction = async (emoji: string) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowPicker(false);

    const isAlreadyReacted = myReactedEmojis.includes(emoji);
    const updatedMyReactions = isAlreadyReacted
      ? myReactedEmojis.filter((e) => e !== emoji)
      : [...myReactedEmojis, emoji];

    const currentCount = reactions[emoji] || 0;
    const updatedCount = isAlreadyReacted ? Math.max(0, currentCount - 1) : currentCount + 1;

    const updatedReactionsObj = { ...reactions };
    if (updatedCount > 0) {
      updatedReactionsObj[emoji] = updatedCount;
    } else {
      delete updatedReactionsObj[emoji];
    }

    setMyReactedEmojis(updatedMyReactions);
    setReactions(updatedReactionsObj);

    try {
      const res = await api.post(`/posts/${post._id}/like`, { emoji });
      if (res.data?.data) {
        setReactions(res.data.data.reactions || {});
        setMyReactedEmojis(res.data.data.userReactedEmojis || []);
      }
    } catch {
      triggerToast('Could not toggle reaction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstTagged = post.taggedUsers && post.taggedUsers.length > 0 ? post.taggedUsers[0] : null;
  const avatarInitials = firstTagged ? getInitials(firstTagged.fullName) : 'GW';

  // Extract active non-zero reaction list for Telegram-style pill bar
  const activeReactionEntries = Object.entries(reactions).filter(([_e, count]) => count > 0);

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

      {/* Card Footer: Telegram-Style Multi-Emoji Reaction Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-black/5 relative">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Active Telegram-Style Reaction Pills */}
          {activeReactionEntries.map(([emoji, count]) => {
            const isMyReaction = myReactedEmojis.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                  isMyReaction
                    ? 'bg-[#0058bd] text-white border-transparent scale-105'
                    : 'bg-white/80 hover:bg-white text-slate-800 border-black/10'
                }`}
                title={`Reaction ${emoji}`}
              >
                <span>{emoji}</span>
                <span className="text-[11px] font-mono">{count}</span>
              </button>
            );
          })}

          {/* Quick (+) Add Reaction Popover Button */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-600 border border-black/10 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-110"
              title="Add Emoji Reaction"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Telegram-Style Emoji Picker Dropdown */}
            {showPicker && (
              <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 bg-slate-900/90 text-white p-2 rounded-full shadow-2xl backdrop-blur-md z-40 animate-fade-slide-up border border-slate-700">
                {defaultEmojis.map((emojiSymbol) => (
                  <button
                    key={emojiSymbol}
                    onClick={() => handleToggleReaction(emojiSymbol)}
                    className="text-lg hover:scale-130 transition-transform cursor-pointer px-1 active:scale-95"
                  >
                    {emojiSymbol}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <span className="text-[10px] font-bold text-[#424753] opacity-60 ml-auto">#gratitude</span>
      </div>
    </div>
  );
};
