import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Search, Filter, Calendar, ArrowUpDown, Clock, 
  CheckCircle2, AlertCircle, RefreshCw, X, Mail, Phone, 
  MessageCircle, Trash2, User, Send, ChevronRight, Copy, 
  Check, RotateCcw, AlertTriangle, Eye, ShoppingBag, ExternalLink,
  Loader2, ShieldAlert, FileText, CornerDownRight, Tag
} from 'lucide-react';
import { db } from '../../firebase';
import { 
  collection, onSnapshot, doc, updateDoc, deleteDoc, 
  serverTimestamp, arrayUnion, getDoc
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { Order } from '../../types';

export type UnifiedSupportStatus = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export interface UnifiedMessage {
  id: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'staff';
  message: string;
  createdAt: string;
  isInternal?: boolean;
}

export interface UnifiedInternalNote {
  id: string;
  note: string;
  author: string;
  createdAt: string;
}

export interface UnifiedSupportItem {
  id: string;
  source: 'inquiry' | 'ticket';
  requestId: string;
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  subject: string;
  type: string;
  status: UnifiedSupportStatus;
  date: string;
  lastUpdated: string;
  message: string;
  relatedOrderId?: string;
  relatedProductId?: string;
  conversation: UnifiedMessage[];
  internalNotes: UnifiedInternalNote[];
}

interface AdminInquiriesProps {
  initialStatusFilter?: string;
  onNavigateTab?: (tab: string, params?: any) => void;
  forcedStoreId?: string;
}

export function AdminInquiries({ initialStatusFilter = 'all', onNavigateTab, forcedStoreId }: AdminInquiriesProps) {
  const { user } = useAuth();
  
  // Raw items from both collections
  const [rawInquiries, setRawInquiries] = useState<any[]>([]);
  const [rawTickets, setRawTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated'>('newest');

  // Selected item detail view
  const [selectedItem, setSelectedItem] = useState<UnifiedSupportItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Inspect related order in OrderDetailsModal
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Sync initialStatusFilter prop
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // 1. Subscribe to 'inquiries' collection
  useEffect(() => {
    const unsubInquiries = onSnapshot(
      collection(db, 'inquiries'),
      (snapshot) => {
        const items = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setRawInquiries(items);
        setLoading(false);
      },
      (err) => {
        console.warn('Inquiries listener error:', err);
        setLoading(false);
      }
    );
    return () => unsubInquiries();
  }, []);

  // 2. Subscribe to 'support_tickets' collection
  useEffect(() => {
    const unsubTickets = onSnapshot(
      collection(db, 'support_tickets'),
      (snapshot) => {
        const items = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setRawTickets(items);
        setLoading(false);
      },
      (err) => {
        console.warn('Support tickets listener error:', err);
        setLoading(false);
      }
    );
    return () => unsubTickets();
  }, []);

  // Normalize status helper
  const normalizeStatus = (rawStatus: any): UnifiedSupportStatus => {
    const s = String(rawStatus || '').toLowerCase().trim();
    if (s === 'new' || s === 'open' || s === 'created') return 'new';
    if (s === 'in_progress' || s === 'investigating') return 'in_progress';
    if (s === 'waiting_customer' || s === 'pending' || s === 'waiting') return 'waiting_customer';
    if (s === 'resolved' || s === 'completed') return 'resolved';
    if (s === 'closed') return 'closed';
    return 'new';
  };

  // Merge and normalize all support records into one single list
  const unifiedItems: UnifiedSupportItem[] = useMemo(() => {
    const list: UnifiedSupportItem[] = [];

    // Map inquiries
    rawInquiries.forEach((inq) => {
      const msgs: UnifiedMessage[] = [];
      if (Array.isArray(inq.replies)) {
        inq.replies.forEach((r: any, idx: number) => {
          msgs.push({
            id: r.id || `reply-${idx}`,
            senderName: r.senderName || 'Staff',
            senderRole: r.senderRole || 'staff',
            message: r.message || '',
            createdAt: r.createdAt || inq.createdAt || ''
          });
        });
      }

      list.push({
        id: inq.id,
        source: 'inquiry',
        requestId: inq.inquiryId || `INQ-${inq.id.slice(0, 6).toUpperCase()}`,
        customerName: inq.name || 'Anonymous Customer',
        customerEmail: inq.email || '',
        customerMobile: inq.phone || '',
        subject: inq.subject || 'Website Inquiry',
        type: 'General Inquiry',
        status: normalizeStatus(inq.status),
        date: inq.createdAt || new Date().toISOString(),
        lastUpdated: inq.updatedAt || inq.createdAt || new Date().toISOString(),
        message: inq.message || '',
        relatedOrderId: inq.orderId || inq.relatedOrderId,
        relatedProductId: inq.productId || inq.relatedProductId,
        conversation: msgs,
        internalNotes: Array.isArray(inq.internalNotes) ? inq.internalNotes : []
      });
    });

    // Map support tickets
    rawTickets.forEach((tk) => {
      const msgs: UnifiedMessage[] = [];
      const notes: UnifiedInternalNote[] = [];

      if (Array.isArray(tk.messages)) {
        tk.messages.forEach((m: any, idx: number) => {
          if (m.isInternal) {
            notes.push({
              id: m.id || `note-${idx}`,
              note: m.message || '',
              author: m.senderName || 'Staff',
              createdAt: m.createdAt || tk.createdAt || ''
            });
          } else {
            msgs.push({
              id: m.id || `msg-${idx}`,
              senderName: m.senderName || (m.senderRole === 'customer' ? (tk.customerName || 'Customer') : 'Staff'),
              senderRole: m.senderRole || 'customer',
              message: m.message || '',
              createdAt: m.createdAt || tk.createdAt || ''
            });
          }
        });
      }

      // If internalNotes array exists on ticket doc as well
      if (Array.isArray(tk.internalNotes)) {
        tk.internalNotes.forEach((n: any) => notes.push(n));
      }

      const reqNum = tk.ticketNumber ? `TICK-${tk.ticketNumber}` : `TICK-${tk.id.slice(0, 6).toUpperCase()}`;

      list.push({
        id: tk.id,
        source: 'ticket',
        requestId: reqNum,
        customerName: tk.customerName || tk.userName || 'Customer',
        customerEmail: tk.customerEmail || tk.userEmail || '',
        customerMobile: tk.customerPhone || tk.phone || '',
        subject: tk.subject || 'Support Ticket',
        type: tk.category ? `${tk.category.replace('_', ' ')}` : 'Support Ticket',
        status: normalizeStatus(tk.status),
        date: tk.createdAt || new Date().toISOString(),
        lastUpdated: tk.updatedAt || tk.createdAt || new Date().toISOString(),
        message: tk.description || tk.message || '',
        relatedOrderId: tk.orderId || tk.relatedOrderId,
        relatedProductId: tk.productId || tk.relatedProductId,
        conversation: msgs,
        internalNotes: notes
      });
    });

    return list;
  }, [rawInquiries, rawTickets]);

  // Keep selected item live when data updates
  useEffect(() => {
    if (selectedItem) {
      const refreshed = unifiedItems.find(i => i.id === selectedItem.id && i.source === selectedItem.source);
      if (refreshed) {
        setSelectedItem(refreshed);
      }
    }
  }, [unifiedItems]);

  // Status counts for badge tabs
  const statusCounts = useMemo(() => {
    const counts = {
      all: unifiedItems.length,
      new: 0,
      in_progress: 0,
      waiting_customer: 0,
      resolved: 0,
      closed: 0,
    };
    unifiedItems.forEach((item) => {
      if (counts[item.status] !== undefined) {
        counts[item.status]++;
      }
    });
    return counts;
  }, [unifiedItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Search query: Request ID, Customer, Mobile, Subject
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = item.requestId.toLowerCase().includes(q);
        const matchesName = item.customerName.toLowerCase().includes(q);
        const matchesEmail = item.customerEmail.toLowerCase().includes(q);
        const matchesPhone = (item.customerMobile || '').toLowerCase().includes(q);
        const matchesSubject = item.subject.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesEmail && !matchesPhone && !matchesSubject) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'updated') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
      return 0;
    });
  }, [unifiedItems, statusFilter, searchQuery, sortBy]);

  // Status badge helper
  const getStatusBadge = (status: UnifiedSupportStatus) => {
    switch (status) {
      case 'new':
        return { label: 'New', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'in_progress':
        return { label: 'In Progress', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      case 'waiting_customer':
        return { label: 'Waiting for Customer', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      case 'resolved':
        return { label: 'Resolved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'closed':
        return { label: 'Closed', bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '—';
    }
  };

  // Change status handler
  const handleUpdateStatus = async (item: UnifiedSupportItem, newStatus: UnifiedSupportStatus) => {
    setUpdatingStatus(true);
    try {
      const nowIso = new Date().toISOString();
      const collectionName = item.source === 'inquiry' ? 'inquiries' : 'support_tickets';
      await updateDoc(doc(db, collectionName, item.id), {
        status: newStatus,
        updatedAt: nowIso
      });

      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(prev => prev ? { ...prev, status: newStatus, lastUpdated: nowIso } : null);
      }
      flashNotification(`Status updated to "${getStatusBadge(newStatus).label}"`);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Could not update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Send Reply handler
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const nowIso = new Date().toISOString();
      const senderDisplayName = user?.displayName || user?.email || 'Store Support Staff';

      if (selectedItem.source === 'ticket') {
        // Post to /api/support/tickets/:id/messages
        const res = await fetch(`/api/support/tickets/${selectedItem.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: 'admin',
            senderName: senderDisplayName,
            senderRole: 'admin',
            message: replyText.trim(),
            isInternal: false
          })
        });
        if (!res.ok) throw new Error('Failed to send reply to ticket');
      } else {
        // Inquiries document reply
        const replyObj: UnifiedMessage = {
          id: `rep-${Date.now()}`,
          senderName: senderDisplayName,
          senderRole: 'admin',
          message: replyText.trim(),
          createdAt: nowIso
        };
        await updateDoc(doc(db, 'inquiries', selectedItem.id), {
          replies: arrayUnion(replyObj),
          status: 'waiting_customer',
          updatedAt: nowIso
        });
      }

      setReplyText('');
      flashNotification('Reply sent successfully.');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      setError(err?.message || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Add Internal Note handler
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newNoteText.trim()) return;

    setAddingNote(true);
    try {
      const nowIso = new Date().toISOString();
      const noteItem: UnifiedInternalNote = {
        id: `note-${Date.now()}`,
        note: newNoteText.trim(),
        author: user?.displayName || user?.email || 'Admin Staff',
        createdAt: nowIso
      };

      if (selectedItem.source === 'ticket') {
        await fetch(`/api/support/tickets/${selectedItem.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: 'admin',
            senderName: noteItem.author,
            senderRole: 'admin',
            message: noteItem.note,
            isInternal: true
          })
        });
      } else {
        await updateDoc(doc(db, 'inquiries', selectedItem.id), {
          internalNotes: arrayUnion(noteItem),
          updatedAt: nowIso
        });
      }

      setNewNoteText('');
      flashNotification('Internal note saved.');
    } catch (err: any) {
      console.error('Failed to add internal note:', err);
      setError('Could not add note.');
    } finally {
      setAddingNote(false);
    }
  };

  // Open related order in modal
  const handleOpenRelatedOrder = async (orderId: string) => {
    setLoadingOrder(true);
    try {
      const cleanId = orderId.replace('#', '').trim();
      const snap = await getDoc(doc(db, 'orders', cleanId));
      if (snap.exists()) {
        setInspectingOrder({ id: snap.id, ...snap.data() } as Order);
      } else {
        flashNotification(`Order #${cleanId} not found in database.`);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoadingOrder(false);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const flashNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              Support & Inquiries
            </h1>
            <p className="text-xs text-slate-500">
              Centralized customer support tickets and storefront inquiries
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            setTimeout(() => setRefreshing(false), 500);
          }}
          disabled={refreshing}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* Main Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Status Filter Tabs: All | New | In Progress | Waiting for Customer | Resolved | Closed */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100">
          {[
            { id: 'all', label: 'All', count: statusCounts.all },
            { id: 'new', label: 'New', count: statusCounts.new },
            { id: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
            { id: 'waiting_customer', label: 'Waiting for Customer', count: statusCounts.waiting_customer },
            { id: 'resolved', label: 'Resolved', count: statusCounts.resolved },
            { id: 'closed', label: 'Closed', count: statusCounts.closed },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-blue-500/80 text-white' : 'bg-slate-200/70 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="support-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Request ID, customer name, mobile, or subject..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort:</span>
            <select
              id="support-sort-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="updated">Recently Updated</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Support List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <span>Loading support requests & inquiries...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Support Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filter to see more requests.'
                : 'Customer inquiries from storefront forms and support tickets will automatically appear here.'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table: Request ID | Customer | Subject | Type | Status | Date | Last Updated | Action */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.map((item) => {
                    const statusConfig = getStatusBadge(item.status);
                    return (
                      <tr
                        key={`${item.source}-${item.id}`}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Request ID */}
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                          <span className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {item.requestId}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 truncate">
                            {item.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                            <span>{item.customerEmail || 'No email'}</span>
                            {item.customerMobile && (
                              <>
                                <span>•</span>
                                <span>{item.customerMobile}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-4 max-w-[220px]">
                          <p className="font-medium text-slate-800 line-clamp-1" title={item.subject}>
                            {item.subject}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="capitalize text-slate-600 font-medium">
                            {item.type}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item, e.target.value as UnifiedSupportStatus)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-hidden ${statusConfig.bg}`}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_customer">Waiting for Customer</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>

                        {/* Last Updated */}
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {formatDateTime(item.lastUpdated)}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`view-request-btn-${item.id}`}
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (screens < lg) */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const statusConfig = getStatusBadge(item.status);
                return (
                  <div
                    key={`mob-${item.source}-${item.id}`}
                    className="p-4 hover:bg-slate-50 transition-colors space-y-2.5 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {item.requestId}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {item.subject}
                        </h4>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.bg}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.customerName}</span>
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* SUPPORT DETAILS MODAL */}
      {selectedItem && (
        <div 
          id="support-details-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 lg:p-6 animate-in fade-in duration-200"
        >
          <div 
            id="support-details-modal-card"
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {selectedItem.requestId}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {selectedItem.type}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Status selector */}
                <select
                  id="detail-status-select"
                  value={selectedItem.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleUpdateStatus(selectedItem, e.target.value as UnifiedSupportStatus)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer focus:outline-hidden ${getStatusBadge(selectedItem.status).bg}`}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting for Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Customer Info Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedItem.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedItem.customerName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedItem.customerEmail || 'No email provided'}
                      {selectedItem.customerMobile && ` • ${selectedItem.customerMobile}`}
                    </p>
                  </div>
                </div>

                {/* Quick Contact Links */}
                <div className="flex items-center gap-1.5">
                  {selectedItem.customerMobile && (
                    <>
                      <a
                        href={`https://wa.me/${selectedItem.customerMobile.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selectedItem.customerName}, regarding request ${selectedItem.requestId}: `)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${selectedItem.customerMobile}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </>
                  )}
                  {selectedItem.customerEmail && (
                    <a
                      href={`mailto:${selectedItem.customerEmail}?subject=${encodeURIComponent(`Re: ${selectedItem.subject} (${selectedItem.requestId})`)}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Subject & Related Order / Product */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedItem.subject}
                </h2>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span>Created: {formatDateTime(selectedItem.date)}</span>
                  <span>•</span>
                  <span>Updated: {formatDateTime(selectedItem.lastUpdated)}</span>
                  
                  {selectedItem.relatedOrderId && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => handleOpenRelatedOrder(selectedItem.relatedOrderId!)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Related Order #{selectedItem.relatedOrderId.slice(0, 8)}</span>
                      </button>
                    </>
                  )}

                  {selectedItem.relatedProductId && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <Tag className="w-3 h-3" />
                        <span>Product ID: {selectedItem.relatedProductId.slice(0, 8)}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Original Message */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Initial Customer Message
                </span>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedItem.message || 'No description provided.'}
                </p>
              </div>

              {/* Conversation / History Messages */}
              {(selectedItem.conversation || []).length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Conversation & Staff Replies ({(selectedItem.conversation || []).length})
                  </h4>
                  <div className="space-y-2">
                    {(selectedItem.conversation || []).map((msg) => {
                      const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'staff';
                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm space-y-1 ${
                            isStaff 
                              ? 'bg-blue-50/70 border-blue-200 ml-4' 
                              : 'bg-slate-50 border-slate-200 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-bold ${isStaff ? 'text-blue-800' : 'text-slate-800'}`}>
                              {msg.senderName} {isStaff && '(Staff)'}
                            </span>
                            <span className="text-slate-400">
                              {formatDateTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-800 whitespace-pre-line">
                            {msg.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reply to Customer
                </label>
                <textarea
                  id="support-reply-textarea"
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the customer..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-y"
                />
                <div className="flex justify-end">
                  <button
                    id="submit-support-reply-btn"
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {sendingReply ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Reply...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Internal Notes Section */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Internal Staff Notes ({(selectedItem.internalNotes || []).length})</span>
                  </h4>
                  <span className="text-[11px] text-amber-700 font-medium">Visible only to store staff</span>
                </div>

                {(selectedItem.internalNotes || []).length > 0 && (
                  <div className="space-y-2">
                    {(selectedItem.internalNotes || []).map((note) => (
                      <div key={note.id} className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-700">{note.author}</span>
                          <span>{formatDateTime(note.createdAt)}</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-line">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddInternalNote} className="space-y-2">
                  <textarea
                    id="internal-note-textarea"
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add an internal note about this request..."
                    className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      id="submit-internal-note-btn"
                      type="submit"
                      disabled={addingNote || !newNoteText.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {addingNote ? 'Saving Note...' : 'Add Internal Note'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Related Order Modal */}
      {inspectingOrder && (
        <OrderDetailsModal
          order={inspectingOrder}
          onClose={() => setInspectingOrder(null)}
          onViewInvoice={() => {}}
        />
      )}
    </div>
  );
}
