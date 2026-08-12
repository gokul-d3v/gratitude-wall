import React, { useState } from 'react';
import { X, Lock, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, forgotPassword } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({
        email: user.email,
        newPassword
      });
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-black/5 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: user.avatarColor || '#0058bd' }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md"
            >
              {user.fullName?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{user.fullName}</h3>
              <p className="text-xs font-semibold text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-2">
              <Lock className="w-4 h-4 text-[#0058bd]" />
              Reset Password
            </h4>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-start gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-green-100">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>Password updated successfully!</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]/50 focus:border-[#0058bd] transition-all"
                  placeholder="Enter new password"
                  required
                  disabled={isLoading || success}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0058bd]/50 focus:border-[#0058bd] transition-all"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading || success}
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0058bd] text-white font-bold text-sm hover:bg-[#004494] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save New Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettingsModal;
