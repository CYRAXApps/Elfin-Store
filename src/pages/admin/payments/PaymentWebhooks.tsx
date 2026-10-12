import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  RotateCcw,
  Clock,
  Send,
  Eye,
  X
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { WebhookEventRecord } from '../../../types';

export function PaymentWebhooks() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WebhookEventRecord | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const webhookEndpoint = `${window.location.origin}/api/payments/webhook`;

  useEffect(() => {
    const q = query(collection(db, 'webhook_logs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: WebhookEventRecord[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as WebhookEventRecord);
      });
      setWebhookLogs(logs);
      setLoading(false);
    }, (err) => {
      console.warn('Webhook logs notice:', err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetryWebhook = async (logId: string) => {
    setIsRetrying(logId);
    try {
      const res = await fetch('/api/admin/payments/retry-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookLogId: logId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');
      setToastMessage('Webhook event successfully replayed & processed.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setToastMessage(`Retry notice: ${err.message}`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsRetrying(null);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-md flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="font-bold ml-3">✕</button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Webhook size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Webhook Management & Ingress Stream</h2>
            <p className="text-xs text-slate-500">Real-time webhook listener with HMAC SHA-256 signature verification & idempotent replay.</p>
          </div>
        </div>

        <a
          href="https://dashboard.razorpay.com/app/webhooks"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Razorpay Webhook Config</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Webhook Configuration Guide */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Production Webhook Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 font-semibold block">Webhook Target URL</span>
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-300 font-mono text-slate-800 text-xs">
              <span className="truncate flex-1">{webhookEndpoint}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                title="Copy URL"
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Paste this URL in your Razorpay Dashboard &gt; Webhooks configuration.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 font-semibold block">HMAC Secret Status</span>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200 font-semibold text-xs">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Configured Server-Side (RAZORPAY_WEBHOOK_SECRET)</span>
            </div>
            <p className="text-[11px] text-slate-500">Signatures are computed strictly on server raw payload to prevent MITM attacks.</p>
          </div>
        </div>

        {/* Supported Events Tags */}
        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 block mb-2">Subscribed Event Triggers:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'order.paid',
              'payment.authorized',
              'payment.captured',
              'payment.failed',
              'refund.created',
              'refund.processed',
              'refund.failed'
            ].map((evt) => (
              <span key={evt} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[11px] font-mono font-medium">
                {evt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Webhook Events Stream */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Incoming Webhook Event Ingress</h3>
          <span className="text-xs text-slate-500">{webhookLogs.length} events logged</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Loading webhook ingress records...
          </div>
        ) : webhookLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Webhook className="mx-auto mb-2 text-slate-400" size={28} />
            <p className="font-semibold text-slate-700">No webhook events received yet</p>
            <p className="text-slate-400 mt-1">Webhook payloads from Razorpay will stream here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Event ID / Type</th>
                  <th className="py-3.5 px-4">Entity ID / Razorpay Ref</th>
                  <th className="py-3.5 px-4">HMAC Signature</th>
                  <th className="py-3.5 px-4">Ingress Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {webhookLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-700 block">{log.eventType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.eventId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {log.entityId || log.paymentId || log.orderId || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.signatureVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Verified (Valid)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                          <AlertCircle size={13} className="text-rose-600" />
                          Invalid Signature
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.status === 'PROCESSED' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'DUPLICATE_SKIPPED' ? 'bg-slate-100 text-slate-700' :
                        log.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                      >
                        <Eye size={12} /> Payload
                      </button>
                      <button
                        onClick={() => handleRetryWebhook(log.id)}
                        disabled={isRetrying === log.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isRetrying === log.id ? 'animate-spin' : ''} />
                        Replay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Webhook size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs">Webhook Payload Inspector</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] bg-slate-900 text-slate-200 rounded-b-2xl">
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(selectedLog.rawPayload || selectedLog, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
