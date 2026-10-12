import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  IndianRupee, 
  ShieldCheck, 
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { Order, PaymentRefund } from '../../../types';

export function PaymentRefunds() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<PaymentRefund[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Customer return / exchange');
  const [restoreStock, setRestoreStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen to refunds collection
    const qRefunds = query(collection(db, 'refunds'), orderBy('createdAt', 'desc'));
    const unsubRefunds = onSnapshot(qRefunds, (snapshot) => {
      const rList: PaymentRefund[] = [];
      snapshot.forEach((doc) => {
        rList.push({ id: doc.id, ...doc.data() } as PaymentRefund);
      });
      setRefunds(rList);
      setLoading(false);
    }, (err) => {
      console.warn('Refunds query notice:', err.message);
      setLoading(false);
    });

    // 2. Listen to orders for eligible refund targets
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach((doc) => {
        ords.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ords);
    });

    return () => {
      unsubRefunds();
      unsubOrders();
    };
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const originalGrandTotal = Number(selectedOrder?.grandTotal || selectedOrder?.totalAmount || 0);
  const alreadyRefunded = Number(selectedOrder?.payment?.refundedAmount || 0);
  const remainingRefundable = Math.max(0, originalGrandTotal - alreadyRefunded);

  // Update default refund amount when order or type changes
  useEffect(() => {
    if (refundType === 'full') {
      setRefundAmount(remainingRefundable);
    }
  }, [selectedOrderId, refundType, remainingRefundable]);

  const handleOpenIssueModal = () => {
    setModalError(null);
    setModalSuccess(null);
    // Default to first paid order if available
    const firstPaid = orders.find(o => (o.payment?.paymentStatus === 'captured' || o.status === 'confirmed' || o.status === 'delivered') && (Number(o.payment?.refundedAmount || 0) < Number(o.grandTotal || o.totalAmount || 0)));
    if (firstPaid) {
      setSelectedOrderId(firstPaid.id);
    }
    setShowIssueModal(true);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) {
      setModalError('Please select a valid order for refund.');
      return;
    }
    if (refundAmount <= 0 || refundAmount > remainingRefundable) {
      setModalError(`Refund amount must be between ₹1 and ₹${remainingRefundable}.`);
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          amount: refundAmount,
          reason: refundReason,
          adminEmail: user?.email || 'Admin',
          restoreStock
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process refund.');
      }

      setModalSuccess(data.message || 'Refund successfully processed!');
      setTimeout(() => {
        setShowIssueModal(false);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || 'Server error processing refund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    return (
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.razorpayRefundId && r.razorpayRefundId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const totalRefundedVolume = refunds.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0);

  const formatDate = (val: any) => {
    if (!val) return 'Recent';
    try {
      const date = val.toDate ? val.toDate() : new Date(val);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <RotateCcw size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Refunds & Reversals Management</h2>
            <p className="text-xs text-slate-500">Initiate server-authorized full or partial refunds with inventory synchronization.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="text-slate-500 block">Total Refunded</span>
            <span className="font-bold text-purple-700">₹{totalRefundedVolume.toLocaleString('en-IN')}</span>
          </div>

          <button
            onClick={handleOpenIssueModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus size={14} />
            Issue Refund
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by Refund ID, Invoice, Order, or Gateway Ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Loading refund records...
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RotateCcw className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-slate-700">No refunds recorded</p>
            <p className="text-xs text-slate-400 mt-1">Processed refunds will appear here with audit timestamps and gateway references.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Refund ID / Ref</th>
                  <th className="py-3.5 px-4">Order / Invoice</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Refund Amount</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Processed Date</th>
                  <th className="py-3.5 px-4">Admin Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <div>{r.razorpayRefundId || r.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {r.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{r.invoiceNumber || 'EST-ORDER'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.orderId.slice(0, 10)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{r.customerName}</div>
                      <div className="text-[10px] text-slate-400">{r.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-700">
                      ₹{Number(r.refundAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {r.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        <CheckCircle2 size={12} /> {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(r.createdAt || r.processedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {r.adminEmail || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Issue Refund Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Issue Order Refund</h3>
                  <p className="text-xs text-slate-500">Server-authorized payment reversal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleProcessRefund} className="p-6 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Select Order */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium text-slate-800"
                  required
                >
                  <option value="" disabled>-- Select an Order --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.invoiceNumber || `EST-${o.id.slice(0, 6)}`} • {o.shippingAddress?.fullName || 'Customer'} • ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Financial Overview */}
              {selectedOrder && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Original Total:</span>
                    <span className="font-bold text-slate-800">₹{originalGrandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Already Refunded:</span>
                    <span className="font-bold text-rose-600">₹{alreadyRefunded.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span className="text-slate-800">Remaining Refundable:</span>
                    <span className="text-emerald-700 font-bold">₹{remainingRefundable.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Refund Mode */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundType('full')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors ${
                    refundType === 'full' 
                      ? 'bg-purple-50 border-purple-600 text-purple-700' 
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Full Refund (₹{remainingRefundable})
                </button>
                <button
                  type="button"
                  onClick={() => setRefundType('partial')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors ${
                    refundType === 'partial' 
                      ? 'bg-purple-50 border-purple-600 text-purple-700' 
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Partial Refund
                </button>
              </div>

              {/* Custom Partial Amount */}
              {refundType === 'partial' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Partial Refund Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max={remainingRefundable}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-slate-900"
                    required
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Refund</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-slate-800"
                  required
                />
              </div>

              {/* Restore Stock Checkbox */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="restoreStock"
                  checked={restoreStock}
                  onChange={(e) => setRestoreStock(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="restoreStock" className="text-slate-700 font-medium cursor-pointer">
                  Automatically restore inventory stock count for returned items
                </label>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || remainingRefundable <= 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      Confirm & Issue ₹{refundAmount}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
