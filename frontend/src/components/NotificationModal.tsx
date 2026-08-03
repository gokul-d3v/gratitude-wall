import React, { useEffect, useRef } from 'react';
import { X, Bell, Check } from 'lucide-react';
import { useWallStore } from '../store/useWallStore';

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
      // Mark all as read on backend
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Even if backend call fails, update UI
      });

      // Update local state
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silence
    }
  };

  if (!isNotifModalOpen) return null;

  const filteredNotifications = notifications;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        ref={notifRef}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 animate-fade-slide-up max-h-[80vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0058bd]/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#0058bd]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-[10px] font-semibold text-rose-600">
                  {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-[#0058bd] font-semibold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
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

        {/* Notification Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Bell className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400">You'll see tags and reactions here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id || (n as any)._id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    !n.isRead ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 border border-slate-100'
                  }`}
                >
                  {/* Type Icon */}
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg ${
                    n.type === 'TAGGED' ? 'bg-purple-100' :
                    n.type === 'LIKED' ? 'bg-rose-100' : 'bg-blue-100'
                  }`}>
                    {n.type === 'TAGGED' ? '🏷' : n.type === 'LIKED' ? '❤️' : '📢'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">
                        {getRelativeTime(n.createdAt || new Date().toISOString())}
                      </span>
                      {!n.isRead && (
                        <span className="text-[9px] font-bold bg-[#0058bd] text-white px-1.5 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!n.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0058bd] shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};