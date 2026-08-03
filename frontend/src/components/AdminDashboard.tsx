import React, { useEffect, useState } from 'react';
import { useWallStore } from '../store/useWallStore';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

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
      triggerToast(err.response?.data?.message || 'Failed to load console telemetry', 'error');
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

  const filteredPosts = posts.filter(
    (p) =>
      !filterQuery.trim() ||
      p.content?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.authorName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.authorEmployeeCode?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      !filterQuery.trim() ||
      u.fullName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.employeeCode?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.team?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] text-[#191c1d] font-sans overflow-hidden flex">
      {/* Compact Side Navigation Shell (Settings Removed) */}
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#f8f9fa] border-r border-[#e1e3e4] flex flex-col py-6 z-50 shrink-0">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-[#0058bd] tracking-tight">Admin Panel</h1>
          <p className="text-xs text-[#424753] mt-0.5">Management Console</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-[#6ddd81] text-[#005320] shadow-2xs font-bold'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('users')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              activeNav === 'users'
                ? 'bg-[#6ddd81] text-[#005320] shadow-2xs font-bold'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Users</span>
          </button>

          <button
            onClick={() => setActiveNav('posts')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              activeNav === 'posts'
                ? 'bg-[#6ddd81] text-[#005320] shadow-2xs font-bold'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
            <span>Posts</span>
          </button>

          <button
            onClick={() => setActiveNav('analytics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              activeNav === 'analytics'
                ? 'bg-[#6ddd81] text-[#005320] shadow-2xs font-bold'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            <span>Analytics</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-[#e1e3e4] pt-4 px-3">
          <button
            onClick={() => setAdminViewOpen(false)}
            className="w-full flex items-center gap-3 text-[#424753] px-3.5 py-2.5 rounded-lg hover:bg-[#e7e8e9] transition-all cursor-pointer text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[18px] text-[#0058bd]">home</span>
            <span>View Wall</span>
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col pl-[240px] min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 right-0 bg-[#f8f9fa] flex justify-between items-center h-16 px-8 w-full z-40 border-b border-[#e1e3e4] shrink-0">
          <h2 className="text-xl font-bold text-[#0058bd]">
            {activeNav === 'dashboard'
              ? 'Executive Dashboard & Announcements'
              : activeNav === 'users'
              ? 'User Directory & Departments'
              : activeNav === 'posts'
              ? 'Content Moderation & Gratitude Posts'
              : 'Platform Telemetry & Analytics'}
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="p-2 text-[#424753] hover:text-[#0058bd] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#191c1d]">Admin User</span>
                <div className="w-8 h-8 rounded-full bg-[#0058bd] text-white flex items-center justify-center font-bold text-xs">
                  {user?.fullName?.[0]?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
            <div className="h-6 w-px bg-[#c2c6d5]" />
            <button
              onClick={() => logout()}
              className="text-xs font-semibold text-[#424753] hover:text-rose-600 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Workspace Rendered by Active Tab */}
        <main className="p-6 sm:p-8 max-w-[1440px] w-full mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-[#424753]">
              <span className="material-symbols-outlined text-[#0058bd] animate-spin text-2xl">refresh</span>
              <span className="text-sm font-medium">Loading management data...</span>
            </div>
          ) : activeNav === 'dashboard' ? (
            /* TAB 1: DASHBOARD FEATURE */
            <div className="space-y-8 animate-fade-slide-up">
              {/* Top Bento Metrics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Total Members</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#191c1d]">{stats?.totalUsers || users.length}</span>
                    <span className="text-[#00722f] text-xs font-bold">Active</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Total Gratitude Notes</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#191c1d]">{stats?.totalPosts || posts.length}</span>
                    <span className="text-[#0058bd] text-xs font-bold">Live</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Total Reactions</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#191c1d]">{stats?.totalLikes || 0}</span>
                    <span className="text-rose-600 text-xs font-bold">Hearts</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase tracking-wider">Quarantined Notes</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-600">{stats?.quarantinedPosts || 0}</span>
                    <span className="text-amber-700 text-xs font-bold">Flagged</span>
                  </div>
                </div>
              </div>

              {/* Split Announcement Broadcast & Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  {/* Create Announcement Card */}
                  <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 text-lg font-bold text-[#191c1d]">
                      <span className="material-symbols-outlined text-[#0058bd]">campaign</span>
                      <span>Create Announcement</span>
                    </div>

                    <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[#424753] font-semibold mb-1">Title</label>
                        <input
                          type="text"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          placeholder="Enter headline..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#c2c6d5] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0058bd] outline-none transition-all text-[#191c1d]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#424753] font-semibold mb-1">Target Audience</label>
                        <select
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#c2c6d5] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0058bd] outline-none transition-all text-[#191c1d] cursor-pointer"
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
                        <label className="block text-[#424753] font-semibold mb-1">Message Content</label>
                        <textarea
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          placeholder="Write your announcement details here..."
                          rows={4}
                          required
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#c2c6d5] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#0058bd] outline-none transition-all text-[#191c1d] leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAnnouncementTitle('');
                            setNotifMessage('');
                          }}
                          className="text-xs font-semibold text-[#0058bd] hover:underline cursor-pointer"
                        >
                          Clear Draft
                        </button>

                        <button
                          type="submit"
                          disabled={isBroadcasting || !notifMessage.trim()}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0058bd] hover:bg-[#004494] text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">send</span>
                          {isBroadcasting ? 'Publishing...' : 'Publish Now'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xl font-bold text-[#191c1d]">Recent Gratitude Stream</h3>
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post._id} className="bg-white p-5 rounded-2xl border border-[#c2c6d5] shadow-2xs flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#191c1d]">{post.authorName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{post.team || 'General'}</span>
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
            /* TAB 2: USERS & DEPARTMENTS FEATURE */
            <div className="space-y-8 animate-fade-slide-up">
              {/* Department Management Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                <div>
                  <h3 className="text-xl font-bold text-[#191c1d]">Department Structure</h3>
                  <p className="text-xs text-[#424753] mt-0.5">Create and manage organization divisions</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-[#0058bd] hover:bg-[#004494] text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Department
                </button>
              </div>

              {/* Departments Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {teams.map((t) => {
                  const memberCount = users.filter((u) => u.team === t.name).length;
                  return (
                    <div key={t._id} className="bg-white p-5 rounded-2xl border border-[#c2c6d5] shadow-2xs flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#191c1d]">{t.name}</h4>
                        <p className="text-xs text-[#424753] mt-0.5">{memberCount} Registered Members</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTeam(t._id)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Registered Users Table */}
              <div className="bg-white rounded-2xl border border-[#c2c6d5] shadow-2xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#c2c6d5] flex items-center justify-between bg-slate-50">
                  <h4 className="text-lg font-bold text-[#191c1d]">User Directory</h4>
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search members..."
                    className="px-3.5 py-1.5 bg-white border border-[#c2c6d5] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0058bd]"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[#424753] text-xs font-bold border-b border-[#c2c6d5]">
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5">Employee Code</th>
                        <th className="px-6 py-3.5">Department</th>
                        <th className="px-6 py-3.5">Role</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c2c6d5] text-xs">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#191c1d]">{u.fullName}</td>
                          <td className="px-6 py-4 font-mono text-purple-700 font-bold">{u.employeeCode}</td>
                          <td className="px-6 py-4">{u.team || 'General'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRoleToggle(u._id, u.role)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
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
            /* TAB 3: POSTS MODERATION FEATURE */
            <div className="space-y-6 animate-fade-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#191c1d]">Wall Posts & Moderation</h3>
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter posts..."
                  className="px-3.5 py-1.5 bg-white border border-[#c2c6d5] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0058bd]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-bold text-[#191c1d]">{post.authorName} ({post.authorEmployeeCode})</span>
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${post.isQuarantined ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                          {post.isQuarantined ? 'Quarantined' : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm italic text-[#424753]">"{post.content}"</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#c2c6d5] flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleQuarantine(post._id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold cursor-pointer"
                      >
                        {post.isQuarantined ? 'Activate' : 'Quarantine'}
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold cursor-pointer"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* TAB 4: ANALYTICS FEATURE */
            <div className="space-y-8 animate-fade-slide-up">
              <h3 className="text-2xl font-bold text-[#191c1d]">Platform Telemetry & Analytics</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase">Total Users</span>
                  <h4 className="text-3xl font-extrabold text-[#191c1d] mt-2">{stats?.totalUsers || users.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase">Total Posts</span>
                  <h4 className="text-3xl font-extrabold text-[#191c1d] mt-2">{stats?.totalPosts || posts.length}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase">Reactions Shared</span>
                  <h4 className="text-3xl font-extrabold text-[#191c1d] mt-2">{stats?.totalLikes || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#c2c6d5] shadow-2xs">
                  <span className="text-xs font-bold text-[#424753] uppercase">Quarantined Notes</span>
                  <h4 className="text-3xl font-extrabold text-amber-600 mt-2">{stats?.quarantinedPosts || 0}</h4>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-[#c2c6d5] shadow-2xs space-y-4">
                <h4 className="text-lg font-bold text-[#191c1d]">Department Activity Distribution</h4>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-[#c2c6d5] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#191c1d]">Add New Department</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#191c1d] mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Operations"
                  className="w-full px-3 py-2 rounded-lg border border-[#c2c6d5] outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#191c1d] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Logistics & Infrastructure"
                  className="w-full px-3 py-2 rounded-lg border border-[#c2c6d5] outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#c2c6d5] font-semibold cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="px-4 py-2 rounded-lg bg-[#0058bd] hover:bg-[#004494] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
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
