import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

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

  useEffect(() => {
    fetchTopUsers();
  }, []);

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
    <div className="bg-[#fff8f2] border border-[#c2c6d5] p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs animate-fade-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            workspace_premium
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0058bd] bg-[#d8e2ff] px-2 py-0.5 rounded-full">
              Most Appreciated Employee
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-base text-[#191c1d] mt-0.5">
            {topRecipient.user.fullName} <span className="font-mono text-xs text-slate-500 font-semibold">({topRecipient.user.employeeCode})</span>
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-2xs ml-auto">
        <span className="material-symbols-outlined text-amber-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
        <span className="text-xs font-bold text-[#191c1d]">
          {topRecipient.count} Gratitude {topRecipient.count === 1 ? 'Note' : 'Notes'} Received
        </span>
      </div>
    </div>
  );
};
