import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CreditCard, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw,
  RefreshCw,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order } from '../../../types';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';

export function RazorpayOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
      console.error('Error fetching Razorpay orders:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const rzpOrderId = o.payment?.razorpayOrderId || '';
    const invoice = o.invoiceNumber || '';
    const customer = o.shippingAddress?.fullName || '';
    const email = o.shippingAddress?.phone || o.userId || '';

    return (
      rzpOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by Razorpay Order ID, Invoice, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://dashboard.razorpay.com/app/orders"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <span>Razorpay Orders Gateway</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Razorpay Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Loading Razorpay Orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-slate-700">No Razorpay Orders Recorded</p>
            <p className="text-xs text-slate-400 mt-1">Orders created via server-side checkout will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Razorpay Order ID</th>
                  <th className="py-3.5 px-4">Internal Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount (INR)</th>
                  <th className="py-3.5 px-4">Gateway Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => {
                  const rzpOrderId = o.payment?.razorpayOrderId || `order_${o.id.slice(0, 10)}`;
                  const status = o.payment?.paymentStatus || (o.status === 'confirmed' ? 'captured' : 'pending');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {rzpOrderId}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {o.invoiceNumber || `EST-${o.id.slice(0, 6)}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{o.shippingAddress?.fullName || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400">{o.shippingAddress?.city}, {o.shippingAddress?.state}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{Number(o.grandTotal || o.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        {status === 'captured' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Paid / Captured
                          </span>
                        ) : status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            <RotateCcw size={12} /> Refunded
                          </span>
                        ) : status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <AlertCircle size={12} /> Failed / Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock size={12} /> Created / Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(o.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded text-xs font-semibold transition-colors"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Razorpay Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Razorpay Order Breakdown</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1">Razorpay Order Identifier</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedOrder.payment?.razorpayOrderId || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Amount (INR)</span>
                  <span className="font-bold text-slate-900 text-sm">₹{Number(selectedOrder.grandTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block mb-1">Amount in Paise</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{Math.round((selectedOrder.grandTotal || 0) * 100)} paise</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1">Customer & Delivery</span>
                <span className="font-semibold text-slate-800 block">{selectedOrder.shippingAddress?.fullName}</span>
                <span className="text-slate-500 text-[11px]">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, <PincodeDisplay pincode={selectedOrder.shippingAddress?.zipCode} /></span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1">Items in this Order</span>
                <div className="space-y-1 mt-1">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">₹{item.totalPrice || (item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
