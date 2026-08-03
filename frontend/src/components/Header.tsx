import React, { useState, useEffect } from 'react';
import { Search, Bell, User, LogOut, ShieldCheck, Tag, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { StickyColor } from '../types';
import { api } from '../services/api';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    activeColor,
    setActiveColor,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setAuthModalOpen,
    setAdminViewOpen,
    notifications,
    unreadCount,
    setNotifications,
    fetchPosts,
    rateLimitInfo,
  } = useWallStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [isTaggedMeFilter, setIsTaggedMeFilter] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.data || []);
    } catch {
      setTeams([]);
    }
  };

  const filterColors: { key: StickyColor | 'all'; label: string; dot: string }[] = [
    { key: 'all', label: 'All', dot: 'bg-[#0058bd]' },
    { key: 'yellow', label: 'Yellow', dot: 'bg-amber-300' },
    { key: 'blue', label: 'Blue', dot: 'bg-blue-300' },
    { key: 'pink', label: 'Pink', dot: 'bg-pink-300' },
    { key: 'green', label: 'Green', dot: 'bg-emerald-300' },
    { key: 'purple', label: 'Purple', dot: 'bg-purple-300' },
  ];

  const handleMarkNotifsRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silence
    }
  };

  const handleTeamFilterChange = (teamName: string) => {
    setSelectedTeam(teamName);
    setIsTaggedMeFilter(false);
    useWallStore.setState({ activeColor: 'all' });

    // Refetch posts with team query
    api.get(`/posts?team=${teamName}`).then((res) => {
      if (res.data?.posts) {
        useWallStore.getState().setPosts(res.data.posts);
      }
    });
  };

  const handleTaggedMeToggle = () => {
    if (!isAuthenticated || !user) {
      setAuthModalOpen(true);
      return;
    }

    const nextState = !isTaggedMeFilter;
    setIsTaggedMeFilter(nextState);

    if (nextState) {
      api.get(`/posts?taggedUserId=${user.id}`).then((res) => {
        if (res.data?.posts) {
          useWallStore.getState().setPosts(res.data.posts);
        }
      });
    } else {
      fetchPosts();
    }
  };

  return (
    <header className="animate-fade-slide-up flex flex-col gap-4 mb-6">
      {/* Main Navbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        {/* Brand Title & Subtitle */}
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#191c1d]">
            BROTIFY
          </h1>
          <span className="hidden sm:inline-block h-5 w-px bg-slate-300" />
          <p className="hidden sm:block text-xs text-[#424753] font-medium">
            Virtual Gratitude & Appreciation Wall
          </p>

          {/* Rate Limit Counter Badge */}
          {rateLimitInfo && (
            <div
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-semibold text-slate-600 shadow-2xs"
              title="API Request Quota Remaining (15 min window)"
            >
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Rate Limit: {rateLimitInfo.remaining}/{rateLimitInfo.limit}</span>
            </div>
          )}
        </div>

        {/* Search, Compact Filters & Sign In in SAME Header Row */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Search Input */}
          <div className="relative w-36 sm:w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0058bd]"
            />
          </div>

          {/* Team-Wise Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-full bg-[#fff8f2] border border-[#c2c6d5] text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t._id || t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tagged Me Quick Filter Button */}
          {isAuthenticated && (
            <button
              onClick={handleTaggedMeToggle}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                isTaggedMeFilter
                  ? 'bg-[#0058bd] text-white border-transparent shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Tag className="w-3 h-3" />
              Tagged Me
            </button>
          )}

          {/* Compact Filter Strip (Latest / Trending + Color Dots) */}
          <div className="flex items-center gap-1 bg-[#fff8f2] p-1 rounded-full border border-[#c2c6d5]">
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === 'latest'
                  ? 'bg-white text-[#191c1d] shadow-2xs font-bold'
                  : 'text-[#424753] hover:text-black'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === 'trending'
                  ? 'bg-white text-[#191c1d] shadow-2xs font-bold'
                  : 'text-[#424753] hover:text-black'
              }`}
            >
              Trending
            </button>

            <span className="h-3 w-px bg-slate-300 mx-0.5" />

            {/* Compact Color Dots */}
            <div className="flex items-center gap-1 px-1">
              {filterColors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveColor(c.key)}
                  className={`w-4 h-4 rounded-full ${c.dot} transition-transform cursor-pointer border border-black/10 ${
                    activeColor === c.key ? 'ring-2 ring-[#0058bd] scale-125' : 'hover:scale-110 opacity-70'
                  }`}
                  title={`Filter by ${c.label}`}
                />
              ))}
            </div>
          </div>

          {/* User Session & Sign In Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setAdminViewOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen && unreadCount > 0) {
                      handleMarkNotifsRead();
                    }
                  }}
                  className="relative p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs"
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-fade-slide-up">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Notifications</span>
                      <button
                        onClick={handleMarkNotifsRead}
                        className="text-[10px] text-[#0058bd] font-semibold hover:underline"
                      >
                        Mark read
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="p-3 text-center text-xs text-slate-400">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id || (n as any)._id} className="p-2.5 hover:bg-slate-50 text-xs">
                            <p className="font-semibold text-slate-800">{n.message}</p>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              {new Date(n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Employee Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
                <div
                  style={{ backgroundColor: user?.avatarColor || '#0058bd' }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                >
                  {user?.fullName?.[0]?.toUpperCase() || 'E'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#191c1d] leading-none">{user?.fullName}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-0.5 hover:text-rose-600 transition-colors cursor-pointer ml-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-semibold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5" />
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
