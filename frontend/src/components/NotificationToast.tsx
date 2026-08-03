import React, { useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';

export const NotificationToast: React.FC = () => {
  const { toastNotification, clearToast } = useWallStore();

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification, clearToast]);

  if (!toastNotification) return null;

  const variantStyles = {
    success: 'bg-emerald-900 border-emerald-600 text-emerald-100',
    error: 'bg-rose-900 border-rose-600 text-rose-100',
    info: 'bg-slate-900 border-slate-700 text-white',
  };

  const variantIcon = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Sparkles className="w-5 h-5 text-blue-400" />,
  };

  const style = variantStyles[toastNotification.variant || 'info'] || variantStyles.info;
  const icon = variantIcon[toastNotification.variant || 'info'] || variantIcon.info;

  return (
    <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 p-4 rounded-xl shadow-2xl border transition-all animate-bounce-in max-w-md ${style}`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 text-xs">
        <p className="font-bold tracking-wide uppercase text-[10px] opacity-80">
          {toastNotification.senderName || 'Notification'}
        </p>
        <p className="text-sm font-medium mt-0.5">{toastNotification.message}</p>
      </div>
      <button onClick={clearToast} className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
        <X className="w-4 h-4 opacity-70 hover:opacity-100" />
      </button>
    </div>
  );
};
