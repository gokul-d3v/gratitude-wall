import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, X } from 'lucide-react';
import { StickyColor, User } from '../types';
import { api, updatePostApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import confetti from 'canvas-confetti';

const colors: { key: StickyColor; hex: string; bgClass: string; name: string }[] = [
  { key: 'yellow', hex: '#FFF9C4', bgClass: 'bg-sticky-yellow', name: 'Pastel Yellow' },
  { key: 'green', hex: '#E8F5E9', bgClass: 'bg-sticky-green', name: 'Pastel Green' },
  { key: 'blue', hex: '#E3F2FD', bgClass: 'bg-sticky-blue', name: 'Pastel Blue' },
  { key: 'pink', hex: '#FCE4EC', bgClass: 'bg-sticky-pink', name: 'Pastel Pink' },
  { key: 'purple', hex: '#F3E8FF', bgClass: 'bg-sticky-purple', name: 'Pastel Purple' },
];

export const CreateNoteModal: React.FC = () => {
  const { user } = useAuthStore();
  const { setCreateModalOpen, editingPost, setEditingPost, addPost, triggerToast } = useWallStore();

  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<StickyColor>('yellow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tagging users state
  const [tagQuery, setTagQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Pre-fill state when editing an existing post
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content || '');
      setSelectedColor(editingPost.color || 'yellow');
      setSelectedUsers(editingPost.taggedUsers || []);
    } else {
      setContent('');
      setSelectedColor('yellow');
      setSelectedUsers([]);
    }
  }, [editingPost]);

  const handleClose = () => {
    setCreateModalOpen(false);
    setEditingPost(null);
  };

  useEffect(() => {
    if (tagQuery.trim().length > 0) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/users/search?q=${encodeURIComponent(tagQuery)}`);
          setSearchResults(res.data.data || []);
        } catch {
          setSearchResults([]);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [tagQuery]);

  const handleAddUserTag = (taggedUser: User) => {
    if (!selectedUsers.some((u) => u.id === taggedUser.id || u.email === taggedUser.email)) {
      setSelectedUsers([...selectedUsers, taggedUser]);
    }
    setTagQuery('');
    setSearchResults([]);
  };

  const handleRemoveUserTag = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId && u.email !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!user) {
      triggerToast('You must be logged in to post a gratitude note.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPost) {
        const res = await updatePostApi(editingPost._id, {
          content: content.trim(),
          taggedUserIds: selectedUsers.map((u) => u.id || (u as any)._id),
          color: selectedColor,
        });

        const updatedData = res.data || res;
        useWallStore.getState().setPosts(
          useWallStore.getState().posts.map((p) => (p._id === editingPost._id ? { ...p, ...updatedData } : p))
        );
        triggerToast('Your gratitude note has been updated!', 'success');
        handleClose();
      } else {
        const res = await api.post('/posts', {
          content: content.trim(),
          taggedUserIds: selectedUsers.map((u) => u.id || (u as any)._id),
          color: selectedColor,
        });

        addPost(res.data.data);
        triggerToast('Your gratitude note has been shared on the wall!', 'success');

        // Trigger celebration confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        handleClose();
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to save gratitude note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBgClass = colors.find((c) => c.key === selectedColor)?.bgClass || 'bg-sticky-yellow';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto min-h-screen">
      <div className="w-full max-w-xl mx-auto my-auto flex flex-col gap-4 animate-fade-slide-up">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Wall
          </button>

          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white text-slate-500 hover:text-slate-800 border border-slate-200 transition-all cursor-pointer shadow-xs"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticky Note Form Card */}
        <div className={`relative w-full rounded-2xl shadow-2xl border border-black/10 p-6 sm:p-8 ${activeBgClass} transition-colors duration-300`}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Header Prompt */}
            <h2 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 tracking-tight">
              {editingPost ? 'Edit your gratitude note' : 'What are you grateful for today?'}
            </h2>

            {/* Message Input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note of appreciation here..."
              maxLength={500}
              rows={4}
              required
              className="w-full bg-transparent resize-none outline-none text-lg sm:text-xl font-sans italic text-slate-800 placeholder-slate-400 focus:ring-0 border-0 p-0 leading-relaxed"
            />

            {/* Tagged Recipients Selector */}
            <div className="relative border-t border-black/10 pt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                TAG A PERSON
              </label>

              {/* Tag Chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id || u.email}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-slate-800 border border-slate-300 shadow-2xs"
                    >
                      @{u.fullName} ({u.email})
                      <button
                        type="button"
                        onClick={() => handleRemoveUserTag(u.id || u.email)}
                        className="hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="Search user by name or employee code..."
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-slate-300/60 text-xs sm:text-sm focus:outline-none focus:bg-white"
              />

              {/* Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-40 overflow-y-auto z-50">
                  {searchResults.map((u) => (
                    <button
                      key={u.id || (u as any)._id}
                      type="button"
                      onClick={() => handleAddUserTag(u)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-xs sm:text-sm text-slate-700 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium">{u.fullName}</span>
                      <span className="text-[10px] font-mono text-slate-400">Code: {u.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-black/10 my-0.5" />

            {/* Color Palette & Submit Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">STICKY COLOR</span>
                <div className="flex items-center gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setSelectedColor(c.key)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full border border-slate-400/40 transition-transform cursor-pointer ${
                        selectedColor === c.key ? 'ring-2 ring-[#0058bd] ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer ml-auto"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? (editingPost ? 'Saving...' : 'Posting...') : (editingPost ? 'Update Gratitude' : 'Post Gratitude')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
