import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, X, Tag } from 'lucide-react';
import { StickyColor, User } from '../types';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import confetti from 'canvas-confetti';

const colors: { key: StickyColor; hex: string; name: string }[] = [
  { key: 'yellow', hex: '#FFF59D', name: 'Pastel Yellow' },
  { key: 'green', hex: '#C8E6C9', name: 'Pastel Green' },
  { key: 'blue', hex: '#BBDEFB', name: 'Pastel Blue' },
  { key: 'pink', hex: '#F8BBD0', name: 'Pastel Pink' },
  { key: 'purple', hex: '#E1BEE7', name: 'Pastel Purple' },
];

export const CreateNoteModal: React.FC = () => {
  const { user } = useAuthStore();
  const { setCreateModalOpen, addPost, triggerToast } = useWallStore();

  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<StickyColor>('yellow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tagging users state
  const [tagQuery, setTagQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

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
    if (!selectedUsers.some((u) => u.id === taggedUser.id || u.employeeCode === taggedUser.employeeCode)) {
      setSelectedUsers([...selectedUsers, taggedUser]);
    }
    setTagQuery('');
    setSearchResults([]);
  };

  const handleRemoveUserTag = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId && u.employeeCode !== userId));
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

      setCreateModalOpen(false);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to post gratitude note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 dotted-canvas overflow-y-auto">
      {/* Top Bar: "Back to Wall" Pill Button */}
      <div className="w-full max-w-4xl flex items-center justify-start mb-6 px-4">
        <button
          onClick={() => setCreateModalOpen(false)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 shadow-xs text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all hover:shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wall
        </button>
      </div>

      {/* Sticky Note Creation Card */}
      <div className="relative w-full max-w-xl mx-auto rounded-lg shadow-xl border border-slate-200/80 p-8 sm:p-10 note-bg-yellow transition-colors duration-300">
        {/* Top Tape Strip */}
        <div className="tape-strip" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Header Prompt */}
          <h2 className="text-3xl sm:text-4xl font-bold font-sans-main text-slate-900 tracking-tight">
            What are you grateful for today?
          </h2>

          {/* Content Input */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note of appreciation or thankfulness here..."
            maxLength={500}
            rows={5}
            required
            className="w-full bg-transparent resize-none outline-none text-xl sm:text-2xl font-handwriting font-bold text-slate-800 placeholder-slate-400 focus:ring-0 border-0 p-0"
          />

          {/* Tagged Recipients Selector */}
          <div className="relative border-t border-slate-800/10 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              TAG A PERSON
            </label>

            {/* Selected Tag Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id || u.employeeCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 border border-slate-300 shadow-2xs"
                  >
                    @{u.fullName} ({u.employeeCode})
                    <button
                      type="button"
                      onClick={() => handleRemoveUserTag(u.id || u.employeeCode)}
                      className="hover:text-red-500 cursor-pointer"
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
              className="w-full px-3 py-2 rounded-md bg-white/60 border border-slate-300/60 text-sm focus:outline-none focus:bg-white"
            />

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-40 overflow-y-auto z-50">
                {searchResults.map((u) => (
                  <button
                    key={u.id || (u as any)._id}
                    type="button"
                    onClick={() => handleAddUserTag(u)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center justify-between text-sm text-slate-700 cursor-pointer"
                  >
                    <span className="font-medium">{u.fullName}</span>
                    <span className="text-xs text-slate-400 font-mono">Code: {u.employeeCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-800/10 my-1" />

          {/* Bottom Bar: COLOR picker circles */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">COLOR</span>
              <div className="flex items-center gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedColor(c.key)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-7 h-7 rounded-full border border-slate-400/40 transition-transform cursor-pointer ${
                      selectedColor === c.key ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Posting...' : 'Post Gratitude'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
