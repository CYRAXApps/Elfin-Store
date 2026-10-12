import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  Receipt, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Banknote,
  QrCode,
  CreditCard,
  Eye,
  Calendar,
  User,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Filter,
  Layers,
  X
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { ReturnOrderModal } from '../orders/OrderActionModals';
import { PosInvoiceModal } from './PosInvoiceModal';
import { useSiteSettings, defaultPosSettings, type PosSettings } from '../../../context/SiteSettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { hasStaffPermission } from '../../../utils/staffPermissions';

interface PosSalesHistoryProps {
  onNewSaleClick?: () => void;
}

export const PosSalesHistory: React.FC<PosSalesHistoryProps> = ({ onNewSaleClick }) => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const posSettings: PosSettings = { ...defaultPosSettings, ...(settings.pos || {}) };
  const canManageReturns = hasStaffPermission(user, 'pos_manage_returns');
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'returned'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'upi' | 'card' | 'split'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  
  // Selected order for viewing/printing invoice details
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<any | null>(null);
  
  // Selected order for processing return
  const [returnOrder, setReturnOrder] = useState<any | null>(null);
  const [returning, setReturning] = useState<boolean>(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pos/recent-sales');
      if (res.ok) {
        const data = await res.json();
        // Ensure sorted newest first
        const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setSales(sorted);
      }
    } catch (err) {
      console.error('Failed to load recent POS sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial fetch from API
    fetchSales();

    // 2. Real-time Firestore synchronization on orders collection
    try {
      const q = query(
        collection(db, 'orders'),
        where('orderSource', '==', 'pos')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const liveOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          liveOrders.sort((a: any, b: any) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime());
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime());
            return dateB - dateA;
          });
          setSales(liveOrders);
          setLoading(false);
        }
      }, (err) => {
        console.warn('Real-time listener fallback to API:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore subscription fallback:', e);
    }
  }, []);

  // Filter sales based on search query, status, payment method, payment status, and date bounds
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 1. Search Query filter (Invoice ID, Customer name, phone, email, item name, payment method)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const invMatch = (sale.invoiceNumber || sale.id || '').toLowerCase().includes(q);
        const custNameMatch = (sale.customerName || sale.shippingAddress?.fullName || '').toLowerCase().includes(q);
        const custPhoneMatch = (sale.customerPhone || sale.shippingAddress?.phone || '').toLowerCase().includes(q);
        const custEmailMatch = (sale.customerEmail || sale.shippingAddress?.email || sale.userId || '').toLowerCase().includes(q);
        const methodMatch = (sale.paymentMethod || sale.payment?.paymentMethod || sale.payment?.provider || '').toLowerCase().includes(q);
        const itemMatch = Array.isArray(sale.items) && sale.items.some((i: any) => (i.name || '').toLowerCase().includes(q));

        if (!invMatch && !custNameMatch && !custPhoneMatch && !custEmailMatch && !methodMatch && !itemMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'returned' && sale.status !== 'returned') return false;
      if (statusFilter === 'delivered' && sale.status === 'returned') return false;

      // 3. Payment Method Filter
      if (paymentMethodFilter !== 'all') {
        const method = (sale.paymentMethod || sale.payment?.paymentMethod || sale.payment?.provider || '').toLowerCase();
        if (!method.includes(paymentMethodFilter)) return false;
      }

      // 4. Payment Status Filter
      if (paymentStatusFilter !== 'all') {
        const payStatus = (sale.payment?.paymentStatus || sale.paymentStatus || 'paid').toLowerCase();
        if (paymentStatusFilter === 'paid' && payStatus !== 'paid' && payStatus !== 'captured') return false;
        if (paymentStatusFilter === 'pending' && payStatus !== 'pending') return false;
        if (paymentStatusFilter === 'refunded' && payStatus !== 'refunded' && payStatus !== 'partially_refunded' && sale.status !== 'returned') return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'all') {
        const saleDate = sale.createdAt?.toDate 
          ? sale.createdAt.toDate() 
          : (sale.createdAt?.toMillis ? new Date(sale.createdAt.toMillis()) : new Date(sale.createdAt || 0));
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        if (dateFilter === 'today') {
          if (saleDate < startOfToday || saleDate > endOfToday) return false;
        } else if (dateFilter === 'yesterday') {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          const endOfYesterday = new Date(endOfToday);
          endOfYesterday.setDate(endOfYesterday.getDate() - 1);
          if (saleDate < startOfYesterday || saleDate > endOfYesterday) return false;
        } else if (dateFilter === 'last_7_days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (saleDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          if (saleDate < startOfMonth) return false;
        } else if (dateFilter === 'custom' && customDate) {
          const customStart = new Date(`${customDate}T00:00:00`);
          const customEnd = new Date(`${customDate}T23:59:59.999`);
          if (saleDate < customStart || saleDate > customEnd) return false;
        }
      }

      return true;
    });
  }, [sales, searchQuery, statusFilter, paymentMethodFilter, paymentStatusFilter, dateFilter, customDate]);

  // Overall Statistics from filtered sales
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalItems = 0;
    let completedCount = 0;
    let returnedCount = 0;

    filteredSales.forEach((s) => {
      const amt = Number(s.grandTotal || s.totalAmount || 0);
      if (s.status === 'returned') {
        returnedCount += 1;
      } else {
        completedCount += 1;
        totalRevenue += amt;
      }
      const count = (s.items || []).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
      totalItems += count;
    });

    return { totalRevenue, totalItems, completedCount, returnedCount };
  }, [filteredSales]);

  // Handler for Return confirmation via existing return/refund system
  const handleConfirmReturn = async (reason: string, restock: boolean) => {
    if (!returnOrder) return;
    setReturning(true);

    try {
      const orderRef = doc(db, 'orders', returnOrder.id);
      await updateDoc(orderRef, {
        status: 'returned',
        'payment.paymentStatus': 'refunded',
        returnReason: reason,
        returnedAt: serverTimestamp(),
        shippingStatus: 'returned',
        updatedAt: serverTimestamp()
      });

      // Restock inventory directly in existing products collection as single source of truth
      if (restock && returnOrder.items && Array.isArray(returnOrder.items)) {
        for (const item of returnOrder.items) {
          if (item.productId) {
            try {
              const pRef = doc(db, 'products', item.productId);
              await updateDoc(pRef, {
                stock: increment(item.quantity || 1),
                availableStock: increment(item.quantity || 1),
                inStock: true,
                updatedAt: serverTimestamp()
              });
            } catch (pErr) {
              console.warn('Product restock warning:', item.productId, pErr);
            }
          }
        }
      }

      // Record in existing inventory ledger / audit API
      try {
        if (restock && returnOrder.items && Array.isArray(returnOrder.items)) {
          for (const item of returnOrder.items) {
            if (item.productId) {
              await fetch('/api/admin/inventory/returns/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: returnOrder.invoiceNumber || returnOrder.id,
                  productId: item.productId,
                  quantity: item.quantity || 1,
                  disposition: 'restock',
                  notes: reason,
                  createdBy: 'POS Counter'
                })
              });
            }
          }
        }
      } catch (auditErr) {
        console.warn('Ledger return audit note:', auditErr);
      }

      // Update local state
      setSales(prev => prev.map(s => s.id === returnOrder.id ? { 
        ...s, 
        status: 'returned', 
        returnReason: reason,
        payment: { ...(s.payment || {}), paymentStatus: 'refunded' }
      } : s));

      alert(`✅ Return processed for Order #${returnOrder.invoiceNumber || returnOrder.id}.${restock ? ' Product stock has been restored in inventory.' : ''}`);
      setReturnOrder(null);
    } catch (err: any) {
      console.error('Return processing error:', err);
      alert(err.message || 'Failed to process return');
    } finally {
      setReturning(false);
    }
  };

  const formatDateTime = (val: any) => {
    if (!val) return '—';
    try {
      const d = val.toDate ? val.toDate() : new Date(val);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch ((method || '').toLowerCase()) {
      case 'cash':
        return <Banknote size={13} className="text-emerald-600" />;
      case 'upi':
        return <QrCode size={13} className="text-purple-600" />;
      case 'card':
        return <CreditCard size={13} className="text-blue-600" />;
      case 'split':
        return <Layers size={13} className="text-purple-600" />;
      default:
        return <Receipt size={13} className="text-slate-600" />;
    }
  };

  const renderPaymentStatusBadge = (paymentStatus: string, orderStatus: string) => {
    const norm = (paymentStatus || '').toLowerCase();
    if (orderStatus === 'returned' || norm === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <RotateCcw size={10} /> Refunded
        </span>
      );
    }
    if (norm === 'paid' || norm === 'captured') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} /> Paid
        </span>
      );
    }
    if (norm === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
          <AlertCircle size={10} /> Pending
        </span>
      );
    }
    if (norm === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle size={10} /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700">
        {paymentStatus || 'Paid'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Quick Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">POS Sales</p>
            <p className="text-lg font-black text-slate-900">{filteredSales.length}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</p>
            <p className="text-lg font-black text-emerald-600 font-mono">₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Units Sold</p>
            <p className="text-lg font-black text-slate-900">{stats.totalItems}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Returns</p>
            <p className="text-lg font-black text-amber-700">{stats.returnedCount}</p>
          </div>
        </div>
      </div>

      {/* 2. Top Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Sale ID, Customer, Phone, or Date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <CreditCard size={13} className="text-slate-500 shrink-0" />
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
                aria-label="Filter POS sales by payment method"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="split">Split</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <DollarSign size={13} className="text-slate-500 shrink-0" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                aria-label="Filter POS sales by payment status"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Date Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar size={13} className="text-slate-500 shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                aria-label="Filter POS sales by date range"
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {/* Custom Date Picker Input if custom is chosen */}
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                aria-label="Choose custom date filter"
                className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            )}

            {/* Status Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'delivered' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('returned')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'returned' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Returned
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchSales}
              disabled={loading}
              title="Refresh Sales"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sales History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Invoice / Sale ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Staff</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                    <span>Loading sales history...</span>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ShoppingBag size={28} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No POS sales found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || dateFilter !== 'all' ? 'Try adjusting your search or date filter' : 'Completed counter sales will appear here in real time'}
                    </p>
                    {onNewSaleClick && (
                      <button
                        onClick={onNewSaleClick}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        Start Counter Billing
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isReturned = sale.status === 'returned';
                  const paymentMethod = sale.payment?.paymentMethod || 'cash';
                  const paymentStatus = sale.payment?.paymentStatus || 'paid';
                  const itemsCount = (sale.items || []).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                  const itemsSummary = (sale.items || []).map((i: any) => `${i.name} (x${i.quantity || 1})`).join(', ');

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Invoice / Sale ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <button
                          onClick={() => setViewInvoiceOrder(sale)}
                          className="hover:text-blue-600 hover:underline cursor-pointer text-left flex items-center gap-1.5"
                          title="Click to view full sale invoice & details"
                        >
                          <Receipt size={13} className="text-blue-600 shrink-0" />
                          <span>{sale.invoiceNumber || sale.id}</span>
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(sale.createdAt)}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{sale.customerName || 'Walk-in Customer'}</span>
                              {(!sale.customerName || sale.customerName === 'Walk-in Customer') && (
                                <span className="text-[9.5px] px-1 py-0.2 bg-slate-100 text-slate-600 font-semibold rounded">
                                  Walk-in
                                </span>
                              )}
                            </div>
                            {sale.customerPhone && (
                              <p className="text-[10px] text-slate-400 font-mono">{sale.customerPhone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="truncate" title={itemsSummary}>
                          <span className="font-bold text-slate-900">{itemsCount} unit{itemsCount > 1 ? 's' : ''}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5">({itemsSummary})</span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{Number(sale.grandTotal || sale.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {paymentMethod === 'split' || (Array.isArray(sale.payment?.splitDetails) && sale.payment.splitDetails.length > 0) ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Layers size={11} className="text-purple-600" />
                              Split Payment
                            </span>
                            {Array.isArray(sale.payment?.splitDetails) && sale.payment.splitDetails.length > 0 && (
                              <span className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                                {sale.payment.splitDetails.map((p: any) => `${(p.method || 'payment').toUpperCase()}: ₹${Number(p.amount || 0).toLocaleString('en-IN')}`).join(' + ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {getPaymentIcon(paymentMethod)}
                            {paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Staff */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">
                          {sale.cashier?.name || sale.cashier?.email || sale.staffName || 'Ritam Saha'}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderPaymentStatusBadge(paymentStatus, sale.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Sale / Invoice */}
                          <button
                            onClick={() => setViewInvoiceOrder(sale)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                            title="View / Print Invoice"
                          >
                            <Eye size={13} />
                            <span>Invoice</span>
                          </button>

                          {/* Process Return (connected to existing return system) */}
                          {!isReturned && posSettings.enablePosReturns !== false && canManageReturns && (() => {
                            const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt || 0);
                            const daysSinceSale = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
                            const returnWindowDays = posSettings.returnWindowDays || 7;
                            const isWithinWindow = daysSinceSale <= returnWindowDays;

                            return (
                              <button
                                onClick={() => isWithinWindow && setReturnOrder(sale)}
                                disabled={!isWithinWindow}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                  isWithinWindow
                                    ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 cursor-pointer'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                }`}
                                title={
                                  isWithinWindow
                                    ? 'Process Customer Return & Restock Inventory'
                                    : `Return window expired (${daysSinceSale} days > max ${returnWindowDays} days)`
                                }
                              >
                                <RotateCcw size={13} />
                                <span>Return</span>
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details & Invoice Modal (Reusing existing Step 2 UI) */}
      {viewInvoiceOrder && (
        <PosInvoiceModal
          order={viewInvoiceOrder}
          onClose={() => setViewInvoiceOrder(null)}
          onNewSale={() => {
            setViewInvoiceOrder(null);
            if (onNewSaleClick) onNewSaleClick();
          }}
        />
      )}

      {/* Existing ReturnOrderModal directly connected to inventory restock */}
      {returnOrder && (
        <ReturnOrderModal
          order={returnOrder}
          onConfirm={handleConfirmReturn}
          onClose={() => setReturnOrder(null)}
        />
      )}
    </div>
  );
};
export default PosSalesHistory;
