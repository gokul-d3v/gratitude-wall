import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Trash2,
  ShieldAlert,
  Users,
  Heart,
  FileText,
  RefreshCw,
  Plus,
  BellRing,
  Send,
  Building2,
  BarChart3,
  Search,
  Activity,
  LogOut,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
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

  const [activeSection, setActiveSection] = useState<'overview' | 'departments' | 'moderation' | 'announcements' | 'employees'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Department Form
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  // Announcement Form
  const [notifMessage, setNotifMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [activeSection]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeSection === 'overview') {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } else if (activeSection === 'moderation') {
        const res = await api.get('/admin/posts');
        setPosts(res.data.data || []);
      } else if (activeSection === 'employees') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data || []);
      } else if (activeSection === 'departments') {
        const res = await api.get('/teams');
        setTeams(res.data.data || []);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to load admin telemetry', 'error');
    } finally {
      setIsLoading(false);
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
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts(posts.filter((p) => p._id !== postId));
      triggerToast('Post deleted permanently from database', 'success');
    } catch {
      triggerToast('Failed to delete post', 'error');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      triggerToast(`Employee role updated to ${newRole}`, 'success');
    } catch {
      triggerToast('Failed to update employee role', 'error');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await api.post('/admin/teams', {
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || 'Department',
      });
      setTeams([...teams, res.data.data]);
      setNewTeamName('');
      setNewTeamDesc('');
      triggerToast('Department created successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to create department', 'error');
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

  const filteredUsers = users.filter(
    (u) =>
      !searchFilter.trim() ||
      u.fullName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.employeeCode?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.team?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Dark Slate Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-wide leading-none">BROTIFY</h2>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Enterprise Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview & Analytics
            </button>

            <button
              onClick={() => setActiveSection('departments')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'departments'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Department Management
            </button>

            <button
              onClick={() => setActiveSection('announcements')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'announcements'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BellRing className="w-4 h-4" />
              Broadcast Announcements
            </button>

            <button
              onClick={() => setActiveSection('moderation')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'moderation'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Content Moderation
            </button>

            <button
              onClick={() => setActiveSection('employees')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeSection === 'employees'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Employee Directory
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.fullName?.[0] || 'A'}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{user?.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono">{user?.employeeCode}</span>
            </div>
          </div>

          <button
            onClick={() => setAdminViewOpen(false)}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit Admin Control
          </button>
        </div>
      </aside>

      {/* Right Main Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Row */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setAdminViewOpen(false)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-bold text-sm text-white">BROTIFY Admin</h1>
          </div>

          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-white tracking-tight">System Control Console</h1>
            <p className="text-xs text-slate-400">Enterprise Administration & Department Moderation Portal</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              System Status: Active
            </span>
          </div>
        </header>

        {/* Body Content */}
        <main className="p-6 sm:p-8 max-w-6xl w-full mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Fetching telemetry...</span>
            </div>
          ) : activeSection === 'overview' && stats ? (
            <div className="flex flex-col gap-8 animate-fade-slide-up">
              <h2 className="text-2xl font-bold text-white">Platform Metrics</h2>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Employees</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalUsers}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Gratitude Notes</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalPosts}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Reactions</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalLikes}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Quarantined</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{stats.quarantinedPosts}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          ) : activeSection === 'departments' ? (
            <div className="flex flex-col gap-8 animate-fade-slide-up">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Department Management</h2>
                  <p className="text-xs text-slate-400 mt-1">Configure company departments for registration and team filtering</p>
                </div>
              </div>

              {/* Add Department Form */}
              <form onSubmit={handleCreateTeam} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Department Name</label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Quality Assurance"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    placeholder="e.g. Testing & Verification"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create Department
                  </button>
                </div>
              </form>

              {/* Departments Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {teams.map((t) => (
                  <div key={t._id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white">{t.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{t.description || 'Department'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(t._id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeSection === 'announcements' ? (
            <div className="flex flex-col gap-6 animate-fade-slide-up max-w-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white">Broadcast Announcement</h2>
                <p className="text-xs text-slate-400 mt-1">Publish live notifications to all active employees on the wall</p>
              </div>

              <form onSubmit={handleBroadcastNotification} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <BellRing className="w-5 h-5 text-blue-400" />
                  System Broadcast Message
                </div>

                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type announcement message (e.g. 'Employee Appreciation Week begins tomorrow!')..."
                  rows={4}
                  required
                  className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={isBroadcasting || !notifMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 ml-auto"
                >
                  <Send className="w-4 h-4" />
                  {isBroadcasting ? 'Broadcasting...' : 'Broadcast Alert to All Employees'}
                </button>
              </form>
            </div>
          ) : activeSection === 'moderation' ? (
            <div className="flex flex-col gap-6 animate-fade-slide-up">
              <div>
                <h2 className="text-2xl font-bold text-white">Content Moderation & Post Deletion</h2>
                <p className="text-xs text-slate-400 mt-1">Review flagged notes, quarantine issues, or delete posts permanently</p>
              </div>

              {posts.length === 0 ? (
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
                  No posts requiring moderation
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className={`p-6 rounded-2xl border bg-slate-900 shadow-md flex flex-col justify-between ${
                        post.isQuarantined ? 'border-rose-900/60 bg-rose-950/10' : 'border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="font-semibold text-slate-300">
                            {post.authorName || 'Employee'} ({post.authorEmployeeCode})
                          </span>
                          {post.isQuarantined ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Quarantined
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
                          "{post.content}"
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Reports: {post.reportsCount || 0}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleQuarantine(post._id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              post.isQuarantined
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            }`}
                          >
                            {post.isQuarantined ? 'Unquarantine' : 'Quarantine'}
                          </button>

                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Post
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-slide-up">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Employee Directory</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage user roles and employee credentials</p>
                </div>

                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search employee..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-800/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Employee Name</th>
                      <th className="p-4">Employee Code</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-semibold text-white flex items-center gap-2.5">
                          <div
                            style={{ backgroundColor: u.avatarColor || '#0058bd' }}
                            className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs"
                          >
                            {u.fullName?.[0]?.toUpperCase()}
                          </div>
                          {u.fullName}
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-400">{u.employeeCode}</td>
                        <td className="p-4 font-medium text-slate-300">{u.team || 'Engineering'}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            className="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold cursor-pointer text-slate-300 hover:text-white"
                          >
                            Toggle {u.role === 'ADMIN' ? 'User' : 'Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
