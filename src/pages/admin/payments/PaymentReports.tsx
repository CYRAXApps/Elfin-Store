import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  IndianRupee, 
  Filter, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order } from '../../../types';

export function PaymentReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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
      console.error('Error fetching orders for reports:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Group orders by chosen period
  const groupedData: Record<string, {
    date: string;
    ordersCount: number;
    successfulCount: number;
    failedCount: number;
    refundedCount: number;
    grossAmount: number;
    refundAmount: number;
    fees: number;
    netAmount: number;
  }> = {};

  orders.forEach((o) => {
    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || Date.now());
    let groupKey = orderDate.toISOString().slice(0, 10); // Default YYYY-MM-DD

    if (reportPeriod === 'monthly') {
      groupKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    } else if (reportPeriod === 'weekly') {
      const firstDayOfYear = new Date(orderDate.getFullYear(), 0, 1);
      const pastDaysOfYear = (orderDate.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      groupKey = `${orderDate.getFullYear()}-W${weekNum}`;
    }

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        date: groupKey,
        ordersCount: 0,
        successfulCount: 0,
        failedCount: 0,
        refundedCount: 0,
        grossAmount: 0,
        refundAmount: 0,
        fees: 0,
        netAmount: 0
      };
    }

    const amount = Number(o.grandTotal || o.totalAmount || 0);
    const paymentStatus = o.payment?.paymentStatus || (o.status === 'confirmed' || o.status === 'delivered' ? 'captured' : o.status === 'cancelled' ? 'failed' : 'pending');
    const isCaptured = paymentStatus === 'captured';
    const isFailed = paymentStatus === 'failed';
    const isRefunded = paymentStatus === 'refunded' || (o.payment?.refundedAmount && o.payment.refundedAmount > 0);
    const refAmt = Number(o.payment?.refundedAmount || (isRefunded ? amount : 0));

    groupedData[groupKey].ordersCount += 1;
    if (isCaptured) {
      groupedData[groupKey].successfulCount += 1;
      groupedData[groupKey].grossAmount += amount;
      const fee = Math.round(amount * 0.02 * 1.18);
      groupedData[groupKey].fees += fee;
      groupedData[groupKey].netAmount += (amount - fee);
    }
    if (isFailed) {
      groupedData[groupKey].failedCount += 1;
    }
    if (isRefunded) {
      groupedData[groupKey].refundedCount += 1;
      groupedData[groupKey].refundAmount += refAmt;
      groupedData[groupKey].netAmount -= refAmt;
    }
  });

  const reportRows = Object.values(groupedData).sort((a, b) => b.date.localeCompare(a.date));

  // Export clean CSV without secrets
  const handleExportCSV = () => {
    if (reportRows.length === 0) return;

    const headers = ['Period/Date', 'Total Orders', 'Successful Payments', 'Failed Payments', 'Refunded Payments', 'Gross Amount (INR)', 'Refunded Amount (INR)', 'Estimated Fees (INR)', 'Net Settlement (INR)'];
    const csvLines = [headers.join(',')];

    reportRows.forEach((r) => {
      csvLines.push([
        r.date,
        r.ordersCount,
        r.successfulCount,
        r.failedCount,
        r.refundedCount,
        r.grossAmount,
        r.refundAmount,
        r.fees,
        r.netAmount
      ].join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvLines.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `ELECTRO_STORE_Payment_Report_${reportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const totalGross = reportRows.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalNet = reportRows.reduce((sum, r) => sum + r.netAmount, 0);
  const totalRefunds = reportRows.reduce((sum, r) => sum + r.refundAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Reconciliation Reports</h2>
            <p className="text-xs text-slate-500">Aggregated financial statements, gateway deductions, and net collection summaries.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setReportPeriod('daily')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${reportPeriod === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setReportPeriod('weekly')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${reportPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setReportPeriod('monthly')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${reportPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={reportRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Gross Volume</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalGross.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Refund Deductions</span>
          <div className="text-2xl font-black text-rose-700 mt-1">₹{totalRefunds.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Net Realized</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalNet.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            <RefreshCw className="animate-spin inline-block mr-2" size={18} />
            Compiling financial reports...
          </div>
        ) : reportRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileSpreadsheet className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-slate-700">No report data for this period</p>
            <p className="text-xs text-slate-400 mt-1">Payment transactions will automatically compute into this report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Period / Date</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Captured</th>
                  <th className="py-3.5 px-4">Failed</th>
                  <th className="py-3.5 px-4">Refunded</th>
                  <th className="py-3.5 px-4">Gross Collected</th>
                  <th className="py-3.5 px-4">Refunds</th>
                  <th className="py-3.5 px-4">Est. Fees</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Net Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRows.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {r.date}
                    </td>
                    <td className="py-3.5 px-4">{r.ordersCount}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">{r.successfulCount}</td>
                    <td className="py-3.5 px-4 text-rose-600">{r.failedCount}</td>
                    <td className="py-3.5 px-4 text-purple-700">{r.refundedCount}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{Number(r.grossAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-rose-600">₹{Number(r.refundAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-500">₹{Number(r.fees || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">₹{Number(r.netAmount || 0).toLocaleString('en-IN')}</td>
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
