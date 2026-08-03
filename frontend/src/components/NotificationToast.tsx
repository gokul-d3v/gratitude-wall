import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Megaphone, Heart, Sparkles } from 'lucide-react';
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
      <div className="bg-[#fffcf9]/95 backdrop-blur-md border border-black/10 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center gap-4">
        {/* Icon Badge */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
            isError
              ? 'bg-rose-100 text-rose-600 ring-4 ring-rose-50'
              : isSuccess
              ? 'bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50'
              : isLike
              ? 'bg-rose-100 text-rose-600 ring-4 ring-rose-50'
              : 'bg-blue-100 text-[#0058bd] ring-4 ring-blue-50'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-5 h-5" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isLike ? (
            <Heart className="w-5 h-5 fill-rose-600" />
          ) : isAnnouncement ? (
            <Megaphone className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs sm:text-sm font-bold text-[#191c1d] leading-snug break-words">
            {toastNotification.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={clearToast}
          className="p-1.5 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-700 transition-all cursor-pointer shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
