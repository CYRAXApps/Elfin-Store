import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { 
  DollarSign, 
  RefreshCw, 
  Search, 
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Check,
  X,
  Package,
  Eye,
  ChevronRight,
  Ban,
  ShieldAlert,
  Clock,
  ArrowRight,
  FileText,
  Receipt
} from 'lucide-react';
import { ReturnRequest, CreditNote } from '../../types';
import { useAuth, isAdminEmail } from '../../context/AuthContext';
import { CreditNoteModal } from '../../components/admin/invoices/CreditNoteModal';
import { CreateCreditNoteModal } from '../../components/admin/invoices/CreateCreditNoteModal';

export function AdminReturnsManager() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Listen to all return requests in real time without strict order index requirement
    const q = query(collection(db, 'return_requests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ReturnRequest));
      // Safe chronological sort in memory
      data.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setReturns(data);
      setLoading(false);
      
      // Update selected return if open
      setSelectedReturn(prev => {
        if (!prev) return null;
        return data.find(r => r.id === prev.id) || null;
      });
    }, (error) => {
      console.error("Error fetching returns:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredReturns = useMemo(() => {
    return returns.filter(ret => {
      // 1. Status Filter
      if (statusFilter !== 'all' && ret.status !== statusFilter) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (ret.id || '').toLowerCase().includes(q);
        const matchNum = (ret.returnNumber || '').toLowerCase().includes(q);
        const matchOrder = (ret.orderId || '').toLowerCase().includes(q) || (ret.invoiceNumber || '').toLowerCase().includes(q);
        const matchCust = (ret.customerName || '').toLowerCase().includes(q) || (ret.customerEmail || '').toLowerCase().includes(q);
        return matchId || matchNum || matchOrder || matchCust;
      }

      return true;
    });
  }, [returns, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'under_review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pickup_scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'received': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'inspection':
      case 'inspected': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approve_refund':
      case 'refund_processing': return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
      case 'refunded': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'approved_replacement':
      case 'shipped':
      case 'delivered':
      case 'replaced': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'cancelled': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'closed':
      case 'completed': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleUpdateStatus = async (
    returnId: string, 
    newStatus: string, 
    orderId?: string, 
    refundAmount?: number, 
    additionalData?: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Verify admin authorization
      const isAdmin = user && (user.role === 'admin' || isAdminEmail(user?.email));
      if (!isAdmin) {
        throw new Error('PERMISSION_DENIED: Administrator privileges are required to update return status.');
      }

      // 2. Verify target return request document exists
      const returnDocRef = doc(db, 'return_requests', returnId);
      const returnSnap = await getDoc(returnDocRef);
      if (!returnSnap.exists()) {
        throw new Error(`NOT_FOUND: Return request with ID ${returnId} does not exist in the database.`);
      }

      const currentData = returnSnap.data() as ReturnRequest;

      // 3. Initiate payment gateway or store credit refund if transition is 'refunded'
      let refundResData: any = null;
      if (newStatus === 'refunded' && orderId && refundAmount && refundAmount > 0) {
        const res = await fetch('/api/admin/payments/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount: refundAmount,
            reason: additionalData?.reason || `Return #${returnId} inspected and refund approved`,
            adminEmail: user?.email || 'admin',
            returnId,
            restoreStock: true,
            refundDestination: additionalData?.refundDestination || 'original_payment'
          })
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Refund payment processing failed');
        }
        refundResData = result;
      }

      // 4. Build Firestore update object
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.displayName || user?.email || user?.uid || 'Admin'
      };

      if (newStatus === 'refunded') {
        updateData.refundStatus = 'completed';
        updateData.refundDestination = additionalData?.refundDestination || 'original_payment';
        updateData.refundDetails = {
          refundId: refundResData?.razorpayRefundId || `rfnd_${Date.now()}`,
          amount: refundAmount,
          status: 'processed',
          processedAt: new Date().toISOString()
        };
      }

      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      // 5. Construct status timeline message
      let timelineMsg = `Status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`;
      if (newStatus === 'approved') timelineMsg = 'Return request approved by operations team';
      else if (newStatus === 'pickup_scheduled') timelineMsg = `Doorstep pickup scheduled for ${additionalData?.pickupDetails?.date || 'scheduled date'} (${additionalData?.pickupDetails?.timeWindow || ''})`;
      else if (newStatus === 'picked_up') timelineMsg = 'Product picked up by logistics courier';
      else if (newStatus === 'received') timelineMsg = 'Product safely received at return fulfillment center';
      else if (newStatus === 'inspection') timelineMsg = 'Product inspection started by quality assurance team';
      else if (newStatus === 'inspected' || newStatus === 'approve_refund' || newStatus === 'approved_replacement') timelineMsg = `Product inspection completed. Condition: ${additionalData?.inspectionDetails?.productCondition || 'Good'}. Result: Approved.`;
      else if (newStatus === 'refunded') timelineMsg = `Refund of ₹${refundAmount} processed successfully to original payment method. Ref: ${refundResData?.razorpayRefundId || 'PROCESSED'}`;
      else if (newStatus === 'shipped') timelineMsg = `Replacement unit dispatched via ${additionalData?.replacementDetails?.courier || 'Express'}. Tracking: ${additionalData?.replacementDetails?.trackingNumber || 'N/A'}`;
      else if (newStatus === 'delivered') timelineMsg = 'Replacement unit delivered to customer';
      else if (newStatus === 'rejected') timelineMsg = `Request rejected: ${additionalData?.rejectionReason || additionalData?.inspectionDetails?.notes || 'Does not meet return criteria'}`;
      else if (newStatus === 'closed') timelineMsg = 'Return / replacement request marked completed & closed';

      const existingTimeline = (Array.isArray(currentData.timeline) ? currentData.timeline : []) || [];
      const newEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        message: timelineMsg,
        updatedBy: user?.displayName || user?.email || 'Admin'
      };
      updateData.timeline = [...existingTimeline, newEntry];

      // 6. Real Firestore update (triggers onSnapshot everywhere)
      await updateDoc(returnDocRef, updateData);

      // 7. Invoke backend API for inventory disposition, email notifications, and audit log
      try {
        await fetch(`/api/admin/support/returns/${returnId}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            adminNotes: timelineMsg,
            adminUser: user?.email || 'Admin',
            disposition: additionalData?.inspectionDetails?.productCondition || 'restock'
          })
        });
      } catch (apiErr) {
        console.warn('Backend API notification non-blocking warning:', apiErr);
      }

      // 8. Optimistically update selectedReturn in parent state
      setSelectedReturn(prev => {
        if (!prev || prev.id !== returnId) return prev;
        return {
          ...prev,
          ...updateData,
          status: newStatus as any,
          timeline: updateData.timeline
        };
      });

      return { success: true };
    } catch (err: any) {
      console.error("Failed to update return status:", err);
      return {
        success: false,
        error: err?.message || 'Failed to update return status in database.'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <RefreshCw className="animate-spin text-purple-600" size={32} />
        <p className="text-xs text-slate-500 font-medium">Loading return requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Returns & Replacements</h2>
          <p className="text-xs text-slate-500 mt-0.5">Review return requests, verify product inspections, and execute refunds or replacements.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search return #, order, customer..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-2 hide-scrollbar">
        {['all', 'requested', 'under_review', 'approved', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'approve_refund', 'refunded', 'approved_replacement', 'shipped', 'delivered', 'rejected', 'closed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border cursor-pointer ${
              statusFilter === status 
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status === 'all' ? 'All Requests' : status.replace(/_/g, ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase border-b border-slate-200/80 tracking-wider">
            <tr>
              <th className="p-4">Request ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Order / Items</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReturns.map(ret => (
              <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="p-4 font-mono text-[11px] font-bold text-slate-900">
                  {ret.returnNumber || ret.id.substring(0, 8)}
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900">{ret.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{ret.customerEmail}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-900">Ord: {ret.invoiceNumber || ret.orderId.substring(0,8)}</div>
                  <div className="text-slate-500 truncate max-w-[150px] text-[11px]">
                    {ret.items?.map((i: any) => i.productName).join(', ')}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ret.items?.[0]?.requestedResolution === 'replacement' || ret.requestedResolution === 'replacement'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'bg-purple-50 text-purple-700 border border-purple-100'
                  }`}>
                    {ret.items?.[0]?.requestedResolution === 'replacement' || ret.requestedResolution === 'replacement' ? 'REPLACEMENT' : 'RETURN'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(ret.status)}`}>
                    {ret.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setSelectedReturn(ret)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg inline-flex items-center gap-1.5 transition-colors font-bold text-xs cursor-pointer"
                  >
                    <Eye size={13} /> Review Details
                  </button>
                </td>
              </tr>
            ))}
            {filteredReturns.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500">
                  <RotateCcw size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No return requests found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No return requests match this status filter'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedReturn && (
        <ReturnDetailsModal 
          request={selectedReturn} 
          onClose={() => setSelectedReturn(null)} 
          onUpdateStatus={handleUpdateStatus}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
}

interface ReturnDetailsModalProps {
  request: ReturnRequest;
  onClose: () => void;
  onUpdateStatus: (id: string, s: string, orderId?: string, amount?: number, additionalData?: any) => Promise<{ success: boolean; error?: string }>;
  getStatusColor: (s: string) => string;
}

function ReturnDetailsModal({ request, onClose, onUpdateStatus, getStatusColor }: ReturnDetailsModalProps) {
  const { user } = useAuth();
  const [currentRequest, setCurrentRequest] = useState<ReturnRequest>(request);
  const isReplace = currentRequest.items?.[0]?.requestedResolution === 'replacement' || currentRequest.requestedResolution === 'replacement';

  const [activeForm, setActiveForm] = useState<'none' | 'pickup' | 'inspection' | 'refund' | 'dispatch' | 'reject'>('none');
  const [order, setOrder] = useState<any>(null);

  // Status transition state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updatingAction, setUpdatingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Rejection Form State
  const [rejectReasonPreset, setRejectReasonPreset] = useState<string>('Item returned in used, damaged, or unsealed condition');
  const [rejectNotes, setRejectNotes] = useState<string>('');

  // Credit Note Modal State
  const [viewCreditNote, setViewCreditNote] = useState<CreditNote | null>(null);
  const [isCreateCNOpen, setIsCreateCNOpen] = useState<boolean>(false);
  const [loadingCN, setLoadingCN] = useState<boolean>(false);

  const handleOpenCreditNote = async () => {
    const cnId = currentRequest.creditNoteId;
    if (!cnId) return;
    try {
      setLoadingCN(true);
      const snap = await getDoc(doc(db, 'credit_notes', cnId));
      if (snap.exists()) {
        setViewCreditNote({ id: snap.id, ...snap.data() } as CreditNote);
      } else {
        alert('Credit Note document could not be found.');
      }
    } catch (err: any) {
      console.error('Error fetching credit note:', err);
      alert(`Error fetching credit note: ${err.message}`);
    } finally {
      setLoadingCN(false);
    }
  };

  // Real-time synchronization for the active return document
  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  useEffect(() => {
    if (!request.id) return;
    const unsub = onSnapshot(doc(db, 'return_requests', request.id), (snap) => {
      if (snap.exists()) {
        setCurrentRequest({ id: snap.id, ...snap.data() } as ReturnRequest);
      }
    }, (err) => {
      console.warn("Realtime return document subscription error:", err);
    });
    return () => unsub();
  }, [request.id]);

  // Load parent order data for payment & address context
  useEffect(() => {
    if (!currentRequest.orderId) return;
    getDoc(doc(db, 'orders', currentRequest.orderId)).then(snap => {
      if (snap.exists()) setOrder(snap.data());
    }).catch(console.error);
  }, [currentRequest.orderId]);

  // Pickup Form State
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupCourier, setPickupCourier] = useState('');
  const [pickupTracking, setPickupTracking] = useState('');

  // Inspection Form State
  const [insProductReceived, setInsProductReceived] = useState(true);
  const [insCondition, setInsCondition] = useState('good');
  const [insAccessories, setInsAccessories] = useState(true);
  const [insPackaging, setInsPackaging] = useState('good');
  const [insNotes, setInsNotes] = useState('');
  const [insResult, setInsResult] = useState<'approved' | 'rejected'>('approved');

  // Dispatch Form State (for replacement)
  const [dispatchCourier, setDispatchCourier] = useState('Delhivery Express');
  const [dispatchTracking, setDispatchTracking] = useState('');
  const [dispatchEstDate, setDispatchEstDate] = useState('');
  const [refundDestination, setRefundDestination] = useState<'store_credit' | 'original_payment'>('store_credit');

  // Status pipeline enforcement
  const validNextStatuses = (current: string) => {
    if (isReplace) {
      switch(current) {
        case 'requested': return ['approved', 'rejected'];
        case 'under_review': return ['approved', 'rejected'];
        case 'approved': return ['pickup_scheduled'];
        case 'pickup_scheduled': return ['picked_up'];
        case 'picked_up': return ['received'];
        case 'received': return ['inspection'];
        case 'inspection': return ['approved_replacement', 'rejected'];
        case 'approved_replacement': return ['shipped'];
        case 'shipped': return ['delivered'];
        case 'delivered': return ['closed'];
        default: return [];
      }
    } else {
      switch(current) {
        case 'requested': return ['approved', 'rejected'];
        case 'under_review': return ['approved', 'rejected'];
        case 'approved': return ['pickup_scheduled'];
        case 'pickup_scheduled': return ['picked_up'];
        case 'picked_up': return ['received'];
        case 'received': return ['inspection'];
        case 'inspection': return ['approve_refund', 'rejected'];
        case 'approve_refund': return ['refunded'];
        case 'refunded': return ['closed'];
        default: return [];
      }
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approved': return isReplace ? 'Approve Replacement' : 'Approve Return';
      case 'rejected': return 'Reject Request';
      case 'pickup_scheduled': return 'Schedule Pickup';
      case 'picked_up': return 'Mark Picked Up';
      case 'received': return 'Mark Received at Hub';
      case 'inspection': return 'Start Inspection';
      case 'approve_refund': return 'Approve Refund';
      case 'refunded': return 'Process Gateway Refund';
      case 'approved_replacement': return 'Approve Replacement Unit';
      case 'shipped': return 'Dispatch Replacement';
      case 'delivered': return 'Mark Replacement Delivered';
      case 'closed': return 'Close Request';
      default: return action;
    }
  };

  // 1. APPROVE RETURN ACTION
  const handleApprove = async () => {
    if (isUpdating) return;

    // Verify admin authorization
    const isAdmin = user && (user.role === 'admin' || isAdminEmail(user?.email));
    if (!isAdmin) {
      setActionError("UNAUTHORIZED: Admin privileges required to approve return requests.");
      return;
    }

    // Verify current status is requested / under_review
    if (currentRequest.status !== 'requested' && currentRequest.status !== 'under_review') {
      setActionError(`Cannot approve: Current status is already ${currentRequest.status.replace(/_/g, ' ').toUpperCase()}.`);
      return;
    }

    setIsUpdating(true);
    setUpdatingAction('approved');
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await onUpdateStatus(currentRequest.id, 'approved', currentRequest.orderId, currentRequest.refundAmount);
      if (res && !res.success) {
        throw new Error(res.error || 'Failed to approve return request');
      }

      // Optimistically update local view immediately
      setCurrentRequest(prev => ({
        ...prev,
        status: 'approved' as any
      }));
      setActiveForm('none');
      setActionSuccess(`${isReplace ? 'Replacement' : 'Return'} request approved successfully. You can now schedule doorstep pickup.`);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve return request in database.');
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  // 2. REJECT RETURN ACTION
  const handleConfirmReject = async () => {
    if (isUpdating) return;

    // Verify admin authorization
    const isAdmin = user && (user.role === 'admin' || isAdminEmail(user?.email));
    if (!isAdmin) {
      setActionError("UNAUTHORIZED: Admin privileges required to reject return requests.");
      return;
    }

    const finalReason = rejectReasonPreset === 'Other'
      ? (rejectNotes.trim() || 'Request does not meet return criteria')
      : (rejectNotes.trim() ? `${rejectReasonPreset}: ${rejectNotes.trim()}` : rejectReasonPreset);

    setIsUpdating(true);
    setUpdatingAction('rejected');
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await onUpdateStatus(currentRequest.id, 'rejected', currentRequest.orderId, currentRequest.refundAmount, {
        rejectionReason: finalReason,
        rejectedAt: new Date().toISOString()
      });
      if (res && !res.success) {
        throw new Error(res.error || 'Failed to reject return request');
      }

      // Optimistically update local view immediately
      setCurrentRequest(prev => ({
        ...prev,
        status: 'rejected' as any,
        rejectionReason: finalReason,
        rejectedAt: new Date().toISOString()
      }));
      setActiveForm('none');
      setActionSuccess('Return request has been rejected. Customer notification dispatched.');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reject return request in database.');
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  // Generic direct status update for pipeline steps (picked_up, received, etc.)
  const handleDirectStatusUpdate = async (action: string) => {
    if (isUpdating) return;

    const isAdmin = user && (user.role === 'admin' || isAdminEmail(user?.email));
    if (!isAdmin) {
      setActionError("UNAUTHORIZED: Admin privileges required to update return status.");
      return;
    }

    setIsUpdating(true);
    setUpdatingAction(action);
    setActionError(null);
    setActionSuccess(null);

    try {
      let additionalData: any = {};
      if (action === 'picked_up') {
        additionalData = {
          pickupDetails: {
            ...(currentRequest.pickupDetails || {}),
            pickedUpAt: new Date().toISOString()
          }
        };
      } else if (action === 'received') {
        additionalData = {
          receivedAt: new Date().toISOString()
        };
      }

      const res = await onUpdateStatus(currentRequest.id, action, currentRequest.orderId, currentRequest.refundAmount, additionalData);
      if (res && !res.success) {
        throw new Error(res.error || `Failed to update status to ${action}`);
      }

      setCurrentRequest(prev => ({
        ...prev,
        status: action as any,
        ...(additionalData)
      }));
      setActionSuccess(`Status successfully advanced to ${action.replace(/_/g, ' ').toUpperCase()}.`);
    } catch (err: any) {
      setActionError(err?.message || `Failed to update status to ${action}.`);
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  const handleActionClick = (action: string) => {
    setActionError(null);
    setActionSuccess(null);

    if (action === 'approved') {
      handleApprove();
    } else if (action === 'rejected') {
      setActiveForm('reject');
    } else if (action === 'pickup_scheduled') {
      setActiveForm('pickup');
    } else if (action === 'inspection') {
      setActiveForm('inspection');
    } else if (action === 'refunded') {
      setActiveForm('refund');
    } else if (action === 'shipped') {
      setActiveForm('dispatch');
    } else {
      handleDirectStatusUpdate(action);
    }
  };

  const submitPickup = async () => {
    if (!pickupDate || !pickupTime) {
      setActionError("Please provide both pickup date and time window.");
      return;
    }

    setIsUpdating(true);
    setUpdatingAction('pickup_scheduled');
    setActionError(null);

    const additionalData = {
      pickupDetails: {
        date: pickupDate,
        timeWindow: pickupTime,
        courier: pickupCourier.trim() || 'ElectroStore Logistics',
        trackingNumber: pickupTracking.trim() || `PKP-${Date.now().toString().slice(-6)}`
      }
    };

    try {
      const res = await onUpdateStatus(currentRequest.id, 'pickup_scheduled', currentRequest.orderId, currentRequest.refundAmount, additionalData);
      if (res && !res.success) throw new Error(res.error);
      setCurrentRequest(prev => ({
        ...prev,
        status: 'pickup_scheduled' as any,
        pickupDetails: additionalData.pickupDetails
      }));
      setActiveForm('none');
      setActionSuccess('Doorstep pickup scheduled successfully.');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to schedule pickup.');
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  const submitInspection = async () => {
    setIsUpdating(true);
    const nextStatus = insResult === 'approved' ? (isReplace ? 'approved_replacement' : 'approve_refund') : 'rejected';
    setUpdatingAction(nextStatus);
    setActionError(null);

    const additionalData = {
      inspectionDetails: {
        productReceived: insProductReceived,
        productCondition: insCondition,
        accessoriesComplete: insAccessories,
        packagingCondition: insPackaging,
        notes: insNotes,
        result: insResult,
        inspectedAt: new Date().toISOString()
      },
      ...(insResult === 'rejected' ? {
        rejectionReason: insNotes ? `Inspection Failed: ${insNotes}` : 'Inspection Failed: Product does not meet return standards',
        rejectedAt: new Date().toISOString()
      } : {})
    };

    try {
      const res = await onUpdateStatus(currentRequest.id, nextStatus, currentRequest.orderId, currentRequest.refundAmount, additionalData);
      if (res && !res.success) throw new Error(res.error);
      setCurrentRequest(prev => ({
        ...prev,
        status: nextStatus as any,
        ...additionalData
      }));
      setActiveForm('none');
      setActionSuccess(insResult === 'approved' ? 'Inspection approved. Ready for refund/replacement.' : 'Inspection rejected. Return closed.');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit inspection report.');
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  const submitDispatch = async () => {
    if (!dispatchTracking.trim()) {
      setActionError("Please enter a valid tracking or AWB number.");
      return;
    }

    setIsUpdating(true);
    setUpdatingAction('shipped');
    setActionError(null);

    const additionalData = {
      replacementDetails: {
        courier: dispatchCourier.trim(),
        trackingNumber: dispatchTracking.trim(),
        estimatedDeliveryDate: dispatchEstDate || 'Within 3-5 business days',
        dispatchedAt: new Date().toISOString()
      }
    };

    try {
      const res = await onUpdateStatus(currentRequest.id, 'shipped', currentRequest.orderId, undefined, additionalData);
      if (res && !res.success) throw new Error(res.error);
      setCurrentRequest(prev => ({
        ...prev,
        status: 'shipped' as any,
        replacementDetails: additionalData.replacementDetails
      }));
      setActiveForm('none');
      setActionSuccess('Replacement unit successfully dispatched to customer.');
    } catch (err: any) {
      setActionError(err?.message || 'Failed to dispatch replacement unit.');
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  const submitRefund = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdatingAction('refunded');
    setActionError(null);

    try {
      const res = await onUpdateStatus(currentRequest.id, 'refunded', currentRequest.orderId, currentRequest.refundAmount, {
        refundDestination,
        reason: `Return #${currentRequest.id} refund (${refundDestination === 'store_credit' ? 'Store Credit' : 'Payment Gateway'})`
      });
      if (res && !res.success) throw new Error(res.error);
      setCurrentRequest(prev => ({
        ...prev,
        status: 'refunded' as any,
        refundStatus: 'completed',
        refundDestination
      }));
      setActiveForm('none');
      const destLabel = refundDestination === 'store_credit' 
        ? 'credited to Customer Store Credit wallet' 
        : 'processed via payment gateway to original source';
      setActionSuccess(`Refund of ₹${Number(currentRequest.refundAmount || 0).toLocaleString('en-IN')} successfully ${destLabel}.`);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to process refund.');
    } finally {
      setIsUpdating(false);
      setUpdatingAction(null);
    }
  };

  const nextActions = validNextStatuses(currentRequest.status);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="text-purple-600" size={20} />
              {isReplace ? 'Replacement' : 'Return'} Request: {currentRequest.returnNumber || currentRequest.id}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(currentRequest.status)}`}>
                {currentRequest.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500 font-medium">Order: {currentRequest.invoiceNumber || currentRequest.orderId}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Customer & Order Info */}
            <div className="grid grid-cols-3 gap-4">
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</h3>
                 <p className="font-bold text-slate-900 text-sm">{currentRequest.customerName}</p>
                 <p className="text-xs text-slate-600 truncate">{currentRequest.customerEmail}</p>
                 <p className="text-xs text-slate-600">{currentRequest.customerPhone || 'N/A'}</p>
               </div>
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Refund Amount</h3>
                 <p className="font-bold text-slate-900 text-sm">₹{Number(currentRequest.refundAmount || 0).toLocaleString('en-IN')}</p>
                 <p className="text-[11px] text-slate-500 mt-0.5">{isReplace ? 'Replacement Value' : 'Refund Value'}</p>
               </div>
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Request Date</h3>
                 <p className="font-bold text-slate-900 text-sm">
                   {currentRequest.createdAt ? new Date((currentRequest.createdAt as any)?.toDate?.() || currentRequest.createdAt).toLocaleDateString() : 'N/A'}
                 </p>
                 <p className="text-[11px] text-slate-500 mt-0.5">
                   {currentRequest.createdAt ? new Date((currentRequest.createdAt as any)?.toDate?.() || currentRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                 </p>
               </div>
            </div>

            {/* Items Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Items to {isReplace ? 'Replace' : 'Return'}</h3>
              <div className="space-y-3">
                {currentRequest.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    {item.image ? (
                       <img src={item.image} alt={item.productName} className="w-16 h-16 object-cover rounded-lg bg-white border border-slate-200" />
                    ) : (
                       <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                         <Package size={24} />
                       </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{item.productName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Reason: <span className="font-bold text-slate-700">{item.reason || currentRequest.overallReason}</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity || 1} • Unit Price: ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Message */}
            {currentRequest.comments && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Customer Message</h3>
                <div className="p-4 bg-amber-50/50 border border-amber-200 text-amber-900 text-sm rounded-xl italic">
                  "{currentRequest.comments}"
                </div>
              </div>
            )}

            {/* Rejection Details (if rejected) */}
            {(currentRequest.status === 'rejected' || currentRequest.rejectionReason) && (
              <div>
                <h3 className="text-xs font-bold text-rose-500 uppercase mb-3 flex items-center gap-1.5">
                  <Ban size={14} /> Rejection Details
                </h3>
                <div className="p-4 border border-rose-200 rounded-xl bg-rose-50/60 text-sm space-y-1">
                  <p className="font-bold text-rose-900">Request Rejected by Operations</p>
                  <p className="text-xs text-rose-800">{currentRequest.rejectionReason || 'Item does not meet return policy criteria.'}</p>
                  {currentRequest.rejectedAt && (
                    <p className="text-[10px] text-rose-500 pt-1">
                      Timestamp: {new Date(currentRequest.rejectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Pickup Information */}
            {currentRequest.pickupDetails && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Pickup Information</h3>
                <div className="p-4 border border-slate-200 rounded-xl bg-white text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 block">Date & Time</span>
                      <span className="font-bold">{currentRequest.pickupDetails.date} ({currentRequest.pickupDetails.timeWindow})</span>
                    </div>
                    {currentRequest.pickupDetails.courier && (
                      <div>
                        <span className="text-xs text-slate-500 block">Courier</span>
                        <span className="font-bold">{currentRequest.pickupDetails.courier}</span>
                      </div>
                    )}
                    {currentRequest.pickupDetails.trackingNumber && (
                      <div>
                        <span className="text-xs text-slate-500 block">Tracking Number</span>
                        <span className="font-bold font-mono">{currentRequest.pickupDetails.trackingNumber}</span>
                      </div>
                    )}
                    {currentRequest.pickupDetails.pickedUpAt && (
                      <div>
                        <span className="text-xs text-slate-500 block">Picked Up At</span>
                        <span className="font-bold text-emerald-600">{new Date(currentRequest.pickupDetails.pickedUpAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Inspection Details */}
            {currentRequest.inspectionDetails && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Inspection Details</h3>
                <div className="p-4 border border-slate-200 rounded-xl bg-white text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-xs text-slate-500 block">Product Condition</span>
                       <span className="font-bold capitalize">{currentRequest.inspectionDetails.productCondition}</span>
                    </div>
                    <div>
                       <span className="text-xs text-slate-500 block">Packaging</span>
                       <span className="font-bold capitalize">{currentRequest.inspectionDetails.packagingCondition}</span>
                    </div>
                    <div>
                       <span className="text-xs text-slate-500 block">Accessories Included</span>
                       <span className="font-bold">{currentRequest.inspectionDetails.accessoriesComplete ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                       <span className="text-xs text-slate-500 block">Result</span>
                       <span className={`font-bold uppercase ${currentRequest.inspectionDetails.result === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {currentRequest.inspectionDetails.result}
                       </span>
                    </div>
                  </div>
                  {currentRequest.inspectionDetails.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500 block">Notes</span>
                      <p className="text-sm text-slate-800 mt-0.5">{currentRequest.inspectionDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Refund Details */}
            {currentRequest.refundDetails && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Refund Transaction</h3>
                <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/50 text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-emerald-900">Refund Completed: ₹{Number(currentRequest.refundDetails.amount || currentRequest.refundAmount || 0).toLocaleString('en-IN')}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      currentRequest.refundDestination === 'store_credit' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {currentRequest.refundDestination === 'store_credit' ? 'Store Credit Wallet' : 'Original Payment Source'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-mono">Reference: {currentRequest.refundDetails.refundId}</p>
                  {currentRequest.refundDetails.processedAt && (
                    <p className="text-[11px] text-emerald-600">Processed: {new Date(currentRequest.refundDetails.processedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            {/* Credit Note Integration */}
            {(currentRequest.creditNoteNumber || currentRequest.creditNoteId) ? (
              <div className="p-4 border border-rose-200 rounded-xl bg-rose-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">GST Credit Note Issued</h4>
                      <p className="text-xs font-mono font-bold text-rose-700 mt-0.5">
                        #{currentRequest.creditNoteNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreditNote}
                    disabled={loadingCN}
                    className="px-3 py-1.5 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                  >
                    {loadingCN ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                    <span>View Note</span>
                  </button>
                </div>
              </div>
            ) : (currentRequest.status === 'refunded' || currentRequest.refundStatus === 'completed' || currentRequest.status === 'approve_refund') ? (
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Receipt size={14} className="text-slate-600" />
                    GST Credit Note
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Generate an official tax credit note for this refund.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateCNOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                >
                  <span>+ Issue Credit Note</span>
                </button>
              </div>
            ) : null}

          </div>

          {/* Right Column - Actions */}
          <div className="space-y-5 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
            
            {/* Status Feedback Banners */}
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{actionError}</div>
                <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">{actionSuccess}</div>
                <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Main Action Buttons */}
            {activeForm === 'none' && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Admin Actions</h3>
                {nextActions.length > 0 ? (
                  <div className="space-y-2.5">
                    {nextActions.map(action => (
                      <button
                        type="button"
                        key={action}
                        onClick={() => handleActionClick(action)}
                        disabled={isUpdating}
                        className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-between min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                           action === 'rejected' 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                            : action === 'approved'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                        }`}
                      >
                        {isUpdating && updatingAction === action ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw size={15} className="animate-spin" />
                            <span>{action === 'approved' ? 'Approving...' : action === 'rejected' ? 'Rejecting...' : 'Updating...'}</span>
                          </span>
                        ) : (
                          <>
                            <span>{getActionLabel(action)}</span>
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    ))}
                    
                    {!nextActions.includes('rejected') && !nextActions.includes('closed') && currentRequest.status !== 'rejected' && currentRequest.status !== 'closed' && (
                       <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                         <button
                           type="button"
                           disabled={isUpdating}
                           onClick={() => handleDirectStatusUpdate('closed')}
                           className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors min-h-[40px] cursor-pointer disabled:opacity-50"
                         >
                           Force Close Request
                         </button>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    currentRequest.status === 'rejected' 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {currentRequest.status === 'rejected' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                    <span>{currentRequest.status === 'rejected' ? 'No pending actions (Request Rejected)' : 'No pending actions (Request Completed)'}</span>
                  </div>
                )}
              </div>
            )}

            {/* In-Modal Rejection Form */}
            {activeForm === 'reject' && (
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-900">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                    <Ban size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Reject Return Request</h3>
                    <p className="text-[11px] text-rose-700">Confirm rejection reason for customer records.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason Category</label>
                    <select
                      value={rejectReasonPreset}
                      onChange={e => setRejectReasonPreset(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      <option value="Item returned in used, damaged, or unsealed condition">Item returned in used, damaged, or unsealed condition</option>
                      <option value="Request is outside the 7-day return policy window">Request is outside the 7-day return policy window</option>
                      <option value="Serial number, IMEI, or product mismatch with original invoice">Serial number, IMEI, or product mismatch with original invoice</option>
                      <option value="Missing original manufacturer accessories, manuals, or warranty card">Missing original manufacturer accessories, manuals, or warranty card</option>
                      <option value="Reported defect could not be reproduced or verified">Reported defect could not be reproduced or verified</option>
                      <option value="Customer requested cancellation of return">Customer requested cancellation of return</option>
                      <option value="Other">Other / Custom reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Explanation / Notes</label>
                    <textarea
                      value={rejectNotes}
                      onChange={e => setRejectNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      placeholder="Add details visible to customer..."
                    />
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>Rejecting will terminate this return request. The customer will be notified and pickup/refund processing will be prevented.</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-rose-200">
                  <button
                    type="button"
                    onClick={() => { setActiveForm('none'); setActionError(null); }}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {isUpdating && updatingAction === 'rejected' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <span>Confirm Rejection</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* In-Modal Pickup Scheduling Form */}
            {activeForm === 'pickup' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Truck size={16} className="text-purple-600" /> Schedule Doorstep Pickup
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Pickup Date *</label>
                    <input 
                      type="date" 
                      value={pickupDate} 
                      onChange={e => setPickupDate(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Time Window *</label>
                    <select 
                      value={pickupTime} 
                      onChange={e => setPickupTime(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                    >
                      <option value="">Select Time Window</option>
                      <option value="09:00 AM - 01:00 PM">09:00 AM - 01:00 PM</option>
                      <option value="01:00 PM - 05:00 PM">01:00 PM - 05:00 PM</option>
                      <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Courier (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Delhivery, BlueDart" 
                      value={pickupCourier} 
                      onChange={e => setPickupCourier(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tracking Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="AWB Number" 
                      value={pickupTracking} 
                      onChange={e => setPickupTracking(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-mono" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { setActiveForm('none'); setActionError(null); }} 
                    disabled={isUpdating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={submitPickup} 
                    disabled={isUpdating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {isUpdating && updatingAction === 'pickup_scheduled' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Scheduling...</span>
                      </>
                    ) : (
                      <span>Schedule Pickup</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* In-Modal Inspection Report Form */}
            {activeForm === 'inspection' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Eye size={16} className="text-purple-600" /> QA Inspection Report
                </h3>
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Product Received?</label>
                    <select 
                      value={insProductReceived ? 'yes' : 'no'} 
                      onChange={e => setInsProductReceived(e.target.value === 'yes')} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Product Condition</label>
                    <select 
                      value={insCondition} 
                      onChange={e => setInsCondition(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="good">Good / Resalable</option>
                      <option value="used">Used / Open Box</option>
                      <option value="damaged">Damaged / Defective</option>
                      <option value="wrong_item">Wrong Item Returned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Accessories Complete?</label>
                    <select 
                      value={insAccessories ? 'yes' : 'no'} 
                      onChange={e => setInsAccessories(e.target.value === 'yes')} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No (Missing Parts)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Packaging Condition</label>
                    <select 
                      value={insPackaging} 
                      onChange={e => setInsPackaging(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="good">Good (Original intact)</option>
                      <option value="damaged">Damaged Box</option>
                      <option value="missing">No Original Box</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Inspection Notes</label>
                    <textarea 
                      value={insNotes} 
                      onChange={e => setInsNotes(e.target.value)} 
                      rows={2} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white" 
                      placeholder="Enter findings..."
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">Final Decision</label>
                    <div className="flex gap-2">
                       <button 
                         type="button"
                         onClick={() => setInsResult('approved')} 
                         className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer ${insResult === 'approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}
                       >
                         Approve
                       </button>
                       <button 
                         type="button"
                         onClick={() => setInsResult('rejected')} 
                         className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer ${insResult === 'rejected' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
                       >
                         Reject
                       </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { setActiveForm('none'); setActionError(null); }} 
                    disabled={isUpdating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={submitInspection} 
                    disabled={isUpdating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Report</span>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* In-Modal Gateway Refund Form */}
            {activeForm === 'refund' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-600" /> Process Real Gateway Refund
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-500">Original Order Total</span>
                       <span className="font-bold">₹{Number(order?.payment?.amount || order?.grandTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="text-slate-500">Already Refunded</span>
                       <span className="font-bold text-rose-600">₹{Number(order?.payment?.refundedAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                       <span className="text-slate-900 font-bold">Approved Refund Amount</span>
                       <span className="font-bold text-emerald-600">₹{Number(currentRequest.refundAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Refund Destination</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label 
                        className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          refundDestination === 'store_credit' 
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="armRefundDestination"
                          value="store_credit"
                          checked={refundDestination === 'store_credit'}
                          onChange={() => setRefundDestination('store_credit')}
                          className="mt-0.5 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>Store Credit Wallet</span>
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">Instant</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                            Credits customer's store credit balance immediately.
                          </p>
                        </div>
                      </label>

                      <label 
                        className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          refundDestination === 'original_payment' 
                            ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="armRefundDestination"
                          value="original_payment"
                          checked={refundDestination === 'original_payment'}
                          onChange={() => setRefundDestination('original_payment')}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>Original Source</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Razorpay</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                            Refunds back to original card / UPI source.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { setActiveForm('none'); setActionError(null); }} 
                    disabled={isUpdating} 
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={submitRefund} 
                    disabled={isUpdating} 
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {isUpdating && updatingAction === 'refunded' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Processing Refund...</span>
                      </>
                    ) : (
                      <span>Confirm & Refund</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* In-Modal Replacement Dispatch Form */}
            {activeForm === 'dispatch' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package size={16} className="text-teal-600" /> Dispatch Replacement Unit
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Courier Partner *</label>
                    <input 
                      type="text" 
                      value={dispatchCourier} 
                      onChange={e => setDispatchCourier(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white" 
                      placeholder="e.g. Delhivery Express" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">AWB / Tracking Number *</label>
                    <input 
                      type="text" 
                      value={dispatchTracking} 
                      onChange={e => setDispatchTracking(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono" 
                      placeholder="Tracking Number" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Estimated Delivery Date</label>
                    <input 
                      type="date" 
                      value={dispatchEstDate} 
                      onChange={e => setDispatchEstDate(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { setActiveForm('none'); setActionError(null); }} 
                    disabled={isUpdating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 min-h-[44px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={submitDispatch} 
                    disabled={isUpdating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    {isUpdating && updatingAction === 'shipped' ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <span>Confirm Dispatch</span>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Timeline Visual (Informational only - no arbitrary jumping) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Status Pipeline</h3>
               <div className="space-y-0 relative">
                 <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>
                 {(() => {
                   let allSteps: string[] = [];
                   if (isReplace) {
                     allSteps = ['requested', 'approved', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'approved_replacement', 'shipped', 'delivered', 'closed'];
                   } else {
                     allSteps = ['requested', 'approved', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'approve_refund', 'refunded', 'closed'];
                   }
                   
                   // Add rejected or cancelled if active
                   if (currentRequest.status === 'rejected') allSteps.push('rejected');
                   if (currentRequest.status === 'cancelled') allSteps.push('cancelled');

                   const currentIdx = allSteps.indexOf(currentRequest.status);
                   const isFailState = ['rejected', 'cancelled'].includes(currentRequest.status);
                   
                   return allSteps.map((step, idx) => {
                     const isCompleted = isFailState ? (step === currentRequest.status || (currentIdx > -1 && idx < currentIdx)) : (currentIdx > -1 && idx <= currentIdx);
                     const isCurrent = step === currentRequest.status;
                     if (isFailState && !isCurrent && idx > (currentIdx > -1 ? currentIdx : 0) && step !== 'rejected' && step !== 'cancelled') return null;

                     return (
                       <div key={step} className="flex items-center gap-3 relative z-10 py-1.5 bg-white">
                         <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 ${
                           isCurrent 
                             ? (step === 'rejected' ? 'border-rose-600 bg-white ring-2 ring-rose-100' : 'border-purple-600 bg-white ring-2 ring-purple-100')
                             : isCompleted 
                             ? (step === 'rejected' ? 'border-rose-500 bg-rose-500' : 'border-purple-500 bg-purple-500') 
                             : 'border-slate-200 bg-white'
                         }`}>
                           {isCompleted && !isCurrent && <Check size={10} className="text-white stroke-[3]" />}
                           {isCurrent && step === 'rejected' && <Ban size={10} className="text-rose-600" />}
                         </div>
                         <span className={`text-xs font-bold capitalize ${
                           isCurrent 
                             ? (step === 'rejected' ? 'text-rose-700' : 'text-purple-700')
                             : isCompleted 
                             ? 'text-slate-700' 
                             : 'text-slate-400'
                         }`}>
                           {step.replace(/_/g, ' ')}
                         </span>
                       </div>
                     );
                   });
                 })()}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Note View Modal */}
      {viewCreditNote && (
        <CreditNoteModal
          creditNote={viewCreditNote}
          onClose={() => setViewCreditNote(null)}
        />
      )}

      {/* Credit Note Issuance Modal */}
      {isCreateCNOpen && (
        <CreateCreditNoteModal
          initialOrder={order}
          initialReturnRequest={currentRequest}
          onClose={() => setIsCreateCNOpen(false)}
          onSuccess={(newCN) => {
            setIsCreateCNOpen(false);
            setViewCreditNote(newCN);
            setCurrentRequest(prev => ({
              ...prev,
              creditNoteId: newCN.id,
              creditNoteNumber: newCN.creditNoteNumber
            }));
            setActionSuccess(`Credit Note #${newCN.creditNoteNumber} issued successfully!`);
          }}
        />
      )}
    </div>
  );
}

