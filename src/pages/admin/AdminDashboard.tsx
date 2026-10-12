import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Headphones,
  CreditCard,
  ChevronRight,
  Plus,
  Store,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface AdminDashboardProps {
  onNavigateTab?: (tab: string, params?: any) => void;
}

// In-memory cache for dashboard data to ensure zero-lag tab transitions
const cachedDashboardData: Record<string, any> = {};
const cachedDashboardTimestamps: Record<string, number> = {};

export function AdminDashboard({ onNavigateTab }: AdminDashboardProps) {
  const { settings } = useSiteSettings();
  const shortStoreName = settings.general?.shortStoreName || settings.general?.storeName?.split(' ')[0] || 'Store';
  const currencySymbol = settings.general?.currencySymbol || '₹';

  const [rangePreset, setRangePreset] = useState('last_30_days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const cacheKey = `${rangePreset}-${customStart}-${customEnd}`;

  const [data, setData] = useState<any>(() => cachedDashboardData[cacheKey] || null);
  const [loading, setLoading] = useState<boolean>(() => !cachedDashboardData[cacheKey]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (force = false) => {
    // Reuse warm cache if fresher than 45 seconds unless user manually refreshes
    if (!force && cachedDashboardData[cacheKey] && Date.now() - (cachedDashboardTimestamps[cacheKey] || 0) < 45000) {
      setData(cachedDashboardData[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      if (cachedDashboardData[cacheKey]) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        rangePreset,
        startDate: customStart,
        endDate: customEnd
      });

      const res = await fetch(`/api/admin/analytics/overview?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch analytics`);
      const json = await res.json();

      cachedDashboardData[cacheKey] = json;
      cachedDashboardTimestamps[cacheKey] = Date.now();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching admin dashboard metrics:', err);
      setError(err?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rangePreset, customStart, customEnd, cacheKey]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Derived Metrics & Aggregations
  const metrics = data?.metrics || {};
  const deltas = data?.deltas || {};
  const orderBreakdown = metrics?.orderStatusBreakdown || {};
  const rawOrders: any[] = useMemo(() => Array.isArray(data?.rawOrders) ? data.rawOrders : [], [data?.rawOrders]);
  const rawProducts: any[] = useMemo(() => Array.isArray(data?.rawProducts) ? data.rawProducts : [], [data?.rawProducts]);
  const salesTrend = useMemo(() => Array.isArray(data?.salesTimeSeries) ? data.salesTimeSeries : [], [data?.salesTimeSeries]);

  // Calculate Today's specific metrics directly from real orders
  const { todaySales, todayOrdersCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    let count = 0;
    let sales = 0;

    rawOrders.forEach((o: any) => {
      let t = 0;
      if (o.createdAt?.toMillis) t = o.createdAt.toMillis();
      else if (o.createdAt?.seconds) t = o.createdAt.seconds * 1000;
      else if (o.createdAt) t = new Date(o.createdAt).getTime();

      if (t >= startOfToday) {
        count++;
        if (o.status !== 'cancelled' && o.status !== 'returned') {
          sales += Number(o.grandTotal || o.totalAmount || 0);
        }
      }
    });

    return { todaySales: sales, todayOrdersCount: count };
  }, [rawOrders]);

  // Inventory Alerts
  const { outOfStockList, lowStockList } = useMemo(() => {
    const oos: any[] = [];
    const low: any[] = [];

    rawProducts.forEach((p: any) => {
      const stock = Number(p.stock ?? (p.inStock ? 10 : 0));
      const threshold = Number(p.lowStockThreshold || 5);
      if (stock <= 0) {
        oos.push(p);
      } else if (stock <= threshold) {
        low.push(p);
      }
    });

    return { outOfStockList: oos, lowStockList: low };
  }, [rawProducts]);

  // Payment & Support alerts
  const paymentMismatches: any[] = useMemo(() => Array.isArray(data?.reconciliationMismatches) ? data.reconciliationMismatches : [], [data?.reconciliationMismatches]);
  const failedPaymentsCount = metrics?.failedPayments || 0;
  const recentTickets: any[] = useMemo(() => Array.isArray(data?.recentTickets) ? data.recentTickets : [], [data?.recentTickets]);
  const pendingOrdersCount = orderBreakdown.pending || 0;
  const processingOrdersCount = orderBreakdown.processing || 0;

  // Format INR Currency
  const formatINR = (val: number) => `${currencySymbol}${Number(val || 0).toLocaleString('en-IN')}`;

  // Current Date String for Compact Header
  const currentDateStr = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return new Date().toDateString();
    }
  }, []);

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
    processing: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
    shipped: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
    delivered: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
    returned: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800', dot: 'bg-slate-500' }
  };

  const renderDelta = (val: number | null | undefined) => {
    if (val === undefined || val === null) return null;
    const isPos = val >= 0;
    return (
      <span
        className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
          isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
      >
        {isPos ? <ArrowUpRight size={11} className="mr-0.5" /> : <ArrowDownRight size={11} className="mr-0.5" />}
        {Math.abs(val)}%
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse max-w-7xl mx-auto pb-12">
        <div className="h-14 bg-white rounded-xl border border-slate-200 p-4"></div>
        <div className="h-20 bg-white rounded-xl border border-slate-200 p-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="h-3 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-28 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-xl border border-slate-200"></div>
          <div className="h-72 bg-white rounded-xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* 1. TOP HEADER (Compact & Functional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Dashboard</span>
              <span className="hidden sm:inline-block text-xs font-normal text-slate-400">|</span>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-500">{shortStoreName} Store</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>{currentDateStr}</span>
            </p>
          </div>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
            <select
              value={rangePreset}
              onChange={(e) => setRangePreset(e.target.value)}
              className="bg-transparent text-slate-700 font-medium px-2 py-1 outline-none cursor-pointer text-xs"
              aria-label="Select date range"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {rangePreset === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 p-1 rounded-lg border border-slate-200">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
              <span className="text-slate-400 text-[10px]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>
          )}

          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer min-h-[34px]"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchDashboardData(true)} className="underline font-bold text-rose-900 hover:text-rose-950 ml-3">
            Retry
          </button>
        </div>
      )}

      {/* 2. QUICK ACTIONS (Compact & Functional) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</span>
          <span className="text-[11px] text-slate-400">Primary store shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigateTab && onNavigateTab('products', { openAddModal: true })}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
          >
            <Plus size={15} />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('orders')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
          >
            <ShoppingCart size={15} className="text-slate-500" />
            <span>New Order</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('pos')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
          >
            <Store size={15} className="text-emerald-600" />
            <span>Counter Billing</span>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('customers')}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-50/70 hover:bg-purple-100/70 text-purple-700 border border-purple-200/80 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px]"
          >
            <Users size={15} className="text-purple-600" />
            <span>View Customers</span>
          </button>
        </div>
      </div>

      {/* 3. BUSINESS OVERVIEW (4 Core KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Today's Sales */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatINR(todaySales)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{todayOrdersCount} order{todayOrdersCount === 1 ? '' : 's'} today</span>
              {renderDelta(deltas.grossRevenue)}
            </div>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.totalOrders || rawOrders.length || 0}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className={pendingOrdersCount > 0 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                {pendingOrdersCount > 0 ? `${pendingOrdersCount} pending fulfillment` : 'All caught up'}
              </span>
              <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                View &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Customers */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('customers')}
          className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
              Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.totalCustomers || 0}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Registered accounts</span>
              <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform">
                Manage &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Products */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('products')}
          className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
              Products
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {rawProducts.length || metrics.totalProducts || 0}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className={outOfStockList.length > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                {outOfStockList.length > 0 ? `${outOfStockList.length} out of stock` : 'Catalog active'}
              </span>
              <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">
                Catalog &rarr;
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. SALES CHART & ORDER STATUS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sales Revenue Trend</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Period Revenue: <strong className="text-slate-700 font-semibold">{formatINR(metrics.grossRevenue)}</strong>
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              Avg Order: <strong className="text-slate-800 font-bold">{formatINR(metrics.avgOrderValue)}</strong>
            </div>
          </div>

          <div className="h-64 w-full">
            {salesTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs bg-slate-50/50 rounded-lg">
                No revenue records found for selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardSalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '8px 12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#dashboardSalesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status Breakdown (1 col on lg) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Order Overview</h2>
              <button
                onClick={() => onNavigateTab && onNavigateTab('orders')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                All Orders
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">Current order fulfillment status</p>

            <div className="space-y-2.5">
              {[
                { label: 'Pending', key: 'pending', count: orderBreakdown.pending || 0, color: 'bg-amber-500' },
                { label: 'Processing', key: 'processing', count: orderBreakdown.processing || 0, color: 'bg-indigo-500' },
                { label: 'Shipped', key: 'shipped', count: orderBreakdown.shipped || 0, color: 'bg-purple-500' },
                { label: 'Delivered', key: 'delivered', count: orderBreakdown.delivered || 0, color: 'bg-emerald-500' },
                { label: 'Cancelled / Returned', key: 'cancelled', count: (orderBreakdown.cancelled || 0) + (orderBreakdown.returned || 0), color: 'bg-rose-500' }
              ].map((item) => {
                const total = metrics.totalOrders || rawOrders.length || 1;
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div
                    key={item.label}
                    onClick={() => onNavigateTab && onNavigateTab('orders', { statusFilter: item.key })}
                    className="p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                        <span>{item.label}</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Payment Success: <strong className="text-emerald-700 font-bold">{metrics.paymentSuccessRate ? `${Math.round(metrics.paymentSuccessRate)}%` : '100%'}</strong></span>
            <span>Total Orders: <strong className="text-slate-900 font-bold">{metrics.totalOrders || rawOrders.length || 0}</strong></span>
          </div>
        </div>

      </div>

      {/* 5. RECENT ORDERS & OPERATIONAL ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table / List (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart size={15} className="text-blue-600" />
                <span>Recent Orders</span>
              </h2>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('orders')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            {rawOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-lg">
                No customer orders recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {rawOrders.slice(0, 6).map((o: any) => {
                  const orderDate = o.createdAt
                    ? typeof o.createdAt === 'string'
                      ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                      : new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Recent';

                  const st = (o.status || 'pending').toLowerCase();
                  const style = statusColors[st] || { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' };

                  return (
                    <div
                      key={o.id}
                      onClick={() => onNavigateTab && onNavigateTab('orders')}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-lg transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                          #{String(o.id).slice(-4).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">
                            {o.customerName || o.shippingAddress?.fullName || 'Customer'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {orderDate} • {Array.isArray(o.items) ? `${o.items.length} item(s)` : 'Order'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-900">
                          {formatINR(o.grandTotal || o.totalAmount)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                          <span>{st}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing latest {Math.min(6, rawOrders.length)} orders</span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('orders')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Open Orders Manager &rarr;
            </button>
          </div>
        </div>

        {/* Actionable Alerts Column (1 col on lg) */}
        <div className="space-y-4">
          
          {/* Inventory Alerts Card */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes size={14} className="text-amber-500" />
                <span>Inventory Alerts</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                outOfStockList.length > 0
                  ? 'bg-rose-100 text-rose-800'
                  : lowStockList.length > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {outOfStockList.length + lowStockList.length === 0 ? 'All Stock Healthy' : `${outOfStockList.length + lowStockList.length} Items`}
              </span>
            </div>

            {outOfStockList.length === 0 && lowStockList.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center gap-2 justify-center">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>All stock levels are optimal.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {[...outOfStockList, ...lowStockList].slice(0, 4).map((p: any) => {
                  const stock = Number(p.stock ?? 0);
                  const isOOS = stock <= 0;
                  return (
                    <div key={p.id} className="p-2 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                      <div className="truncate mr-2">
                        <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.sku || p.category || 'SKU'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isOOS ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isOOS ? '0 Stock' : `${stock} left`}
                        </span>
                        {onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('inventory')}
                            className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            Restock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{rawProducts.length} total SKUs</span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Manage Inventory &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Payment & Support Alerts Card */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-indigo-600" />
                <span>System & Support Alerts</span>
              </h3>
            </div>

            <div className="space-y-2">
              {/* Payment Alert item */}
              {paymentMismatches.length > 0 || failedPaymentsCount > 0 ? (
                <div
                  onClick={() => onNavigateTab && onNavigateTab('payments')}
                  className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard size={14} className="text-amber-700 shrink-0" />
                    <span className="text-amber-900 font-medium truncate">
                      {paymentMismatches.length > 0 ? `${paymentMismatches.length} payment mismatch(es)` : `${failedPaymentsCount} failed payment(s)`}
                    </span>
                  </div>
                  <span className="text-amber-800 font-bold text-[10px] shrink-0">Review</span>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-slate-50 text-xs flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Payments reconciled & clean</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">Active</span>
                </div>
              )}

              {/* Support Alert item */}
              {recentTickets.length > 0 ? (
                <div
                  onClick={() => onNavigateTab && onNavigateTab('support')}
                  className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs flex items-center justify-between cursor-pointer hover:bg-purple-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Headphones size={14} className="text-purple-700 shrink-0" />
                    <span className="text-purple-900 font-medium truncate">
                      {recentTickets.length} open customer inquiry ticket(s)
                    </span>
                  </div>
                  <span className="text-purple-800 font-bold text-[10px] shrink-0">Reply</span>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-slate-50 text-xs flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>No pending support tickets</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">All Good</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Customer communications</span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('support')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Customer Support &rarr;
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
