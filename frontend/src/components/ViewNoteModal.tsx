import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';
import { StickyColor, Post } from '../types';

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

export const ViewNoteModal: React.FC = () => {
  const { viewingPost, setViewingPost } = useWallStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingPost(null);
    };
    if (viewingPost) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [viewingPost, setViewingPost]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setViewingPost(null);
    }
  };

  if (!viewingPost) return null;
  const post = viewingPost;

  const firstTagged = post.taggedUsers && post.taggedUsers.length > 0 ? post.taggedUsers[0] : null;
  const avatarInitials = firstTagged ? getInitials(firstTagged.fullName) : 'GW';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-2xl max-h-[88vh] overflow-y-auto ${
          colorClassMap[post.color || 'yellow']
        } p-8 sm:p-12 flex flex-col justify-between rounded-xl font-sans shadow-2xl animate-in zoom-in-95 duration-300`}
      >
        <button
          onClick={() => setViewingPost(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-4 mb-8 pt-4">
          <div className="w-14 h-14 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            {avatarInitials}
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#0058bd] bg-white/80 px-2 py-1 rounded-md border border-black/5">
              Gratified Person
            </span>
            <h4 className="text-xl font-bold text-[#191c1d] mt-1">
              {firstTagged ? `@${firstTagged.fullName}` : 'General Appreciation'}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm uppercase tracking-tighter text-[#424753]">
                {formatTimeAgo(post.createdAt)}
              </span>
              {post.team && (
                <span className="text-xs font-semibold text-slate-600 bg-white/60 px-2 py-0.5 rounded-full border border-black/5">
                  {post.team}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Message Body */}
        <div className="flex-grow my-4">
          <p className="text-xl sm:text-2xl text-[#191c1d] italic leading-relaxed break-words break-all whitespace-pre-wrap font-medium">
            "{post.content}"
          </p>
        </div>

        {/* Tagged user chips */}
        {post.taggedUsers && post.taggedUsers.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {post.taggedUsers.slice(1).map((u) => (
              <span
                key={u.id || u.email}
                className="text-sm font-semibold bg-white/70 text-slate-700 px-3 py-1 rounded-full border border-black/5"
              >
                @{u.fullName}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer: Written by */}
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-black/10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Written by:</span>
            <span className="text-sm font-bold text-slate-800">{post.authorName || 'Anonymous'}</span>
          </div>
          <span className="text-sm font-bold text-[#424753] opacity-60">#gratitude</span>
        </div>
      </div>
    </div>
  );
};
