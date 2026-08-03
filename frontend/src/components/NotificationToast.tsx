import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';

export const NotificationToast: React.FC = () => {
  const { toastNotification, clearToast } = useWallStore();

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification, clearToast]);

  if (!toastNotification) return null;

  const isError = toastNotification.variant === 'error';
  const isSuccess = toastNotification.variant === 'success';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto animate-fade-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-md transition-all ${
          isError
            ? 'bg-rose-900/90 text-white border-rose-700'
            : isSuccess
            ? 'bg-emerald-900/90 text-white border-emerald-700'
            : 'bg-slate-900/90 text-white border-slate-700'
        }`}
      >
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
        )}

        <div className="flex-1 text-xs font-semibold leading-tight pr-2">
          {toastNotification.message}
        </div>

        <button
          onClick={clearToast}
          className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
