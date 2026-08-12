import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, User as UserIcon, Sparkles, Eye, EyeOff, IdCard, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWallStore } from '../store/useWallStore';
import { api } from '../services/api';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useWallStore();
  const { login, register, forgotPassword } = useAuthStore();
  const { triggerToast } = useWallStore();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    team: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const teamSelectRef = useRef<HTMLSelectElement>(null);

  // When teams load, sync formData.team to first available team
  useEffect(() => {
    if (teams.length > 0 && !formData.team) {
      setFormData(prev => ({ ...prev, team: teams[0].name }));
    }
  }, [teams]);

  useEffect(() => {
    if (isAuthModalOpen) {
      fetchTeams();
    }
  }, [isAuthModalOpen]);

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      const teamList = res.data.data || [];
      setTeams(teamList);
      if (teamList.length > 0) {
        setFormData((prev) => ({ ...prev, team: teamList[0].name }));
      }
    } catch {
      setTeams([]);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegisterMode) {
      if (!formData.fullName.trim()) {
        setError('Full Name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Password and Confirm Password do not match');
        return;
      }
      if (!formData.team) {
        setError('Please select a department / team');
        return;
      }
    } else {
      if (!formData.email.trim() || !formData.password) {
        setError('Email and Password are required');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        // Read team directly from DOM select to bypass any React state sync lag
        const selectedTeam = teamSelectRef.current?.value || formData.team;

        await register({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          team: selectedTeam,
        });
        triggerToast('Registration successful! Welcome to BROTIFY.', 'success');
      } else {
        await login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });
        triggerToast('Successfully signed in!', 'success');
      }
      setAuthModalOpen(false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Authentication failed. Please check credentials.';
      setError(errMsg);
      triggerToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0058bd] flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isRegisterMode ? 'User Registration' : 'Employee Login'}
            </h2>
            <p className="text-xs text-slate-500">Access BROTIFY Gratitude Wall</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          {/* Full Name (Register Only) */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
              </div>
            </div>
          )}

          {/* Team Dropdown Selection (Register Only) */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Team</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  ref={teamSelectRef}
                  value={formData.team}
                  onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0058bd] bg-white cursor-pointer"
                  required
                >
                  <option value="" disabled>Select your department</option>
                  {teams.map((t) => (
                    <option key={t._id || t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email / Username</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. user@example.com"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 lowercase focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
              />
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
          </div>

          {/* Confirm Password with Eye Toggle (Register) */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0058bd]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-3 rounded-lg bg-[#0058bd] hover:bg-[#004494] text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : isRegisterMode ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          {isRegisterMode ? (
            <>
              Already registered?{' '}
              <button
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                }}
                className="font-bold text-[#0058bd] hover:underline cursor-pointer"
              >
                Sign In with Email
              </button>
            </>
          ) : (
            <>
              Need an account?{' '}
              <button
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                }}
                className="font-bold text-[#0058bd] hover:underline cursor-pointer"
              >
                Register Here
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
