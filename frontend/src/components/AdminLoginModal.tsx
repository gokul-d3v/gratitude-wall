import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, IdCard, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { api } from '../services/api';
import { setAccessToken } from '../services/api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { checkAuth } = useAuthStore();
  const { triggerToast, setAdminViewOpen } = useWallStore();

  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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

      const { accessToken } = res.data.data;
      setAccessToken(accessToken);
      await checkAuth();

      triggerToast('Admin authenticated successfully!', 'success');
      onClose();
      setAdminViewOpen(true);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Admin authentication failed. Please check credentials.';
      setError(errMsg);
      triggerToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admin Portal Login</h2>
            <p className="text-xs text-slate-500">Access Management Console</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Employee Code</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Enter admin employee code"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 uppercase focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};
