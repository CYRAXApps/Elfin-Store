import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Package, Truck, CreditCard, RotateCcw, Check, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { AppNotification } from '../../types';

interface NotificationsSubViewProps {
  userId: string;
  onNavigateView?: (view: string, status?: string) => void;
}

export function NotificationsSubView({ userId, onNavigateView }: NotificationsSubViewProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return timeB - timeA;
      });
      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.warn('Notifications fetch note:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleMarkNotificationAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unread = notifications.filter(n => !n.read);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
            <Bell size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Notifications & Alerts
            </h2>
            <p className="text-slate-400 text-xs">
              {notifications.length} total • {unreadNotificationsCount} unread
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={handleMarkAllNotificationsRead}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Check size={13} /> Mark all read
            </button>
          )}
          <Link
            to="/notifications"
            className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1.5"
          >
            Preferences
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell size={26} className="text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No notifications yet</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4 leading-relaxed">
            You're all caught up! Updates regarding order confirmations, shipping tracking, out-for-delivery alerts, and invoices will appear here.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Explore Store
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const isUnread = !notif.read;

            let TypeIcon = Bell;
            let iconBg = 'bg-blue-50 text-blue-600';
            if (notif.type === 'order') {
              TypeIcon = Package;
              iconBg = 'bg-blue-50 text-blue-600';
            } else if (notif.type === 'shipping') {
              TypeIcon = Truck;
              iconBg = 'bg-indigo-50 text-indigo-600';
            } else if (notif.type === 'payment') {
              TypeIcon = CreditCard;
              iconBg = 'bg-emerald-50 text-emerald-600';
            } else if (notif.type === 'refund') {
              TypeIcon = RotateCcw;
              iconBg = 'bg-amber-50 text-amber-600';
            }

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (isUnread) {
                    handleMarkNotificationAsRead(notif.id);
                  }
                  if (notif.orderId) {
                    if (onNavigateView) {
                      onNavigateView('orders', 'all');
                    } else {
                      navigate(`/account?view=orders&orderId=${notif.orderId}`);
                    }
                  }
                }}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                  isUnread
                    ? 'bg-blue-50/40 border-blue-200/80 shadow-2xs hover:bg-blue-50/60'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <TypeIcon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                      {notif.title || notif.subject || 'Notification'}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100/80">
                    {notif.orderNumber || notif.orderId ? (
                      <span className="text-[10px] font-bold text-blue-600 inline-flex items-center gap-0.5">
                        Order #{notif.orderNumber || notif.orderId?.slice(0, 8)} <ChevronRight size={10} />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 capitalize">{notif.type || 'Alert'}</span>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkNotificationAsRead(notif.id, e)}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check size={11} /> Mark read
                      </button>
                    )}
                  </div>
                </div>

                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
