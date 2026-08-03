import React, { useState } from 'react';
import { Heart, Search, Bell, User, LogOut, Sparkles, Filter } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { StickyColor } from '../types';
import { api } from '../services/api';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    activeColor,
    setActiveColor,
    searchQuery,
    setSearchQuery,
    setAuthModalOpen,
    notifications,
    unreadCount,
    setNotifications,
  } = useWallStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const filterColors: { key: StickyColor | 'all'; label: string; bg: string }[] = [
    { key: 'all', label: 'All Notes', bg: 'bg-slate-100 text-slate-800' },
    { key: 'yellow', label: 'Yellow', bg: 'bg-[#FFF59D] text-slate-800' },
    { key: 'green', label: 'Green', bg: 'bg-[#C8E6C9] text-slate-800' },
    { key: 'blue', label: 'Blue', bg: 'bg-[#BBDEFB] text-slate-800' },
    { key: 'pink', label: 'Pink', bg: 'bg-[#F8BBD0] text-slate-800' },
    { key: 'purple', label: 'Purple', bg: 'bg-[#E1BEE7] text-slate-800' },
  ];

  const handleMarkNotifsRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silence
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans-main text-slate-900 tracking-tight flex items-center gap-2">
              Virtual Gratitude Wall
            </h1>
            <p className="text-xs text-slate-500">Spread appreciation & positive energy</p>
          </div>
        </div>

        {/* Search Bar & Color Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gratitude..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            {filterColors.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveColor(c.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  activeColor === c.key
                    ? 'ring-2 ring-blue-600 border-transparent shadow-xs scale-105'
                    : 'border-slate-200 hover:opacity-80'
                } ${c.bg}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Navigation & Notifications */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen && unreadCount > 0) {
                      handleMarkNotifsRead();
                    }
                  }}
                  className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      <button
                        onClick={handleMarkNotifsRead}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-400">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id || (n as any)._id} className="p-3 hover:bg-slate-50 text-xs">
                            <p className="font-semibold text-slate-800">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Badge */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <div
                  style={{ backgroundColor: user?.avatarColor || '#0066FF' }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {user?.fullName?.[0]?.toUpperCase() || 'E'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-none">{user?.fullName}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{user?.employeeCode}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-1 hover:text-red-600 transition-colors cursor-pointer ml-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-all shadow-xs cursor-pointer"
            >
              <User className="w-4 h-4" />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
