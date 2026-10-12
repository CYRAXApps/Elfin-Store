import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Search, 
  RefreshCw, 
  Eye, 
  UserX, 
  UserCheck, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Users,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface Subscriber {
  id: string;
  email: string;
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED';
  subscribedAt: string;
  updatedAt: string;
}

export function AdminSubscribers() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBSCRIBED' | 'UNSUBSCRIBED'>('ALL');
  
  // Modals & action states
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [deleteConfirmSubscriber, setDeleteConfirmSubscriber] = useState<Subscriber | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSubscribers = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setLoading(true);

    try {
      const headers: Record<string, string> = {};
      if (user?.email) {
        headers['x-admin-email'] = user.email;
      }
      
      const res = await fetch('/api/admin/newsletter/subscribers', { headers });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      } else {
        throw new Error(data?.error || 'Failed to fetch subscribers');
      }
    } catch (err: any) {
      console.error('Error fetching subscribers:', err);
      setFeedbackNotice({
        type: 'error',
        text: err?.message || 'Could not load newsletter subscribers.'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackNotice({ type, text });
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 4000);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleToggleStatus = async (sub: Subscriber) => {
    const newStatus = sub.status === 'SUBSCRIBED' ? 'UNSUBSCRIBED' : 'SUBSCRIBED';
    setActionLoadingId(sub.id);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (user?.email) {
        headers['x-admin-email'] = user.email;
      }

      const res = await fetch(`/api/admin/newsletter/subscribers/${sub.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update subscriber status');
      }

      setSubscribers(prev =>
        prev.map(s => (s.id === sub.id ? { ...s, status: newStatus, updatedAt: data.updatedAt || new Date().toISOString() } : s))
      );

      if (selectedSubscriber?.id === sub.id) {
        setSelectedSubscriber(prev => prev ? { ...prev, status: newStatus, updatedAt: data.updatedAt || new Date().toISOString() } : null);
      }

      showFeedback('success', `Subscriber marked as ${newStatus === 'SUBSCRIBED' ? 'Subscribed' : 'Unsubscribed'}.`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to update subscriber status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteSubscriber = async () => {
    if (!deleteConfirmSubscriber) return;
    const sub = deleteConfirmSubscriber;
    setActionLoadingId(sub.id);

    try {
      const headers: Record<string, string> = {};
      if (user?.email) {
        headers['x-admin-email'] = user.email;
      }

      const res = await fetch(`/api/admin/newsletter/subscribers/${sub.id}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete subscriber');
      }

      setSubscribers(prev => prev.filter(s => s.id !== sub.id));
      if (selectedSubscriber?.id === sub.id) {
        setSelectedSubscriber(null);
      }
      setDeleteConfirmSubscriber(null);
      showFeedback('success', `Subscriber ${sub.email} has been deleted.`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to delete subscriber.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      const matchesSearch = !searchQuery.trim() || sub.email.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchQuery, statusFilter]);

  // Metric counts
  const totalCount = subscribers.length;
  const subscribedCount = subscribers.filter(s => s.status === 'SUBSCRIBED').length;
  const unsubscribedCount = subscribers.filter(s => s.status === 'UNSUBSCRIBED').length;

  return (
    <div className="space-y-6" id="admin-newsletter-subscribers">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Subscribers</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active (Subscribed)</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{subscribedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unsubscribed</p>
              <h3 className="text-2xl font-black text-slate-600 mt-1">{unsubscribedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {feedbackNotice && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in ${
          feedbackNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{feedbackNotice.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackNotice(null)} 
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Directory Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Newsletter Subscribers</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live directory of customers subscribed to store deal announcements and updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-subscribers-btn"
              type="button"
              onClick={() => fetchSubscribers(true)}
              disabled={isRefreshing || loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh subscriber list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Status Filters */}
        <div className="p-4 sm:p-5 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search by email */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-subscriber-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills: All | Subscribed | Unsubscribed */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              id="filter-status-all"
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({totalCount})
            </button>

            <button
              id="filter-status-subscribed"
              type="button"
              onClick={() => setStatusFilter('SUBSCRIBED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === 'SUBSCRIBED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Subscribed ({subscribedCount})
            </button>

            <button
              id="filter-status-unsubscribed"
              type="button"
              onClick={() => setStatusFilter('UNSUBSCRIBED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === 'UNSUBSCRIBED'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Unsubscribed ({unsubscribedCount})
            </button>
          </div>
        </div>

        {/* Content Table & Cards */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading subscriber directory...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center border-dashed border-slate-200">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No subscribers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No newsletter subscribers match your search query or filter.'
                : 'Customer newsletter subscriptions from the storefront footer will appear here.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Email</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Subscribed Date</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubscribers.map((sub) => {
                  const isSubscribed = sub.status === 'SUBSCRIBED';
                  const isOperating = actionLoadingId === sub.id;

                  return (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedSubscriber(sub)}
                    >
                      {/* Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block select-all">
                              {sub.email}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEmail(sub.email);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            title="Copy email"
                          >
                            {copiedEmail === sub.email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isSubscribed 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSubscribed ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>

                      {/* Subscribed Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(sub.subscribedAt)}</span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(sub.updatedAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            id={`view-subscriber-btn-${sub.id}`}
                            type="button"
                            onClick={() => setSelectedSubscriber(sub)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="View subscriber details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* Unsubscribe / Resubscribe */}
                          <button
                            id={`toggle-subscriber-status-${sub.id}`}
                            type="button"
                            disabled={isOperating}
                            onClick={() => handleToggleStatus(sub)}
                            className={`px-2.5 py-1.5 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                              isSubscribed
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={isSubscribed ? 'Unsubscribe customer' : 'Mark as Subscribed'}
                          >
                            {isSubscribed ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Unsubscribe</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Subscribe</span>
                              </>
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            id={`delete-subscriber-btn-${sub.id}`}
                            type="button"
                            disabled={isOperating}
                            onClick={() => setDeleteConfirmSubscriber(sub)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete subscriber record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. SUBSCRIBER DETAILS MODAL */}
      {selectedSubscriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Subscriber Details</h3>
                  <p className="text-xs text-slate-400">Newsletter audience record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubscriber(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Email */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 select-all">{selectedSubscriber.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyEmail(selectedSubscriber.email)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedEmail === selectedSubscriber.email ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subscription Status</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedSubscriber.status === 'SUBSCRIBED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedSubscriber.status === 'SUBSCRIBED' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {selectedSubscriber.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedSubscriber)}
                  disabled={actionLoadingId === selectedSubscriber.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedSubscriber.status === 'SUBSCRIBED'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {selectedSubscriber.status === 'SUBSCRIBED' ? 'Unsubscribe' : 'Mark Subscribed'}
                </button>
              </div>

              {/* Subscribed Date */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subscribed Date</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(selectedSubscriber.subscribedAt)}</span>
                </div>
              </div>

              {/* Updated Date */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(selectedSubscriber.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmSubscriber(selectedSubscriber);
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Subscriber</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSubscriber(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DELETE CONFIRMATION MODAL */}
      {deleteConfirmSubscriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Subscriber?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete <strong className="text-slate-800">{deleteConfirmSubscriber.email}</strong> from the newsletter database?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={actionLoadingId === deleteConfirmSubscriber.id}
                onClick={() => setDeleteConfirmSubscriber(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoadingId === deleteConfirmSubscriber.id}
                onClick={handleDeleteSubscriber}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoadingId === deleteConfirmSubscriber.id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSubscribers;
