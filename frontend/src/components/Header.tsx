import React, { useState } from 'react';
import { Search, Bell, User, LogOut } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'latest' | 'trending'>('latest');

  const filterColors: { key: StickyColor | 'all'; label: string; bg: string }[] = [
    { key: 'all', label: 'All', bg: 'bg-white text-slate-800' },
    { key: 'yellow', label: 'Yellow', bg: 'bg-sticky-yellow text-slate-800' },
    { key: 'blue', label: 'Blue', bg: 'bg-sticky-blue text-slate-800' },
    { key: 'pink', label: 'Pink', bg: 'bg-sticky-pink text-slate-800' },
    { key: 'green', label: 'Green', bg: 'bg-sticky-green text-slate-800' },
    { key: 'purple', label: 'Purple', bg: 'bg-sticky-purple text-slate-800' },
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
    <header className="animate-fade-slide-up flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#191c1d]">
          Gratitude Wall
        </h1>
        <p className="font-display text-base sm:text-lg text-[#424753] mt-1">
          A collection of community moments to be thankful for.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Search Bar */}
        <div className="relative flex-1 md:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]/40"
          />
        </div>

        {/* Filter Pills Container */}
        <div className="flex items-center gap-1.5 bg-[#fff8f2] p-1.5 rounded-full border border-[#c2c6d5] overflow-x-auto">
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'latest'
                ? 'bg-[#f9ebe0] text-[#191c1d] shadow-2xs'
                : 'text-[#424753] hover:bg-[#f5e8df]'
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'trending'
                ? 'bg-[#f9ebe0] text-[#191c1d] shadow-2xs'
                : 'text-[#424753] hover:bg-[#f5e8df]'
            }`}
          >
            Trending
          </button>

          {/* Color Pills */}
          <div className="h-4 w-px bg-slate-300 mx-1" />
          {filterColors.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveColor(c.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                activeColor === c.key
                  ? 'ring-2 ring-[#0058bd] border-transparent scale-105 shadow-2xs'
                  : 'border-slate-200/60 hover:opacity-80'
              } ${c.bg}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* User Session & Notifications */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen && unreadCount > 0) {
                      handleMarkNotifsRead();
                    }
                  }}
                  className="relative p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fade-slide-up">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">Notifications</span>
                      <button
                        onClick={handleMarkNotifsRead}
                        className="text-xs text-[#0058bd] font-semibold hover:underline"
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

              {/* Employee Session Badge */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-2xs">
                <div
                  style={{ backgroundColor: user?.avatarColor || '#0058bd' }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                >
                  {user?.fullName?.[0]?.toUpperCase() || 'E'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#191c1d] leading-none">{user?.fullName}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">{user?.employeeCode}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-1 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-medium text-xs transition-all shadow-md cursor-pointer"
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
