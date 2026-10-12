import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ExternalLink, 
  Calendar, 
  IndianRupee, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Info,
  Layers
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order } from '../../../types';

export function PaymentSettlements() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error('Error fetching settlements data:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const capturedOrders = orders.filter(o => o.payment?.paymentStatus === 'captured' || o.status === 'confirmed' || o.status === 'delivered');
  const grossCollected = capturedOrders.reduce((sum, o) => sum + Number(o.grandTotal || o.totalAmount || 0), 0);
  
  // Standard Razorpay Standard Fee calculation (2% + 18% GST on fee)
  const estimatedGatewayFees = Math.round(grossCollected * 0.02);
  const estimatedGstOnFees = Math.round(estimatedGatewayFees * 0.18);
  const totalDeductions = estimatedGatewayFees + estimatedGstOnFees;
  const netEstimatedSettlement = Math.max(0, grossCollected - totalDeductions);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Bank Settlements & Payouts</h2>
            <p className="text-xs text-slate-500">Overview of captured funds, standard payment gateway fees, and bank transfers.</p>
          </div>
        </div>

        <a
          href="https://dashboard.razorpay.com/app/settlements"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Open Razorpay Settlements</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Settlement Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Captured</span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{Number(grossCollected || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{capturedOrders.length} captured orders</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Fee (Est. 2%)</span>
          <div className="mt-2 text-2xl font-black text-slate-700">
            ₹{Number(estimatedGatewayFees || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Standard Razorpay MDR</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST on Gateway Fees</span>
          <div className="mt-2 text-2xl font-black text-slate-700">
            ₹{Number(estimatedGstOnFees || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">18% GST on MDR charges</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Bank Payout</span>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            ₹{Number(netEstimatedSettlement || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">T+2 Business Days Schedule</span>
        </div>
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
        <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-blue-900 text-sm">Settlement Architecture Notice</h4>
          <p className="text-blue-800">
            Live settlement cycles, UTR numbers, account transfers, and instant payout schedules are managed directly by Razorpay Banking operations according to your registered merchant account bank details.
          </p>
          <p className="text-blue-700">
            Settlement data is available in full detail with bank UTRs directly on your official <strong>Razorpay Dashboard</strong>.
          </p>
        </div>
      </div>

      {/* Settlement Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recent Captured Payment Settlement Stream</h3>
          <span className="text-xs text-slate-500">Auto-calculated</span>
        </div>

        {capturedOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Layers className="mx-auto mb-2 text-slate-400" size={28} />
            <p className="font-semibold text-slate-700">No settlement batches pending</p>
            <p className="text-slate-400 mt-1">Captured orders will stream here for settlement reconciliation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Gross Collected</th>
                  <th className="py-3 px-4">Estimated Gateway Fee (2%)</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Settlement Cycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {capturedOrders.slice(0, 10).map((o) => {
                  const gross = Number(o.grandTotal || o.totalAmount || 0);
                  const fee = Math.round(gross * 0.02 * 1.18);
                  const net = Math.max(0, gross - fee);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {o.invoiceNumber || `EST-${o.id.slice(0, 6)}`}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {o.shippingAddress?.fullName || 'Customer'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{Number(gross || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        ₹{Number(fee || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        ₹{Number(net || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                          <CheckCircle2 size={11} /> Eligible for Payout (T+2)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
