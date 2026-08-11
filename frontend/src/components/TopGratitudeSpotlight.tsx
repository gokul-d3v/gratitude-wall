import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useWallStore } from '../store/useWallStore';
import { initSocketClient } from '../services/socket';
import { Trophy, Star } from 'lucide-react';

interface TopUserItem {
  user: {
    _id?: string;
    fullName: string;
    email: string;
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
    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/50 px-5 py-3 rounded-2xl shadow-sm mb-6 animate-fade-slide-up cursor-pointer backdrop-blur-sm w-full md:w-fit">
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
        <Trophy className="w-5 h-5" />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700/80 mb-0.5">Most Appreciated</span>
        <span className="text-sm font-extrabold text-[#191c1d] truncate leading-none">{topRecipient.user.fullName}</span>
      </div>
      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ml-2 border border-amber-300/50">
        <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
        {topRecipient.count}
      </div>
    </div>
  );
};
