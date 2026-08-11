import React, { useEffect, useRef } from 'react';
import { X, Bell, Check, Trash2 } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';
import { api } from '../services/api';

const getRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationModal: React.FC = () => {
  const { isNotifModalOpen, setNotifModalOpen, notifications, unreadCount, setNotifications } = useWallStore();
  const notifRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifModalOpen(false);
      }
    };

    if (isNotifModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isNotifModalOpen, setNotifModalOpen]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read');
    } catch {
      // Silence api error
    }
    // Update local state instantly and reset unread count & highlights
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear');
    } catch {
      // Silence api error
    }
    setNotifications([]);
  };

  const [pushPermission, setPushPermission] = React.useState(Notification.permission);
  const handleEnablePush = async () => {
    try {
      const { registerAndSubscribePush } = await import('../services/pushService');
      await registerAndSubscribePush();
      setPushPermission(Notification.permission);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isNotifModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        ref={notifRef}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 animate-fade-slide-up max-h-[80vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0058bd]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#0058bd]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Notifications</h2>
              {unreadCount > 0 ? (
                <p className="text-[10px] font-bold text-rose-600">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-[10px] font-medium text-slate-400">All caught up!</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#0058bd] font-bold hover:underline cursor-pointer flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 transition-all"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
            <button
              onClick={() => setNotifModalOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {pushPermission === 'default' && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-blue-900">Get Notified!</span>
              <span className="text-xs text-blue-700">Enable desktop notifications to never miss out.</span>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Enable
            </button>
          </div>
        )}

        {/* Modal Body: Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Bell className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400">You'll see announcements, tags and likes here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => {
                const isUnread = !n.isRead;
                return (
                  <div
                    key={n.id || (n as any)._id}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl transition-all ${
                      isUnread
                        ? 'bg-blue-50/90 border-2 border-[#0058bd]/40 shadow-xs ring-1 ring-[#0058bd]/20'
                        : 'bg-white border border-slate-100 opacity-80'
                    }`}
                  >
                    {/* Type Icon */}
                    <div
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg ${
                        n.type === 'TAGGED'
                          ? 'bg-purple-100 text-purple-700'
                          : n.type === 'LIKED'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-[#0058bd]'
                      }`}
                    >
                      {n.type === 'TAGGED' ? '🏷' : n.type === 'LIKED' ? '❤️' : '📢'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm leading-snug ${
                          isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'
                        }`}
                      >
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {getRelativeTime(n.createdAt || new Date().toISOString())}
                        </span>
                        {isUnread && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#0058bd] text-white px-2 py-0.5 rounded-full">
                            UNREAD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <div className="w-3 h-3 rounded-full bg-[#0058bd] shrink-0 mt-1 shadow-xs animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};