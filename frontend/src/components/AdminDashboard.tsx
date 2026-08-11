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

  // Bulk Upload & Multi-Select Users
  const [bulkFileContent, setBulkFileContent] = useState('');
  const [bulkDefaultPassword, setBulkDefaultPassword] = useState('');
  const [selectedBulkDepartment, setSelectedBulkDepartment] = useState('');
  const [customBulkDepartment, setCustomBulkDepartment] = useState('');
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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

  const handleToggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (filteredUsersList: any[]) => {
    if (selectedUserIds.length === filteredUsersList.length && filteredUsersList.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsersList.map((u) => u._id));
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedUserIds.length} selected user(s)? This action cannot be undone.`)) return;

    try {
      const res = await api.post('/admin/users/bulk-delete', { userIds: selectedUserIds });
      const count = res.data.data?.deletedCount || selectedUserIds.length;
      triggerToast(`Successfully deleted ${count} user(s)!`, 'success');
      setUsers((prev) => prev.filter((u) => !selectedUserIds.includes(u._id)));
      setSelectedUserIds([]);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to delete selected users', 'error');
    }
  };

  const handleDeleteSingleUser = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete user "${userName}"?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      triggerToast(`User "${userName}" deleted successfully!`, 'success');
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to delete user', 'error');
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

  const parseBulkContent = (content: string): any[] => {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Uploaded file content is empty');

    // Attempt JSON parsing
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list.length === 0) throw new Error('JSON array contains no user records');
      return list;
    }

    // Parse CSV / TSV
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) throw new Error('File contains no data lines');
    if (lines.length === 1) throw new Error('CSV must contain a header row and at least one user row');

    const headerLine = lines[0];
    let delimiter = ',';
    if (headerLine.includes('\t')) delimiter = '\t';
    else if (headerLine.includes(';') && !headerLine.includes(',')) delimiter = ';';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(headerLine);
    const users: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.every((v) => !v)) continue;
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) {
          obj[h] = values[idx] || '';
        }
      });
      users.push(obj);
    }

    if (users.length === 0) throw new Error('No user data rows found in CSV');
    return users;
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFileContent || !bulkDefaultPassword) return;
    setIsUploadingBulk(true);
    setBulkResult(null);

    const effectiveDept =
      selectedBulkDepartment === '__NEW__'
        ? customBulkDepartment.trim()
        : selectedBulkDepartment;

    try {
      const parsedUsers = parseBulkContent(bulkFileContent);
      
      const res = await api.post('/admin/bulk-users', {
        users: parsedUsers,
        defaultPassword: bulkDefaultPassword,
        targetDepartment: effectiveDept,
      });
      setBulkResult(res.data.data);
      
      if (res.data.data.success > 0) {
        triggerToast(`Bulk upload complete: ${res.data.data.success} users created!`, 'success');
      } else {
        triggerToast(`Bulk upload failed: 0 users created out of ${res.data.data.failed}`, 'error');
      }
      
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/teams'),
      ]);
      setUsers(usersRes.data.data || []);
      setTeams(teamsRes.data.data || []);
    } catch (err: any) {
      triggerToast(err.message || 'Invalid CSV/JSON format or server error', 'error');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const downloadSampleTemplate = (type: 'json' | 'csv') => {
    let content = '';
    let filename = '';
    let mime = '';

    if (type === 'json') {
      content = JSON.stringify(
        [
          { email: 'alex.smith@company.com', fullName: 'Alex Smith', team: 'Engineering' },
          { email: 'sarah.jones@company.com', fullName: 'Sarah Jones', team: 'Marketing' },
          { email: 'michael.brown@company.com', fullName: 'Michael Brown', team: 'Sales' },
        ],
        null,
        2
      );
      filename = 'users_import_sample.json';
      mime = 'application/json';
    } else {
      content = 'email,fullName,team\nalex.smith@company.com,Alex Smith,Engineering\nsarah.jones@company.com,Sarah Jones,Marketing\nmichael.brown@company.com,Michael Brown,Sales';
      filename = 'users_import_sample.csv';
      mime = 'text/csv';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
      u.role !== 'ADMIN' &&
      (!filterQuery.trim() ||
        u.fullName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        u.team?.toLowerCase().includes(filterQuery.toLowerCase()))
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
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-white/70 backdrop-blur-xl border-r border-white/40 flex flex-col py-8 z-50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-[#0058bd] text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#191c1d]">BROTIFY</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeNav === 'dashboard'
                ? 'bg-gradient-to-r from-[#0058bd] to-purple-600 text-white shadow-md shadow-[#0058bd]/20 scale-[1.02]'
                : 'text-[#424753] hover:bg-white/80 hover:text-[#0058bd] hover:shadow-sm'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveNav('users')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeNav === 'users'
                ? 'bg-gradient-to-r from-[#0058bd] to-purple-600 text-white shadow-md shadow-[#0058bd]/20 scale-[1.02]'
                : 'text-[#424753] hover:bg-white/80 hover:text-[#0058bd] hover:shadow-sm'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Teams</span>
          </button>

          <button
            onClick={() => setActiveNav('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeNav === 'posts'
                ? 'bg-gradient-to-r from-[#0058bd] to-purple-600 text-white shadow-md shadow-[#0058bd]/20 scale-[1.02]'
                : 'text-[#424753] hover:bg-white/80 hover:text-[#0058bd] hover:shadow-sm'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Content Moderation</span>
          </button>

          <button
            onClick={() => setActiveNav('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeNav === 'analytics'
                ? 'bg-gradient-to-r from-[#0058bd] to-purple-600 text-white shadow-md shadow-[#0058bd]/20 scale-[1.02]'
                : 'text-[#424753] hover:bg-white/80 hover:text-[#0058bd] hover:shadow-sm'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Telemetry & Stats</span>
          </button>
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-[260px] min-w-0 overflow-y-auto">
        {/* Header Bar matching BROTIFY header */}
        <header className="sticky top-0 right-0 bg-white/40 backdrop-blur-xl flex justify-between items-center h-20 px-10 w-full z-40 border-b border-white/40 shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-sans text-[#191c1d] tracking-tight">
              {activeNav === 'dashboard'
                ? 'Dashboard Overview'
                : activeNav === 'users'
                ? 'User Directory & Departments'
                : activeNav === 'posts'
                ? 'Content Moderation'
                : 'Analytics & Telemetry'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
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
                <div className="bg-gradient-to-br from-white to-amber-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex flex-col justify-between admin-card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-amber-600/80 uppercase tracking-widest">Total Members</span>
                    <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-[#191c1d] tracking-tight">{stats?.totalUsers || users.length}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-emerald-700 px-2.5 py-1 rounded-full shadow-sm border border-white/60">Active</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex flex-col justify-between admin-card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#0058bd]/70 uppercase tracking-widest">Gratitude Shared</span>
                    <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-[#0058bd]">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-[#191c1d] tracking-tight">{stats?.totalPosts || posts.length}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-[#0058bd] px-2.5 py-1 rounded-full shadow-sm border border-white/60">Notes</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-rose-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex flex-col justify-between admin-card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-rose-500/80 uppercase tracking-widest">Total Reactions</span>
                    <div className="w-8 h-8 rounded-full bg-rose-100/50 flex items-center justify-center text-rose-500">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-[#191c1d] tracking-tight">{stats?.totalLikes || 0}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-rose-600 px-2.5 py-1 rounded-full shadow-sm border border-white/60">Hearts</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-purple-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md flex flex-col justify-between admin-card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-600/70 uppercase tracking-widest">Quarantined</span>
                    <div className="w-8 h-8 rounded-full bg-purple-100/50 flex items-center justify-center text-purple-600">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-amber-600 tracking-tight">{stats?.quarantinedPosts || 0}</span>
                    <span className="text-[10px] font-bold bg-white/80 text-amber-700 px-2.5 py-1 rounded-full shadow-sm border border-white/60">Flagged</span>
                  </div>
                </div>
              </div>

              {/* Announcement & Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0058bd]/5 to-transparent rounded-bl-full" />
                  
                  <div className="flex items-center gap-3 text-lg font-bold text-[#191c1d] relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0058bd] to-blue-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Send className="w-5 h-5" />
                    </div>
                    <span>Broadcast Announcement</span>
                  </div>

                  <form onSubmit={handleBroadcastAnnouncement} className="space-y-5 text-xs relative z-10">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[10px]">Headline</label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="e.g. Monthly Employee Awards..."
                        className="w-full px-4 py-3 bg-white/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0058bd]/50 outline-none transition-all text-[#191c1d] shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[10px]">Target Audience</label>
                      <select
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full px-4 py-3 bg-white/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0058bd]/50 outline-none transition-all text-[#191c1d] cursor-pointer shadow-sm appearance-none"
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
                      <label className="block text-slate-500 font-bold mb-1.5 uppercase tracking-wider text-[10px]">Announcement Details</label>
                      <textarea
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Write your announcement details here..."
                        rows={4}
                        required
                        className="w-full px-4 py-3 bg-white/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0058bd]/50 outline-none transition-all text-[#191c1d] leading-relaxed shadow-sm resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting || !notifMessage.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-[#0058bd] to-blue-600 hover:from-[#004494] hover:to-blue-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Send className="w-4 h-4" />
                      {isBroadcasting ? 'Broadcasting...' : 'Publish Announcement'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-[#191c1d] tracking-tight">Recent Gratitude Activity</h3>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200/60">Live Stream</span>
                  </div>
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post._id} className="bg-white/80 backdrop-blur-md p-5 rounded-[20px] border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4 admin-row-hover">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-[#191c1d]">{post.authorName}</span>
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/50">{post.team || 'General'}</span>
                          </div>
                          <p className="text-[13px] italic text-[#424753] leading-relaxed">"{post.content}"</p>
                        </div>
                        <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-full bg-rose-50 border border-rose-100 shadow-sm">
                          <span className="text-[10px] text-rose-500">❤️</span>
                          <span className="text-[11px] font-bold text-rose-700 leading-none mt-0.5">{post.likesCount || 0}</span>
                        </div>
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
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[#191c1d] tracking-tight">Active Departments</h3>
                    <p className="text-xs text-[#424753] mt-0.5">Structure and manage company divisions</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0058bd] to-blue-600 hover:from-[#004494] hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Plus className="w-4 h-4" />
                    Add Department
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {teams.map((t) => {
                    const memberCount = users.filter((u) => u.team === t.name).length;
                    return (
                      <div key={t._id} className="bg-white/80 p-5 rounded-[24px] border border-slate-200/60 shadow-sm flex items-center justify-between admin-card-hover group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-slate-100 shadow-inner text-indigo-600 font-bold text-lg">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#191c1d]">{t.name}</h4>
                            <span className="text-[11px] font-bold text-slate-500">{memberCount} Member{memberCount === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTeam(t._id)}
                          className="p-2 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Delete Department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bulk Upload Section */}
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#191c1d]">Bulk Import Users</h3>
                    <p className="text-xs text-[#424753] mt-0.5">Upload a CSV or JSON file containing user data (email, fullName, team)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadSampleTemplate('csv')}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-300 cursor-pointer"
                    >
                      📥 Sample CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSampleTemplate('json')}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-300 cursor-pointer"
                    >
                      📥 Sample JSON
                    </button>
                  </div>
                </div>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#191c1d] mb-1">Target Department</label>
                      <select
                        value={selectedBulkDepartment}
                        onChange={(e) => setSelectedBulkDepartment(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#0058bd] text-xs bg-white"
                      >
                        <option value="">Auto-detect from file (or General)</option>
                        {teams.map((t) => (
                          <option key={t._id} value={t.name}>
                            📁 {t.name}
                          </option>
                        ))}
                        <option value="__NEW__">➕ Create New Department...</option>
                      </select>

                      {selectedBulkDepartment === '__NEW__' && (
                        <input
                          type="text"
                          required
                          value={customBulkDepartment}
                          onChange={(e) => setCustomBulkDepartment(e.target.value)}
                          placeholder="Type new department name..."
                          className="w-full px-3.5 py-2 mt-2 rounded-xl border border-purple-300 outline-none focus:ring-2 focus:ring-purple-600 text-xs bg-purple-50"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#191c1d] mb-1">Select File (.csv, .json, .txt)</label>
                      <input 
                        type="file" 
                        accept=".csv,.json,.txt"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0058bd] file:text-white hover:file:bg-[#004494] cursor-pointer"
                      />
                      {bulkFileContent && <span className="text-[10px] text-emerald-600 font-bold block mt-1">File loaded into memory</span>}
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
                  
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={isUploadingBulk || !bulkFileContent || !bulkDefaultPassword}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {isUploadingBulk ? 'Processing Import...' : 'Process Bulk Import'}
                    </button>
                    
                    {bulkResult && (
                      <div className="text-xs font-bold px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/60 shadow-sm">
                        <span className="text-emerald-600">{bulkResult.success} Created</span> • <span className="text-rose-600">{bulkResult.failed} Failed</span>
                      </div>
                    )}
                  </div>

                  {bulkResult && bulkResult.errors && bulkResult.errors.length > 0 && (
                    <div className="p-5 rounded-[24px] bg-rose-50/80 backdrop-blur-sm border border-rose-200/60 space-y-3 mt-4">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        Failure Log ({bulkResult.errors.length} item{bulkResult.errors.length === 1 ? '' : 's'}):
                      </span>
                      <ul className="max-h-36 overflow-y-auto text-[11px] font-mono text-rose-700 space-y-1.5 pr-2 custom-scrollbar">
                        {bulkResult.errors.map((errStr: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 bg-white/40 p-2 rounded-lg">
                            <span className="mt-0.5">•</span>
                            <span>{errStr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </form>
              </div>

              {/* User Directory Table */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] overflow-hidden space-y-0">
                {/* Multi-Select Action Banner */}
                {selectedUserIds.length > 0 && (
                  <div className="bg-rose-50/90 backdrop-blur-sm px-6 py-4 border-b border-rose-200/60 flex items-center justify-between animate-fade-slide-up">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-3 h-3">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full w-2 h-2 bg-rose-600"></span>
                      </div>
                      <span className="text-xs font-bold text-rose-900 tracking-wide">
                        {selectedUserIds.length} Member{selectedUserIds.length === 1 ? '' : 's'} Selected
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserIds([])}
                        className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200/60 cursor-pointer shadow-sm transition-all"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={handleBulkDeleteUsers}
                        className="px-5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-2 transform hover:-translate-y-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Selected ({selectedUserIds.length})
                      </button>
                    </div>
                  </div>
                )}

                <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between bg-white/40">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-[#191c1d] tracking-tight">User Directory</h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-slate-200/50">
                      {filteredUsers.length} total
                    </span>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Search members by name, email, or team..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bd]/50 shadow-sm transition-all"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-white/40">
                        <th className="px-6 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                            onChange={() => handleSelectAllUsers(filteredUsers)}
                            className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shadow-sm"
                          />
                        </th>
                        <th className="px-6 py-4">Member Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 text-xs">
                      {filteredUsers.map((u) => (
                        <tr
                          key={u._id}
                          className={`group transition-all duration-300 ${selectedUserIds.includes(u._id) ? 'bg-rose-50/60' : 'hover:bg-white/80'} admin-row-hover`}
                        >
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u._id)}
                              onChange={() => handleToggleSelectUser(u._id)}
                              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shadow-sm transition-all"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border border-white shadow-sm flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-[#191c1d] group-hover:text-[#0058bd] transition-colors">{u.fullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-500 group-hover:text-purple-600 transition-colors">{u.email}</td>
                          <td className="px-6 py-4 font-bold text-slate-600">
                            <span className="px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200/50">{u.team || 'General'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border ${u.role === 'ADMIN' ? 'bg-purple-100/80 text-purple-800 border-purple-200' : 'bg-slate-100/80 text-slate-700 border-slate-200/50'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleRoleToggle(u._id, u.role)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#0058bd] font-bold text-[11px] cursor-pointer shadow-sm transition-all"
                              >
                                {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDeleteSingleUser(u._id, u.fullName)}
                                title="Delete user"
                                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                            No members match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeNav === 'posts' ? (
            /* WALL POSTS MODERATION TAB */
            <div className="space-y-6 animate-fade-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#191c1d] tracking-tight">Content Moderation Stream</h3>
                  <p className="text-xs text-[#424753] mt-0.5">Review, quarantine, or remove inappropriate content</p>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200/60 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0058bd]/50 shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="break-inside-avoid bg-white/60 backdrop-blur-xl p-6 rounded-[24px] border border-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4 admin-card-hover group">
                    <div>
                      <div className="flex justify-between items-start text-xs mb-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#191c1d] text-[13px]">{post.authorName}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{post.authorEmail}</span>
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border shadow-sm ${post.isQuarantined ? 'bg-amber-50/80 text-amber-700 border-amber-200/60' : 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60'}`}>
                          {post.isQuarantined ? 'Quarantined' : 'Active'}
                        </span>
                      </div>
                      <p className="text-[13px] italic text-[#424753] leading-relaxed relative">
                        <span className="text-2xl text-purple-200 absolute -top-2 -left-2 select-none leading-none opacity-50">"</span>
                        <span className="relative z-10">{post.content}</span>
                        <span className="text-2xl text-purple-200 absolute -bottom-4 ml-1 select-none leading-none opacity-50">"</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/50 text-xs">
                      <button
                        onClick={() => handleToggleQuarantine(post._id)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-sm border ${post.isQuarantined ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'}`}
                      >
                        {post.isQuarantined ? 'Restore Post' : 'Quarantine'}
                      </button>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 rounded-xl bg-white border border-slate-200/60 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm transition-all cursor-pointer"
                        title="Delete Post permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ANALYTICS TAB */
            <div className="space-y-8 animate-fade-slide-up">
              <h3 className="text-2xl font-bold text-[#191c1d] tracking-tight">Telemetry Analytics</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md admin-card-hover">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Users</span>
                  <h4 className="text-4xl font-black text-[#191c1d] mt-2 tracking-tight">{stats?.totalUsers || users.length}</h4>
                </div>
                <div className="bg-gradient-to-br from-white to-blue-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md admin-card-hover">
                  <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">Total Posts</span>
                  <h4 className="text-4xl font-black text-[#191c1d] mt-2 tracking-tight">{stats?.totalPosts || posts.length}</h4>
                </div>
                <div className="bg-gradient-to-br from-white to-rose-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md admin-card-hover">
                  <span className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest">Reactions Shared</span>
                  <h4 className="text-4xl font-black text-[#191c1d] mt-2 tracking-tight">{stats?.totalLikes || 0}</h4>
                </div>
                <div className="bg-gradient-to-br from-white to-amber-50/50 p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md admin-card-hover">
                  <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">Quarantined Notes</span>
                  <h4 className="text-4xl font-black text-amber-600 mt-2 tracking-tight">{stats?.quarantinedPosts || 0}</h4>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)] space-y-6">
                <h4 className="text-lg font-bold text-[#191c1d] tracking-tight">Department Activity Breakdown</h4>
                <div className="space-y-5">
                  {teams.map((t) => {
                    const count = posts.filter((p) => p.team === t.name).length;
                    const percent = posts.length ? Math.round((count / posts.length) * 100) : 0;
                    return (
                      <div key={t._id} className="space-y-2 text-xs">
                        <div className="flex justify-between font-bold text-[#191c1d]">
                          <span>{t.name}</span>
                          <span className="text-slate-500">{count} Posts ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-200/50 h-3 rounded-full overflow-hidden shadow-inner border border-slate-100">
                          <div className="bg-gradient-to-r from-[#0058bd] to-blue-500 h-full rounded-full transition-all duration-1000 ease-out relative shadow-sm" style={{ width: `${percent}%` }}>
                            <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }} />
                          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[32px] max-w-md w-full border border-white/60 shadow-[0_16px_64px_rgba(0,0,0,0.1)] space-y-6 animate-fade-slide-up">
            <h3 className="text-2xl font-bold text-[#191c1d] tracking-tight">Add New Department</h3>
            <form onSubmit={handleCreateTeam} className="space-y-5 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-[10px]">Department Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Operations"
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0058bd]/50 outline-none transition-all shadow-sm text-[#191c1d]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider text-[10px]">Description (Optional)</label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="e.g. Infrastructure & Operations"
                  className="w-full px-4 py-3 bg-white/80 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0058bd]/50 outline-none transition-all shadow-sm text-[#191c1d]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200/60 font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeam}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0058bd] to-blue-600 hover:from-[#004494] hover:to-blue-700 text-white font-bold cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
