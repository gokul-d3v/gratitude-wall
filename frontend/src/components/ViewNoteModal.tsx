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

  const taggedUsers = post.taggedUsers || [];
  const hasTagged = taggedUsers.length > 0;
  const authorInitials = getInitials(post.authorName);

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

        {/* Top Header — shows the author */}
        <div className="flex items-center gap-4 mb-4 pt-4">
          <div className="w-14 h-14 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            {authorInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-bold text-[#191c1d]">{post.authorName || 'Anonymous'}</h4>
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

        {/* Gratified Persons or Team */}
        {(hasTagged || post.team) && (
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-black/8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0058bd]">For:</span>
            {hasTagged ? (
              taggedUsers.map((u) => (
                <span
                  key={u.id || u.email || u.fullName}
                  className="text-sm font-bold bg-[#0058bd]/10 text-[#0058bd] px-3 py-1 rounded-full border border-[#0058bd]/20"
                >
                  @{u.fullName}
                </span>
              ))
            ) : (
              <span className="text-sm font-bold bg-[#0058bd]/10 text-[#0058bd] px-3 py-1 rounded-full border border-[#0058bd]/20">
                {post.team}
              </span>
            )}
          </div>
        )}

        {/* Message Body */}
        <div className="flex-grow my-4">
          <p className="text-xl sm:text-2xl text-[#191c1d] italic leading-relaxed break-words break-all whitespace-pre-wrap font-medium">
            "{post.content}"
          </p>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-end pt-6 mt-8 border-t border-black/10">
          <span className="text-sm font-bold text-[#424753] opacity-60">#gratitude</span>
        </div>
      </div>
    </div>
  );
};
