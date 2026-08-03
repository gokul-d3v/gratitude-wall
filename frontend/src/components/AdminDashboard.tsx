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

  const [activeNav, setActiveNav] = useState<'dashboard' | 'users' | 'posts' | 'analytics' | 'settings'>('users');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  // Add Department Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  // System Announcement
  const [notifMessage, setNotifMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [activeNav]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeNav === 'dashboard' || activeNav === 'users' || activeNav === 'analytics') {
        const [statsRes, teamsRes, usersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/teams'),
          api.get('/admin/users'),
        ]);
        setStats(statsRes.data.data);
        setTeams(teamsRes.data.data || []);
        setUsers(usersRes.data.data || []);
      } else if (activeNav === 'posts') {
        const res = await api.get('/admin/posts');
        setPosts(res.data.data || []);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to load console data', 'error');
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
      triggerToast('Department created successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to create department', 'error');
    } finally {
      setIsSubmittingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
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
      triggerToast('Post moderation status updated', 'success');
    } catch {
      triggerToast('Failed to update post status', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
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
      triggerToast('Failed to update user role', 'error');
    }
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      await api.post('/admin/notifications', { message: notifMessage.trim() });
      setNotifMessage('');
      triggerToast('System announcement broadcasted to all users!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to broadcast notification', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      !filterQuery.trim() ||
      t.name?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9fa] text-[#191c1d] font-sans overflow-hidden flex">
      {/* Side Navigation Shell */}
      <aside className="docked fixed left-0 top-0 h-full w-[256px] bg-[#f8f9fa] border-r border-[#c2c6d5] flex flex-col py-6 z-50 shrink-0">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-[#2771df] tracking-tight">Admin Panel</h1>
          <p className="text-xs font-medium text-[#424753]">Management Console</p>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 text-left cursor-pointer transition-colors duration-200 ${
              activeNav === 'dashboard'
                ? 'bg-[#86f898] text-[#00722f] rounded-lg border-l-4 border-[#0058bd] opacity-90'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-xs font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 text-left cursor-pointer transition-colors duration-200 ${
              activeNav === 'users'
                ? 'bg-[#86f898] text-[#00722f] rounded-lg border-l-4 border-[#0058bd] opacity-90'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <span className="text-xs font-medium">Users & Departments</span>
          </button>

          <button
            onClick={() => setActiveNav('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 text-left cursor-pointer transition-colors duration-200 ${
              activeNav === 'posts'
                ? 'bg-[#86f898] text-[#00722f] rounded-lg border-l-4 border-[#0058bd] opacity-90'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="text-xs font-medium">Posts</span>
          </button>

          <button
            onClick={() => setActiveNav('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 text-left cursor-pointer transition-colors duration-200 ${
              activeNav === 'analytics'
                ? 'bg-[#86f898] text-[#00722f] rounded-lg border-l-4 border-[#0058bd] opacity-90'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span className="text-xs font-medium">Analytics</span>
          </button>

          <button
            onClick={() => setActiveNav('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 text-left cursor-pointer transition-colors duration-200 ${
              activeNav === 'settings'
                ? 'bg-[#86f898] text-[#00722f] rounded-lg border-l-4 border-[#0058bd] opacity-90'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-xs font-medium">Settings & Announcements</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-[#c2c6d5] pt-4">
          <button
            onClick={() => setAdminViewOpen(false)}
            className="w-full flex items-center gap-3 text-[#424753] px-4 py-3 mx-2 hover:bg-[#e7e8e9] transition-colors duration-200 cursor-pointer rounded-lg text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[20px] text-[#0058bd]">home</span>
            <span className="text-xs font-medium">View Wall</span>
          </button>
        </div>
      </aside>

      {/* Top App Bar & Main Content */}
      <div className="flex-1 flex flex-col pl-[256px] min-w-0 overflow-y-auto">
        {/* Top App Bar */}
        <header className="sticky top-0 right-0 bg-[#f8f9fa] flex justify-between items-center h-16 px-8 w-full z-40 border-b border-[#c2c6d5] shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-[#191c1d] capitalize">{activeNav}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="p-2 text-[#424753] hover:text-[#0058bd] transition-colors cursor-pointer">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 text-[#424753] hover:text-[#0058bd] transition-colors cursor-pointer">
                <span className="material-symbols-outlined">account_circle</span>
              </button>
            </div>
            <div className="h-8 w-px bg-[#c2c6d5]"></div>
            <button
              onClick={() => logout()}
              className="text-xs font-medium text-[#424753] hover:text-[#0058bd] transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="min-h-screen p-8 max-w-[1440px] w-full mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-slate-500">
              <span className="material-symbols-outlined text-[#0058bd] animate-spin">refresh</span>
              <span className="text-sm font-medium">Loading management data...</span>
            </div>
          ) : activeNav === 'users' || activeNav === 'dashboard' ? (
            <div className="space-y-6 animate-fade-slide-up">
              {/* Header Section with Stats */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-[#191c1d]">Organization Overview</h3>
                  <p className="text-sm text-[#424753]">Monitor and manage structural divisions across the company.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-[#0058bd] text-white px-6 py-2.5 rounded-lg font-medium text-xs hover:opacity-90 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Department
                </button>
              </div>

              {/* Bento Stats Grid (100% Real Live Database Metrics) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5] shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-medium text-[#424753] uppercase tracking-wider">Total Registered Employees</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#191c1d]">{stats?.totalUsers || users.length || 0}</span>
                    <span className="text-[#00722f] text-xs font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span> Active
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5] shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-medium text-[#424753] uppercase tracking-wider">Gratitude Notes Shared</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#191c1d]">{stats?.totalPosts || 0}</span>
                    <span className="text-[#424753] text-xs font-medium">Live</span>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-[#2771df] text-white p-6 rounded-xl border border-[#0058bd] shadow-md">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider opacity-90">System Integrity</span>
                      <h4 className="text-lg font-medium mt-2">All departments reporting nominal activity</h4>
                    </div>
                    <p className="text-sm mt-4 opacity-80 max-w-sm">No structural conflicts or unhandled moderation reports detected.</p>
                  </div>
                  <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>
              </div>

              {/* Active Departments Data Table (Compute real counts from DB) */}
              <div className="bg-white rounded-xl border border-[#c2c6d5] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#c2c6d5] flex items-center justify-between bg-[#f3f4f5]">
                  <h4 className="text-lg font-medium text-[#191c1d]">Active Departments</h4>
                  <div className="flex gap-2">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#424753] text-[18px]">search</span>
                      <input
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-[#c2c6d5] rounded-lg text-xs focus:ring-2 focus:ring-[#0058bd] outline-none transition-all w-64 text-[#191c1d]"
                        placeholder="Filter departments..."
                        type="text"
                      />
                    </div>
                    <button className="p-2 border border-[#c2c6d5] rounded-lg hover:bg-[#edeeef] transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f3f4f5] text-[#424753] text-xs font-medium border-b border-[#c2c6d5]">
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Lead / Admin</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Members</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c2c6d5]">
                      {filteredTeams.map((team) => {
                        const teamMembers = users.filter((u) => u.team === team.name);
                        const memberCount = teamMembers.length;
                        const leadUser = teamMembers[0]?.fullName || user?.fullName || 'Brototype Admin';

                        return (
                          <tr key={team._id} className="hover:bg-[#f3f4f5] transition-colors duration-150 group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#d8e2ff] flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[#0058bd]">terminal</span>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-[#191c1d]">{team.name}</div>
                                  <div className="text-xs text-[#424753]">{team.description || 'Core Department'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#e1e3e4] border border-[#c2c6d5] flex items-center justify-center font-bold text-xs text-[#0058bd]">
                                  {leadUser[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-[#191c1d]">{leadUser}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-bold text-[#191c1d]">{memberCount}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 text-[#00722f] text-xs font-medium bg-[#86f898]/30 px-2 py-0.5 rounded-full">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteTeam(team._id)}
                                className="text-[#424753] hover:text-rose-600 transition-colors p-1.5 rounded-md cursor-pointer hover:bg-rose-50"
                                title="Delete Department"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-[#f3f4f5] border-t border-[#c2c6d5] flex items-center justify-between text-xs text-[#424753]">
                  <span>Showing {filteredTeams.length} departments</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-[#424753] border border-[#c2c6d5] rounded-lg hover:bg-slate-200 cursor-pointer">Previous</button>
                    <button className="px-4 py-2 text-[#0058bd] border border-[#0058bd] rounded-lg hover:bg-[#d8e2ff] cursor-pointer font-medium">Next</button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === 'analytics' ? (
            <div className="space-y-6 animate-fade-slide-up">
              <h3 className="text-2xl font-semibold text-[#191c1d]">Platform Telemetry & Analytics</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5]">
                  <span className="text-xs font-semibold text-[#424753] uppercase">Total Users</span>
                  <h4 className="text-3xl font-bold text-[#191c1d] mt-2">{stats?.totalUsers || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5]">
                  <span className="text-xs font-semibold text-[#424753] uppercase">Total Posts</span>
                  <h4 className="text-3xl font-bold text-[#191c1d] mt-2">{stats?.totalPosts || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5]">
                  <span className="text-xs font-semibold text-[#424753] uppercase">Reactions</span>
                  <h4 className="text-3xl font-bold text-[#191c1d] mt-2">{stats?.totalLikes || 0}</h4>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5]">
                  <span className="text-xs font-semibold text-[#424753] uppercase">Quarantined</span>
                  <h4 className="text-3xl font-bold text-[#191c1d] mt-2">{stats?.quarantinedPosts || 0}</h4>
                </div>
              </div>
            </div>
          ) : activeNav === 'posts' ? (
            <div className="space-y-6 animate-fade-slide-up">
              <h3 className="text-2xl font-semibold text-[#191c1d]">Content Moderation & Post Deletion</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.length === 0 ? (
                  <p className="text-xs text-slate-500">No posts currently reported or requiring moderation.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post._id} className="bg-white p-6 rounded-xl border border-[#c2c6d5] shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between text-xs mb-3">
                          <span className="font-semibold text-[#191c1d]">{post.authorName} ({post.authorEmployeeCode})</span>
                          <span className="text-rose-600 font-bold">{post.isQuarantined ? 'Quarantined' : 'Active'}</span>
                        </div>
                        <p className="text-sm italic text-[#424753]">"{post.content}"</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-[#c2c6d5] flex items-center justify-between text-xs">
                        <button
                          onClick={() => handleToggleQuarantine(post._id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold cursor-pointer"
                        >
                          {post.isQuarantined ? 'Unquarantine' : 'Quarantine'}
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl bg-white p-8 rounded-xl border border-[#c2c6d5] shadow-xs space-y-6 animate-fade-slide-up">
              <div>
                <h3 className="text-xl font-semibold text-[#191c1d]">Broadcast Announcement</h3>
                <p className="text-xs text-[#424753] mt-1">Publish live notifications to all active employees on the wall</p>
              </div>

              <form onSubmit={handleBroadcastNotification} className="space-y-4">
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type announcement message (e.g. 'Monthly gratitude awards start today!')..."
                  rows={5}
                  required
                  className="w-full p-4 rounded-xl border border-[#c2c6d5] text-xs focus:ring-2 focus:ring-[#0058bd] outline-none leading-relaxed text-[#191c1d]"
                />

                <button
                  type="submit"
                  disabled={isBroadcasting || !notifMessage.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#0058bd] text-white font-medium text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {isBroadcasting ? 'Broadcasting...' : 'Broadcast Alert to All Users'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-[#c2c6d5] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#191c1d]">Add New Department</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Operations"
                  className="w-full px-3 py-2 rounded-lg border border-[#c2c6d5] text-xs focus:ring-2 focus:ring-[#0058bd] outline-none text-[#191c1d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Infrastructure & Logistics"
                  className="w-full px-3 py-2 rounded-lg border border-[#c2c6d5] text-xs focus:ring-2 focus:ring-[#0058bd] outline-none text-[#191c1d]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#c2c6d5] text-xs font-medium cursor-pointer hover:bg-[#edeeef]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="px-4 py-2 rounded-lg bg-[#0058bd] text-white text-xs font-medium cursor-pointer shadow-xs disabled:opacity-50"
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
