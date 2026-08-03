import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Settings,
  Home,
  Bell,
  User as UserIcon,
  LogOut,
  Plus,
  Search,
  Filter,
  Terminal,
  Palette,
  Badge,
  Megaphone,
  MoreVertical,
  Trash2,
  ShieldAlert,
  Send,
  Sparkles,
  RefreshCw,
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'departments' | 'posts' | 'users' | 'announcements'>('departments');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  // Add Department Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);

  // Announcement Form State
  const [notifMessage, setNotifMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'departments') {
        const [statsRes, teamsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/teams'),
        ]);
        setStats(statsRes.data.data);
        setTeams(teamsRes.data.data || []);
      } else if (activeTab === 'posts') {
        const res = await api.get('/admin/posts');
        setPosts(res.data.data || []);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data || []);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to load admin data', 'error');
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
        description: newTeamDesc.trim() || 'Department Division',
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
      triggerToast('Post permanently deleted', 'success');
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
    <div className="fixed inset-0 z-50 flex bg-[#f8f9fa] text-[#191c1d] font-sans overflow-hidden">
      {/* Side Navigation Shell */}
      <aside className="fixed left-0 top-0 h-full w-[256px] bg-[#f8f9fa] border-r border-[#c2c6d5] flex flex-col py-6 z-50 shrink-0">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-[#0058bd] tracking-tight">Admin Panel</h1>
          <p className="text-xs font-medium text-[#424753] mt-0.5">Management Console</p>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#86f898] text-[#00722f] border-l-4 border-[#0058bd]'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-[#86f898] text-[#00722f] border-l-4 border-[#0058bd]'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <Users className="w-4 h-4" />
            Departments
          </button>

          <button
            onClick={() => setActiveTab('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-[#86f898] text-[#00722f] border-l-4 border-[#0058bd]'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Posts Moderation
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#86f898] text-[#00722f] border-l-4 border-[#0058bd]'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <Users className="w-4 h-4" />
            Users Directory
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-[#86f898] text-[#00722f] border-l-4 border-[#0058bd]'
                : 'text-[#424753] hover:bg-[#e7e8e9]'
            }`}
          >
            <Bell className="w-4 h-4" />
            Announcements
          </button>
        </nav>

        <div className="mt-auto border-t border-[#c2c6d5] pt-4">
          <button
            onClick={() => setAdminViewOpen(false)}
            className="w-full flex items-center gap-3 text-[#424753] px-4 py-3 mx-2 hover:bg-[#e7e8e9] transition-colors cursor-pointer rounded-lg text-xs font-semibold"
          >
            <Home className="w-4 h-4 text-[#0058bd]" />
            View Wall
          </button>
        </div>
      </aside>

      {/* Top App Bar & Main Content */}
      <div className="flex-1 flex flex-col pl-[256px] min-w-0 overflow-y-auto">
        {/* Top App Bar */}
        <header className="sticky top-0 right-0 bg-[#f8f9fa] flex justify-between items-center h-16 px-8 w-full z-40 border-b border-[#c2c6d5] shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-[#191c1d] capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button className="p-2 text-[#424753] hover:text-[#0058bd] transition-colors cursor-pointer">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-[#424753] hover:text-[#0058bd] transition-colors cursor-pointer">
                <UserIcon className="w-5 h-5" />
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
              <RefreshCw className="w-6 h-6 animate-spin text-[#0058bd]" />
              <span className="text-sm font-medium">Loading console data...</span>
            </div>
          ) : activeTab === 'departments' || activeTab === 'dashboard' ? (
            <div className="space-y-6 animate-fade-slide-up">
              {/* Header Section with Stats & Add Department Button */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-[#191c1d]">Organization Overview</h3>
                  <p className="text-sm text-[#424753]">Monitor and manage structural divisions across the company.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-[#0058bd] hover:bg-[#004494] text-white px-6 py-2.5 rounded-lg font-medium text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </button>
              </div>

              {/* Bento Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5] shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-medium text-[#424753] uppercase tracking-wider">Total Members</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-[#191c1d]">{stats?.totalUsers || 1248}</span>
                    <span className="text-[#00722f] text-xs font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 12%
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#c2c6d5] shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-medium text-[#424753] uppercase tracking-wider">Avg Activity</span>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-semibold text-[#191c1d]">84%</span>
                    <span className="text-[#424753] text-xs font-medium">Steady</span>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-[#2771df] text-white p-6 rounded-xl border border-[#0058bd] shadow-md">
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider opacity-90">System Integrity</span>
                      <h4 className="text-lg font-medium mt-2">All departments reporting nominal activity</h4>
                    </div>
                    <p className="text-sm mt-4 opacity-80 max-w-sm">Last system-wide audit completed 4 hours ago. No structural conflicts detected.</p>
                  </div>
                  <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>
              </div>

              {/* Data Table Section */}
              <div className="bg-white rounded-xl border border-[#c2c6d5] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#c2c6d5] flex items-center justify-between bg-[#f3f4f5]">
                  <h4 className="text-lg font-medium text-[#191c1d]">Active Departments</h4>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#424753] w-4 h-4" />
                      <input
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-[#c2c6d5] rounded-lg text-xs focus:ring-2 focus:ring-[#0058bd] outline-none transition-all w-64 text-[#191c1d]"
                        placeholder="Filter departments..."
                        type="text"
                      />
                    </div>
                    <button className="p-2 border border-[#c2c6d5] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <Filter className="w-4 h-4 text-[#424753]" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f3f4f5] text-[#424753] text-xs font-medium border-b border-[#c2c6d5]">
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Lead</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Members</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">Activity</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Growth</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c2c6d5]">
                      {filteredTeams.map((team) => (
                        <tr key={team._id} className="hover:bg-[#f3f4f5] transition-colors duration-150 group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#d8e2ff] flex items-center justify-center">
                                <Terminal className="w-5 h-5 text-[#0058bd]" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-[#191c1d]">{team.name}</div>
                                <div className="text-xs text-[#424753]">{team.description || 'Division'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#e1e3e4] border border-[#c2c6d5] flex items-center justify-center font-bold text-xs text-[#0058bd]">
                                {team.name?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-xs font-medium text-[#191c1d]">Lead Manager</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-medium text-[#191c1d]">482</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="w-24 bg-[#e1e3e4] h-2 rounded-full mx-auto overflow-hidden">
                              <div className="bg-[#006e2c] h-full rounded-full" style={{ width: '92%' }}></div>
                            </div>
                            <span className="text-[10px] text-[#424753] mt-1 block">92% High</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-[#00722f] text-xs font-medium bg-[#86f898]/30 px-2 py-0.5 rounded-full">
                              <TrendingUp className="w-3 h-3" /> 8%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteTeam(team._id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-rose-50 cursor-pointer"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 py-4 bg-[#f3f4f5] border-t border-[#c2c6d5] flex items-center justify-between text-xs text-[#424753]">
                  <span>Showing {filteredTeams.length} departments</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-[#424753] border border-[#c2c6d5] rounded-lg hover:bg-slate-200 cursor-pointer">Previous</button>
                    <button className="px-4 py-2 text-[#0058bd] border border-[#0058bd] rounded-lg hover:bg-[#d8e2ff] cursor-pointer">Next</button>
                  </div>
                </div>
              </div>

              {/* Bottom Asymmetric Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="md:col-span-2 bg-[#edeeef] p-8 rounded-xl border border-[#c2c6d5] relative overflow-hidden flex flex-col justify-center min-h-[200px]">
                  <div className="relative z-10">
                    <h4 className="text-xl font-semibold text-[#191c1d] mb-2">Annual Structural Review</h4>
                    <p className="text-xs text-[#424753] max-w-lg mb-6 leading-relaxed">Evaluate department performance metrics and team compositions for the upcoming fiscal cycle. Access detailed analytics and forecasting tools.</p>
                    <button className="px-6 py-2 border border-[#0058bd] text-[#0058bd] font-medium text-xs rounded-lg hover:bg-[#0058bd]/5 transition-all cursor-pointer">Launch Review Tool</button>
                  </div>
                </div>

                <div className="bg-[#006e2c] text-white p-8 rounded-xl border border-[#0058bd] shadow-lg flex flex-col justify-between">
                  <div>
                    <Sparkles className="w-8 h-8 mb-4" />
                    <h4 className="text-lg font-medium mb-2">AI Optimization</h4>
                    <p className="text-xs opacity-90 leading-relaxed">Auto-balance member distributions based on project loads and skill sets.</p>
                  </div>
                  <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-xs transition-all cursor-pointer">Run Suggestion Engine</button>
                </div>
              </div>
            </div>
          ) : activeTab === 'announcements' ? (
            <div className="max-w-2xl bg-white p-8 rounded-xl border border-[#c2c6d5] shadow-xs space-y-6 animate-fade-slide-up">
              <div>
                <h3 className="text-xl font-semibold text-[#191c1d]">Broadcast System Announcement</h3>
                <p className="text-xs text-[#424753] mt-1">Publish live notifications to all active employees on the gratitude wall</p>
              </div>

              <form onSubmit={handleBroadcastNotification} className="space-y-4">
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type announcement message (e.g. 'Monthly gratitude awards start today!')..."
                  rows={5}
                  required
                  className="w-full p-4 rounded-xl border border-[#c2c6d5] text-xs focus:ring-2 focus:ring-[#0058bd] outline-none leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={isBroadcasting || !notifMessage.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#0058bd] hover:bg-[#004494] text-white font-medium text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isBroadcasting ? 'Broadcasting...' : 'Broadcast Alert to All Users'}
                </button>
              </form>
            </div>
          ) : activeTab === 'posts' ? (
            <div className="space-y-6 animate-fade-slide-up">
              <h3 className="text-xl font-semibold text-[#191c1d]">Content Moderation & Post Deletion</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
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
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-slide-up">
              <h3 className="text-xl font-semibold text-[#191c1d]">User Directory & Roles</h3>
              <div className="bg-white rounded-xl border border-[#c2c6d5] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f3f4f5] text-[#424753] font-semibold border-b border-[#c2c6d5]">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Employee Code</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c6d5]">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-[#f3f4f5]">
                        <td className="p-4 font-semibold text-[#191c1d]">{u.fullName}</td>
                        <td className="p-4 font-mono text-[#424753]">{u.employeeCode}</td>
                        <td className="p-4 text-[#424753]">{u.team || 'Engineering'}</td>
                        <td className="p-4 font-bold text-[#0058bd]">{u.role}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            className="px-3 py-1 border border-[#c2c6d5] rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            Toggle Role
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
                  className="w-full px-3 py-2 rounded-lg border border-[#c2c6d5] text-xs focus:ring-2 focus:ring-[#0058bd] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Infrastructure & Logistics"
                  className="w-full px-3 py-2 rounded-lg border border-[#c2c6d5] text-xs focus:ring-2 focus:ring-[#0058bd] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#c2c6d5] text-xs font-medium cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="px-4 py-2 rounded-lg bg-[#0058bd] hover:bg-[#004494] text-white text-xs font-medium cursor-pointer shadow-sm disabled:opacity-50"
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
