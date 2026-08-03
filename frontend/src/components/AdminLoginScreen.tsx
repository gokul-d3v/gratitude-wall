import React, { useState } from 'react';
import { Lock, Eye, EyeOff, IdCard, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { api, setAccessToken } from '../services/api';

export const AdminLoginScreen: React.FC = () => {
  const { checkAuth } = useAuthStore();
  const { triggerToast, setAdminViewOpen } = useWallStore();

  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!employeeCode.trim() || !password) {
      setError('Employee Code and Password are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/admin-login', {
        employeeCode: employeeCode.trim().toUpperCase(),
        password,
      });

      const { accessToken, refreshToken } = res.data.data;
      setAccessToken(accessToken, refreshToken);
      await checkAuth();

      triggerToast('Admin authenticated successfully! Opening console...', 'success');
      window.history.pushState({}, '', '/admin');
      setAdminViewOpen(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Admin authentication failed. Please check credentials.';
      setError(errMsg);
      triggerToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div
      className="min-h-screen bg-[#fffcf9] flex flex-col justify-center items-center p-6 text-slate-900 font-sans"
      style={{
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md text-slate-900 rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 animate-fade-slide-up">
        <button
          onClick={navigateToHome}
          className="inline-flex items-center gap-2 mb-6 text-xs font-semibold text-slate-500 hover:text-[#0058bd] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gratitude Wall
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Admin Portal Login</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Route: http://localhost:5173/admin-login</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Employee Code</label>
            <div className="relative">
              <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Enter admin employee code"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs font-mono bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};
