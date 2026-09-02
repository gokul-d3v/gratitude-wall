import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Star, Heart, Tag, Sparkles, X, ChevronRight, Crown } from 'lucide-react';
import { api } from '../services/api';
import { useWallStore } from '../store/useWallStore';
import { initSocketClient } from '../services/socket';
import { TopAppreciatedMember } from '../types';

export const TopGratitudeSpotlight: React.FC = () => {
  const [topMembers, setTopMembers] = useState<TopAppreciatedMember[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const { posts } = useWallStore();

  useEffect(() => {
    fetchTopMembers();

    const socket = initSocketClient();
    const handleUpdate = () => {
      fetchTopMembers();
    };

    socket.on('new_post', handleUpdate);
    socket.on('reaction_update', handleUpdate);
    socket.on('delete_post', handleUpdate);

    return () => {
      socket.off('new_post', handleUpdate);
      socket.off('reaction_update', handleUpdate);
      socket.off('delete_post', handleUpdate);
    };
  }, []);

  useEffect(() => {
    fetchTopMembers();
  }, [posts.length]);

  const fetchTopMembers = async () => {
    try {
      const res = await api.get('/users/top-gratitude');
      setTopMembers(res.data.data || []);
    } catch {
      setTopMembers([]);
    }
  };

  if (!topMembers || topMembers.length === 0) return null;

  const champion = topMembers[0];

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: '🥇',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 2:
        return {
          icon: '🥈',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
        };
      case 3:
        return {
          icon: '🥉',
          bg: 'bg-amber-800/10 text-amber-900 border-amber-700/30',
        };
      default:
        return {
          icon: `#${rank}`,
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
  };

  return (
    <>
      {/* Wall Spotlight Minimal Bar */}
      <div
        onClick={() => setIsLeaderboardOpen(true)}
        className="group flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-yellow-50/50 border border-amber-200/70 hover:border-amber-400/80 px-4 sm:px-5 py-2.5 rounded-2xl shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer w-full overflow-hidden"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Trophy className="w-4 h-4 fill-white/80" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-amber-900/90 shrink-0">Most Appreciated:</span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              {champion.user.fullName}
            </span>
            {champion.user.team && (
              <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full border border-black/5 shrink-0">
                {champion.user.team}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white/90 border border-amber-200/60 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{champion.score} pts</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/60 group-hover:bg-amber-200 px-2.5 py-1 rounded-xl transition-colors">
            <span>Top 5</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Minimal Top 5 Leaderboard Modal */}
      {isLeaderboardOpen &&
        createPortal(
          <div
            onClick={() => setIsLeaderboardOpen(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#fffcf9] rounded-3xl shadow-2xl border border-black/10 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-black/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <Trophy className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Leaderboard</h3>
                    <p className="text-[11px] text-slate-500">Top 5 appreciated members</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minimal Leaderboard List */}
              <div className="p-4 space-y-2 overflow-y-auto">
                {topMembers.map((member) => {
                  const badge = getRankBadge(member.rank);
                  const isFirst = member.rank === 1;

                  return (
                    <div
                      key={member.user._id || member.user.email}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isFirst
                          ? 'bg-amber-50/60 border-amber-300/80 shadow-2xs'
                          : 'bg-white border-black/5 shadow-2xs'
                      }`}
                    >
                      {/* Left: Rank, Avatar & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center font-extrabold text-xs shrink-0 ${badge.bg}`}
                        >
                          {badge.icon}
                        </div>

                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                          style={{ backgroundColor: member.user.avatarColor || '#0058bd' }}
                        >
                          {member.user.fullName?.charAt(0).toUpperCase()}
                        </div>

                        {/* Name & Team */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {member.user.fullName}
                            </span>
                            {isFirst && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />}
                          </div>
                          {member.user.team && (
                            <span className="text-[10px] text-slate-500 font-medium truncate block">
                              {member.user.team}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Metrics & Points */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                          <span className="flex items-center gap-0.5 text-[#0058bd] bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100/80 font-bold">
                            <Tag className="w-3 h-3" />
                            {member.tagsCount}
                          </span>
                          <span className="flex items-center gap-0.5 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/80 font-bold">
                            <Heart className="w-3 h-3 fill-current" />
                            {member.likesCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-400/90 text-amber-950 font-black text-xs px-2.5 py-1 rounded-xl shadow-2xs">
                          <span>{member.score}</span>
                          <span className="text-[10px] font-bold opacity-80">pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Minimal Scoring Note Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Formula:</span>
                  <span>(🏷️ Tags × 3) + (❤️ Likes × 2)</span>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
