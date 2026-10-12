import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, setDoc, getDoc } from 'firebase/firestore';
import { 
  Bell, Package, CreditCard, Truck, RotateCcw, ShieldCheck, 
  CheckCheck, Clock, Sliders, CheckCircle2, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppNotification, NotificationPreferences } from '../../types';
import { AccountLayout } from '../../components/account/AccountLayout';

export function CustomerNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [filterType, setFilterType] = useState<string>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Notification Preferences State
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    paymentNotifications: true,
    shippingUpdates: true,
    deliveryNotifications: true,
    promotionalNotifications: false
  });
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return timeB - timeA;
      });
      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.warn("Notifications subscription note:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch user preferences
  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      try {
        const prefDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'notification_preferences'));
        if (prefDoc.exists()) {
          setPreferences(prefDoc.data() as NotificationPreferences);
        }
      } catch (err) {
        console.warn("Preferences load note:", err);
      }
    };
    fetchPrefs();
  }, [user]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.warn("Notice marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const batch = writeBatch(db);
      const unread = notifications.filter(n => !n.read);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn("Notice marking all read:", err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPrefSaving(true);
    setPrefSuccess(false);

    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'notification_preferences'), {
        ...preferences,
        updatedAt: new Date()
      }, { merge: true });
      setPrefSuccess(true);
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (err) {
      console.warn("Notice saving preferences:", err);
    } finally {
      setPrefSaving(false);
    }
  };

  const getFilteredList = () => {
    if (filterType === 'all') return notifications;
    if (filterType === 'orders') return notifications.filter(n => n.type === 'order');
    if (filterType === 'payments') return notifications.filter(n => n.type === 'payment');
    if (filterType === 'shipping') return notifications.filter(n => n.type === 'shipping');
    if (filterType === 'refunds') return notifications.filter(n => n.type === 'refund');
    if (filterType === 'account') return notifications.filter(n => n.type === 'account' || n.type === 'system');
    return notifications;
  };

  const filtered = getFilteredList();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Package size={18} className="text-blue-600" />;
      case 'payment':
        return <CreditCard size={18} className="text-indigo-600" />;
      case 'shipping':
        return <Truck size={18} className="text-emerald-600" />;
      case 'refund':
        return <RotateCcw size={18} className="text-amber-600" />;
      case 'account':
      case 'system':
        return <ShieldCheck size={18} className="text-purple-600" />;
      default:
        return <Bell size={18} className="text-blue-600" />;
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-16 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto">
          <Bell size={40} className="text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Account Notifications</h2>
          <p className="text-slate-500 text-sm mb-6">Please sign in to view your order updates, delivery tracking, and manage preferences.</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout activeView="notifications" title="Notifications">
      <div>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">Real-time alerts, payment confirmations, tracking info, and communication settings.</p>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell size={14} /> Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'preferences' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={14} /> Preferences
          </button>
        </div>
      </div>

      {activeTab === 'notifications' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filters and Batch Actions */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'orders', label: 'Orders' },
                { key: 'payments', label: 'Payments' },
                { key: 'shipping', label: 'Shipping' },
                { key: 'refunds', label: 'Refunds' },
                { key: 'account', label: 'Account' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filterType === tab.key 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm">Loading your notifications...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Bell size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  You are all caught up! Updates regarding your orders, shipments, and account security will appear here.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                let dateStr = 'Recent';
                try {
                  if (typeof item.createdAt?.toDate === 'function') {
                    dateStr = item.createdAt.toDate()?.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Recent';
                  } else if (item.createdAt?.seconds) {
                    dateStr = new Date(item.createdAt.seconds * 1000).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  } else if (item.createdAt) {
                    dateStr = new Date(item.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  }
                } catch {
                  dateStr = 'Recent';
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => !item.read && handleMarkAsRead(item.id)}
                    className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                      !item.read ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      item.type === 'shipping' ? 'bg-emerald-100/70' :
                      item.type === 'payment' ? 'bg-indigo-100/70' :
                      item.type === 'refund' ? 'bg-amber-100/70' :
                      item.type === 'account' ? 'bg-purple-100/70' :
                      'bg-blue-100/70'
                    }`}>
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm ${!item.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {item.title || item.subject}
                          </h4>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> {dateStr}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        {item.orderNumber && (
                          <span className="bg-slate-100 text-slate-600 font-mono text-[11px] px-2 py-0.5 rounded font-semibold">
                            Order #{item.orderNumber}
                          </span>
                        )}
                        <span className="text-slate-400 capitalize text-[11px]">
                          Channel: <span className="font-semibold text-slate-600">{item.channel.replace('_', ' ')}</span>
                        </span>
                        {item.orderId && (
                          <Link
                            to="/orders"
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5 ml-auto text-xs"
                          >
                            Track / View Order <ChevronRight size={13} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Notification Preferences Panel */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Communication Preferences</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Control how you receive non-essential updates. Transactional security notices and invoices are always dispatched to guarantee consumer protection.
            </p>

            {prefSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm font-semibold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                Your notification preferences have been saved securely!
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-6">
              {/* Category: Transactional (Essential) */}
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Transactional (Essential & Legally Required)</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Order Confirmations & Invoices</p>
                      <p className="text-xs text-slate-500">Tax invoices, order verification, and dispatch alerts.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-200/80 px-2.5 py-1 rounded-md">Enforced</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Payment Captures & Refund Receipts</p>
                      <p className="text-xs text-slate-500">Razorpay transaction verification & credit acknowledgments.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-200/80 px-2.5 py-1 rounded-md">Enforced</span>
                  </div>
                </div>
              </div>

              {/* Category: Operational Updates */}
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Delivery & Logistics</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Shipping & Courier Updates</p>
                      <p className="text-xs text-slate-500">Receive tracking AWB assignments and transit checkpoints.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.shippingUpdates}
                      onChange={(e) => setPreferences({ ...preferences, shippingUpdates: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Out for Delivery Alerts</p>
                      <p className="text-xs text-slate-500">Get notified the morning your package arrives in your neighborhood.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.deliveryNotifications}
                      onChange={(e) => setPreferences({ ...preferences, deliveryNotifications: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Category: Marketing / Promotional */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Promotions & Offers</span>
                </div>

                <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Exclusive Deals & Product Drops</p>
                    <p className="text-xs text-slate-500">Receive curated discounts, seasonal coupons, and new technology launches.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.promotionalNotifications}
                    onChange={(e) => setPreferences({ ...preferences, promotionalNotifications: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={prefSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {prefSaving ? <RefreshCw size={14} className="animate-spin" /> : null}
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AccountLayout>
  );
}
