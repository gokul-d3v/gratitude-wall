import React, { useState, useEffect } from 'react';
import { Search, Bell, User, LogOut, ShieldCheck, Tag, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { useThemeStore } from '../store/useThemeStore';
import { StickyColor } from '../types';
import { api } from '../services/api';
import UserSettingsModal from './UserSettingsModal';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
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
    isTaggedMeFilter,
    setIsTaggedMeFilter,
  } = useWallStore();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

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
    if (!isAuthenticated || (!user?.id && !(user as any)?._id)) {
      setAuthModalOpen(true);
      return;
    }

    const currentUserId = user?.id || (user as any)?._id;
    const nextState = !isTaggedMeFilter;
    setIsTaggedMeFilter(nextState);

    if (nextState && currentUserId) {
      setSelectedTeam('all');
      useWallStore.setState({ activeColor: 'all' });
      api.get(`/posts?taggedUserId=${currentUserId}`).then((res) => {
        if (res.data?.posts) {
          useWallStore.getState().setPosts(res.data.posts);
        }
      });
    } else {
      useWallStore.getState().fetchPosts();
    }
  };

  return (
    <header className="w-full flex flex-col gap-3 py-4 select-none relative z-30">
      {/* Main Navbar Row */}
      <div className="flex items-center justify-between gap-3 w-full relative">
        {/* Brand Title & Subtitle */}
        <div className="flex flex-col gap-0.5">
          <h1 id="brotify-logo" className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#191c1d] dark:text-slate-100 transition-colors">
            BROTIFY
          </h1>
          <p className="text-[10px] sm:text-xs text-[#424753] dark:text-slate-400 font-medium transition-colors">
            Virtual Gratitude & Appreciation Wall
          </p>
        </div>

        {/* Mobile: Controls (Theme Toggle & Menu Button) */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 cursor-pointer shadow-2xs transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors relative z-50"
            title={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Small Mobile Menu (sm to lg) - Popup */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full right-0 mt-3 w-[300px] sm:w-[340px] flex flex-col gap-3 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.15)] animate-fade-slide-up z-50">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                title="Search posts by content, author name, or department"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0058bd]/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Team Filter */}
              <select
                value={selectedTeam}
                onChange={(e) => handleTeamFilterChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#fff8f2] dark:bg-slate-800 border border-[#c2c6d5] dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Teams</option>
                {teams.map((t) => (
                  <option key={t._id || t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Tagged Me Button */}
              {isAuthenticated && (
                <button
                  onClick={handleTaggedMeToggle}
                  title="Tagged Me"
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isTaggedMeFilter
                      ? 'bg-[#0058bd] text-white border-transparent shadow-2xs'
                      : 'bg-[#fff8f2] dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-[#c2c6d5] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Tagged Me
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#fff8f2] dark:bg-slate-800/80 p-2 rounded-xl border border-[#c2c6d5] dark:border-slate-700">
              {/* Latest / Trending Tabs */}
              <div className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setActiveTab('latest')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'latest'
                      ? 'bg-white dark:bg-slate-700 text-[#191c1d] dark:text-white shadow-2xs font-bold'
                      : 'text-[#424753] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setActiveTab('trending')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'trending'
                      ? 'bg-white dark:bg-slate-700 text-[#191c1d] dark:text-white shadow-2xs font-bold'
                      : 'text-[#424753] dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Trending
                </button>
              </div>

              <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-600" />

              {/* Color Dots Filter */}
              <div className="flex items-center gap-2 justify-between sm:justify-center px-1">
                {filterColors.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setActiveColor(c.key)}
                    className={`w-5 h-5 rounded-full ${c.dot} transition-transform cursor-pointer border border-black/10 ${
                      activeColor === c.key ? 'ring-2 ring-[#0058bd] scale-125' : 'hover:scale-110 opacity-75'
                    }`}
                    title={`Filter by ${c.label}`}
                  />
                ))}
              </div>
            </div>

            {/* Auth / Profile Area */}
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setSettingsOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{ backgroundColor: user?.avatarColor || '#0058bd' }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs hover:scale-105 transition-transform cursor-pointer"
                      title="User Settings"
                    >
                      {user?.fullName?.[0]?.toUpperCase() || 'E'}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {user?.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{user?.email}</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setAdminViewOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Dashboard
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleBellClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-[#0058bd]' : ''}`} />
                    <span className="text-xs font-semibold">Notifs {unreadCount > 0 && `(${unreadCount})`}</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-600 dark:text-rose-400 cursor-pointer shadow-2xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Logout</span>
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
                title="Sign In"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        )}

        {/* Desktop: Search, Filters, Dark Mode & Sign In */}
        <div className="hidden lg:flex items-center gap-2.5 flex-1 max-w-4xl ml-auto">
          {/* Search Input */}
          <div className="relative w-48 xl:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content, name, dept..."
              title="Search posts by content, author name, or department"
              className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0058bd] shadow-2xs"
            />
          </div>

          {/* Compact Filter Strip (Latest / Trending + Color Dots) */}
          <div className="flex items-center gap-1.5 bg-[#fff8f2] dark:bg-slate-800/90 p-1.5 rounded-full border border-[#c2c6d5] dark:border-slate-700 shadow-2xs">
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'latest'
                  ? 'bg-white dark:bg-slate-700 text-[#191c1d] dark:text-white shadow-2xs font-bold'
                  : 'text-[#424753] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'trending'
                  ? 'bg-white dark:bg-slate-700 text-[#191c1d] dark:text-white shadow-2xs font-bold'
                  : 'text-[#424753] dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Trending
            </button>

            <span className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />

            {/* Compact Color Dots */}
            <div className="flex items-center gap-1 px-1">
              {filterColors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveColor(c.key)}
                  className={`w-5 h-5 rounded-full ${c.dot} transition-transform cursor-pointer border border-black/10 ${
                    activeColor === c.key ? 'ring-2 ring-[#0058bd] scale-125' : 'hover:scale-110 opacity-75'
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
              className="px-3.5 py-2 rounded-full bg-[#fff8f2] dark:bg-slate-800 border border-[#c2c6d5] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer shadow-2xs"
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
              className={`inline-flex items-center justify-center px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                isTaggedMeFilter
                  ? 'bg-[#0058bd] text-white border-transparent'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 cursor-pointer shadow-2xs transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Session & Sign In Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 ml-auto">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setAdminViewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </button>
              )}

              {/* Notification Bell */}
              <button
                onClick={handleBellClick}
                className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
                title="Notifications"
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-[#0058bd]' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Employee Badge */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  onClick={() => setSettingsOpen(true)}
                  style={{ backgroundColor: user?.avatarColor || '#0058bd' }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform cursor-pointer shadow-sm"
                  title="User Settings"
                >
                  {user?.fullName?.[0]?.toUpperCase() || 'E'}
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 hover:text-rose-600 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                  <span className="text-xs font-bold">Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
              title="Sign In"
            >
              <User className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>

      <UserSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </header>
  );
};
