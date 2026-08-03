import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useWallStore } from '../store/useWallStore';
import { initSocketClient } from '../services/socket';

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
    <div className="bg-[#fff8f2] border border-[#c2c6d5] px-3 py-2 rounded-lg flex items-center gap-2 shadow-xs animate-fade-slide-up transition-all duration-500">
      <div className="w-8 h-8 rounded-full bg-[#0058bd] text-white flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          workspace_premium
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9px] uppercase font-bold tracking-wider text-[#0058bd]">
          Most Appreciated Employee
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs text-[#191c1d] truncate">
            {topRecipient.user.fullName}
          </span>
          <span className="font-mono text-[10px] text-slate-500 flex-shrink-0">
            ({topRecipient.user.employeeCode})
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
        <span className="text-[11px] font-bold text-[#191c1d] whitespace-nowrap">
          {topRecipient.count}
        </span>
      </div>
    </div>
  );
};
