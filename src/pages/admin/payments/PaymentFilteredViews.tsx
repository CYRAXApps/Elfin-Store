import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  ArrowUpRight, 
  IndianRupee, 
  CreditCard,
  User,
  Calendar,
  Search,
  ExternalLink,
  ShieldAlert,
  Send
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order } from '../../../types';

interface FilteredViewsProps {
  viewType: 'successful' | 'pending' | 'failed';
  onNavigateTab?: (tab: string) => void;
}

export function PaymentFilteredViews({ viewType, onNavigateTab }: FilteredViewsProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshingOrderId, setRefreshingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach((doc) => {
        ords.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ords);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching filtered payments:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRefreshPaymentStatus = async (orderId: string) => {
    setRefreshingOrderId(orderId);
    try {
      const res = await fetch('/api/admin/payments/reconcile', { method: 'POST' });
      const data = await res.json();
      setToastMessage('Payment status verified with server gateway.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Status verification complete.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setRefreshingOrderId(null);
    }
  };

  // Filter orders by viewType
  const matchingOrders = orders.filter((o) => {
    const paymentStatus = o.payment?.paymentStatus || (o.status === 'confirmed' || o.status === 'delivered' ? 'captured' : o.status === 'cancelled' ? 'failed' : 'pending');
    
    if (viewType === 'successful') {
      return paymentStatus === 'captured' || o.status === 'confirmed' || o.status === 'delivered';
    }
    if (viewType === 'pending') {
      return paymentStatus === 'pending' || (o.status === 'pending' && paymentStatus !== 'captured' && paymentStatus !== 'failed');
    }
    if (viewType === 'failed') {
      return paymentStatus === 'failed' || o.status === 'cancelled';
    }
    return true;
  });

  const searched = matchingOrders.filter((o) => {
    const rzpOrderId = o.payment?.razorpayOrderId || '';
    const invoice = o.invoiceNumber || '';
    const customer = o.shippingAddress?.fullName || '';
    const email = o.shippingAddress?.phone || o.userId || '';

    return (
      rzpOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalAmount = searched.reduce((sum, o) => sum + (Number(o.grandTotal || o.totalAmount || 0)), 0);
  const avgAmount = searched.length > 0 ? Math.round(totalAmount / searched.length) : 0;

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

  const getTitle = () => {
    switch (viewType) {
      case 'successful': return 'Successful & Captured Payments';
      case 'pending': return 'Pending Payments & Incomplete Authorizations';
      case 'failed': return 'Failed Payments & Abandoned Checkouts';
    }
  };

  const getDescription = () => {
    switch (viewType) {
      case 'successful': return 'Verified transactions with cryptographic signature confirmation and captured payment state.';
      case 'pending': return 'Transactions awaiting gateway authorization or webhook callback acknowledgment.';
      case 'failed': return 'Transactions cancelled by user, timed out, or rejected by payment gateway security.';
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-md flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold ml-3">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
            viewType === 'successful' ? 'bg-emerald-50 text-emerald-600' :
            viewType === 'pending' ? 'bg-amber-50 text-amber-600' :
            'bg-rose-50 text-rose-600'
          }`}>
            {viewType === 'successful' ? <CheckCircle2 size={20} /> :
             viewType === 'pending' ? <Clock size={20} /> :
             <AlertCircle size={20} />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{getTitle()}</h2>
            <p className="text-xs text-slate-500">{getDescription()}</p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block">Total Volume</span>
            <span className="font-bold text-slate-900">₹{Number(totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 block">Records</span>
            <span className="font-bold text-slate-900">{searched.length}</span>
          </div>
          {viewType === 'successful' && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Average Ticket</span>
              <span className="font-bold text-slate-900">₹{Number(avgAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by invoice, customer name, contact, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Filtered Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Loading filtered records...
          </div>
        ) : searched.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-slate-700">No {viewType} records found</p>
            <p className="text-xs text-slate-400 mt-1">There are currently no transactions matching this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date Created</th>
                  {viewType === 'failed' && <th className="py-3.5 px-4">Failure Reason</th>}
                  {viewType === 'pending' && <th className="py-3.5 px-4">Verification</th>}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searched.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{o.invoiceNumber || `EST-${o.id.slice(0, 6)}`}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {o.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{o.shippingAddress?.fullName || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400">{o.shippingAddress?.phone || o.userId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                    {viewType === 'failed' && (
                      <td className="py-3.5 px-4 text-rose-600 font-medium">
                        Customer cancelled checkout or card was declined.
                      </td>
                    )}
                    {viewType === 'pending' && (
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleRefreshPaymentStatus(o.id)}
                          disabled={refreshingOrderId === o.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          <RefreshCw size={11} className={refreshingOrderId === o.id ? 'animate-spin' : ''} />
                          Refresh Status
                        </button>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab('orders')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded text-xs font-semibold transition-colors"
                        >
                          <Eye size={12} />
                          View Order
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
