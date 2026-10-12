import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  Bell, Mail, MessageSquare, Send, CheckCircle2, XCircle, Clock, 
  RefreshCw, Search, Filter, Eye, AlertTriangle, Smartphone, ShieldCheck, 
  ChevronRight, X, Trash2, Check, CheckCheck, ShoppingCart, CreditCard, 
  RotateCcw, Package, AlertCircle, Store, Star, ArrowUpRight, Inbox,
  SlidersHorizontal, CheckSquare, Square, Layers, ExternalLink, Settings
} from 'lucide-react';
import { AppNotification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../utils/staffPermissions';

interface AdminNotificationsProps {
  initialFilter?: string;
  onNavigateTab?: (tab: string, params?: any) => void;
}

export function AdminNotifications({ initialFilter = 'all', onNavigateTab }: AdminNotificationsProps) {
  const { user } = useAuth();
  const canManage = hasStaffPermission(user, 'notifications_manage') || (user as any)?.role === 'admin' || (user as any)?.role === 'owner';

  const [activeMainTab, setActiveMainTab] = useState<'inbox' | 'telemetry'>('inbox');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>(initialFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Telemetry & Preview states (preserved from existing monitoring system)
  const [previewTemplateId, setPreviewTemplateId] = useState<string>('order_confirmation');
  const [templatePreviewModal, setTemplatePreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [providersHealth, setProvidersHealth] = useState<any>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Set up real-time listener for real notifications from Firestore
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: AppNotification[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          read: Boolean(data.read),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString())
        } as AppNotification;
      });
      setNotifications(items);
      setLoading(false);
    }, (error) => {
      console.warn("Realtime notifications listener error, falling back to API:", error);
      // Fallback to REST API
      fetchNotificationsFallback();
    });

    // Also fetch provider health in background
    fetchProviderHealth();

    return () => unsubscribe();
  }, []);

  // Synchronize initialFilter prop changes
  useEffect(() => {
    if (initialFilter && initialFilter !== 'all') {
      setTypeFilter(initialFilter);
      if (initialFilter === 'unread') {
        setStatusFilter('unread');
        setTypeFilter('all');
      }
    }
  }, [initialFilter]);

  const fetchNotificationsFallback = async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=200');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications via fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderHealth = async () => {
    try {
      const provRes = await fetch('/api/admin/notifications/settings');
      if (provRes.ok) {
        const provData = await provRes.json();
        setProvidersHealth(provData);
      }
    } catch (err) {
      console.warn("Provider health check note:", err);
    }
  };

  // Helper to categorize notification type
  const getNotificationCategory = (notif: AppNotification): string => {
    const rawType = (notif.type || '').toLowerCase();
    if (rawType.includes('order')) return 'orders';
    if (rawType.includes('pay')) return 'payments';
    if (rawType.includes('ship') || rawType.includes('deliver')) return 'shipping';
    if (rawType.includes('return') || rawType.includes('refund')) return 'returns';
    if (rawType.includes('inquiry') || rawType.includes('ticket') || rawType.includes('support')) return 'support';
    if (rawType.includes('review')) return 'reviews';
    if (rawType.includes('stock') || rawType.includes('inventory')) return 'inventory';
    if (rawType.includes('pos')) return 'pos';
    if (rawType.includes('system') || rawType.includes('security') || rawType.includes('staff')) return 'system';
    return 'general';
  };

  // Dynamic filter counts
  const counts = useMemo(() => {
    let unread = 0;
    const catCounts = {
      all: notifications.length,
      unread: 0,
      orders: 0,
      payments: 0,
      returns: 0,
      support: 0,
      reviews: 0,
      inventory: 0,
      pos: 0,
      system: 0
    };

    notifications.forEach(n => {
      if (!n.read) {
        unread++;
        catCounts.unread++;
      }
      const cat = getNotificationCategory(n);
      if (cat in catCounts && cat !== 'all' && cat !== 'unread') {
        (catCounts as any)[cat]++;
      }
    });

    return { total: notifications.length, unread, ...catCounts };
  }, [notifications]);

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Status Filter
      if (statusFilter === 'unread' && n.read) return false;
      if (statusFilter === 'read' && !n.read) return false;

      // 2. Type Filter
      if (typeFilter !== 'all') {
        const cat = getNotificationCategory(n);
        if (typeFilter === 'unread' && n.read) return false;
        if (typeFilter === 'orders' && cat !== 'orders' && cat !== 'shipping') return false;
        if (typeFilter === 'payments' && cat !== 'payments') return false;
        if (typeFilter === 'returns' && cat !== 'returns') return false;
        if (typeFilter === 'support' && cat !== 'support') return false;
        if (typeFilter === 'reviews' && cat !== 'reviews') return false;
        if (typeFilter === 'inventory' && cat !== 'inventory') return false;
        if (typeFilter === 'pos' && cat !== 'pos') return false;
        if (typeFilter === 'system' && cat !== 'system') return false;
      }

      // 3. Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const id = (n.id || '').toLowerCase();
        const title = (n.title || n.subject || '').toLowerCase();
        const message = (n.message || '').toLowerCase();
        const recipient = (n.recipient || '').toLowerCase();
        const orderNum = (n.orderNumber || n.orderId || '').toLowerCase();
        const posInv = ((n as any).posInvoiceNumber || '').toLowerCase();
        const custName = ((n as any).metadata?.customerName || '').toLowerCase();
        const custEmail = ((n as any).metadata?.customerEmail || '').toLowerCase();

        return id.includes(term) || title.includes(term) || message.includes(term) || 
               recipient.includes(term) || orderNum.includes(term) || posInv.includes(term) || 
               custName.includes(term) || custEmail.includes(term);
      }

      return true;
    });
  }, [notifications, statusFilter, typeFilter, searchTerm]);

  // Mark single notification as read/unread
  const handleToggleRead = async (notif: AppNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !notif.read;
    
    // Optimistic UI update
    setNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, read: newStatus } : item));
    if (selectedNotif?.id === notif.id) {
      setSelectedNotif({ ...selectedNotif, read: newStatus });
    }

    try {
      await fetch(`/api/admin/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: newStatus })
      });
      // Also update Firestore directly
      const docRef = doc(db, 'notifications', notif.id);
      await updateDoc(docRef, { read: newStatus });
    } catch (err) {
      console.warn("Could not sync read status:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (counts.unread === 0) return;
    setActionLoading(true);

    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (selectedNotif) {
      setSelectedNotif({ ...selectedNotif, read: true });
    }

    try {
      await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
    } catch (err) {
      console.warn("Failed mark-all-read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a single notification
  const handleDeleteNotification = async (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this notification record?')) return;

    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    if (selectedNotif?.id === notifId) {
      setSelectedNotif(null);
    }
    setSelectedIds(prev => prev.filter(id => id !== notifId));

    try {
      await fetch(`/api/admin/notifications/${notifId}`, { method: 'DELETE' });
      await deleteDoc(doc(db, 'notifications', notifId));
    } catch (err) {
      console.warn("Delete error:", err);
    }
  };

  // Bulk actions (Mark Read / Unread / Delete)
  const handleBulkMarkRead = async (targetReadState: boolean) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);

    const idsToUpdate = [...selectedIds];
    setNotifications(prev => prev.map(n => idsToUpdate.includes(n.id) ? { ...n, read: targetReadState } : n));

    try {
      await Promise.all(idsToUpdate.map(id => 
        fetch(`/api/admin/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: targetReadState })
        })
      ));
    } catch (err) {
      console.warn("Bulk mark read error:", err);
    } finally {
      setActionLoading(false);
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected notification(s)?`)) return;

    setActionLoading(true);
    const idsToDelete = [...selectedIds];
    setNotifications(prev => prev.filter(n => !idsToDelete.includes(n.id)));
    if (selectedNotif && idsToDelete.includes(selectedNotif.id)) {
      setSelectedNotif(null);
    }

    try {
      await fetch('/api/admin/notifications/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: idsToDelete })
      });
    } catch (err) {
      console.warn("Bulk delete error:", err);
    } finally {
      setActionLoading(false);
      setSelectedIds([]);
    }
  };

  // Toggle selection for all visible items
  const handleSelectAllVisible = () => {
    if (selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id));
    }
  };

  const handleToggleSelectId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Handle click on a notification card (opens detail and marks read)
  const handleSelectNotification = (notif: AppNotification) => {
    setSelectedNotif(notif);
    if (!notif.read) {
      handleToggleRead(notif);
    }
  };

  // Deep linking navigation callback
  const handleNavigateToRecord = (notif: AppNotification) => {
    if (!onNavigateTab) return;
    const cat = getNotificationCategory(notif);

    if (notif.orderId || notif.orderNumber || cat === 'orders' || cat === 'shipping') {
      onNavigateTab('orders', { orderId: notif.orderId || notif.orderNumber, search: notif.orderNumber || notif.orderId });
    } else if (cat === 'payments' || (notif as any).paymentId) {
      onNavigateTab('payments', { initialSubTab: 'transactions', search: (notif as any).paymentId || notif.orderId });
    } else if (cat === 'returns' || (notif as any).returnId) {
      onNavigateTab('orders', { initialSubTab: 'returns', search: (notif as any).returnId || notif.orderNumber });
    } else if (cat === 'support' || (notif as any).inquiryId) {
      onNavigateTab('inquiries', { search: (notif as any).inquiryId || notif.recipient });
    } else if (cat === 'reviews' || (notif as any).reviewId) {
      onNavigateTab('reviews');
    } else if (cat === 'inventory' || (notif as any).productId) {
      onNavigateTab('inventory', { search: (notif as any).productId });
    } else if (cat === 'pos' || (notif as any).posInvoiceNumber) {
      onNavigateTab('pos', { initialSubTab: 'history', search: (notif as any).posInvoiceNumber });
    } else {
      onNavigateTab('dashboard');
    }
  };

  // Formatting date/time
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Type badge styling & icon renderer
  const renderTypeIcon = (notif: AppNotification) => {
    const cat = getNotificationCategory(notif);
    switch (cat) {
      case 'orders':
      case 'shipping':
        return <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0"><ShoppingCart size={16} /></div>;
      case 'payments':
        return <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0"><CreditCard size={16} /></div>;
      case 'returns':
        return <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0"><RotateCcw size={16} /></div>;
      case 'support':
        return <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0"><MessageSquare size={16} /></div>;
      case 'reviews':
        return <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600 shrink-0"><Star size={16} /></div>;
      case 'inventory':
        return <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0"><AlertTriangle size={16} /></div>;
      case 'pos':
        return <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0"><Store size={16} /></div>;
      default:
        return <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0"><Bell size={16} /></div>;
    }
  };

  const renderTypeBadge = (notif: AppNotification) => {
    const rawType = (notif.type || 'system').toUpperCase();
    const cat = getNotificationCategory(notif);
    let colorClass = 'bg-slate-100 text-slate-700';

    if (cat === 'orders') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (cat === 'payments') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (cat === 'returns') colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    else if (cat === 'support') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (cat === 'reviews') colorClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    else if (cat === 'inventory') colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (cat === 'pos') colorClass = 'bg-teal-50 text-teal-700 border-teal-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
        {rawType.replace('_', ' ')}
      </span>
    );
  };

  // Telemetry handlers (preserved)
  const handleRetryNotification = async (notifId: string) => {
    setRetryingId(notifId);
    try {
      const res = await fetch('/api/admin/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId, adminEmail: user?.email || 'admin' })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to retry notification.');
      } else {
        alert('Notification retry submitted successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error retrying notification.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleOpenTemplatePreview = async (templateKey: string) => {
    setPreviewTemplateId(templateKey);
    setTemplatePreviewModal(true);
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/notifications/preview-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: templateKey })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      }
    } catch (err) {
      console.warn("Preview load error:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header with Title, Mode Switcher & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="text-slate-800" size={24} />
              Notifications Management
            </h1>
            {counts.unread > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black animate-pulse">
                {counts.unread} unread
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-slate-200">
                {notifications.length} Total
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Live omnichannel store alerts, order events, customer activities, and delivery monitoring.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Mode Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveMainTab('inbox')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMainTab === 'inbox' 
                  ? 'bg-white text-blue-600 shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              <Inbox size={14} />
              <span>Notification Inbox</span>
              {counts.unread > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
            <button
              onClick={() => setActiveMainTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMainTab === 'telemetry' 
                  ? 'bg-white text-blue-600 shadow-xs' 
                  : 'hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Delivery & Health</span>
            </button>
          </div>

          {/* Quick Action: Store Notification Settings Shortcut */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('store-settings', { initialSubTab: 'notifications' })}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hidden sm:inline-flex"
              title="Configure Notification Templates & Gateways"
            >
              <Settings size={14} className="text-slate-500" />
              <span>Settings</span>
            </button>
          )}

          {/* Mark All as Read */}
          {activeMainTab === 'inbox' && counts.unread > 0 && canManage && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INBOX VIEW (Primary Mode) */}
      {/* ========================================================================= */}
      {activeMainTab === 'inbox' && (
        <div className="space-y-4">
          
          {/* Filter Bar & Categories */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            
            {/* Top Row: Search & Status Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by order #, customer, message, or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Segment: All / Unread / Read */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({counts.total})
                </button>
                <button
                  onClick={() => setStatusFilter('unread')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'unread' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Unread</span>
                  {counts.unread > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px]">
                      {counts.unread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setStatusFilter('read')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'read' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Read ({counts.total - counts.unread})
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 border-t border-slate-100">
              {[
                { id: 'all', label: 'All Events', count: counts.total },
                { id: 'orders', label: 'Orders & Shipping', count: counts.orders },
                { id: 'payments', label: 'Payments', count: counts.payments },
                { id: 'returns', label: 'Returns & Refunds', count: counts.returns },
                { id: 'support', label: 'Support & Inquiries', count: counts.support },
                { id: 'reviews', label: 'Reviews', count: counts.reviews },
                { id: 'inventory', label: 'Low Stock', count: counts.inventory },
                { id: 'pos', label: 'POS Sales', count: counts.pos },
                { id: 'system', label: 'System', count: counts.system },
              ].map(cat => {
                const isActive = typeFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setTypeFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {cat.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bulk Actions Toolbar (when items selected) */}
            {selectedIds.length > 0 && canManage && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <CheckSquare size={16} className="text-blue-600" />
                  <span>{selectedIds.length} notification(s) selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkMarkRead(true)}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Check size={13} className="text-emerald-600" /> Mark as Read
                  </button>
                  <button
                    onClick={() => handleBulkMarkRead(false)}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Bell size={13} className="text-blue-600" /> Mark as Unread
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Clear selection"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* List Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* List Header Table Controls */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2.5">
                {canManage && (
                  <button 
                    onClick={handleSelectAllVisible}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Select all visible"
                  >
                    {selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0 ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                )}
                <span>Showing {filteredNotifications.length} notification{filteredNotifications.length === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">Click any alert for full details & action links</span>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Inbox size={28} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchTerm 
                    ? `No alerts matched "${searchTerm}". Try a different search term.` 
                    : statusFilter === 'unread' 
                    ? 'You have caught up with all notifications! No unread alerts.' 
                    : 'No store notifications have been generated for this category yet.'}
                </p>
                {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
                    className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              /* Notification Items List */
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notif) => {
                  const isSelected = selectedIds.includes(notif.id);
                  const isUnread = !notif.read;
                  const cat = getNotificationCategory(notif);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleSelectNotification(notif)}
                      className={`group p-3 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50/90 ${
                        isUnread ? 'bg-blue-50/30' : 'bg-white'
                      } ${selectedNotif?.id === notif.id ? 'ring-2 ring-blue-500/20 bg-blue-50/40' : ''}`}
                    >
                      {/* Selection Checkbox (for staff with manage permissions) */}
                      {canManage && (
                        <div className="pt-0.5 shrink-0" onClick={(e) => handleToggleSelectId(notif.id, e)}>
                          {isSelected ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} className="text-slate-300 hover:text-slate-500" />
                          )}
                        </div>
                      )}

                      {/* Category Icon */}
                      <div className="shrink-0">
                        {renderTypeIcon(notif)}
                      </div>

                      {/* Main Message Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Unread Indicator Dot */}
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread notification" />
                            )}
                            <h4 className={`text-xs sm:text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {notif.title || notif.subject || 'Store Notification'}
                            </h4>
                            {renderTypeBadge(notif)}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                            {formatDateTime(notif.createdAt)}
                          </span>
                        </div>

                        {/* Content text preview */}
                        <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${isUnread ? 'text-slate-800' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>

                        {/* Metadata Pills & Quick Links */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                          {/* Order link */}
                          {(notif.orderNumber || notif.orderId) && (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              <ShoppingCart size={11} /> Order #{notif.orderNumber || notif.orderId?.slice(0, 8)}
                            </span>
                          )}

                          {/* Recipient / Customer */}
                          {notif.recipient && (
                            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                              <Mail size={11} className="text-slate-400" /> {notif.recipient}
                            </span>
                          )}

                          {/* Channel Badge */}
                          {notif.channel && notif.channel !== 'in_app' && (
                            <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md capitalize">
                              {notif.channel}
                            </span>
                          )}

                          {/* Amount if available */}
                          {(notif as any).metadata?.amount && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                              ₹{Number((notif as any).metadata.amount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Action Icons (Hover / Touch) */}
                      <div className="flex items-center gap-1 shrink-0 self-center opacity-80 group-hover:opacity-100">
                        {canManage && (
                          <button
                            onClick={(e) => handleToggleRead(notif, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              notif.read ? 'text-slate-400 hover:text-blue-600 hover:bg-slate-100' : 'text-blue-600 hover:bg-blue-100'
                            }`}
                            title={notif.read ? "Mark as unread" : "Mark as read"}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TELEMETRY & PROVIDER MONITORING VIEW (Secondary Mode) */}
      {/* ========================================================================= */}
      {activeMainTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Provider Health Bar */}
          {providersHealth && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck size={18} className="text-blue-600" /> Channel Gateway Connectivity:
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800">In-App Store:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Active Realtime</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${providersHealth.email?.configured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-semibold text-slate-800">Email:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${providersHealth.email?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {providersHealth.email?.provider || 'SMTP / Resend'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${providersHealth.sms?.configured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-semibold text-slate-800">SMS:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${providersHealth.sms?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {providersHealth.sms?.provider || 'Twilio'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${providersHealth.whatsapp?.configured ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="font-semibold text-slate-800">WhatsApp:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${providersHealth.whatsapp?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {providersHealth.whatsapp?.provider || 'WhatsApp Cloud'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Template Preview Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" /> Customer Email Template Preview Engine
            </h3>
            <p className="text-xs text-slate-500">
              Test render customer transactional email layouts and copy with dynamic mock order data.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { id: 'order_confirmation', label: 'Order Confirmation' },
                { id: 'payment_success', label: 'Payment Captured' },
                { id: 'payment_failure', label: 'Payment Failure Notice' },
                { id: 'order_shipped', label: 'Shipment & Live Tracking' },
                { id: 'order_delivered', label: 'Order Delivered' },
                { id: 'order_cancelled', label: 'Order Cancelled' },
                { id: 'refund_processed', label: 'Refund Credit Confirmation' },
                { id: 'account_security', label: 'Security & Account Notice' }
              ].map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleOpenTemplatePreview(tpl.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={13} className="text-slate-400" />
                  <span>{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTIFICATION DETAIL SLIDE-OVER / MODAL */}
      {/* ========================================================================= */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                {renderTypeIcon(selectedNotif)}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {selectedNotif.title || selectedNotif.subject || 'Notification Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400">ID: {selectedNotif.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Type and Timestamp Bar */}
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Category</span>
                  {renderTypeBadge(selectedNotif)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Timestamp</span>
                  <span className="font-semibold text-slate-700">
                    {selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Message Content</span>
                <div className="p-3.5 bg-slate-50 rounded-xl text-slate-800 leading-relaxed font-medium">
                  {selectedNotif.message}
                </div>
              </div>

              {/* Metadata and Context Grid */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Event Context & Metadata</span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedNotif.recipient && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Recipient</span>
                      <span className="font-semibold text-slate-800 truncate block">{selectedNotif.recipient}</span>
                    </div>
                  )}
                  {selectedNotif.channel && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Delivery Channel</span>
                      <span className="font-semibold text-slate-800 capitalize block">{selectedNotif.channel}</span>
                    </div>
                  )}
                  {(selectedNotif.orderNumber || selectedNotif.orderId) && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Order Reference</span>
                      <span className="font-semibold text-blue-600 truncate block">#{selectedNotif.orderNumber || selectedNotif.orderId}</span>
                    </div>
                  )}
                  {(selectedNotif as any).metadata?.customerName && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Customer Name</span>
                      <span className="font-semibold text-slate-800 truncate block">{(selectedNotif as any).metadata.customerName}</span>
                    </div>
                  )}
                  {(selectedNotif as any).metadata?.amount && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Amount</span>
                      <span className="font-bold text-emerald-600 block">₹{Number((selectedNotif as any).metadata.amount).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(selectedNotif as any).paymentId && (
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Payment ID</span>
                      <span className="font-semibold text-slate-800 truncate block">{(selectedNotif as any).paymentId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Error Details (if delivery failed) */}
              {selectedNotif.status === 'failed' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Delivery Alert</p>
                    <p className="text-[11px] mt-0.5">{selectedNotif.errorMessage || 'Outbound notification gateway rejected dispatch.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {/* Left actions: Toggle Read & Delete */}
              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    onClick={() => handleToggleRead(selectedNotif)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check size={13} className={selectedNotif.read ? 'text-slate-400' : 'text-emerald-600'} />
                    <span>{selectedNotif.read ? 'Mark as Unread' : 'Mark as Read'}</span>
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={() => handleDeleteNotification(selectedNotif.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Right action: Deep Link to related record */}
              <div className="flex items-center gap-2">
                {onNavigateTab && (
                  <button
                    onClick={() => {
                      const notifToNav = selectedNotif;
                      setSelectedNotif(null);
                      handleNavigateToRecord(notifToNav);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>View Related Record</span>
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEMPLATE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {templatePreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" /> Template: {previewData.templateName}
                </h3>
                <p className="text-[11px] text-slate-400">{previewData.description}</p>
              </div>
              <button
                onClick={() => setTemplatePreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-slate-100 rounded-xl space-y-1">
                <p className="text-slate-500 font-semibold">Subject:</p>
                <p className="text-slate-900 font-bold">{previewData.subject}</p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-extrabold text-slate-900 text-sm">ELECTRO STORE</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Official Communication</span>
                </div>
                <p className="text-slate-700">Dear Customer,</p>
                <p className="text-slate-600 leading-relaxed">
                  This is an automated operational notice regarding your recent store transaction and account status.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-[11px]">
                  <p className="font-bold text-slate-800">Summary Details:</p>
                  <pre className="text-slate-600 font-mono text-[10px] whitespace-pre-wrap">
                    {JSON.stringify(previewData.sampleData, null, 2)}
                  </pre>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 text-center">
                  Questions? Contact customer support or visit your account dashboard.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setTemplatePreviewModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
