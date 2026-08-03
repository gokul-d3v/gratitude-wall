import React, { useState } from 'react';
import { Heart, Tag, Flag } from 'lucide-react';
import { Post, StickyColor } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';

interface StickyNoteCardProps {
  post: Post;
}

const colorClassMap: Record<StickyColor, string> = {
  yellow: 'note-bg-yellow',
  green: 'note-bg-green',
  blue: 'note-bg-blue',
  pink: 'note-bg-pink',
  purple: 'note-bg-purple',
};

export const StickyNoteCard: React.FC<StickyNoteCardProps> = React.memo(({ post }) => {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen, triggerToast } = useWallStore();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [isLiking, setIsLiking] = useState(false);

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

  const handleReport = async () => {
    try {
      await api.post(`/posts/${post._id}/report`);
      triggerToast('Thank you for reporting. Content has been flagged for moderation.', 'info');
    } catch {
      triggerToast('Could not submit report. Please try again later.', 'error');
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-6 rounded-sm border shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        colorClassMap[post.color || 'yellow']
      } min-h-[220px] max-w-sm w-full font-sans-main`}
    >
      {/* Tape strip graphic at top header */}
      <div className="tape-strip" />

      {/* Post Content */}
      <div className="mt-3">
        <p className="text-xl leading-snug font-handwriting font-bold text-slate-800 break-words whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Tagged users section */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            {post.taggedUsers.map((user) => (
              <span
                key={user.id || user.employeeCode}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-white/70 text-slate-700 border border-slate-200/60 shadow-2xs"
              >
                @{user.fullName} ({user.employeeCode})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note Footer */}
      <div className="mt-6 pt-3 border-t border-slate-800/10 flex items-center justify-between text-xs text-slate-600">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">FROM</span>
          <span className="font-semibold text-slate-700">
            {post.authorName || 'Employee'} {post.authorEmployeeCode ? `(${post.authorEmployeeCode})` : ''}
          </span>
        </div>

        {/* Action Buttons: Like Heart & Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer ${
              hasLiked
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/50'
            }`}
            title="Like this note"
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-white stroke-white' : 'stroke-slate-600'}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={handleReport}
            className="p-1 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Report inappropriate content"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});
