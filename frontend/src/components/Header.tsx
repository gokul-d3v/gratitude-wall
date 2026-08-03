import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, ShieldCheck, Tag, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { StickyColor } from '../types';
import { api } from '../services/api';

const getRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

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
  } = useWallStore();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [isTaggedMeFilter, setIsTaggedMeFilter] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleBellClick = () => {
    useWallStore.getState().setNotifModalOpen(true);
    if (unreadCount > 0) {
      handleMarkNotifsRead();
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
    if (!isAuthenticated || !user?.id) {
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
      }).catch(() => {
        setIsTaggedMeFilter(false);
      });
    } else {
      fetchPosts();
    }
  };

  return (
    <header className="animate-fade-slide-up flex flex-col gap-3 mb-6">
      {/* Main Navbar Row */}
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Brand Title & Subtitle */}
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#191c1d]">
            BROTIFY
          </h1>
          <p className="text-[10px] sm:text-xs text-[#424753] font-medium">
            Virtual Gratitude & Appreciation Wall
          </p>
        </div>

        {/* Mobile: Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs transition-colors"
          title={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Small Mobile Menu (sm to lg) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 mt-2 mx-4 flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-lg animate-dropdown-in z-50">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by content, name, or department..."
              title="Search posts by content, author name, or department"
              className="w-full pl-8 pr-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#0058bd]"
            />
            </div>

            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => handleTeamFilterChange(e.target.value)}
              className="px-3 py-2 rounded-full bg-[#fff8f2] border border-[#c2c6d5] text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t._id || t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Latest / Trending Tabs */}
            <div className="flex items-center gap-2 bg-[#fff8f2] p-1.5 rounded-full border border-[#c2c6d5]">
              <button
                onClick={() => setActiveTab('latest')}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'latest'
                    ? 'bg-white text-[#191c1d] shadow-2xs font-bold'
                    : 'text-[#424753] hover:text-black'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'trending'
                    ? 'bg-white text-[#191c1d] shadow-2xs font-bold'
                    : 'text-[#424753] hover:text-black'
                }`}
              >
                Trending
              </button>
            </div>

            {/* Color Dots Filter */}
            <div className="flex items-center gap-2 bg-[#fff8f2] p-2 rounded-full border border-[#c2c6d5] justify-center">
              {filterColors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveColor(c.key)}
                  className={`w-6 h-6 rounded-full ${c.dot} transition-transform cursor-pointer border border-black/10 ${
                    activeColor === c.key ? 'ring-2 ring-[#0058bd] scale-125' : 'hover:scale-110 opacity-70'
                  }`}
                  title={`Filter by ${c.label}`}
                />
              ))}
            </div>

            {/* Tagged Me Button */}
            {isAuthenticated && (
              <button
                onClick={handleTaggedMeToggle}
                title="Tagged Me"
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold border transition-all cursor-pointer ${
                  isTaggedMeFilter
                    ? 'bg-[#0058bd] text-white border-transparent shadow-2xs'
                    : 'bg-[#fff8f2] text-slate-700 border-[#c2c6d5] hover:bg-slate-50'
                }`}
              >
                <Tag className="w-4 h-4" />
              </button>
            )}

            {/* User Session / Auth */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-2">
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setAdminViewOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-2xs transition-all cursor-pointer"
                    title="Admin Dashboard"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Dashboard
                  </button>
                )}

                {/* Notification Bell */}
                <button
                  onClick={() => {
                    handleBellClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs transition-colors"
                >
                  <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-[#0058bd]' : ''}`} />
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* User Info & Logout */}
                <div className="flex items-center gap-3 p-3 rounded-full bg-white border border-slate-200 shadow-2xs">
                  <div
                    style={{ backgroundColor: user?.avatarColor || '#0058bd' }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  >
                    {user?.fullName?.[0]?.toUpperCase() || 'E'}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-slate-400 hover:text-rose-500" />
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                title="Sign In / Register"
              >
                <User className="w-4 h-4" />
                Sign In / Register
              </button>
            )}
          </div>
        )}

        {/* Desktop: Search, Filters & Sign In */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-3xl ml-auto">
          {/* Search Input */}
          <div className="relative w-40 xl:w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by content, name, or dept..."
              title="Search posts by content, author name, or department"
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#0058bd]"
            />
          </div>

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
              title="Tagged Me"
              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                isTaggedMeFilter
                  ? 'bg-[#0058bd] text-white border-transparent shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Tag className="w-3 h-3" />
            </button>
          )}

          {/* User Session & Sign In Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-auto">
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
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs transition-colors"
                title="Notifications"
              >
                <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-[#0058bd]' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Employee Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
                <div
                  style={{ backgroundColor: user?.avatarColor || '#0058bd' }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                >
                  {user?.fullName?.[0]?.toUpperCase() || 'E'}
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
                  <span className="text-xs font-semibold">Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-semibold text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap ml-auto"
              title="Sign In / Register"
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