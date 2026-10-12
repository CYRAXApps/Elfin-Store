import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { 
  Bell, CheckCheck, ShoppingCart, CreditCard, RotateCcw, 
  MessageSquare, AlertTriangle, Store, ArrowRight, X, ExternalLink
} from 'lucide-react';
import { AppNotification } from '../../types';

interface AdminNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll: () => void;
  onNavigateTab: (tab: string, params?: any) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function AdminNotificationDropdown({
  isOpen,
  onClose,
  onViewAll,
  onNavigateTab,
  triggerRef
}: AdminNotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  // Subscribe to real-time notifications
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(25)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items: AppNotification[] = snapshot.docs.map(d => {
          const data = d.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt?.toDate) {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (typeof data.createdAt === 'string') {
            createdAtStr = data.createdAt;
          }

          return {
            id: d.id,
            ...data,
            read: Boolean(data.read),
            createdAt: createdAtStr
          } as AppNotification;
        });
        setNotifications(items);
      }, (err) => {
        console.warn("Admin dropdown notification subscription note:", err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not set up notifications listener:", err);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0 || isUpdating) return;
    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { 
          read: true,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    onClose();

    // Contextual routing without page reload
    if (notif.orderId || notif.type === 'order' || notif.type === 'shipping') {
      onNavigateTab('orders', { orderId: notif.orderId });
    } else if (notif.type === 'payment' || notif.type === 'refund') {
      onNavigateTab('payments');
    } else if (notif.type === 'stock') {
      onNavigateTab('inventory');
    } else if (notif.type === 'account') {
      onNavigateTab('customers');
    } else {
      onViewAll();
    }
  };

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
      case 'shipping':
        return <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0"><ShoppingCart size={15} /></div>;
      case 'payment':
      case 'refund':
        return <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0"><CreditCard size={15} /></div>;
      case 'stock':
        return <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0"><AlertTriangle size={15} /></div>;
      case 'account':
        return <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 shrink-0"><RotateCcw size={15} /></div>;
      default:
        return <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0"><Bell size={15} /></div>;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs)) return '';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-100 text-blue-700">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isUpdating}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-2 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'all' 
              ? 'bg-slate-900 text-white' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            filter === 'unread' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto divide-y divide-slate-100 flex-1 overscroll-contain max-h-[360px]">
        {filteredNotifications.length === 0 ? (
          <div className="py-10 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
              <Bell size={18} />
            </div>
            <p className="text-xs font-bold text-slate-700">No notifications</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filter === 'unread' ? "You're all caught up with unread alerts!" : "No recent activity or notifications recorded yet."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3 transition-colors cursor-pointer flex items-start gap-3 relative ${
                notif.read ? 'hover:bg-slate-50/80 bg-white' : 'bg-blue-50/40 hover:bg-blue-50/70'
              }`}
            >
              {renderIcon(notif.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className={`text-xs truncate ${notif.read ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'}`}>
                    {notif.title || notif.subject || 'Store Alert'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.read && (
                <span 
                  className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5 ring-2 ring-blue-100" 
                  title="Unread"
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer / View All */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center shrink-0">
        <button
          type="button"
          onClick={() => {
            onClose();
            onViewAll();
          }}
          className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-100/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>View all notifications</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
