import React, { useEffect, useState } from 'react';
import { useWallStore } from '../store/useWallStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { LayoutDashboard, Users, FileText, BarChart3, Home, LogOut, Bell, ShieldCheck, Plus, Trash2, ShieldAlert, Sparkles, Send, Tag, Search, Filter } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalLikes: number;
  quarantinedPosts: number;
  reportedPosts: number;
}

export const AdminDashboard: React.FC = () => {
  const { setAdminViewOpen, triggerToast } = useWallStore();
  const { user, logout } = useAuthStore();

  const handleAdminLogout = async () => {
    try {
      await logout();
    } catch {
      // Silence
    }
    setAdminViewOpen(false);
    triggerToast('Logged out of Admin Console', 'info');
    window.history.pushState({}, '', '/admin-login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const [activeNav, setActiveNav] = useState<'dashboard' | 'users' | 'posts' | 'analytics'>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  // Announcement Form
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Community Members');
  const [notifMessage, setNotifMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Department Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  // Bulk Upload
  const [bulkFileContent, setBulkFileContent] = useState('');
  const [bulkDefaultPassword, setBulkDefaultPassword] = useState('');
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeNav]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, teamsRes, usersRes, postsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/teams'),
        api.get('/admin/users'),
        api.get('/admin/posts'),
      ]);
      setStats(statsRes.data.data);
      setTeams(teamsRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setPosts(postsRes.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        window.history.pushState({}, '', '/admin-login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        triggerToast(err.response?.data?.message || 'Failed to load console telemetry', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsSubmittingTeam(true);
    try {
      const res = await api.post('/admin/teams', {
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || 'Core Division',
      });
      setTeams([...teams, res.data.data]);
      setNewTeamName('');
      setNewTeamDesc('');
      setIsAddModalOpen(false);
      triggerToast('Department added successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to create department', 'error');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/admin/teams/${teamId}`);
      setTeams(teams.filter((t) => t._id !== teamId));
      triggerToast('Department deleted successfully', 'success');
    } catch {
      triggerToast('Failed to delete department', 'error');
    }
  };

  const handleToggleQuarantine = async (postId: string) => {
    try {
      const res = await api.put(`/admin/posts/${postId}/quarantine`);
      setPosts(posts.map((p) => (p._id === postId ? { ...p, isQuarantined: res.data.data.isQuarantined } : p)));
      triggerToast('Post status updated', 'success');
    } catch {
      triggerToast('Failed to update post status', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Permanently delete this gratitude post?')) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
      triggerToast('Post deleted permanently', 'success');
    } catch {
      triggerToast('Failed to delete post', 'error');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      triggerToast(`User role updated to ${newRole}`, 'success');
    } catch {
      triggerToast('Failed to update role', 'error');
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;

    setIsBroadcasting(true);
    const broadcastText = announcementTitle.trim()
      ? `📢 [${announcementTitle.trim()}] ${notifMessage.trim()}`
      : notifMessage.trim();

    try {
      await api.post('/admin/notifications', { message: broadcastText });
      setAnnouncementTitle('');
      setNotifMessage('');
      triggerToast('Announcement published to all users!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to publish announcement', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkFileContent(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFileContent || !bulkDefaultPassword) return;
    setIsUploadingBulk(true);
    setBulkResult(null);

    try {
      const parsed = JSON.parse(bulkFileContent);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of objects');
      
      const res = await api.post('/admin/bulk-users', {
        users: parsed,
        defaultPassword: bulkDefaultPassword
      });
      setBulkResult(res.data.data);
      triggerToast('Bulk upload processed', 'info');
      
      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.data || []);
      setBulkFileContent('');
      setBulkDefaultPassword('');
    } catch (err: any) {
      triggerToast(err.message || 'Invalid JSON format or server error', 'error');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      !filterQuery.trim() ||
      p.content?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.authorEmail?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      !filterQuery.trim() ||
      u.fullName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.team?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-[#fffcf9] text-[#191c1d] font-sans overflow-hidden flex"
      style={{
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Side Navigation Bar matching User Side Aesthetics */}
      <aside className="fixed left-0 top-0 h-full w-[250px] bg-white/90 backdrop-blur-md border-r border-slate-200 flex flex-col py-6 z-50 shrink-0 shadow-sm">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#191c1d]">BROTIFY</h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-3">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-[#0058bd] text-white shadow-md'
                : 'text-[#424753] hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeNav === 'users'
                ? 'bg-[#0058bd] text-white shadow-md'
                : 'text-[#424753] hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Teams</span>
          </button>

          <button
            onClick={() => setActiveNav('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeNav === 'posts'
                ? 'bg-[#0058bd] text-white shadow-md'
                : 'text-[#424753] hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Wall Posts</span>
          </button>

          <button
            onClick={() => setActiveNav('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeNav === 'analytics'
                ? 'bg-[#0058bd] text-white shadow-md'
                : 'text-[#424753] hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-200/80 pt-4 px-3 space-y-1">
          <button
            onClick={() => setAdminViewOpen(false)}
            className="w-full flex items-center gap-3 text-slate-700 px-4 py-2.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer text-xs font-bold"
          >
            <Home className="w-4 h-4 text-[#0058bd]" />
            <span>Return to Wall</span>
          </button>
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-3 text-rose-600 px-4 py-2.5 rounded-full hover:bg-rose-50 transition-all cursor-pointer text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-[250px] min-w-0 overflow-y-auto">
        {/* Header Bar matching BROTIFY header */}
        <header className="sticky top-0 right-0 bg-white/90 backdrop-blur-md flex justify-between items-center h-16 px-8 w-full z-40 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-sans text-[#191c1d] capitalize">
              {activeNav === 'dashboard'
                ? 'Dashboard Overview'
                : activeNav === 'users'
                ? 'User Directory & Departments'
                : activeNav === 'posts'
                ? 'Gratitude Wall Moderation'
                : 'Analytics & Platform Telemetry'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdminViewOpen(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0058bd]/10 hover:bg-[#0058bd]/20 text-[#0058bd] text-xs font-bold transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Wall View</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-[10px]">
                {user?.fullName?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-[#191c1d]">{user?.fullName || 'Brototype Admin'}</span>
              <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">ADMIN</span>
            </div>

            <button
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Logout from Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="p-6 sm:p-8 max-w-[1440px] w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 animate-spin text-[#0058bd]" />
              <p className="text-sm font-medium">Loading console telemetry...</p>
            </div>
          ) : activeNav === 'dashboard' ? (
            /* DASHBOARD TAB */
            <div className="space-y-8 animate-fade-slide-up">
              {/* Metrics Grid matching Sticky Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-sticky-yellow p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Total Members</span>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#191c1d]">{stats?.totalUsers || users.length}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-emerald-800 px-2 py-0.5 rounded-full border border-black/5">Active</span>
                  </div>
                </div>

                <div className="bg-sticky-blue p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Gratitude Shared</span>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#191c1d]">{stats?.totalPosts || posts.length}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-[#0058bd] px-2 py-0.5 rounded-full border border-black/5">Notes</span>
                  </div>
                </div>

                <div className="bg-sticky-pink p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Total Reactions</span>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-[#191c1d]">{stats?.totalLikes || 0}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-rose-700 px-2 py-0.5 rounded-full border border-black/5">Hearts</span>
                  </div>
                </div>

                <div className="bg-sticky-purple p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Quarantined</span>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-extrabold text-amber-700">{stats?.quarantinedPosts || 0}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-amber-800 px-2 py-0.5 rounded-full border border-black/5">Flagged</span>
                  </div>
                </div>
              </div>

              {/* Announcement & Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-lg font-bold text-[#191c1d]">
                    <Send className="w-5 h-5 text-[#0058bd]" />
                    <span>Broadcast Announcement</span>
                  </div>

                  <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[#424753] font-bold mb-1">Headline</label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="e.g. Monthly Employee Awards..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0058bd] outline-none transition-all text-[#191c1d]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#424753] font-bold mb-1">Target Audience</label>
                      <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0058bd] outline-none transition-all text-[#191c1d] cursor-pointer"
                      >
                        <option value="All Community Members">All Community Members</option>
                        {teams.map((t) => (
                          <option key={t._id || t.name} value={t.name}>
                            {t.name} Department
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#424753] font-bold mb-1">Announcement Details</label>
                      <textarea
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Write your announcement details here..."
                        rows={4}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0058bd] outline-none transition-all text-[#191c1d] leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting || !notifMessage.trim()}
                      className="w-full py-3 bg-[#0058bd] hover:bg-[#004494] text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isBroadcasting ? 'Broadcasting...' : 'Publish Announcement'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xl font-bold text-[#191c1d]">Recent Gratitude Activity</h3>
                  <div className="space-y-3">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#191c1d]">{post.authorName}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{post.team || 'General'}</span>
                          </div>
                          <p className="text-xs italic text-[#424753]">"{post.content}"</p>
                        </div>
                        <span className="text-xs font-bold text-rose-600 shrink-0">❤️ {post.likesCount || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === 'users' ? (
            /* USERS & DEPARTMENTS TAB */
            <div className="space-y-8 animate-fade-slide-up">
              {/* Departments Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#191c1d]">Active Departments</h3>
                    <p className="text-xs text-[#424753] mt-0.5">Structure and manage company divisions</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Department
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  {teams.map((t) => {
                    const memberCount = users.filter((u) => u.team === t.name).length;
                    return (
                      <div key={t._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-[#191c1d]">{t.name}</h4>
                          <span className="text-[11px] font-semibold text-slate-500">{memberCount} Members</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTeam(t._id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bulk Upload Section */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#191c1d]">Bulk Import Users</h3>
                    <p className="text-xs text-[#424753] mt-0.5">Upload a JSON file containing user data (email, fullName, team)</p>
                  </div>
                </div>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#191c1d] mb-1">Select JSON File</label>
                      <input 
                        type="file" 
                        accept=".json"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0058bd] file:text-white hover:file:bg-[#004494] cursor-pointer"
                      />
                      {bulkFileContent && <span className="text-[10px] text-emerald-600 font-bold block mt-1">File loaded successfully</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#191c1d] mb-1">Default Password for Users</label>
                      <input
                        type="text"
                        required
                        value={bulkDefaultPassword}
                        onChange={(e) => setBulkDefaultPassword(e.target.value)}
                        placeholder="e.g. Welcome123!"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#0058bd] text-xs"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isUploadingBulk || !bulkFileContent || !bulkDefaultPassword}
                      className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingBulk ? 'Uploading...' : 'Process Bulk Import'}
                    </button>
                    
                    {bulkResult && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                        <span className="text-emerald-600">{bulkResult.success} Created</span> • <span className="text-rose-600">{bulkResult.failed} Failed</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* User Directory Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#191c1d]">User Directory</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Filter members..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#0058bd]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[#424753] text-xs font-bold border-b border-slate-100">
                        <th className="px-6 py-3.5">Member Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Department</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#191c1d]">{u.fullName}</td>
                          <td className="px-6 py-4 font-mono font-bold text-purple-700">{u.email}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{u.team || 'General'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRoleToggle(u._id, u.role)}
                              className="px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer"
                            >
                              {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === 'posts' ? (
            /* WALL POSTS MODERATION TAB */
            <div className="space-y-6 animate-fade-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#191c1d]">Content Moderation Stream</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-[#0058bd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-bold text-[#191c1d]">{post.authorName} ({post.authorEmail})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.isQuarantined ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                          {post.isQuarantined ? 'Quarantined' : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm italic text-[#424753]">"{post.content}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => handleToggleQuarantine(post._id)}
                        className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition-colors cursor-pointer"
                      >
                        {post.isQuarantined ? 'Activate' : 'Quarantine'}
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="px-3.5 py-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ANALYTICS TAB */
            <div className="space-y-8 animate-fade-slide-up">
              <h3 className="text-2xl font-bold text-[#191c1d]">Telemetry Analytics</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#424753] uppercase">Total Users</span>
                  <h4 className="text-3xl font-extrabold text-[#191c1d] mt-2">{stats?.totalUsers || users.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#424753] uppercase">Total Posts</span>
                  <h4 className="text-3xl font-extrabold text-[#191c1d] mt-2">{stats?.totalPosts || posts.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#424753] uppercase">Reactions Shared</span>
                  <h4 className="text-3xl font-extrabold text-[#191c1d] mt-2">{stats?.totalLikes || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#424753] uppercase">Quarantined Notes</span>
                  <h4 className="text-3xl font-extrabold text-amber-600 mt-2">{stats?.quarantinedPosts || 0}</h4>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-lg font-bold text-[#191c1d]">Department Activity Breakdown</h4>
                <div className="space-y-3">
                  {teams.map((t) => {
                    const count = posts.filter((p) => p.team === t.name).length;
                    const percent = posts.length ? Math.round((count / posts.length) * 100) : 0;
                    return (
                      <div key={t._id} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-[#191c1d]">
                          <span>{t.name}</span>
                          <span>{count} Posts ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-[#0058bd] h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-fade-slide-up">
            <h3 className="text-xl font-bold text-[#191c1d]">Add New Department</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#191c1d] mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Operations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191c1d] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Infrastructure & Operations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-300 font-bold text-slate-700 cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="px-5 py-2 rounded-full bg-[#0058bd] hover:bg-[#004494] text-white font-bold cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmittingTeam ? 'Adding...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
