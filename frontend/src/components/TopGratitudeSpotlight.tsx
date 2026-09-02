import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, Star, Heart, Tag, Sparkles, X, ChevronRight, Award, Crown, Flame, Info, Calculator } from 'lucide-react';
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

    // Register real-time socket listener for instant leaderboard updates
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

  // Re-fetch top tagged users whenever posts change
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
  const runnersUp = topMembers.slice(1, 5);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-300 ring-amber-400/30',
          icon: <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />,
          label: '1st',
        };
      case 2:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-400/30',
          icon: <Award className="w-4 h-4 text-slate-500" />,
          label: '2nd',
        };
      case 3:
        return {
          bg: 'bg-amber-800/10 text-amber-900 border-amber-700/30 ring-amber-700/20',
          icon: <Award className="w-4 h-4 text-amber-700" />,
          label: '3rd',
        };
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200 ring-blue-300/20',
          icon: <span className="font-extrabold text-xs">#{rank}</span>,
          label: `${rank}th`,
        };
    }
  };

  return (
    <>
      {/* Wall Spotlight Banner */}
      <div
        onClick={() => setIsLeaderboardOpen(true)}
        className="group relative flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-yellow-50/70 border border-amber-200/80 hover:border-amber-400/80 px-4 sm:px-6 py-3.5 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer w-full overflow-hidden"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Trophy Icon */}
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
            <Trophy className="w-5 h-5 fill-white/80" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>

          {/* Champion Info */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-800/90 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                Most Appreciated Spotlight
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300/50">
                Top 5
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 truncate">
              <span className="text-sm sm:text-base font-extrabold text-[#191c1d] truncate group-hover:text-amber-900 transition-colors">
                {champion.user.fullName}
              </span>
              {champion.user.team && (
                <span className="hidden xs:inline-block text-[10px] font-semibold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full border border-black/5 shrink-0">
                  {champion.user.team}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Runners-up preview */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* Champion Score & Breakdown Pill */}
          <div className="flex items-center gap-2 bg-white/90 border border-amber-200/70 px-3 py-1.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-800" title="Total Appreciation Score">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>{champion.score} pts</span>
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600" title="Likes Received on Appreciation Notes">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{champion.likesCount} likes</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#0058bd]" title="Notes Tagged In">
              <Tag className="w-3.5 h-3.5" />
              <span>{champion.tagsCount} tags</span>
            </div>
          </div>

          {/* Runners-up Avatars preview */}
          {runnersUp.length > 0 && (
            <div className="hidden md:flex items-center -space-x-2">
              {runnersUp.map((m) => (
                <div
                  key={m.user._id || m.user.email}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: m.user.avatarColor || '#0058bd' }}
                  title={`${m.rank}. ${m.user.fullName} (${m.tagsCount} tags, ${m.likesCount} likes)`}
                >
                  {m.user.fullName?.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}

          {/* View Leaderboard Action */}
          <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/60 group-hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors shrink-0">
            <span>Leaderboard</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Top 5 Leaderboard Modal */}
      {isLeaderboardOpen &&
        createPortal(
          <div
            onClick={() => setIsLeaderboardOpen(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-[#fffcf9] rounded-3xl shadow-2xl border border-black/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5 bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center shadow-md shrink-0">
                    <Trophy className="w-6 h-6 fill-white/80" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#191c1d]">Top Appreciated Leaderboard</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300/50">
                        Top 5
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Celebrating our most appreciated team members</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="p-2 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close Leaderboard"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Podium Highlight (Top 3 Visual) */}
              <div className="px-6 pt-6 pb-3 bg-gradient-to-b from-amber-50/50 to-transparent">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end max-w-md mx-auto text-center">
                  {/* Rank 2 (Silver) */}
                  {topMembers[1] && (
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-white/90 border border-slate-200/90 shadow-2xs">
                      <div className="relative mb-2">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                          style={{ backgroundColor: topMembers[1].user.avatarColor || '#64748b' }}
                        >
                          {topMembers[1].user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-200 border-2 border-white text-slate-700 font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                          2
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate w-full">
                        {topMembers[1].user.fullName}
                      </span>
                      {topMembers[1].user.team && (
                        <span className="text-[9px] text-slate-500 truncate w-full">{topMembers[1].user.team}</span>
                      )}
                      {/* Breakdown */}
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          ❤️ {topMembers[1].likesCount}
                        </span>
                        <span className="text-[10px] font-bold text-[#0058bd] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          🏷️ {topMembers[1].tagsCount}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800 font-black mt-1">
                        ⭐ {topMembers[1].score} pts
                      </span>
                    </div>
                  )}

                  {/* Rank 1 (Gold / Champion) */}
                  {champion && (
                    <div className="flex flex-col items-center p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-100/95 to-amber-50/90 border-2 border-amber-400 shadow-md -translate-y-2">
                      <div className="relative mb-2">
                        <Crown className="w-5 h-5 text-amber-500 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg ring-4 ring-amber-300/70"
                          style={{ backgroundColor: champion.user.avatarColor || '#0058bd' }}
                        >
                          {champion.user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          🥇
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate w-full">
                        {champion.user.fullName}
                      </span>
                      {champion.user.team && (
                        <span className="text-[10px] text-amber-900/80 font-semibold truncate w-full">
                          {champion.user.team}
                        </span>
                      )}
                      {/* Breakdown */}
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <span className="text-[10px] font-extrabold text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                          ❤️ {champion.likesCount}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#0058bd] bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                          🏷️ {champion.tagsCount}
                        </span>
                      </div>
                      <span className="text-xs text-amber-950 font-black mt-1.5 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                        {champion.score} pts
                      </span>
                    </div>
                  )}

                  {/* Rank 3 (Bronze) */}
                  {topMembers[2] && (
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-white/90 border border-amber-700/20 shadow-2xs">
                      <div className="relative mb-2">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                          style={{ backgroundColor: topMembers[2].user.avatarColor || '#b45309' }}
                        >
                          {topMembers[2].user.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-100 border-2 border-white text-amber-900 font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                          3
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 truncate w-full">
                        {topMembers[2].user.fullName}
                      </span>
                      {topMembers[2].user.team && (
                        <span className="text-[9px] text-slate-500 truncate w-full">{topMembers[2].user.team}</span>
                      )}
                      {/* Breakdown */}
                      <div className="flex flex-wrap items-center justify-center gap-1 mt-2">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                          ❤️ {topMembers[2].likesCount}
                        </span>
                        <span className="text-[10px] font-bold text-[#0058bd] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          🏷️ {topMembers[2].tagsCount}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800 font-black mt-1">
                        ⭐ {topMembers[2].score} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Ranked List (All 5 Members) */}
              <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex justify-between items-center">
                  <span>Rank & Member</span>
                  <span>Tags & Likes Breakdown</span>
                </div>

                {topMembers.map((member) => {
                  const badge = getRankBadge(member.rank);
                  return (
                    <div
                      key={member.user._id || member.user.email}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        member.rank === 1
                          ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                          : 'bg-white border-black/5 shadow-2xs'
                      }`}
                    >
                      {/* Left: Rank & User Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${badge.bg}`}
                        >
                          {badge.icon}
                        </div>

                        {/* User Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: member.user.avatarColor || '#0058bd' }}
                        >
                          {member.user.fullName?.charAt(0).toUpperCase()}
                        </div>

                        {/* User Meta */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {member.user.fullName}
                            </p>
                            {member.user.team && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0">
                                {member.user.team}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{member.user.email}</p>
                        </div>
                      </div>

                      {/* Right: Explicit Tags & Likes Counters */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Tag Count Pill */}
                        <div
                          className="flex items-center gap-1 text-xs font-bold text-[#0058bd] bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 shadow-2xs"
                          title={`${member.tagsCount} gratitude notes received from teammates`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>{member.tagsCount} tags</span>
                        </div>

                        {/* Like Count Pill */}
                        <div
                          className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100 shadow-2xs"
                          title={`${member.likesCount} total likes received on appreciation notes`}
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>{member.likesCount} likes</span>
                        </div>

                        {/* Total Score Badge */}
                        <div
                          className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-400 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs"
                          title="Total Score = (Tags × 3) + (Likes × 2)"
                        >
                          <Star className="w-3 h-3 fill-white" />
                          <span>{member.score} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* How Points Are Calculated Note */}
              <div className="mx-6 mb-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-slate-700 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1.5">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span>How Points Are Calculated</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200/50 font-medium">
                    <span className="text-base">🏷️</span>
                    <span><strong>1 Tag</strong> = <strong>3 pts</strong> (When tagged in a note)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200/50 font-medium">
                    <span className="text-base">❤️</span>
                    <span><strong>1 Like</strong> = <strong>2 pts</strong> (On your tagged notes)</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200/50 font-bold text-amber-900">
                    <span className="text-base">⭐</span>
                    <span>Score = (Tags × 3) + (Likes × 2)</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-white border-t border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Appreciation is based on tags and likes received from colleagues.</span>
                </div>
                <button
                  onClick={() => setIsLeaderboardOpen(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer shrink-0"
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
