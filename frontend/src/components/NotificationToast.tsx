import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Megaphone, Heart } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';

export const NotificationToast: React.FC = () => {
  const { toastNotification, clearToast } = useWallStore();

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [toastNotification, clearToast]);

  if (!toastNotification) return null;

  const isError = toastNotification.variant === 'error';
  const isSuccess = toastNotification.variant === 'success';
  const isAnnouncement =
    toastNotification.type === 'NEW_POST' ||
    toastNotification.type === 'SYSTEM' ||
    toastNotification.type === 'TAGGED';
  const isLike = toastNotification.type === 'LIKED';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92%] sm:w-auto animate-fade-slide-up pointer-events-auto">
      <div
        className={`flex items-center gap-3.5 px-5 py-3.5 rounded-full shadow-2xl border backdrop-blur-md transition-all ${
          isError
            ? 'bg-rose-950/95 text-white border-rose-700/80 shadow-rose-950/40'
            : isSuccess
            ? 'bg-emerald-950/95 text-white border-emerald-700/80 shadow-emerald-950/40'
            : isAnnouncement
            ? 'bg-[#003c82]/95 text-white border-[#0058bd] shadow-[#0058bd]/30 ring-2 ring-[#0058bd]/30'
            : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/40'
        }`}
      >
        {isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        ) : isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : isLike ? (
          <Heart className="w-5 h-5 text-rose-400 fill-rose-500 shrink-0" />
        ) : isAnnouncement ? (
          <Megaphone className="w-5 h-5 text-amber-300 animate-bounce shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0 pr-2">
          {isAnnouncement && (
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded-full inline-block mb-0.5">
              Announcement
            </span>
          )}
          <p className="text-xs sm:text-sm font-semibold leading-snug break-words">
            {toastNotification.message}
          </p>
        </div>

        <button
          onClick={clearToast}
          className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
