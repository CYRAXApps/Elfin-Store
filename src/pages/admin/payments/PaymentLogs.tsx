import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Clock, 
  Webhook, 
  Scale, 
  ShieldCheck,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { PaymentAuditRecord } from '../../../types';

export function PaymentLogs() {
  const [logs, setLogs] = useState<PaymentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<PaymentAuditRecord | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'payment_audit'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const auditList: PaymentAuditRecord[] = [];
      snapshot.forEach((doc) => {
        auditList.push({ id: doc.id, ...doc.data() } as PaymentAuditRecord);
      });
      setLogs(auditList);
      setLoading(false);
    }, (err) => {
      console.warn('Audit query notice:', err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.orderId && log.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.paymentId && log.paymentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.actor && log.actor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (actionFilter === 'all') return true;
    return log.action.toLowerCase().includes(actionFilter.toLowerCase());
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
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  const getActionBadge = (action: string, status: string) => {
    if (action.includes('REFUND')) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><RotateCcw size={11} /> {action}</span>;
    }
    if (action.includes('WEBHOOK')) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Webhook size={11} /> {action}</span>;
    }
    if (action.includes('RECONCIL')) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"><Scale size={11} /> {action}</span>;
    }
    if (status === 'SUCCESS') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 size={11} /> {action}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{action}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Audit Logs & Event Trace</h2>
            <p className="text-xs text-slate-500">Immutable ledger of payment events, refund actions, webhook receipts, and system reconciliations.</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          Total Audit Records: <strong className="text-slate-800">{logs.length}</strong>
        </div>
      </div>

      {/* Search & Action Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by action, order, payment ID, actor, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <Filter size={13} className="text-slate-400 ml-1.5" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent font-medium text-slate-700 outline-none pr-2 cursor-pointer"
          >
            <option value="all">All Audit Actions</option>
            <option value="PAYMENT_CAPTURED">Payment Captured</option>
            <option value="REFUND">Refund Processed</option>
            <option value="WEBHOOK">Webhook Ingress</option>
            <option value="RECONCILIATION">Reconciliation</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Loading audit records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Activity className="mx-auto mb-2 text-slate-400" size={28} />
            <p className="font-semibold text-slate-700">No payment audit logs found</p>
            <p className="text-slate-400 mt-1">Actions performed across checkout, capture, webhooks, and refunds will log here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">Order / Payment ID</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action, log.status)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div>{log.orderId || 'N/A'}</div>
                      {log.paymentId && <div className="text-[10px] text-slate-400">{log.paymentId}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {log.actor || 'System'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {log.details || 'Event recorded'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
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
