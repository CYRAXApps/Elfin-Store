import React, { useState, useMemo } from 'react';
import { 
  Search, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Package, 
  DollarSign, 
  Eye, 
  ArrowRight, 
  Check, 
  X, 
  Truck, 
  ShoppingBag, 
  Send, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ReturnRequest, ReturnItem } from '../../../types';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  normalizeReturnStatus, 
  getReturnStatusConfig, 
  getRefundStatusBadge,
  getWhatsAppUrl, 
  getCallUrl, 
  getEmailUrl 
} from './customerUtils';

interface ReturnsManagerProps {
  returns: ReturnRequest[];
  loading: boolean;
  onProcessReturn: (payload: {
    returnId: string;
    status: string;
    disposition?: string;
    adminNotes?: string;
  }) => Promise<void>;
  onExecuteRefund: (payload: {
    orderId: string;
    refundAmount: number;
    reason: string;
    restoreStock: boolean;
    returnId: string;
    refundDestination?: 'original_payment' | 'store_credit';
  }) => Promise<{ success: boolean; razorpayRefundId?: string; error?: string; message?: string }>;
  onViewOrder?: (orderId: string) => void;
  initialSelectedReturnId?: string;
}

export const ReturnsManager: React.FC<ReturnsManagerProps> = ({
  returns,
  loading,
  onProcessReturn,
  onExecuteRefund,
  onViewOrder,
  initialSelectedReturnId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  // Status Action Modal State
  const [actionType, setActionType] = useState<'review' | 'approve' | 'reject' | 'receive' | 'refund' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionDisposition, setActionDisposition] = useState<'restock' | 'damaged' | 'refurbish' | 'discard'>('restock');
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundDestination, setRefundDestination] = useState<'original_payment' | 'store_credit'>('store_credit');
  const [restoreStockInput, setRestoreStockInput] = useState<boolean>(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refundSuccessMessage, setRefundSuccessMessage] = useState<string | null>(null);

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return returns.filter(ret => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNum = (ret.returnNumber || '').toLowerCase().includes(q);
        const matchesInv = (ret.invoiceNumber || '').toLowerCase().includes(q);
        const matchesCust = (ret.customerName || '').toLowerCase().includes(q);
        const matchesEmail = (ret.customerEmail || '').toLowerCase().includes(q);
        const matchesProduct = Array.isArray(ret.items) && ret.items.some(it => (it.productName || '').toLowerCase().includes(q));
        if (!matchesNum && !matchesInv && !matchesCust && !matchesEmail && !matchesProduct) return false;
      }

      if (statusFilter !== 'all') {
        const norm = normalizeReturnStatus(ret.status);
        if (statusFilter === 'active') {
          if (norm === 'refunded' || norm === 'rejected' || norm === 'cancelled') return false;
        } else if (norm !== statusFilter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [returns, searchTerm, statusFilter]);

  // Counts by workflow status
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: returns.length,
      requested: 0,
      under_review: 0,
      approved: 0,
      received: 0,
      refund_processing: 0,
      refunded: 0,
      rejected: 0,
      cancelled: 0
    };
    returns.forEach(r => {
      const norm = normalizeReturnStatus(r.status);
      if (c[norm] !== undefined) c[norm]++;
    });
    return c;
  }, [returns]);

  const openActionModal = (ret: ReturnRequest, type: 'review' | 'approve' | 'reject' | 'receive' | 'refund') => {
    setSelectedReturn(ret);
    setActionType(type);
    setActionNotes(ret.adminNotes || '');
    setActionDisposition(ret.disposition || 'restock');
    setRefundAmountInput(ret.refundAmount || 0);
    setRefundDestination('store_credit');
    setRestoreStockInput(true);
    setActionError(null);
    setRefundSuccessMessage(null);
  };

  const closeActionModal = () => {
    setActionType(null);
    setActionError(null);
    setRefundSuccessMessage(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedReturn || !actionType) return;
    setIsSubmittingAction(true);
    setActionError(null);

    try {
      if (actionType === 'refund') {
        const refundResult = await onExecuteRefund({
          orderId: selectedReturn.orderId,
          refundAmount: Number(refundAmountInput || selectedReturn.refundAmount),
          reason: `Return #${selectedReturn.returnNumber}: ${actionNotes || selectedReturn.overallReason || 'Customer Return'}`,
          restoreStock: restoreStockInput,
          returnId: selectedReturn.id,
          refundDestination
        });

        if (!refundResult.success) {
          setActionError(refundResult.error || 'Refund execution failed. The return status has NOT been updated.');
          setIsSubmittingAction(false);
          return;
        }

        // Successfully refunded
        const destLabel = refundDestination === 'store_credit' 
          ? 'credited to Customer Store Credit wallet!' 
          : `processed via Payment Gateway! Reference: ${refundResult.razorpayRefundId || 'Confirmed'}`;
        setRefundSuccessMessage(`Refund of ₹${Number(refundAmountInput || selectedReturn.refundAmount).toLocaleString('en-IN')} successfully ${destLabel}`);
        // Update local selectedReturn
        setSelectedReturn(prev => prev ? {
          ...prev,
          status: 'completed',
          refundStatus: 'issued',
          razorpayRefundId: refundResult.razorpayRefundId
        } : null);

        setTimeout(() => {
          closeActionModal();
        }, 1800);
      } else {
        // Status transitions
        let nextStatus = 'under_review';
        if (actionType === 'review') nextStatus = 'under_review';
        if (actionType === 'approve') nextStatus = 'approved';
        if (actionType === 'reject') nextStatus = 'rejected';
        if (actionType === 'receive') nextStatus = 'received';

        await onProcessReturn({
          returnId: selectedReturn.id,
          status: nextStatus,
          disposition: actionType === 'receive' ? actionDisposition : undefined,
          adminNotes: actionNotes
        });

        setSelectedReturn(prev => prev ? { ...prev, status: nextStatus as any, adminNotes: actionNotes } : null);
        closeActionModal();
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err?.message || 'Failed to update return request');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 6-Stage Workflow Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { key: 'requested', label: 'Return Requested', count: counts.requested, color: 'text-blue-700', bg: 'bg-blue-50/70', border: 'border-blue-200' },
          { key: 'under_review', label: 'Under Review', count: counts.under_review, color: 'text-amber-700', bg: 'bg-amber-50/70', border: 'border-amber-200' },
          { key: 'approved', label: 'Approved', count: counts.approved, color: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200' },
          { key: 'received', label: 'Item Received', count: counts.received, color: 'text-indigo-700', bg: 'bg-indigo-50/70', border: 'border-indigo-200' },
          { key: 'refund_processing', label: 'Refund Processing', count: counts.refund_processing, color: 'text-purple-700', bg: 'bg-purple-50/70', border: 'border-purple-200' },
          { key: 'refunded', label: 'Refunded', count: counts.refunded, color: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300' },
        ].map((item) => (
          <button
            key={item.key}
            id={`return-stat-card-${item.key}`}
            onClick={() => setStatusFilter(statusFilter === item.key ? 'all' : item.key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === item.key 
                ? `${item.bg} ${item.border} ring-2 ring-blue-500 shadow-sm` 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {item.label}
            </span>
            <p className={`text-2xl font-black mt-1 ${item.color}`}>{item.count}</p>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="return-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search returns by return #, order #, customer, or product..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Needs Attention
            </button>
          </div>
        </div>

        {/* Workflow Status Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter:</span>
          {[
            { id: 'all', label: 'All Returns' },
            { id: 'requested', label: 'Requested' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'received', label: 'Received' },
            { id: 'refund_processing', label: 'Refund Processing' },
            { id: 'refunded', label: 'Refunded' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-return-${tab.id}`}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {(searchTerm || statusFilter !== 'all') && (
            <button
              id="clear-return-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Returns List View */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading return requests...</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
          <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No return requests found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {searchTerm || statusFilter !== 'all'
              ? 'No returns match your active search or status filters.'
              : 'Customer return requests will appear here with simple review and refund actions.'}
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Return #</th>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Product & Qty</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Return Status</th>
                    <th className="py-3.5 px-4">Refund Status</th>
                    <th className="py-3.5 px-4 text-right">Available Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.map((ret) => {
                    const normStatus = normalizeReturnStatus(ret.status);
                    const stConfig = getReturnStatusConfig(ret.status);
                    const rfBadge = getRefundStatusBadge(ret.refundStatus);
                    const firstItem = Array.isArray(ret.items) && ret.items[0];

                    return (
                      <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Return Number */}
                        <td className="py-4 px-4 font-bold text-slate-900">
                          #{ret.returnNumber || ret.id?.slice(0, 8)}
                        </td>

                        {/* Order Number */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => {
                              if (ret.orderId && onViewOrder) onViewOrder(ret.orderId);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                          >
                            #{ret.invoiceNumber || ret.orderId?.slice(0, 8)}
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 text-xs">{ret.customerName || 'Customer'}</p>
                          <p className="text-xs text-slate-500">{ret.customerEmail}</p>
                        </td>

                        {/* Product & Qty */}
                        <td className="py-4 px-4">
                          {firstItem ? (
                            <div className="max-w-xs">
                              <p className="font-semibold text-slate-900 text-xs line-clamp-1">
                                {firstItem.productName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Qty: <span className="font-bold text-slate-700">{firstItem.quantity}</span> · {formatCurrency(firstItem.unitPrice)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">1 Item</span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="py-4 px-4">
                          <span className="text-xs text-slate-700 font-medium line-clamp-1 max-w-[140px]" title={ret.overallReason}>
                            {ret.overallReason || 'Customer return'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {formatDate(ret.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stConfig.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dotColor}`} />
                            {stConfig.label}
                          </span>
                        </td>

                        {/* Refund Status */}
                        <td className="py-4 px-4">
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${rfBadge.badgeClass}`}>
                              {rfBadge.label}
                            </span>
                            <p className="text-xs font-black text-slate-900 mt-0.5">
                              {formatCurrency(ret.refundAmount || 0)}
                            </p>
                          </div>
                        </td>

                        {/* Contextual Actions (Only show actions appropriate to current status) */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* View Detail button always available */}
                            <button
                              id={`view-return-btn-${ret.id}`}
                              onClick={() => setSelectedReturn(ret)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                              title="Inspect full details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Appropriate actions based on current status */}
                            {normStatus === 'requested' && (
                              <>
                                <button
                                  id={`review-return-btn-${ret.id}`}
                                  onClick={() => openActionModal(ret, 'review')}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg transition-colors"
                                >
                                  Review
                                </button>
                                <button
                                  id={`approve-return-btn-${ret.id}`}
                                  onClick={() => openActionModal(ret, 'approve')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  id={`reject-return-btn-${ret.id}`}
                                  onClick={() => openActionModal(ret, 'reject')}
                                  className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {normStatus === 'under_review' && (
                              <>
                                <button
                                  onClick={() => openActionModal(ret, 'approve')}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                                >
                                  Approve Return
                                </button>
                                <button
                                  onClick={() => openActionModal(ret, 'reject')}
                                  className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {normStatus === 'approved' && (
                              <button
                                id={`mark-received-btn-${ret.id}`}
                                onClick={() => openActionModal(ret, 'receive')}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1"
                              >
                                <Package className="w-3.5 h-3.5" />
                                <span>Mark Received</span>
                              </button>
                            )}

                            {(normStatus === 'received' || normStatus === 'refund_processing') && ret.refundStatus !== 'issued' && (
                              <button
                                id={`process-refund-btn-${ret.id}`}
                                onClick={() => openActionModal(ret, 'refund')}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Process Refund</span>
                              </button>
                            )}

                            {normStatus === 'refunded' && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="lg:hidden space-y-3">
            {filteredReturns.map((ret) => {
              const normStatus = normalizeReturnStatus(ret.status);
              const stConfig = getReturnStatusConfig(ret.status);
              const firstItem = Array.isArray(ret.items) && ret.items[0];

              return (
                <div 
                  key={ret.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900">
                        #{ret.returnNumber || ret.id?.slice(0, 8)}
                      </span>
                      <p className="text-xs text-slate-500">Order #{ret.invoiceNumber || ret.orderId?.slice(0, 8)}</p>
                      <p className="text-xs text-slate-700 font-bold mt-0.5">{ret.customerName}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stConfig.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dotColor}`} />
                      {stConfig.label}
                    </span>
                  </div>

                  {firstItem && (
                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs">
                      <p className="font-semibold text-slate-900 line-clamp-1">{firstItem.productName}</p>
                      <div className="flex items-center justify-between text-slate-500 mt-1">
                        <span>Quantity: {firstItem.quantity}</span>
                        <span className="font-black text-slate-900">{formatCurrency(ret.refundAmount)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Reason: <span className="text-slate-800 font-medium">{ret.overallReason}</span>
                      </p>
                    </div>
                  )}

                  {/* Mobile Actions with touch targets >= 44px */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedReturn(ret)}
                      className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Details</span>
                    </button>

                    {normStatus === 'requested' && (
                      <>
                        <button
                          onClick={() => openActionModal(ret, 'approve')}
                          className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => openActionModal(ret, 'reject')}
                          className="min-h-[44px] px-3 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {normStatus === 'approved' && (
                      <button
                        onClick={() => openActionModal(ret, 'receive')}
                        className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Package className="w-4 h-4" />
                        <span>Mark Received</span>
                      </button>
                    )}

                    {(normStatus === 'received' || normStatus === 'refund_processing') && ret.refundStatus !== 'issued' && (
                      <button
                        onClick={() => openActionModal(ret, 'refund')}
                        className="flex-1 min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-xs"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Process Refund</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* RETURN DETAILS MODAL */}
      {selectedReturn && !actionType && (
        <div 
          id="return-detail-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 lg:p-6 animate-in fade-in duration-200"
        >
          <div 
            id="return-detail-modal-card"
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900">
                    Return #{selectedReturn.returnNumber || selectedReturn.id?.slice(0, 8)}
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    getReturnStatusConfig(selectedReturn.status).badgeClass
                  }`}>
                    {getReturnStatusConfig(selectedReturn.status).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Associated Order: #{selectedReturn.invoiceNumber || selectedReturn.orderId?.slice(0, 8)} · Submitted on {formatDateTime(selectedReturn.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedReturn(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Return items */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Items to be returned
                </h3>
                <div className="space-y-2">
                  {selectedReturn.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quantity: <span className="font-bold text-slate-800">{item.quantity}</span> · Unit Price: {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-black text-slate-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">Customer Details</h4>
                  <p><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-800">{selectedReturn.customerName}</span></p>
                  <p><span className="text-slate-500">Email:</span> <span className="font-semibold text-slate-800">{selectedReturn.customerEmail}</span></p>
                  <p><span className="text-slate-500">Phone:</span> <span className="font-semibold text-slate-800">{selectedReturn.customerPhone || '—'}</span></p>
                  {selectedReturn.customerPhone && (
                    <a
                      href={getWhatsAppUrl(selectedReturn.customerPhone, selectedReturn.customerName, `Return Request #${selectedReturn.returnNumber}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:text-emerald-800 mt-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Message on WhatsApp</span>
                    </a>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">Refund Status</h4>
                  <p>
                    <span className="text-slate-500">Status:</span>{' '}
                    <span className="font-bold text-slate-900 capitalize">{selectedReturn.refundStatus || 'Pending'}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Refund Amount:</span>{' '}
                    <span className="font-black text-emerald-700 text-sm">{formatCurrency(selectedReturn.refundAmount)}</span>
                  </p>
                  {selectedReturn.razorpayRefundId && (
                    <p className="font-mono text-slate-600">
                      Gateway Ref: <span className="text-emerald-700 font-bold">{selectedReturn.razorpayRefundId}</span>
                    </p>
                  )}
                  {selectedReturn.overallReason && (
                    <p><span className="text-slate-500">Reason:</span> <span className="font-semibold text-slate-800">{selectedReturn.overallReason}</span></p>
                  )}
                </div>
              </div>

              {/* Customer Comments */}
              {selectedReturn.comments && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">Customer Comments</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedReturn.comments}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedReturn.adminNotes && (
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                  <h4 className="font-bold text-amber-900 uppercase tracking-wider">Admin Processing Notes</h4>
                  <p className="text-amber-950 whitespace-pre-wrap">{selectedReturn.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Footer with contextual actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {normalizeReturnStatus(selectedReturn.status) === 'requested' && (
                  <>
                    <button
                      onClick={() => openActionModal(selectedReturn, 'approve')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Approve Return
                    </button>
                    <button
                      onClick={() => openActionModal(selectedReturn, 'reject')}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl"
                    >
                      Reject Return
                    </button>
                  </>
                )}

                {normalizeReturnStatus(selectedReturn.status) === 'approved' && (
                  <button
                    onClick={() => openActionModal(selectedReturn, 'receive')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Mark Item Received
                  </button>
                )}

                {(normalizeReturnStatus(selectedReturn.status) === 'received' || normalizeReturnStatus(selectedReturn.status) === 'refund_processing') && selectedReturn.refundStatus !== 'issued' && (
                  <button
                    onClick={() => openActionModal(selectedReturn, 'refund')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Process Razorpay Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTION & REFUND MODAL */}
      {selectedReturn && actionType && (
        <div 
          id="return-action-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Action Title */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'review' && 'Review Return Request'}
                {actionType === 'approve' && 'Approve Return Request'}
                {actionType === 'reject' && 'Reject Return Request'}
                {actionType === 'receive' && 'Mark Item as Received'}
                {actionType === 'refund' && 'Process Customer Refund'}
              </h3>
              <button onClick={closeActionModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {refundSuccessMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{refundSuccessMessage}</span>
                </div>
              )}

              {/* Context Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><span className="text-slate-500">Return:</span> <span className="font-bold text-slate-900">#{selectedReturn.returnNumber || selectedReturn.id?.slice(0, 8)}</span></p>
                <p><span className="text-slate-500">Customer:</span> <span className="font-semibold text-slate-800">{selectedReturn.customerName} ({selectedReturn.customerEmail})</span></p>
                <p><span className="text-slate-500">Order:</span> <span className="font-semibold text-slate-800">#{selectedReturn.invoiceNumber || selectedReturn.orderId}</span></p>
              </div>

              {/* Action-specific fields */}
              {actionType === 'receive' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Warehouse Inspection Disposition
                  </label>
                  <select
                    value={actionDisposition}
                    onChange={(e: any) => setActionDisposition(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                  >
                    <option value="restock">Restock to Inventory (Item in mint/original condition)</option>
                    <option value="damaged">Damaged in Transit / Unsellable</option>
                    <option value="refurbish">Refurbish / Open-Box Discount</option>
                    <option value="discard">Discard / Scrap</option>
                  </select>
                </div>
              )}

              {actionType === 'refund' && (
                <div className="space-y-4">
                  {/* Destination Options */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Refund Destination
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label 
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          refundDestination === 'store_credit' 
                            ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="refundDestination"
                          value="store_credit"
                          checked={refundDestination === 'store_credit'}
                          onChange={() => setRefundDestination('store_credit')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>Store Credit Wallet</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Instant</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                            Credits customer's store balance immediately. No gateway fees or bank delays.
                          </p>
                        </div>
                      </label>

                      <label 
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          refundDestination === 'original_payment' 
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="refundDestination"
                          value="original_payment"
                          checked={refundDestination === 'original_payment'}
                          onChange={() => setRefundDestination('original_payment')}
                          className="mt-0.5 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>Original Source</span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">Razorpay</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                            Initiates refund via Razorpay to customer's original card / UPI source.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmountInput}
                      onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Calculated return amount: {formatCurrency(selectedReturn.refundAmount)}
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={restoreStockInput}
                      onChange={(e) => setRestoreStockInput(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Restore returned product quantity back into inventory stock</span>
                  </label>
                </div>
              )}

              {/* Admin Note textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {actionType === 'reject' ? 'Reason for Rejection (Required)' : 'Admin Notes'}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === 'reject' 
                      ? 'Enter reason for rejection...' 
                      : 'Enter internal notes (optional)...'
                  }
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                disabled={isSubmittingAction}
                onClick={closeActionModal}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              <button
                id="confirm-return-action-btn"
                disabled={isSubmittingAction || (actionType === 'reject' && !actionNotes.trim())}
                onClick={handleExecuteAction}
                className={`px-5 py-2 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                  actionType === 'receive' ? 'bg-indigo-600 hover:bg-indigo-700' :
                  actionType === 'refund' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {isSubmittingAction ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {actionType === 'review' && 'Set Under Review'}
                      {actionType === 'approve' && 'Confirm Approval'}
                      {actionType === 'reject' && 'Confirm Rejection'}
                      {actionType === 'receive' && 'Confirm Received'}
                      {actionType === 'refund' && 'Execute Gateway Refund'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
