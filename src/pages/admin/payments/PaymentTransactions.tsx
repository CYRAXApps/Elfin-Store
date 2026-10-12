import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Download, 
  RefreshCw, 
  CreditCard, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Store, 
  Globe, 
  Receipt, 
  Package, 
  ArrowUpDown, 
  Split, 
  ShieldCheck, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  X,
  SlidersHorizontal,
  Wallet
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order, PaymentTransaction, PaymentStatusType } from '../../../types';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { InvoiceModal } from '../../../components/InvoiceModal';
import { PosInvoiceModal } from '../pos/PosInvoiceModal';
import { OrderDetailsModal } from '../orders/OrderDetailsModal';

interface PaymentTransactionsProps {
  initialStatusFilter?: string;
  onNavigateTab?: (tab: string, params?: any) => void;
}

export function PaymentTransactions({ initialStatusFilter = 'all', onNavigateTab }: PaymentTransactionsProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all'); // all, online, pos
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all'); // all, today, 7days, 30days
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  
  // Modals state
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [posInvoiceOrder, setPosInvoiceOrder] = useState<any | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Feedback states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Real-time synchronization of orders collection
  useEffect(() => {
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach((doc) => {
        ords.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ords);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching orders:', err);
      setLoading(false);
    });

    // Real-time synchronization of refunds collection
    const refundsQuery = query(collection(db, 'refunds'), orderBy('createdAt', 'desc'));
    const unsubRefunds = onSnapshot(refundsQuery, (snapshot) => {
      const refList: any[] = [];
      snapshot.forEach((doc) => {
        refList.push({ id: doc.id, ...doc.data() });
      });
      setRefunds(refList);
    }, (err) => {
      console.warn('Refunds collection read note:', err);
    });

    return () => {
      unsubOrders();
      unsubRefunds();
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/payments/reconcile', { method: 'POST' });
      if (res.ok) {
        setToastMessage('Payment status reconciled with backend gateway.');
      } else {
        setToastMessage('Live payment data refreshed.');
      }
    } catch {
      setToastMessage('Live payment data synchronized.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Helper date formatter
  const formatDate = (val: any) => {
    if (!val) return 'N/A';
    try {
      if (typeof val === 'string') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? val : d.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      return String(val);
    } catch {
      return 'N/A';
    }
  };

  // Canonical mapper from orders and refunds to standardized PaymentTransaction records
  const transactions: PaymentTransaction[] = useMemo(() => {
    return orders.map((order) => {
      const isPos = Boolean(
        order.orderSource === 'pos' || 
        order.id?.startsWith('pos_ord_') || 
        (order.invoiceNumber && order.invoiceNumber.includes('POS')) ||
        order.posInvoiceNumber
      );

      const matchedRefund = refunds.find(r => r.orderId === order.id);

      // Determine raw payment status
      const rawPaymentStatus = order.payment?.paymentStatus || 
        (order.status === 'confirmed' || order.status === 'delivered' || order.status === 'completed' ? 'captured' : 
         order.status === 'cancelled' ? 'failed' : 'pending');

      const isRefunded = 
        rawPaymentStatus === 'refunded' || 
        rawPaymentStatus === 'partially_refunded' || 
        (order.payment?.refundedAmount !== undefined && order.payment.refundedAmount > 0) ||
        Boolean(matchedRefund);

      let finalPaymentStatus: PaymentStatusType = rawPaymentStatus as PaymentStatusType;
      if (isRefunded) {
        const refAmt = order.payment?.refundedAmount || matchedRefund?.amount || 0;
        const totalAmt = Number(order.grandTotal || order.totalAmount || 0);
        finalPaymentStatus = (refAmt >= totalAmt && totalAmt > 0) ? 'refunded' : 'partially_refunded';
      } else if (order.status === 'cancelled' && rawPaymentStatus !== 'captured') {
        finalPaymentStatus = 'failed';
      } else if (order.status === 'confirmed' || order.status === 'delivered' || order.status === 'completed') {
        finalPaymentStatus = 'captured';
      }

      // Determine payment method label
      let methodLabel = 'Online Gateway';
      if (isPos) {
        const pm = order.payment?.paymentMethod || 'cash';
        if (pm === 'split' || (order.payment?.splitDetails && order.payment.splitDetails.length > 0)) {
          methodLabel = 'POS Split Payment';
        } else if (pm === 'cash') {
          methodLabel = 'POS Cash';
        } else if (pm === 'upi') {
          methodLabel = 'POS UPI';
        } else if (pm === 'card') {
          methodLabel = `POS Card (${order.payment?.cardType || 'Card'})`;
        } else {
          methodLabel = `POS (${pm.toUpperCase()})`;
        }
      } else {
        const prov = order.payment?.provider || order.payment?.paymentMethod || 'razorpay';
        if (prov === 'cod') {
          methodLabel = 'Cash on Delivery (COD)';
        } else if (prov === 'razorpay') {
          methodLabel = 'Razorpay UPI / Cards';
        } else {
          methodLabel = prov.toUpperCase();
        }
      }

      // Extract transaction ID
      const txId = isPos
        ? (order.posInvoiceNumber || order.payment?.posSaleId || order.payment?.reference || `POS-${order.id.slice(0, 8).toUpperCase()}`)
        : (order.payment?.razorpayPaymentId || order.payment?.transactionId || `PAY-${order.id.slice(0, 8).toUpperCase()}`);

      // Customer info
      const custName = order.customerName || order.shippingAddress?.fullName || 'Walk-in Customer';
      const custEmail = order.customerEmail || order.shippingAddress?.email || (order.userId ? `${order.userId.slice(0, 10)}...` : 'N/A');
      const custPhone = order.customerPhone || order.shippingAddress?.phone || 'N/A';

      // Split breakdown details
      const splitBreakdown = order.payment?.splitBreakdown;
      const splitDetails = order.payment?.splitDetails || (splitBreakdown ? [
        ...(splitBreakdown.cash ? [{ method: 'cash', amount: splitBreakdown.cash, reference: 'Cash at counter' }] : []),
        ...(splitBreakdown.upi ? [{ method: 'upi', amount: splitBreakdown.upi, reference: splitBreakdown.upiRef || 'UPI POS' }] : []),
        ...(splitBreakdown.card ? [{ method: 'card', amount: splitBreakdown.card, reference: splitBreakdown.cardType || 'Card POS', cardLast4: splitBreakdown.cardLast4 }] : [])
      ] : undefined);

      return {
        id: txId,
        orderId: order.id,
        isPos,
        posInvoiceNumber: order.posInvoiceNumber || (isPos ? order.invoiceNumber : undefined),
        invoiceNumber: order.invoiceNumber || (isPos ? order.posInvoiceNumber : `EST-${order.id.slice(0, 8).toUpperCase()}`),
        razorpayOrderId: order.payment?.razorpayOrderId,
        razorpayPaymentId: order.payment?.razorpayPaymentId,
        razorpaySignatureVerified: Boolean(order.payment?.verifiedAt || order.payment?.razorpaySignature),
        gatewayReferenceId: order.payment?.razorpayPaymentId || order.payment?.upiRef || order.payment?.reference,
        amount: Number(order.grandTotal || order.totalAmount || 0),
        currency: 'INR',
        paymentMethod: methodLabel,
        paymentStatus: finalPaymentStatus,
        orderStatus: order.status || (isPos ? 'completed' : 'pending'),
        customerName: custName,
        customerEmail: custEmail,
        customerPhone: custPhone,
        userId: order.userId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        capturedAt: order.payment?.verifiedAt || order.payment?.capturedAt || order.updatedAt || order.createdAt,
        refundStatus: isRefunded ? (finalPaymentStatus === 'partially_refunded' ? 'partially_refunded' : 'refunded') : 'none',
        refundedAmount: order.payment?.refundedAmount || matchedRefund?.amount || 0,
        refundId: order.payment?.refundId || matchedRefund?.id || (isRefunded ? `rfnd_${order.id.slice(0, 8)}` : undefined),
        refundDate: order.payment?.refundDate || matchedRefund?.createdAt,
        refundMethod: matchedRefund?.paymentMethod || (isPos ? 'POS Cash Refund' : 'Original Source (Razorpay)'),
        refundReason: order.payment?.refundReason || matchedRefund?.reason || (order.returns?.reason ? order.returns.reason : undefined),
        relatedReturnId: order.returns?.id || order.returnRequest?.id,
        failureReason: order.status === 'cancelled' ? (order.cancelReason || 'Payment timed out or cancelled by user') : undefined,
        itemsCount: order.items?.length || 1,
        posPaymentMethod: isPos ? (order.payment?.paymentMethod || 'cash') : undefined,
        posSplitBreakdown: splitBreakdown,
        posSplitDetails: splitDetails,
        posCashTendered: order.payment?.amountTendered || splitBreakdown?.cashTendered,
        posChangeAmount: order.payment?.changeAmount || splitBreakdown?.changeDue,
        posUpiRef: order.payment?.upiRef || splitBreakdown?.upiRef,
        posCardLast4: order.payment?.cardLast4 || splitBreakdown?.cardLast4,
        posCardType: order.payment?.cardType || splitBreakdown?.cardType,
        posStaffName: order.posStaff?.name || order.staffName,
        rawOrder: order
      };
    });
  }, [orders, refunds]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Status Filter
      if (statusFilter === 'successful') {
        const isSuccess = tx.paymentStatus === 'captured' || tx.paymentStatus === 'authorized' || tx.orderStatus === 'confirmed' || tx.orderStatus === 'delivered' || tx.orderStatus === 'completed';
        const isRef = tx.refundStatus === 'refunded' || tx.refundStatus === 'partially_refunded';
        if (!isSuccess || isRef) return false;
      } else if (statusFilter === 'pending') {
        if (tx.paymentStatus !== 'pending' && tx.paymentStatus !== 'created') return false;
      } else if (statusFilter === 'failed') {
        if (tx.paymentStatus !== 'failed' && tx.orderStatus !== 'cancelled') return false;
      } else if (statusFilter === 'refunded') {
        if (tx.refundStatus !== 'refunded' && tx.refundStatus !== 'partially_refunded' && tx.paymentStatus !== 'refunded' && tx.paymentStatus !== 'partially_refunded') return false;
      }

      // 2. Channel Filter
      if (channelFilter === 'online' && tx.isPos) return false;
      if (channelFilter === 'pos' && !tx.isPos) return false;

      // 3. Payment Method Filter
      if (methodFilter !== 'all') {
        const m = tx.paymentMethod.toLowerCase();
        if (methodFilter === 'razorpay' && !m.includes('razorpay')) return false;
        if (methodFilter === 'pos_cash' && (!tx.isPos || !m.includes('cash'))) return false;
        if (methodFilter === 'pos_upi' && (!tx.isPos || !m.includes('upi'))) return false;
        if (methodFilter === 'pos_card' && (!tx.isPos || !m.includes('card'))) return false;
        if (methodFilter === 'pos_split' && (!tx.isPos || !m.includes('split'))) return false;
        if (methodFilter === 'cod' && !m.includes('cod') && !m.includes('delivery')) return false;
      }

      // 4. Date Range Filter
      if (dateRangeFilter !== 'all') {
        const txDate = new Date(tx.createdAt?.toDate ? tx.createdAt.toDate() : (tx.createdAt || 0)).getTime();
        const now = Date.now();
        if (dateRangeFilter === 'today') {
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - txDate > oneDay) return false;
        } else if (dateRangeFilter === '7days') {
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (now - txDate > sevenDays) return false;
        } else if (dateRangeFilter === '30days') {
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (now - txDate > thirtyDays) return false;
        }
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = tx.id.toLowerCase().includes(q);
        const matchesOrder = tx.orderId.toLowerCase().includes(q);
        const matchesInvoice = (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(q)) || (tx.posInvoiceNumber && tx.posInvoiceNumber.toLowerCase().includes(q));
        const matchesCust = tx.customerName.toLowerCase().includes(q) || tx.customerEmail.toLowerCase().includes(q) || (tx.customerPhone && tx.customerPhone.includes(q));
        const matchesRzp = (tx.razorpayOrderId && tx.razorpayOrderId.toLowerCase().includes(q)) || (tx.razorpayPaymentId && tx.razorpayPaymentId.toLowerCase().includes(q));
        const matchesUpi = Boolean(tx.posUpiRef && tx.posUpiRef.toLowerCase().includes(q));
        
        if (!matchesId && !matchesOrder && !matchesInvoice && !matchesCust && !matchesRzp && !matchesUpi) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      const dateA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || 0)).getTime();
      const dateB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || 0)).getTime();
      if (sortBy === 'date_asc') return dateA - dateB;
      return dateB - dateA;
    });
  }, [transactions, statusFilter, channelFilter, methodFilter, dateRangeFilter, searchQuery, sortBy]);

  // Overall Metrics Calculations
  const metrics = useMemo(() => {
    let totalVolume = 0;
    let successCount = 0;
    let successVolume = 0;
    let pendingCount = 0;
    let pendingVolume = 0;
    let failedCount = 0;
    let failedVolume = 0;
    let refundedCount = 0;
    let refundedVolume = 0;

    transactions.forEach((tx) => {
      const isRef = tx.refundStatus === 'refunded' || tx.refundStatus === 'partially_refunded' || tx.paymentStatus === 'refunded' || tx.paymentStatus === 'partially_refunded';
      const isSucc = tx.paymentStatus === 'captured' || tx.paymentStatus === 'authorized' || tx.orderStatus === 'confirmed' || tx.orderStatus === 'delivered' || tx.orderStatus === 'completed';
      const isPend = tx.paymentStatus === 'pending' || tx.paymentStatus === 'created';
      const isFail = tx.paymentStatus === 'failed' || tx.orderStatus === 'cancelled';

      if (isRef) {
        refundedCount++;
        refundedVolume += (tx.refundedAmount || tx.amount);
      } else if (isSucc) {
        successCount++;
        successVolume += tx.amount;
        totalVolume += tx.amount;
      } else if (isPend) {
        pendingCount++;
        pendingVolume += tx.amount;
      } else if (isFail) {
        failedCount++;
        failedVolume += tx.amount;
      }
    });

    return {
      totalVolume,
      successCount,
      successVolume,
      pendingCount,
      pendingVolume,
      failedCount,
      failedVolume,
      refundedCount,
      refundedVolume,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleOpenInvoice = (tx: PaymentTransaction) => {
    if (!tx.rawOrder) return;
    if (tx.isPos) {
      setPosInvoiceOrder(tx.rawOrder);
    } else {
      setInvoiceOrder(tx.rawOrder);
    }
  };

  const handleOpenOrder = (tx: PaymentTransaction) => {
    if (tx.rawOrder) {
      setDetailsOrder(tx.rawOrder);
    } else if (onNavigateTab) {
      onNavigateTab('orders', { orderId: tx.orderId });
    }
  };

  const handleOpenCustomer = (userId?: string, email?: string) => {
    if (onNavigateTab) {
      onNavigateTab('customers', { initialSubTab: 'all', searchQuery: email || userId });
    }
  };

  const handleOpenReturn = (orderId: string) => {
    if (onNavigateTab) {
      onNavigateTab('orders', { initialStatusFilter: 'returns', searchQuery: orderId });
    }
  };

  // CSV Export for accounting & compliance
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      'Transaction ID',
      'Order ID',
      'Invoice Number',
      'Channel',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Date & Time',
      'Gateway Reference',
      'Refunded Amount'
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.id}"`,
      `"${tx.orderId}"`,
      `"${tx.invoiceNumber || tx.posInvoiceNumber || ''}"`,
      `"${tx.isPos ? 'POS Counter' : 'Online Store'}"`,
      `"${tx.customerName.replace(/"/g, '""')}"`,
      `"${tx.customerEmail}"`,
      `"${tx.customerPhone || ''}"`,
      tx.amount,
      `"${tx.paymentMethod}"`,
      `"${tx.paymentStatus}"`,
      `"${tx.orderStatus}"`,
      `"${formatDate(tx.createdAt)}"`,
      `"${tx.gatewayReferenceId || tx.razorpayOrderId || ''}"`,
      tx.refundedAmount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top 4 Performance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Captured Volume */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Settled Volume</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            ₹{Number(metrics.totalVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{metrics.successCount} transactions</span>
            <span>settled</span>
          </div>
        </div>

        {/* Successful */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Successful</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            ₹{Number(metrics.successVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {metrics.successCount} paid & captured
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            ₹{Number(metrics.pendingVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {metrics.pendingCount} awaiting authorization
          </div>
        </div>

        {/* Refunded */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Refunded</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-700">
            ₹{Number(metrics.refundedVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {metrics.refundedCount} refund(s) processed
          </div>
        </div>

      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Status Filter Tabs */}
        <div className="px-5 pt-4 border-b border-slate-100 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5 min-w-max pb-3">
            {[
              { id: 'all', label: 'All Transactions', count: metrics.totalCount },
              { id: 'successful', label: 'Successful', count: metrics.successCount },
              { id: 'pending', label: 'Pending', count: metrics.pendingCount },
              { id: 'failed', label: 'Failed', count: metrics.failedCount },
              { id: 'refunded', label: 'Refunded', count: metrics.refundedCount },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pb-3 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Synchronize real payment records"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Export filtered records to CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, Order ID, Customer, Invoice, Razorpay ID, UPI Ref..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Channel Filter (Online vs POS) */}
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="online">Online Store Only</option>
              <option value="pos">POS Counter Billing</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="razorpay">Razorpay Online</option>
              <option value="pos_cash">POS Cash</option>
              <option value="pos_upi">POS UPI</option>
              <option value="pos_card">POS Card</option>
              <option value="pos_split">POS Split Payment</option>
              <option value="cod">Cash on Delivery</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>

          </div>

        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw size={28} className="animate-spin text-blue-600 mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading real payment records from database...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
              <CreditCard size={28} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No payment transactions found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No transactions match your current filters or search query. Try clearing the search query or switching tabs.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setChannelFilter('all');
                setMethodFilter('all');
                setDateRangeFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Transaction / Ref</th>
                    <th className="py-3 px-4">Order / POS Bill</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Channel & Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransactions.map((tx) => {
                    const isSuccessful = tx.paymentStatus === 'captured' || tx.paymentStatus === 'authorized' || tx.orderStatus === 'confirmed' || tx.orderStatus === 'delivered' || tx.orderStatus === 'completed';
                    const isRefunded = tx.paymentStatus === 'refunded' || tx.paymentStatus === 'partially_refunded' || tx.refundStatus === 'refunded' || tx.refundStatus === 'partially_refunded';
                    const isPending = !isSuccessful && !isRefunded && (tx.paymentStatus === 'pending' || tx.paymentStatus === 'created');
                    
                    const statusBadgeClass = isRefunded
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : isSuccessful
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isPending
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                    const statusBadgeLabel = isRefunded
                      ? (tx.refundStatus === 'partially_refunded' ? 'Part. Refunded' : 'Refunded')
                      : isSuccessful
                      ? 'Successful'
                      : isPending
                      ? 'Pending'
                      : 'Failed';

                    const isSplit = tx.posPaymentMethod === 'split' || tx.paymentMethod.toLowerCase().includes('split') || (tx.posSplitDetails && tx.posSplitDetails.length > 0);

                    return (
                      <tr key={tx.id + tx.orderId} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* Transaction ID */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]" title={tx.id}>{tx.id}</span>
                            <button
                              onClick={() => handleCopy(tx.id, tx.id)}
                              className="text-slate-400 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Copy ID"
                            >
                              {copiedId === tx.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                          {tx.razorpayPaymentId && (
                            <span className="text-[10px] text-slate-400 block font-normal truncate max-w-[140px]" title={tx.razorpayPaymentId}>
                              {tx.razorpayPaymentId}
                            </span>
                          )}
                        </td>

                        {/* Order & Invoice */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenOrder(tx)}
                              className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer truncate max-w-[120px]"
                              title={`View order ${tx.orderId}`}
                            >
                              {tx.orderId}
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {tx.posInvoiceNumber || tx.invoiceNumber || 'Invoice'}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 truncate max-w-[150px]">
                            {tx.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            {tx.customerPhone !== 'N/A' ? tx.customerPhone : tx.customerEmail}
                          </div>
                        </td>

                        {/* Channel & Method */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              tx.isPos ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                            }`}>
                              {tx.isPos ? <Store size={10} /> : <Globe size={10} />}
                              <span>{tx.isPos ? 'POS' : 'Online'}</span>
                            </span>
                            <span className="font-semibold text-slate-800">
                              {tx.paymentMethod}
                            </span>
                          </div>

                          {/* Split Breakdown details preview */}
                          {isSplit && (tx.posSplitBreakdown || tx.posSplitDetails) && (
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-medium flex-wrap">
                              {tx.posSplitBreakdown?.cash ? <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Cash: ₹{tx.posSplitBreakdown.cash}</span> : null}
                              {tx.posSplitBreakdown?.upi ? <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">UPI: ₹{tx.posSplitBreakdown.upi}</span> : null}
                              {tx.posSplitBreakdown?.card ? <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Card: ₹{tx.posSplitBreakdown.card}</span> : null}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-black text-slate-900 text-sm">
                            ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                          </div>
                          {isRefunded && tx.refundedAmount && (
                            <div className="text-[10px] text-purple-600 font-semibold">
                              Refunded ₹{Number(tx.refundedAmount).toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeClass}`}>
                            {isRefunded ? <RotateCcw size={11} /> : isSuccessful ? <CheckCircle2 size={11} /> : isPending ? <Clock size={11} /> : <AlertCircle size={11} />}
                            <span>{statusBadgeLabel}</span>
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          <div className="font-medium text-slate-700">{formatDate(tx.createdAt)}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* View Full Transaction Details */}
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="View Payment Details"
                            >
                              <Eye size={15} />
                            </button>

                            {/* View Invoice */}
                            <button
                              onClick={() => handleOpenInvoice(tx)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Invoice"
                            >
                              <Receipt size={15} />
                            </button>

                            {/* View Order */}
                            <button
                              onClick={() => handleOpenOrder(tx)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="View Order Details"
                            >
                              <Package size={15} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {paginatedTransactions.map((tx) => {
                const isSuccessful = tx.paymentStatus === 'captured' || tx.paymentStatus === 'authorized' || tx.orderStatus === 'confirmed' || tx.orderStatus === 'delivered' || tx.orderStatus === 'completed';
                const isRefunded = tx.paymentStatus === 'refunded' || tx.paymentStatus === 'partially_refunded' || tx.refundStatus === 'refunded' || tx.refundStatus === 'partially_refunded';
                const isPending = !isSuccessful && !isRefunded && (tx.paymentStatus === 'pending' || tx.paymentStatus === 'created');

                const statusBadgeClass = isRefunded
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : isSuccessful
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isPending
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

                const statusBadgeLabel = isRefunded
                  ? (tx.refundStatus === 'partially_refunded' ? 'Part. Refunded' : 'Refunded')
                  : isSuccessful
                  ? 'Successful'
                  : isPending
                  ? 'Pending'
                  : 'Failed';

                const isSplit = tx.posPaymentMethod === 'split' || tx.paymentMethod.toLowerCase().includes('split') || (tx.posSplitDetails && tx.posSplitDetails.length > 0);

                return (
                  <div key={tx.id + tx.orderId} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                    
                    {/* Card Top Row: ID, Channel & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tx.isPos ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {tx.isPos ? <Store size={10} /> : <Globe size={10} />}
                            <span>{tx.isPos ? 'POS' : 'Online'}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-xs truncate max-w-[160px]">
                            {tx.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
                        {isRefunded ? <RotateCcw size={11} /> : isSuccessful ? <CheckCircle2 size={11} /> : isPending ? <Clock size={11} /> : <AlertCircle size={11} />}
                        <span>{statusBadgeLabel}</span>
                      </span>
                    </div>

                    {/* Card Middle Row: Amount, Customer & Method */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Customer:</span>
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">{tx.customerName}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Order / Invoice:</span>
                        <span className="font-mono text-slate-800 font-semibold">{tx.posInvoiceNumber || tx.invoiceNumber || tx.orderId}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Payment Method:</span>
                        <span className="font-semibold text-slate-800">{tx.paymentMethod}</span>
                      </div>

                      {isSplit && (tx.posSplitBreakdown || tx.posSplitDetails) && (
                        <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-indigo-900 font-semibold">
                          <span>Split Breakdown:</span>
                          <span>
                            {tx.posSplitBreakdown?.cash ? `Cash: ₹${tx.posSplitBreakdown.cash} ` : ''}
                            {tx.posSplitBreakdown?.upi ? `UPI: ₹${tx.posSplitBreakdown.upi} ` : ''}
                            {tx.posSplitBreakdown?.card ? `Card: ₹${tx.posSplitBreakdown.card}` : ''}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-700 font-bold">Total Amount:</span>
                        <div className="text-right">
                          <span className="text-base font-black text-slate-900">
                            ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                          </span>
                          {isRefunded && tx.refundedAmount && (
                            <span className="block text-[10px] text-purple-600 font-bold">
                              Refunded: ₹{Number(tx.refundedAmount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenInvoice(tx)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Receipt size={13} />
                        <span>Invoice</span>
                      </button>

                      <button
                        onClick={() => handleOpenOrder(tx)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Package size={13} />
                        <span>Order</span>
                      </button>

                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of {filteredTransactions.length} records
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="font-bold px-2 text-slate-800">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* 1. Payment Details Modal */}
      {selectedTx && (
        <PaymentDetailsModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onViewOrder={(order) => {
            setSelectedTx(null);
            setDetailsOrder(order);
          }}
          onViewInvoice={(order) => {
            setSelectedTx(null);
            if (selectedTx.isPos) {
              setPosInvoiceOrder(order);
            } else {
              setInvoiceOrder(order);
            }
          }}
          onViewCustomer={handleOpenCustomer}
          onViewReturn={handleOpenReturn}
        />
      )}

      {/* 2. Online GST Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* 3. POS Invoice Modal */}
      {posInvoiceOrder && (
        <PosInvoiceModal
          order={posInvoiceOrder}
          onClose={() => setPosInvoiceOrder(null)}
        />
      )}

      {/* 4. Full Order Management Modal */}
      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          onClose={() => setDetailsOrder(null)}
          onViewInvoice={(ord) => {
            setDetailsOrder(null);
            if (ord.orderSource === 'pos' || ord.id.startsWith('pos_ord_')) {
              setPosInvoiceOrder(ord);
            } else {
              setInvoiceOrder(ord);
            }
          }}
        />
      )}

    </div>
  );
}
