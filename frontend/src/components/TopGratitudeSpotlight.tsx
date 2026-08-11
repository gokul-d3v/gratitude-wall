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
    <div className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 bg-[#fffcf9] border border-[#0058bd]/20 px-4 py-2.5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-slide-up group cursor-pointer backdrop-blur-sm">
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
        <Trophy className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase font-bold tracking-widest text-[#424753] mb-0.5">Most Appreciated</span>
        <span className="text-sm font-extrabold text-[#191c1d] truncate max-w-[140px] leading-none">{topRecipient.user.fullName}</span>
      </div>
      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-1 border border-amber-200">
        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
        {topRecipient.count}
      </div>
    </div>
  );
};
