import React from 'react';
import {
  DollarSign, TrendingUp, ShoppingCart, Package, Users, CheckCircle, AlertTriangle,
  XCircle, Clock, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldAlert, ArrowRight, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';

interface OverviewTabProps {
  data: any;
  onNavigateTab: (tab: string, filterState?: any) => void;
}

export function OverviewTab({ data, onNavigateTab }: OverviewTabProps) {
  if (!data) return <div className="p-8 text-slate-500">Loading analytics...</div>;

  const { metrics, deltas, salesTimeSeries, healthAlerts, reconciliationMismatches, range } = data;

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const renderDeltaBadge = (deltaVal: number | null | undefined) => {
    if (deltaVal === undefined || deltaVal === null) return null;
    const isPositive = deltaVal >= 0;
    return (
      <span
        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
          isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}
      >
        {isPositive ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
        {Math.abs(deltaVal)}%
      </span>
    );
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatINR(metrics.grossRevenue),
      delta: deltas?.grossRevenue,
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
      onClick: () => onNavigateTab('sales')
    },
    {
      title: 'Net Revenue',
      value: formatINR(metrics.netRevenue),
      delta: deltas?.netRevenue,
      icon: TrendingUp,
      color: 'bg-blue-600 text-white',
      onClick: () => onNavigateTab('sales')
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      delta: deltas?.totalOrders,
      icon: ShoppingCart,
      color: 'bg-indigo-600 text-white',
      onClick: () => onNavigateTab('orders')
    },
    {
      title: 'Avg Order Value',
      value: formatINR(metrics.avgOrderValue),
      delta: deltas?.avgOrderValue,
      icon: TrendingUp,
      color: 'bg-purple-600 text-white',
      onClick: () => onNavigateTab('sales')
    },
    {
      title: 'Products Sold',
      value: metrics.productsSold,
      delta: deltas?.productsSold,
      icon: Package,
      color: 'bg-amber-600 text-white',
      onClick: () => onNavigateTab('products')
    },
    {
      title: 'Successful Payments',
      value: metrics.successfulPayments,
      delta: deltas?.successfulPayments,
      icon: CheckCircle,
      color: 'bg-emerald-600 text-white',
      onClick: () => onNavigateTab('payments')
    },
    {
      title: 'Failed Payments',
      value: metrics.failedPayments,
      delta: null,
      icon: XCircle,
      color: 'bg-rose-600 text-white',
      onClick: () => onNavigateTab('payments', { status: 'failed' })
    },
    {
      title: 'Pending Payments',
      value: metrics.pendingPayments,
      delta: null,
      icon: Clock,
      color: 'bg-orange-500 text-white',
      onClick: () => onNavigateTab('payments', { status: 'pending' })
    },
    {
      title: 'Refund Amount',
      value: formatINR(metrics.refundAmount),
      delta: deltas?.refundAmount,
      icon: RefreshCw,
      color: 'bg-rose-500 text-white',
      onClick: () => onNavigateTab('payments', { tab: 'refunds' })
    },
    {
      title: 'Cancelled Orders',
      value: metrics.orderStatusCounts.cancelled?.count || 0,
      delta: null,
      icon: AlertTriangle,
      color: 'bg-slate-700 text-white',
      onClick: () => onNavigateTab('orders', { status: 'cancelled' })
    },
    {
      title: 'Delivered Orders',
      value: metrics.orderStatusCounts.delivered?.count || 0,
      delta: null,
      icon: CheckCircle,
      color: 'bg-teal-600 text-white',
      onClick: () => onNavigateTab('orders', { status: 'delivered' })
    },
    {
      title: 'Low Stock Products',
      value: data.inventory?.lowStockSKUs || 0,
      delta: null,
      icon: ShieldAlert,
      color: 'bg-amber-500 text-white',
      onClick: () => onNavigateTab('inventory', { filter: 'low_stock' })
    }
  ];

  return (
    <div className="space-y-8">
      {/* 1. Health & Reconciliation Alerts Banner */}
      {healthAlerts && healthAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" /> Business Health & Action Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
                  alert.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                  <p className="text-xs opacity-90">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Top Executive KPI Grid */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-900">Key Business Performance Metrics</h3>
          {range.comparisonPreset !== 'none' && (
            <span className="text-xs text-slate-500 italic">
              Comparing against {range.comparisonPreset.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                onClick={kpi.onClick}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                    <Icon size={20} />
                  </div>
                  {renderDeltaBadge(kpi.delta)}
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {kpi.value}
                </h3>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Revenue Breakdown & Order Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Accounting Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue & Accounting Breakdown</h3>
              <p className="text-xs text-slate-500">Official Gross vs. Net revenue separation (GST excluded from earnings)</p>
            </div>
            <FileText className="text-slate-400" size={20} />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Gross Product Sales</span>
              <span className="font-semibold text-slate-900">{formatINR(metrics.grossSales)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Coupons & Order Discounts</span>
              <span className="font-semibold text-rose-600">- {formatINR(metrics.discounts)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Shipping Charges Collected</span>
              <span className="font-semibold text-slate-900">+ {formatINR(metrics.shipping)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200 bg-slate-50 px-3 rounded-lg">
              <span className="text-slate-900 font-bold">Gross Business Revenue</span>
              <span className="font-bold text-slate-900">{formatINR(metrics.grossRevenue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Refunds Processed</span>
              <span className="font-semibold text-rose-600">- {formatINR(metrics.refundAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-emerald-50 px-3 rounded-lg border border-emerald-200">
              <span className="text-emerald-900 font-black">Net Realized Revenue</span>
              <span className="font-black text-emerald-900 text-lg">{formatINR(metrics.netRevenue)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 pt-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">GST / Tax Collected (Passed to Govt):</span>
              <span className="font-bold text-amber-700">{formatINR(metrics.tax)}</span>
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Order Distribution Status</h3>
              <p className="text-xs text-slate-500">Click any status row to view orders in Order Management</p>
            </div>
            <ShoppingCart className="text-slate-400" size={20} />
          </div>

          <div className="space-y-2">
            {Object.entries(metrics.orderStatusCounts || {}).map(([statusKey, stData]: [string, any]) => {
              const count = stData.count || 0;
              const val = stData.value || 0;
              const pct = metrics.totalOrders > 0 ? ((count / metrics.totalOrders) * 100).toFixed(1) : '0';

              return (
                <div
                  key={statusKey}
                  onClick={() => onNavigateTab('orders', { status: statusKey })}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-slate-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                    <span className="text-xs font-bold text-slate-800 capitalize">{statusKey}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500 font-medium">{pct}% ({count})</span>
                    <span className="font-bold text-slate-900">{formatINR(val)}</span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Sales Trend & Financial Charts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue & Order Trend Analysis</h3>
            <p className="text-xs text-slate-500">Real-time performance aggregated by selected timeframe</p>
          </div>
        </div>

        {salesTimeSeries && salesTimeSeries.length > 0 ? (
          <div className="space-y-8">
            {/* Revenue Area Chart */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Revenue Over Time (₹)</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTimeSeries}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders & Payments Bar Chart */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Successful vs Failed Payments</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successfulPayments" name="Successful Payments" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failedPayments" name="Failed Payments" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-medium">
            No sales data available for this period.
          </div>
        )}
      </div>

      {/* 5. Financial Reconciliation Section */}
      {reconciliationMismatches && reconciliationMismatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
          <h3 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
            <ShieldAlert size={18} /> Financial Reconciliation Audit Mismatches
          </h3>
          <p className="text-xs text-amber-800 mb-4">
            The system flagged the following order and payment status inconsistencies that require manual review:
          </p>
          <div className="space-y-2">
            {reconciliationMismatches.map((m: any) => (
              <div key={m.id} className="bg-white p-3 rounded-lg border border-amber-300 text-xs text-amber-950 flex justify-between items-center">
                <span>{m.message}</span>
                <button
                  onClick={() => onNavigateTab('payments')}
                  className="px-2.5 py-1 bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
                >
                  Review Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
