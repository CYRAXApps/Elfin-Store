import React from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';

interface PaymentAnalyticsViewProps {
  data: any;
  onNavigateToPayments: () => void;
}

export function PaymentAnalyticsView({ data, onNavigateToPayments }: PaymentAnalyticsViewProps) {
  if (!data?.payments) return <div className="p-8 text-slate-500">Loading payment analytics...</div>;

  const { payments } = data;
  const metrics = payments.metrics || {};
  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const methodsList = Object.entries(payments.methodsBreakdown || {}).map(([method, item]: [string, any]) => {
    const totalCount = metrics.successful + metrics.failed + metrics.pending || 1;
    const pct = ((item.count / totalCount) * 100).toFixed(1);
    return {
      method,
      count: item.count,
      amount: item.amount,
      percentage: pct
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Payment KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Payment Success Rate</span>
          <h3 className={`text-2xl font-black mt-1 ${metrics.successRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {metrics.successRate}%
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Successful Payments</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">{metrics.successful} ({formatINR(metrics.successfulAmount)})</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Failed Payments</span>
          <h3 className="text-xl font-bold text-rose-600 mt-1">{metrics.failed} ({formatINR(metrics.failedAmount)})</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pending Payments</span>
          <h3 className="text-xl font-bold text-amber-600 mt-1">{metrics.pending} ({formatINR(metrics.pendingAmount)})</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Authorized Payments</span>
          <h3 className="text-xl font-bold text-blue-600 mt-1">{metrics.authorized}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Refunded Amount</span>
          <h3 className="text-xl font-bold text-rose-500 mt-1">{formatINR(metrics.refundAmount)}</h3>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Payment Method Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across Razorpay payment channels</p>
          </div>
          <button
            onClick={onNavigateToPayments}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Go to Payment Center <ExternalLink size={12} />
          </button>
        </div>

        {payments.hasMethodData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Transaction Count</th>
                  <th className="p-3 text-right">Processed Amount</th>
                  <th className="p-3 text-right">Volume Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {methodsList.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{item.method}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{item.count}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatINR(item.amount)}</td>
                    <td className="p-3 text-right text-slate-600">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Data unavailable</p>
            <p className="text-[11px] text-slate-400 mt-1">Payment method channel metadata is recorded upon Razorpay checkout capture.</p>
          </div>
        )}
      </div>
    </div>
  );
}
