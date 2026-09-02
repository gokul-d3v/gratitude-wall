import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Check, Heart, Eye, Sparkles } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';
import { useAuthStore } from '../store/useAuthStore';
import { StickyColor, Post } from '../types';
import { api } from '../services/api';
import { PostEngagementsModal } from './PostEngagementsModal';

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
  const { viewingPost, setViewingPost, triggerToast, setAuthModalOpen } = useWallStore();
  const { isAuthenticated } = useAuthStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isEngagementOpen, setIsEngagementOpen] = useState(false);
  const [engagementTab, setEngagementTab] = useState<'likes' | 'reads'>('likes');

  // Track post read when opened by logged-in user
  useEffect(() => {
    if (viewingPost?._id && isAuthenticated) {
      api.post(`/posts/${viewingPost._id}/read`).catch(() => {
        // Silence read tracking failure
      });
    }
  }, [viewingPost?._id, isAuthenticated]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewingPost) return;
    const url = `${window.location.origin}?post=${viewingPost._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      if (triggerToast) triggerToast('Link copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      if (triggerToast) triggerToast('Failed to copy link', 'error');
    }
  };

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

        {/* Card Footer: Likes, Reads, Share & Icon */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 mt-8 border-t border-black/10">
          <div className="flex items-center gap-4">
            {/* Likes count & modal trigger */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  if (triggerToast) triggerToast('Please sign in to see who liked this post', 'info');
                  setAuthModalOpen(true);
                  return;
                }
                setEngagementTab('likes');
                setIsEngagementOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white text-rose-600 font-bold text-xs shadow-xs border border-black/5 transition-all cursor-pointer"
              title="View who liked this post"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>{post.likesCount || 0} Likes</span>
            </button>

            {/* Reads count & modal trigger */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  if (triggerToast) triggerToast('Please sign in to see who read this post', 'info');
                  setAuthModalOpen(true);
                  return;
                }
                setEngagementTab('reads');
                setIsEngagementOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white text-[#0058bd] font-bold text-xs shadow-xs border border-black/5 transition-all cursor-pointer"
              title="View who read this post"
            >
              <Eye className="w-4 h-4" />
              <span>{post.readsCount || 0} Reads</span>
            </button>

            {/* Share Link */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white text-slate-700 font-semibold text-xs shadow-xs border border-black/5 transition-all cursor-pointer"
                title="Share Link"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>Share</span>
                  </>
                )}
              </button>
              {isCopied && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-lg whitespace-nowrap animate-in fade-in zoom-in duration-200 pointer-events-none z-10">
                  Link copied to clipboard!
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              )}
            </div>
          </div>

          {/* Gratitude Icon Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 text-[#424753] font-bold text-xs opacity-75"
            title="Virtual Gratitude Note"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Gratitude Note</span>
          </div>
        </div>

        {/* Post Engagements Modal */}
        <PostEngagementsModal
          postId={post._id}
          isOpen={isEngagementOpen}
          initialTab={engagementTab}
          onClose={() => setIsEngagementOpen(false)}
        />
      </div>
    </div>
  );
};
