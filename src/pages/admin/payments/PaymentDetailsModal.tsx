import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Store, 
  Globe, 
  Receipt, 
  Package, 
  ArrowRight,
  Split,
  Calendar,
  IndianRupee,
  Lock,
  Wallet
} from 'lucide-react';
import { PaymentTransaction, Order } from '../../../types';

interface PaymentDetailsModalProps {
  transaction: PaymentTransaction;
  onClose: () => void;
  onViewOrder?: (order: Order) => void;
  onViewInvoice?: (order: Order) => void;
  onViewCustomer?: (userId?: string, email?: string) => void;
  onViewReturn?: (orderId: string) => void;
}

export function PaymentDetailsModal({
  transaction,
  onClose,
  onViewOrder,
  onViewInvoice,
  onViewCustomer,
  onViewReturn
}: PaymentDetailsModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(field);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  const isSuccessful = 
    transaction.paymentStatus === 'captured' || 
    transaction.paymentStatus === 'authorized' || 
    transaction.orderStatus === 'confirmed' || 
    transaction.orderStatus === 'delivered' || 
    transaction.orderStatus === 'completed';

  const isRefunded = 
    transaction.paymentStatus === 'refunded' || 
    transaction.paymentStatus === 'partially_refunded' || 
    transaction.refundStatus === 'refunded' || 
    transaction.refundStatus === 'partially_refunded' ||
    (transaction.refundedAmount !== undefined && transaction.refundedAmount > 0);

  const isPending = 
    !isSuccessful && !isRefunded && 
    (transaction.paymentStatus === 'pending' || transaction.paymentStatus === 'created');

  const isFailed = 
    !isSuccessful && !isRefunded && !isPending && 
    (transaction.paymentStatus === 'failed' || transaction.orderStatus === 'cancelled');

  const statusColor = isRefunded
    ? 'bg-purple-50 text-purple-700 border-purple-200'
    : isSuccessful
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isPending
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  const statusLabel = isRefunded
    ? (transaction.refundStatus === 'partially_refunded' || (transaction.refundedAmount && transaction.refundedAmount < transaction.amount) ? 'Partially Refunded' : 'Refunded')
    : isSuccessful
    ? 'Successful / Captured'
    : isPending
    ? 'Pending Payment'
    : 'Failed';

  const isPos = Boolean(
    transaction.isPos || 
    transaction.posInvoiceNumber || 
    transaction.orderId.startsWith('pos_ord_') ||
    transaction.posPaymentMethod ||
    (transaction.invoiceNumber && transaction.invoiceNumber.includes('POS'))
  );

  const splitDetails = transaction.posSplitDetails || (
    transaction.posSplitBreakdown ? [
      ...(transaction.posSplitBreakdown.cash ? [{ method: 'cash', amount: transaction.posSplitBreakdown.cash, reference: 'Cash Tendered' }] : []),
      ...(transaction.posSplitBreakdown.upi ? [{ method: 'upi', amount: transaction.posSplitBreakdown.upi, reference: transaction.posSplitBreakdown.upiRef || 'UPI POS' }] : []),
      ...(transaction.posSplitBreakdown.card ? [{ method: 'card', amount: transaction.posSplitBreakdown.card, reference: transaction.posSplitBreakdown.cardType || 'Card POS', cardLast4: transaction.posSplitBreakdown.cardLast4 }] : [])
    ] : []
  );

  const isSplit = transaction.posPaymentMethod === 'split' || transaction.paymentMethod.toLowerCase().includes('split') || splitDetails.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isPos ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {isPos ? <Store size={20} /> : <CreditCard size={20} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Payment Details
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                  {isRefunded ? <RotateCcw size={12} /> : isSuccessful ? <CheckCircle2 size={12} /> : isPending ? <Clock size={12} /> : <AlertCircle size={12} />}
                  <span>{statusLabel}</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  isPos ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'
                }`}>
                  {isPos ? <Store size={11} /> : <Globe size={11} />}
                  <span>{isPos ? 'POS Billing' : 'Online Store'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                ID: <span className="font-mono font-medium">{transaction.id}</span> &bull; Created {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          
          {/* Main Amount & Transaction Hero Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Transaction Amount
              </span>
              <div className="text-3xl font-black tracking-tight text-white flex items-center gap-1">
                <span>₹{Number(transaction.amount || 0).toLocaleString('en-IN')}</span>
                <span className="text-xs font-bold text-slate-400 self-end mb-1">INR</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <span>Method:</span>
                <span className="font-bold text-white uppercase">{transaction.paymentMethod}</span>
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5 min-w-[200px]">
              <div className="flex items-center justify-between gap-3 text-slate-400">
                <span>Payment Status:</span>
                <span className="font-semibold text-white capitalize">{transaction.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-slate-400">
                <span>Order Status:</span>
                <span className="font-semibold text-white capitalize">{transaction.orderStatus || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-slate-400">
                <span>Verification:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={12} /> Confirmed
                </span>
              </div>
            </div>
          </div>

          {/* Refund Banner if Refunded */}
          {isRefunded && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <RotateCcw size={18} className="text-purple-600" />
                  <span>Refund Details</span>
                </div>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                  {transaction.refundStatus === 'partially_refunded' ? 'Partially Refunded' : 'Fully Refunded'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Refunded Amount</span>
                  <span className="font-bold text-purple-900 text-sm">
                    ₹{Number(transaction.refundedAmount || transaction.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Refund ID</span>
                  <span className="font-mono font-medium text-slate-800 truncate block" title={transaction.refundId || 'Auto-generated'}>
                    {transaction.refundId || `rfnd_${transaction.orderId.slice(0, 10)}`}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Refund Method</span>
                  <span className="font-medium text-slate-800">
                    {transaction.refundMethod || (isPos ? 'POS Cash Refund' : 'Original Payment Method (Razorpay)')}
                  </span>
                </div>
              </div>

              {transaction.refundReason && (
                <p className="text-xs text-purple-800 bg-purple-100/60 p-2.5 rounded-lg">
                  <span className="font-bold">Reason:</span> {transaction.refundReason}
                </p>
              )}

              {onViewReturn && (
                <button
                  onClick={() => onViewReturn(transaction.orderId)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Related Return & Replacement Request</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          )}

          {/* Split Payment Breakdown Card */}
          {isSplit && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                  <Split size={17} className="text-indigo-600" />
                  <span>POS Split Payment Breakdown</span>
                </div>
                <span className="text-xs font-semibold text-indigo-700">
                  Total: ₹{Number(transaction.amount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Cash portion */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-bold uppercase text-slate-700 flex items-center gap-1">
                      <Wallet size={13} className="text-emerald-600" /> Cash
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{Number(transaction.posSplitBreakdown?.cash || (splitDetails.find(s => s.method === 'cash')?.amount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {transaction.posCashTendered !== undefined && transaction.posCashTendered > 0 && (
                    <div className="text-[11px] text-slate-400 flex justify-between mt-1">
                      <span>Tendered: ₹{transaction.posCashTendered}</span>
                      {transaction.posChangeAmount ? <span>Change: ₹{transaction.posChangeAmount}</span> : null}
                    </div>
                  )}
                </div>

                {/* UPI portion */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-bold uppercase text-slate-700 flex items-center gap-1">
                      <CreditCard size={13} className="text-blue-600" /> UPI
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{Number(transaction.posSplitBreakdown?.upi || (splitDetails.find(s => s.method === 'upi')?.amount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {(transaction.posUpiRef || transaction.posSplitBreakdown?.upiRef) && (
                    <div className="text-[11px] text-slate-500 truncate mt-1">
                      Ref: {transaction.posUpiRef || transaction.posSplitBreakdown?.upiRef}
                    </div>
                  )}
                </div>

                {/* Card portion */}
                <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-bold uppercase text-slate-700 flex items-center gap-1">
                      <CreditCard size={13} className="text-purple-600" /> Card
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{Number(transaction.posSplitBreakdown?.card || (splitDetails.find(s => s.method === 'card')?.amount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between mt-1">
                    <span>{transaction.posCardType || transaction.posSplitBreakdown?.cardType || 'Card'}</span>
                    <span>•••• {transaction.posCardLast4 || transaction.posSplitBreakdown?.cardLast4 || '****'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Information Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-blue-600" /> Customer Information
                </span>
                {onViewCustomer && (
                  <button
                    onClick={() => onViewCustomer(transaction.userId, transaction.customerEmail)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>CRM Profile</span>
                    <ExternalLink size={10} />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{transaction.customerName || 'Walk-in Customer'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]" title={transaction.customerEmail}>
                    {transaction.customerEmail || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800">
                    {transaction.customerPhone || 'N/A'}
                  </span>
                </div>
                {transaction.userId && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">User Account:</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate max-w-[150px]">
                      {transaction.userId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order & Invoice Reference Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-600" /> Order / Invoice Reference
                </span>
                <div className="flex items-center gap-2">
                  {onViewInvoice && transaction.rawOrder && (
                    <button
                      onClick={() => onViewInvoice(transaction.rawOrder!)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt size={11} />
                      <span>Invoice</span>
                    </button>
                  )}
                  {onViewOrder && transaction.rawOrder && (
                    <button
                      onClick={() => onViewOrder(transaction.rawOrder!)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText size={11} />
                      <span>Order</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Order ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{transaction.orderId}</span>
                    <button
                      onClick={() => copyToClipboard(transaction.orderId, 'orderId')}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Order ID"
                    >
                      {copiedId === 'orderId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-semibold text-slate-800">
                    {transaction.posInvoiceNumber || transaction.invoiceNumber || 'EST-INV-2026'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Items Purchased:</span>
                  <span className="font-semibold text-slate-800">{transaction.itemsCount || 1} item(s)</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Channel / Staff:</span>
                  <span className="font-semibold text-slate-800">
                    {isPos ? (transaction.posStaffName ? `POS (${transaction.posStaffName})` : 'POS Counter') : 'Online Store'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gateway & Security Details Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" /> Gateway & Transaction References
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock size={11} /> Credentials Protected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Razorpay Order ID if online */}
              {transaction.razorpayOrderId && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-bold uppercase">Razorpay Order ID</span>
                  <span className="font-mono font-bold text-slate-800 break-all">{transaction.razorpayOrderId}</span>
                </div>
              )}

              {/* Razorpay Payment ID if online */}
              {transaction.razorpayPaymentId && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-bold uppercase">Razorpay Payment ID</span>
                  <span className="font-mono font-bold text-slate-800 break-all">{transaction.razorpayPaymentId}</span>
                </div>
              )}

              {/* POS UTR / Card last 4 if POS */}
              {isPos && transaction.posUpiRef && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-bold uppercase">UPI UTR / Reference</span>
                  <span className="font-mono font-bold text-slate-800">{transaction.posUpiRef}</span>
                </div>
              )}

              {isPos && transaction.posCardLast4 && (
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-bold uppercase">Card Reference (Masked)</span>
                  <span className="font-mono font-bold text-slate-800">{transaction.posCardType || 'Card'} •••• {transaction.posCardLast4}</span>
                </div>
              )}

              {/* Created & Captured Timestamps */}
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-bold uppercase">Created Date & Time</span>
                <span className="font-semibold text-slate-800">{formatDate(transaction.createdAt)}</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-bold uppercase">Captured / Updated Time</span>
                <span className="font-semibold text-slate-800">{formatDate(transaction.capturedAt || transaction.updatedAt || transaction.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Payment Lifecycle Timeline */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Payment Lifecycle Timeline
            </h4>
            <div className="space-y-3 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              
              {/* Event 1 */}
              <div className="flex items-start gap-3 relative">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 -ml-[19px] z-10">
                  <CheckCircle2 size={11} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isPos ? 'POS Billing Order Generated' : 'Online Order Created'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Grand total ₹{Number(transaction.amount).toLocaleString('en-IN')} calculated with tax & discounts.
                  </span>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-start gap-3 relative">
                <div className={`w-5 h-5 rounded-full ${isSuccessful || isRefunded ? 'bg-emerald-600 text-white' : isPending ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'} flex items-center justify-center shrink-0 -ml-[19px] z-10`}>
                  {isSuccessful || isRefunded ? <CheckCircle2 size={11} /> : isPending ? <Clock size={11} /> : <AlertCircle size={11} />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isPos ? `Payment Processed via ${transaction.paymentMethod}` : 'Razorpay Gateway Transaction'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isSuccessful ? 'Payment verified and captured with cryptographic validation.' : isPending ? 'Awaiting customer payment authentication.' : 'Payment attempt cancelled or declined.'}
                  </span>
                </div>
              </div>

              {/* Event 3 */}
              {isRefunded && (
                <div className="flex items-start gap-3 relative">
                  <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 -ml-[19px] z-10">
                    <RotateCcw size={11} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-purple-900 block">
                      Refund Disbursed (₹{Number(transaction.refundedAmount || transaction.amount).toLocaleString('en-IN')})
                    </span>
                    <span className="text-[11px] text-purple-700">
                      Amount refunded to customer account via {transaction.refundMethod || 'original payment method'}.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Encrypted payment log with server-authoritative audit trail.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onViewInvoice && transaction.rawOrder && (
              <button
                onClick={() => onViewInvoice(transaction.rawOrder!)}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Receipt size={14} />
                <span>View Invoice</span>
              </button>
            )}

            {onViewOrder && transaction.rawOrder && (
              <button
                onClick={() => onViewOrder(transaction.rawOrder!)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Package size={14} />
                <span>View Order</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
