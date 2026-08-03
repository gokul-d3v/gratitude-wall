import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, Trash2, ShieldAlert, Users, Heart, FileText, RefreshCw, Plus, BellRing, Send } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';
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
  const [activeTab, setActiveTab] = useState<'stats' | 'posts' | 'users' | 'teams' | 'notifs'>('stats');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } else if (activeTab === 'posts') {
        const res = await api.get('/admin/posts');
        setPosts(res.data.data || []);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data || []);
      } else if (activeTab === 'teams') {
        const res = await api.get('/teams');
        setTeams(res.data.data || []);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await api.post('/admin/teams', { name: newTeamName.trim() });
      setTeams([...teams, res.data.data]);
      setNewTeamName('');
      triggerToast('New department team added successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to add department team', 'error');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this department team?')) return;
    try {
      await api.delete(`/admin/teams/${teamId}`);
      setTeams(teams.filter((t) => t._id !== teamId));
      triggerToast('Department team deleted successfully', 'success');
    } catch {
      triggerToast('Failed to delete team', 'error');
    }
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      await api.post('/admin/notifications', { message: notifMessage.trim() });
      setNotifMessage('');
      triggerToast('System announcement broadcasted to all active users!', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to broadcast notification', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fffcf9] overflow-y-auto">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAdminViewOpen(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Wall
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0058bd] text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#191c1d] leading-none">BROTIFY Admin Control Panel</h1>
              <p className="text-xs text-slate-500 mt-0.5">Management, Department Control & System Broadcasts</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-[#fff8f2] p-1 rounded-full border border-[#c2c6d5] overflow-x-auto">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stats' ? 'bg-[#0058bd] text-white shadow-xs' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'posts' ? 'bg-[#0058bd] text-white shadow-xs' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Moderation
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'teams' ? 'bg-[#0058bd] text-white shadow-xs' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('notifs')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'notifs' ? 'bg-[#0058bd] text-white shadow-xs' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-[#0058bd] text-white shadow-xs' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Employees
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="p-6 sm:p-10 max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh] gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0058bd]" />
            <span className="text-sm font-medium">Loading admin data...</span>
          </div>
        ) : activeTab === 'stats' && stats ? (
          <div className="flex flex-col gap-8 animate-fade-slide-up">
            <h2 className="text-2xl font-bold text-[#191c1d]">System Analytics Overview</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0058bd] flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-900">{stats.totalUsers}</span>
                  <p className="text-xs text-slate-500">Registered Employees</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-900">{stats.totalPosts}</span>
                  <p className="text-xs text-slate-500">Gratitude Notes Shared</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-900">{stats.totalLikes}</span>
                  <p className="text-xs text-slate-500">Appreciation Likes</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-slate-900">{stats.quarantinedPosts}</span>
                  <p className="text-xs text-slate-500">Quarantined Notes</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'teams' ? (
          <div className="flex flex-col gap-8 animate-fade-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#191c1d]">Department Management</h2>
                <p className="text-xs text-slate-500 mt-1">Add or remove departments for employee registration and filtering</p>
              </div>

              <form onSubmit={handleCreateTeam} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="New Department Name"
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0058bd] hover:bg-[#004494] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {teams.map((t) => (
                <div key={t._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500">{t.description || 'Department'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(t._id)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'notifs' ? (
          <div className="flex flex-col gap-6 animate-fade-slide-up max-w-2xl">
            <div>
              <h2 className="text-2xl font-bold text-[#191c1d]">Broadcast System Notification</h2>
              <p className="text-xs text-slate-500 mt-1">Send a real-time system announcement to all active users</p>
            </div>

            <form onSubmit={handleBroadcastNotification} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <BellRing className="w-5 h-5 text-[#0058bd]" />
                System Announcement Message
              </div>

              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="Type system announcement (e.g. 'Monthly gratitude awards start today!')..."
                rows={4}
                required
                className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
              />

              <button
                type="submit"
                disabled={isBroadcasting || !notifMessage.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0058bd] hover:bg-[#004494] text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 ml-auto"
              >
                <Send className="w-4 h-4" />
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Alert to All Users'}
              </button>
            </form>
          </div>
        ) : activeTab === 'posts' ? (
          <div className="flex flex-col gap-6 animate-fade-slide-up">
            <h2 className="text-2xl font-bold text-[#191c1d]">Content Moderation & Post Deletion</h2>

            {posts.length === 0 ? (
              <p className="text-center p-8 text-slate-400 text-sm">No posts to display</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className={`p-6 rounded-2xl border bg-white shadow-sm flex flex-col justify-between ${
                      post.isQuarantined ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-semibold text-slate-600">
                          {post.authorName || 'Employee'} ({post.authorEmployeeCode})
                        </span>
                        {post.isQuarantined ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            Quarantined
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 italic leading-relaxed">
                        "{post.content}"
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Reports: {post.reportsCount || 0}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleQuarantine(post._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            post.isQuarantined
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                          }`}
                        >
                          {post.isQuarantined ? 'Unquarantine' : 'Quarantine'}
                        </button>

                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
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
            <h2 className="text-2xl font-bold text-[#191c1d]">Employee Directory</h2>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Employee Code</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                        <div
                          style={{ backgroundColor: u.avatarColor || '#0058bd' }}
                          className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs"
                        >
                          {u.fullName?.[0]?.toUpperCase()}
                        </div>
                        {u.fullName}
                      </td>
                      <td className="p-4 font-mono font-semibold text-slate-600">{u.employeeCode}</td>
                      <td className="p-4 font-medium text-slate-600">{u.team || 'Engineering'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                          className="px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-100 text-xs font-medium cursor-pointer"
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
  );
};
