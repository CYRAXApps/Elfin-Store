import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { Bell, Package, Truck, AlertTriangle, Tag, CheckCheck, Clock, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '../types';

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let customerList: AppNotification[] = [];
    let adminList: AppNotification[] = [];

    const updateCombined = () => {
      const combined = [...customerList, ...adminList];
      combined.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setNotifications(combined);
    };

    // Query notifications for user with limit
    const qCustomer = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(50)
    );

    const unsubCustomer = onSnapshot(qCustomer, (snap) => {
      customerList = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      updateCombined();
    }, (error) => {
      console.warn("Notifications subscription warning:", error);
    });

    let unsubAdmin: (() => void) | null = null;
    if (user.role === 'admin') {
      const qAdmin = query(
        collection(db, 'notifications'),
        where('userId', '==', 'admin'),
        limit(50)
      );
      unsubAdmin = onSnapshot(qAdmin, (adminSnap) => {
        adminList = adminSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
        updateCombined();
      }, (error) => {
        console.warn("Admin notifications subscription warning:", error);
      });
    }

    return () => {
      unsubCustomer();
      if (unsubAdmin) unsubAdmin();
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unread = notifications.filter(n => !n.read);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.type === 'stock') {
      navigate('/admin');
    } else if (notif.orderId) {
      if (user?.role === 'admin' && notif.userId === 'admin') {
        navigate('/admin');
      } else {
        navigate('/orders');
      }
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package size={16} className="text-blue-600" />;
      case 'shipping':
        return <Truck size={16} className="text-emerald-600" />;
      case 'stock':
        return <AlertTriangle size={16} className="text-amber-600" />;
      case 'promo':
        return <Tag size={16} className="text-purple-600" />;
      default:
        return <Bell size={16} className="text-blue-600" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-full transition-colors relative flex items-center justify-center"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-2 border-b border-slate-100 flex gap-4 text-xs font-semibold bg-white">
            <button
              onClick={() => setFilter('all')}
              className={`pb-1 border-b-2 transition-colors ${filter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-1 border-b-2 transition-colors ${filter === 'unread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications to display
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const dateStr = n.createdAt?.toDate 
                  ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + n.createdAt.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : 'Just now';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 items-start ${
                      !n.read ? 'bg-blue-50/30' : 'bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${
                      n.type === 'shipping' ? 'bg-emerald-100/70' :
                      n.type === 'stock' ? 'bg-amber-100/70' :
                      n.type === 'promo' ? 'bg-purple-100/70' :
                      'bg-blue-100/70'
                    }`}>
                      {getIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {dateStr}
                        </span>
                        {n.orderId && (
                          <span className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                            View Details <ExternalLink size={9} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors w-full py-1"
            >
              View All Notifications & Preferences &rarr;
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
