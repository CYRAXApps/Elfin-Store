import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Search,
  Check,
  FileCheck
} from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';

export function PaymentReconciliation() {
  const [reconcileData, setReconcileData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const runReconciliationScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments/reconcile', { method: 'POST' });
      const data = await res.json();
      setReconcileData(data.items || []);
      setLastScanned(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReconciliationScan();
  }, []);

  const filtered = reconcileData.filter((item) => {
    const matchesSearch = 
      item.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.razorpayOrderId.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return item.reconciliationStatus === filterStatus;
  });

  const matchedCount = reconcileData.filter(i => i.reconciliationStatus === 'MATCHED').length;
  const mismatchCount = reconcileData.filter(i => i.reconciliationStatus === 'MISMATCH').length;
  const actionRequiredCount = reconcileData.filter(i => i.reconciliationStatus === 'ACTION REQUIRED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Scale size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment 3-Way Reconciliation</h2>
            <p className="text-xs text-slate-500">Cross-verifies Internal Orders vs Captured Payment Records vs Payment Gateway State.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastScanned && (
            <span className="text-[11px] text-slate-400">Scanned at: {lastScanned}</span>
          )}
          <button
            onClick={runReconciliationScan}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Run Reconciliation Scan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Matched Records</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{matchedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">100% verified alignment</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Action Required</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{actionRequiredCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Pending state transitions</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Anomalies / Mismatches</span>
            <div className="text-2xl font-black text-rose-700 mt-1">{mismatchCount}</div>
            <span className="text-[11px] text-rose-600 font-medium">Discrepancies flagged</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by invoice number, order ID, customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            All ({reconcileData.length})
          </button>
          <button
            onClick={() => setFilterStatus('MATCHED')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${filterStatus === 'MATCHED' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
          >
            Matched ({matchedCount})
          </button>
          <button
            onClick={() => setFilterStatus('ACTION REQUIRED')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${filterStatus === 'ACTION REQUIRED' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'}`}
          >
            Action Needed ({actionRequiredCount})
          </button>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Auditing transactions and gateway records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <FileCheck className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-slate-700">No reconciliation records found</p>
            <p className="text-slate-400 mt-1">Run a scan to reconcile recent transactions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Invoice # / Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Internal Status</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Reconciliation Result</th>
                  <th className="py-3.5 px-4">Audit Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.orderId.slice(0, 10)}...</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {r.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Number(r.grandTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {r.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        r.paymentStatus === 'captured' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {r.reconciliationStatus === 'MATCHED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} /> MATCHED
                        </span>
                      ) : r.reconciliationStatus === 'ACTION REQUIRED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle size={12} /> ACTION REQUIRED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <AlertCircle size={12} /> MISMATCH
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                      {r.note}
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
