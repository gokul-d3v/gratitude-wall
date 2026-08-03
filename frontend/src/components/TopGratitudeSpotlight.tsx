import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useWallStore } from '../store/useWallStore';
import { initSocketClient } from '../services/socket';
import { Trophy, Star } from 'lucide-react';

interface TopUserItem {
  user: {
    _id?: string;
    fullName: string;
    employeeCode: string;
    avatarColor?: string;
  };
  count: number;
}

export const TopGratitudeSpotlight: React.FC = () => {
  const [topUsers, setTopUsers] = useState<TopUserItem[]>([]);
  const { posts } = useWallStore();

  useEffect(() => {
    fetchTopUsers();

    // Register real-time socket listener for instant spotlight updates
    const socket = initSocketClient();
    const handleNewPost = () => {
      fetchTopUsers();
    };

    socket.on('new_post', handleNewPost);

    return () => {
      socket.off('new_post', handleNewPost);
    };
  }, []);

  // Re-fetch top tagged users whenever posts array changes
  useEffect(() => {
    fetchTopUsers();
  }, [posts.length]);

  const fetchTopUsers = async () => {
    try {
      const res = await api.get('/users/top-gratitude');
      setTopUsers(res.data.data || []);
    } catch {
      setTopUsers([]);
    }
  };

  if (!topUsers || topUsers.length === 0) return null;

  const topRecipient = topUsers[0];

  return (
    <div className="inline-flex items-center gap-2.5 bg-[#fff8f2] border border-[#c2c6d5] px-4 py-1.5 rounded-full shadow-2xs animate-fade-slide-up w-fit max-w-full">
      {/* Icon Badge */}
      <div className="w-5 h-5 rounded-full bg-[#0058bd] text-white flex items-center justify-center shrink-0 shadow-xs">
        <Trophy className="w-3 h-3 text-amber-300" />
      </div>

      {/* Spotlight Label & User Details */}
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#0058bd]">
          Most Appreciated:
        </span>
        <span className="text-xs font-bold text-[#191c1d] truncate">
          {topRecipient.user.fullName}
        </span>
        <span className="text-[10px] font-semibold text-slate-500 font-mono">
          ({topRecipient.user.employeeCode})
        </span>
      </div>

      {/* Count Badge */}
      <div className="flex items-center gap-1 bg-amber-100/90 text-amber-900 border border-amber-300/60 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ml-1">
        <Star className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />
        <span>{topRecipient.count}</span>
      </div>
    </div>
  );
};
