import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Building2, 
  Store, 
  Globe, 
  ShieldCheck, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink,
  Ban,
  ArrowUpDown,
  FileCheck2,
  Receipt
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, CreditNote } from '../../types';
import { InvoiceModal } from '../../components/InvoiceModal';
import { CreditNoteModal } from '../../components/admin/invoices/CreditNoteModal';
import { CreateCreditNoteModal } from '../../components/admin/invoices/CreateCreditNoteModal';
import { useAuth } from '../../context/AuthContext';
import { canManageCreditNotes } from '../../utils/staffPermissions';

export function AdminInvoices() {
  const { user } = useAuth();
  const canManageCN = canManageCreditNotes(user);

  // Sub-tabs: 'invoices' | 'credit_notes'
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'credit_notes'>('invoices');

  // Orders / Invoices Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState<boolean>(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'online' | 'pos'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [cnStatusFilter, setCnStatusFilter] = useState<string>('all');

  // Modals
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [isCreateCreditNoteOpen, setIsCreateCreditNoteOpen] = useState<boolean>(false);
  const [orderForCreditNote, setOrderForCreditNote] = useState<Order | null>(null);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time listener for Orders (Invoices)
  useEffect(() => {
    setLoadingOrders(true);
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(250)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((docSnap) => {
          orderList.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(orderList);
        setLoadingOrders(false);
      },
      (error) => {
        console.error('Error fetching orders for invoices:', error);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time listener for Credit Notes
  useEffect(() => {
    setLoadingCreditNotes(true);
    const q = query(
      collection(db, 'credit_notes'),
      orderBy('createdAt', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cnList: CreditNote[] = [];
        snapshot.forEach((docSnap) => {
          cnList.push({ id: docSnap.id, ...docSnap.data() } as CreditNote);
        });
        setCreditNotes(cnList);
        setLoadingCreditNotes(false);
      },
      (error) => {
        console.error('Error fetching credit notes:', error);
        setLoadingCreditNotes(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Metrics Calculations
  const stats = useMemo(() => {
    const totalInvoicesCount = orders.length;
    const totalInvoiceAmount = orders.reduce(
      (sum, ord) => sum + (ord.grandTotal || ord.totalAmount || 0),
      0
    );

    const onlineOrders = orders.filter((o) => (o as any).orderSource !== 'pos');
    const posOrders = orders.filter((o) => (o as any).orderSource === 'pos');

    const totalCreditNotesCount = creditNotes.filter((c) => c.status !== 'cancelled').length;
    const totalCreditNoteAmount = creditNotes
      .filter((c) => c.status !== 'cancelled')
      .reduce((sum, c) => sum + (c.totalCreditAmount || 0), 0);

    return {
      totalInvoicesCount,
      totalInvoiceAmount,
      onlineCount: onlineOrders.length,
      onlineAmount: onlineOrders.reduce((s, o) => s + (o.grandTotal || o.totalAmount || 0), 0),
      posCount: posOrders.length,
      posAmount: posOrders.reduce((s, o) => s + (o.grandTotal || o.totalAmount || 0), 0),
      creditNotesCount: totalCreditNotesCount,
      creditNoteAmount: totalCreditNoteAmount
    };
  }, [orders, creditNotes]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return orders.filter((order) => {
      const isPos = (order as any).orderSource === 'pos';
      
      // Source filter
      if (sourceFilter === 'online' && isPos) return false;
      if (sourceFilter === 'pos' && !isPos) return false;

      // Payment status filter
      const paymentStatus = (order.payment?.paymentStatus || order.status || 'pending').toLowerCase();
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'paid' && !['captured', 'paid', 'completed'].includes(paymentStatus)) return false;
        if (paymentFilter === 'pending' && !['pending', 'created'].includes(paymentStatus)) return false;
        if (paymentFilter === 'refunded' && !['refunded', 'partially_refunded'].includes(paymentStatus)) return false;
        if (paymentFilter === 'failed' && paymentStatus !== 'failed') return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const orderDate = order.createdAt?.toDate 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || 0);
        const now = new Date();

        if (dateFilter === 'today') {
          const isToday = orderDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateFilter === '7days') {
          const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === '30days') {
          const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invNum = (order.invoiceNumber || order.posInvoiceNumber || '').toLowerCase();
        const orderId = (order.id || '').toLowerCase();
        const custName = (order.shippingAddress?.fullName || order.customerName || '').toLowerCase();
        const custPhone = (order.shippingAddress?.phone || order.customerPhone || '').toLowerCase();
        const custEmail = (order.shippingAddress?.email || order.customerEmail || order.userId || '').toLowerCase();

        return invNum.includes(q) || orderId.includes(q) || custName.includes(q) || custPhone.includes(q) || custEmail.includes(q);
      }

      return true;
    });
  }, [orders, sourceFilter, paymentFilter, dateFilter, searchQuery]);

  // Filtered Credit Notes
  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      // Status Filter
      if (cnStatusFilter !== 'all' && cn.status !== cnStatusFilter) {
        return false;
      }

      // Date Filter
      if (dateFilter !== 'all') {
        const cnDate = cn.createdAt?.toDate 
          ? cn.createdAt.toDate() 
          : new Date(cn.createdAt || 0);
        const now = new Date();

        if (dateFilter === 'today') {
          if (cnDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === '7days') {
          const diffDays = (now.getTime() - cnDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === '30days') {
          const diffDays = (now.getTime() - cnDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cnNum = (cn.creditNoteNumber || '').toLowerCase();
        const origInv = (cn.invoiceNumber || '').toLowerCase();
        const orderId = (cn.orderId || '').toLowerCase();
        const cust = (cn.customerName || '').toLowerCase();
        const phone = (cn.customerPhone || '').toLowerCase();
        const email = (cn.customerEmail || '').toLowerCase();

        return cnNum.includes(q) || origInv.includes(q) || orderId.includes(q) || cust.includes(q) || phone.includes(q) || email.includes(q);
      }

      return true;
    });
  }, [creditNotes, cnStatusFilter, dateFilter, searchQuery]);

  // Void/Cancel Credit Note Handler
  const handleCancelCreditNote = async (cn: CreditNote) => {
    const reason = prompt(`Enter reason for cancelling / voiding Credit Note ${cn.creditNoteNumber}:`);
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/admin/credit-notes/${cn.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          adminEmail: user?.email || 'Admin'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to void credit note.');
      }
      alert(`Credit Note ${cn.creditNoteNumber} has been successfully voided.`);
    } catch (err: any) {
      alert(`Error voiding credit note: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="text-slate-800" size={24} />
              Invoices & Credit Notes Center
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-100">
              {orders.length} Invoices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Centralized hub for customer tax invoices (Website + POS Counter Sales) and GST credit notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManageCN && (
            <button
              onClick={() => {
                setOrderForCreditNote(null);
                setIsCreateCreditNoteOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus size={15} /> Issue Credit Note
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Billed Invoices</span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <FileCheck2 size={16} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{Number(stats.totalInvoiceAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {stats.totalInvoicesCount} invoices generated
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Online Store Orders</span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Globe size={16} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{Number(stats.onlineAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {stats.onlineCount} online orders
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">POS Counter Sales</span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <Store size={16} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            ₹{Number(stats.posAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {stats.posCount} counter sale receipts
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Credit Notes Issued</span>
            <span className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Receipt size={16} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-700 mt-2">
            ₹{Number(stats.creditNoteAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {stats.creditNotesCount} credit notes active
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveSubTab('invoices')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'invoices'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText size={16} />
              Tax Invoices
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('credit_notes')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'credit_notes'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt size={16} />
              GST Credit Notes
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-mono">
                {creditNotes.length}
              </span>
            </button>
          </div>

          {/* Source Filter for Invoices */}
          {activeSubTab === 'invoices' && (
            <div className="flex items-center gap-1.5 pb-3">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sourceFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => setSourceFilter('online')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sourceFilter === 'online'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Globe size={12} /> Online Store
              </button>
              <button
                onClick={() => setSourceFilter('pos')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  sourceFilter === 'pos'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Store size={12} /> POS Counter
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'invoices'
                  ? 'Search by Invoice #, Order ID, Customer, Phone...'
                  : 'Search by Credit Note #, Invoice #, Order ID...'
              }
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Calendar size={13} className="text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Payment Filter for Invoices */}
            {activeSubTab === 'invoices' ? (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid / Captured</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            ) : (
              /* Status Filter for Credit Notes */
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={cnStatusFilter}
                  onChange={(e) => setCnStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="issued">Issued / Active</option>
                  <option value="applied">Applied</option>
                  <option value="cancelled">Cancelled / Void</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* INVOICES TABLE VIEW */}
        {activeSubTab === 'invoices' && (
          <div className="overflow-x-auto">
            {loadingOrders ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-400" />
                Loading invoices from database...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No invoices found</p>
                <p className="text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Order / Sale ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-center">Invoice Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((order) => {
                    const isPos = (order as any).orderSource === 'pos';
                    const invNumber = order.invoiceNumber || order.posInvoiceNumber || `EST-${order.id.slice(0, 8)}`;
                    const custName = order.shippingAddress?.fullName || order.customerName || 'Walk-in Customer';
                    const custPhone = order.shippingAddress?.phone || order.customerPhone || '';
                    const totalAmt = order.grandTotal || order.totalAmount || 0;
                    const paymentStatus = order.payment?.paymentStatus || order.status || 'pending';
                    const isRefunded = paymentStatus === 'refunded' || order.status === 'refunded';
                    const hasCreditNote = Boolean(order.creditNoteId || order.creditNoteNumber);

                    const dateStr = order.createdAt?.toDate 
                      ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(order.createdAt || 0).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Invoice Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{invNumber}</span>
                            <button
                              onClick={() => copyToClipboard(invNumber, `inv-${order.id}`)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                              title="Copy invoice number"
                            >
                              {copiedId === `inv-${order.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4">
                          {isPos ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Store size={10} /> POS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Globe size={10} /> Online
                            </span>
                          )}
                        </td>

                        {/* Order ID */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          #{order.id.slice(0, 10)}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{custName}</p>
                          {custPhone && <p className="text-[10px] text-slate-400">{custPhone}</p>}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {dateStr}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          ₹{Number(totalAmt || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4 text-center">
                          {['captured', 'paid', 'completed'].includes(paymentStatus.toLowerCase()) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} /> Paid
                            </span>
                          ) : paymentStatus.toLowerCase().includes('refund') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {paymentStatus}
                            </span>
                          )}
                        </td>

                        {/* Invoice Status */}
                        <td className="py-3.5 px-4 text-center">
                          {hasCreditNote ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              CN Issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Issued
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View / Print Tax Invoice"
                            >
                              <Eye size={15} />
                            </button>

                            {canManageCN && (isRefunded || order.status === 'returned' || hasCreditNote) && (
                              <button
                                onClick={() => {
                                  if (hasCreditNote) {
                                    const found = creditNotes.find(
                                      (c) => c.id === order.creditNoteId || c.creditNoteNumber === order.creditNoteNumber
                                    );
                                    if (found) {
                                      setSelectedCreditNote(found);
                                      return;
                                    }
                                  }
                                  setOrderForCreditNote(order);
                                  setIsCreateCreditNoteOpen(true);
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                                  hasCreditNote
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                                title={hasCreditNote ? 'View Credit Note' : 'Issue Credit Note for this order'}
                              >
                                {hasCreditNote ? 'View CN' : '+ Issue CN'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CREDIT NOTES TABLE VIEW */}
        {activeSubTab === 'credit_notes' && (
          <div className="overflow-x-auto">
            {loadingCreditNotes ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-400" />
                Loading credit notes...
              </div>
            ) : filteredCreditNotes.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No credit notes found</p>
                <p className="text-slate-400 mt-1">
                  Credit notes are generated when returns or refunds are processed.
                </p>
                {canManageCN && (
                  <button
                    onClick={() => {
                      setOrderForCreditNote(null);
                      setIsCreateCreditNoteOpen(true);
                    }}
                    className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} /> Issue First Credit Note
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Credit Note #</th>
                    <th className="py-3 px-4">Original Invoice</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Taxable Adj.</th>
                    <th className="py-3 px-4 text-right">GST Adj.</th>
                    <th className="py-3 px-4 text-right">Total Credit (₹)</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreditNotes.map((cn) => {
                    const isCancelled = cn.status === 'cancelled';
                    const dateStr = cn.createdAt?.toDate 
                      ? cn.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(cn.createdAt || 0).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                    return (
                      <tr key={cn.id} className={`hover:bg-slate-50/60 transition-colors ${isCancelled ? 'opacity-60 bg-slate-50/40' : ''}`}>
                        {/* CN Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                          <div className="flex items-center gap-1.5">
                            <span>{cn.creditNoteNumber}</span>
                            <button
                              onClick={() => copyToClipboard(cn.creditNoteNumber, `cn-${cn.id}`)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                              title="Copy credit note number"
                            >
                              {copiedId === `cn-${cn.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Original Invoice */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-blue-700 font-semibold">
                          {cn.invoiceNumber}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800">{cn.customerName}</p>
                          {cn.customerPhone && <p className="text-[10px] text-slate-400">{cn.customerPhone}</p>}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {dateStr}
                        </td>

                        {/* Taxable Adjusted */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 font-mono">
                          ₹{Number(cn.taxableAmount || cn.subtotal || 0).toLocaleString('en-IN')}
                        </td>

                        {/* GST Adjusted */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 font-mono">
                          ₹{Number(cn.taxAdjustment || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Total Credit */}
                        <td className="py-3.5 px-4 text-right font-bold text-rose-700 font-mono">
                          ₹{Number(cn.totalCreditAmount || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={cn.reason}>
                          {cn.reason}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCreditNote(cn)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View / Print GST Credit Note"
                            >
                              <Eye size={15} />
                            </button>

                            {canManageCN && !isCancelled && (
                              <button
                                onClick={() => handleCancelCreditNote(cn)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Void / Cancel this Credit Note"
                              >
                                <Ban size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* 1. Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* 2. Credit Note View / Print Modal */}
      {selectedCreditNote && (
        <CreditNoteModal
          creditNote={selectedCreditNote}
          onClose={() => setSelectedCreditNote(null)}
        />
      )}

      {/* 3. Create Credit Note Modal */}
      {isCreateCreditNoteOpen && (
        <CreateCreditNoteModal
          order={orderForCreditNote}
          onClose={() => {
            setIsCreateCreditNoteOpen(false);
            setOrderForCreditNote(null);
          }}
          onSuccess={(newCN) => {
            setIsCreateCreditNoteOpen(false);
            setOrderForCreditNote(null);
            setSelectedCreditNote(newCN);
          }}
        />
      )}
    </div>
  );
}
