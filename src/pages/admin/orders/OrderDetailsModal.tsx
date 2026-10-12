import React, { useState } from 'react';
import { 
  X, Package, Truck, FileText, CheckCircle2, AlertTriangle, 
  ExternalLink, Phone, Mail, MessageSquare, Copy, Check, 
  RotateCcw, DollarSign, ChevronDown, ChevronUp, User, MapPin, 
  Clock, ShieldCheck, ArrowRight, RefreshCw, Edit3, Receipt 
} from 'lucide-react';
import { Order, CreditNote } from '../../../types';
import { OrderTimeline } from './OrderTimeline';
import { 
  formatCurrency, 
  formatOrderDateTime, 
  getOrderStatusInfo, 
  getPaymentStatusInfo, 
  getEffectiveShippingStatus, 
  getShippingStatusLabel,
  POPULAR_COURIERS,
  generateTrackingUrl 
} from './orderUtils';

import { db } from '../../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { CreditNoteModal } from '../../../components/admin/invoices/CreditNoteModal';
import { CreateCreditNoteModal } from '../../../components/admin/invoices/CreateCreditNoteModal';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onViewInvoice: (order: Order) => void;
  onNavigateTab?: (tab: string, params?: any) => void;
  onUpdateStatus?: (orderId: string, newStatus: Order['status'], notifyCustomer: boolean) => Promise<void>;
  onUpdateFulfillment?: (orderId: string, fulfillmentData: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery: string;
    shippingStatus: NonNullable<Order['shippingStatus']>;
    notifyCustomer: boolean;
  }) => Promise<void>;
  onTriggerCancel?: (order: Order) => void;
  onTriggerReturn?: (order: Order) => void;
  onTriggerRefund?: (order: Order) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  onViewInvoice,
  onNavigateTab,
  onUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  },
  onUpdateFulfillment = async (orderId, fulfillmentData) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        ...fulfillmentData,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to update fulfillment:', e);
    }
  },
  onTriggerCancel = () => {},
  onTriggerReturn = () => {},
  onTriggerRefund = () => {}
}: OrderDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [updatingFulfillment, setUpdatingFulfillment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fulfillment form state
  const [carrier, setCarrier] = useState(order.carrier || 'Delhivery');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.estimatedDelivery || '');
  const [shippingStatus, setShippingStatus] = useState<NonNullable<Order['shippingStatus']>>(
    order.shippingStatus || (order.status === 'delivered' ? 'delivered' : order.status === 'shipped' ? 'dispatched' : 'not_shipped')
  );

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const total = order.grandTotal || order.totalAmount || 0;
  const statusInfo = getOrderStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment);

  // Credit Note Modal State
  const [viewCreditNote, setViewCreditNote] = useState<CreditNote | null>(null);
  const [isCreateCNOpen, setIsCreateCNOpen] = useState<boolean>(false);
  const [loadingCN, setLoadingCN] = useState<boolean>(false);

  const handleOpenCreditNote = async () => {
    if (!order.creditNoteId) return;
    try {
      setLoadingCN(true);
      const snap = await getDoc(doc(db, 'credit_notes', order.creditNoteId));
      if (snap.exists()) {
        setViewCreditNote({ id: snap.id, ...snap.data() } as CreditNote);
      } else {
        alert('Credit Note record not found.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error loading credit note: ${err.message}`);
    } finally {
      setLoadingCN(false);
    }
  };
  const effectiveShipping = getEffectiveShippingStatus(order);
  const shippingInfo = getShippingStatusLabel(effectiveShipping);

  // Customer details
  const customerName = order.shippingAddress?.fullName || 'Customer';
  const customerPhone = order.shippingAddress?.phone || '';
  const customerEmail = order.shippingAddress?.email || (order as any).customerEmail || '';
  const shippingAddr = order.shippingAddress;

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Quick WhatsApp message generator
  const handleOpenWhatsApp = () => {
    if (!customerPhone) {
      alert('No customer phone number available on this order.');
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hello ${customerName}, update regarding your ELECTRO STORE order #${inv}: Current status is ${statusInfo.label}.${order.trackingNumber ? ` Your tracking number is ${order.trackingNumber} via ${order.carrier || 'Express Courier'}.` : ''} Thank you for shopping with us!`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Quick Mail trigger
  const handleOpenMail = () => {
    if (!customerEmail) {
      alert('No customer email available on this order.');
      return;
    }
    const subject = `Update on your ELECTRO STORE Order #${inv}`;
    const body = `Hi ${customerName},\n\nThis is an update regarding your order #${inv}.\nCurrent Status: ${statusInfo.label}\nTotal Amount: ${formatCurrency(total)}\n\n${order.trackingNumber ? `Shipment Tracking: ${order.carrier} - ${order.trackingNumber}\nTracking Link: ${order.trackingUrl || 'N/A'}\n\n` : ''}Best regards,\nELECTRO STORE Customer Support`;
    window.open(`mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  // Save Shipping
  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFulfillment(true);
    try {
      await onUpdateFulfillment(order.id, {
        carrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || generateTrackingUrl(carrier, trackingNumber.trim()),
        estimatedDelivery: estimatedDelivery.trim(),
        shippingStatus,
        notifyCustomer: true
      });
      setIsEditingShipping(false);
    } finally {
      setUpdatingFulfillment(false);
    }
  };

  // Quick Status Progress
  const handleStatusTransition = async (newStatus: Order['status']) => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(order.id, newStatus, true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Contextual valid actions for current order state
  const isPending = order.status === 'pending';
  const isConfirmed = order.status === 'confirmed';
  const isProcessing = order.status === 'processing';
  const isShipped = order.status === 'shipped' || order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const isRefunded = order.status === 'refunded';

  const canConfirm = isPending;
  const canStartProcessing = isConfirmed;
  const canMarkShipped = isProcessing;
  const canMarkDelivered = isShipped;
  const canCancel = !isDelivered && !isCancelled && !isReturned && !isRefunded;
  const canReturn = isDelivered && !isReturned;
  
  const grandTotal = Number(order.grandTotal || order.totalAmount || 0);
  const alreadyRefunded = Number(order.payment?.refundedAmount || 0);
  const remainingRefundable = Math.max(0, grandTotal - alreadyRefunded);
  const canRefund = (order.payment?.paymentStatus === 'captured' || order.payment?.paymentStatus === 'partially_refunded' || isCancelled || isReturned) && remainingRefundable > 0 && !isRefunded;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-white p-4 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                Order #{inv}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                <span>{statusInfo.label}</span>
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${paymentInfo.badgeClass}`}>
                {paymentInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Placed: {formatOrderDateTime(order.createdAt)}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-400">ID: {order.id.slice(0, 10)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onViewInvoice(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Print / View GST Compliant Invoice"
            >
              <FileText size={14} />
              <span className="hidden sm:inline">GST Invoice</span>
            </button>

            {order.creditNoteNumber || order.creditNoteId ? (
              <button
                type="button"
                onClick={handleOpenCreditNote}
                disabled={loadingCN}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors border border-rose-200 cursor-pointer"
                title={`View Credit Note #${order.creditNoteNumber}`}
              >
                {loadingCN ? <RefreshCw size={14} className="animate-spin" /> : <Receipt size={14} />}
                <span className="hidden sm:inline">Credit Note</span>
              </button>
            ) : (order.status === 'cancelled' || order.status === 'returned' || order.payment?.paymentStatus === 'refunded') ? (
              <button
                type="button"
                onClick={() => setIsCreateCNOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                title="Issue GST Credit Note"
              >
                <Receipt size={14} />
                <span className="hidden sm:inline">+ Credit Note</span>
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* 1. ORDER STATUS PROGRESS & QUICK ACTIONS BAR */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Order Workflow Status
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-black text-slate-900">{statusInfo.label}</span>
                  {updatingStatus && <RefreshCw size={14} className="animate-spin text-blue-600" />}
                </div>
              </div>

              {/* Contextual Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {canConfirm && (
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusTransition('confirmed')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm Order</span>
                  </button>
                )}

                {canStartProcessing && (
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusTransition('processing')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Clock size={14} />
                    <span>Start Processing</span>
                  </button>
                )}

                {canMarkShipped && (
                  <button
                    disabled={updatingStatus}
                    onClick={() => setIsEditingShipping(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Truck size={14} />
                    <span>Mark Shipped / Add Courier</span>
                  </button>
                )}

                {canMarkDelivered && (
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusTransition('delivered')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark Delivered</span>
                  </button>
                )}

                {canReturn && (
                  <button
                    onClick={() => onTriggerReturn(order)}
                    className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    <span>Start Return</span>
                  </button>
                )}

                {canRefund && (
                  <button
                    onClick={() => onTriggerRefund(order)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <DollarSign size={14} />
                    <span>Refund (₹{Number(remainingRefundable || 0).toLocaleString('en-IN')})</span>
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => onTriggerCancel(order)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>
            </div>

            {/* Visual Workflow Steps (New → Confirmed → Processing → Shipped → Delivered) */}
            <div className="pt-2">
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { key: 'pending', label: '1. New' },
                  { key: 'confirmed', label: '2. Confirmed' },
                  { key: 'processing', label: '3. Processing' },
                  { key: 'shipped', label: '4. Shipped' },
                  { key: 'delivered', label: '5. Delivered' }
                ].map((step, sIdx) => {
                  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
                  const currentIdx = statusOrder.indexOf(order.status);
                  const stepIdx = statusOrder.indexOf(step.key);
                  const isPastOrCurrent = currentIdx >= stepIdx && !isCancelled;
                  const isCurrent = order.status === step.key;

                  return (
                    <div 
                      key={step.key}
                      className={`text-center py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all border ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : isPastOrCurrent
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. ORDER TIMELINE COMPONENT */}
          <OrderTimeline order={order} />

          {/* 3. TWO COLUMN GRID: CUSTOMER & DELIVERY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Details Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <User size={15} className="text-blue-600" /> Customer Information
                </h3>
                {onNavigateTab && (customerEmail || customerPhone) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('customers', { customerEmail: customerEmail || customerPhone, initialSubTab: 'all' });
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    title="Open Customer Profile in Customers Tab"
                  >
                    <span>Customer Profile</span>
                    <ExternalLink size={11} />
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <p className="font-bold text-slate-800 text-sm">{customerName}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Phone Number</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-medium text-slate-800 font-mono">
                      {customerPhone || 'Not provided'}
                    </span>
                    {customerPhone && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(customerPhone, 'phone')}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Copy Phone"
                        >
                          {copiedField === 'phone' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenWhatsApp}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] flex items-center gap-1"
                          title="Message via WhatsApp"
                        >
                          <MessageSquare size={11} /> WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-medium text-slate-800 truncate max-w-[200px]" title={customerEmail}>
                      {customerEmail || 'Not provided'}
                    </span>
                    {customerEmail && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(customerEmail, 'email')}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Copy Email"
                        >
                          {copiedField === 'email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenMail}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-[10px] flex items-center gap-1"
                        >
                          <Mail size={11} /> Email
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Shipping Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Truck size={15} className="text-purple-600" /> Delivery & Shipping
                </h3>
                <div className="flex items-center gap-3">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('shipping');
                      }}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                      title="Open Shipping Dashboard"
                    >
                      <span>Shipping</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingShipping(!isEditingShipping)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>{isEditingShipping ? 'Close Editor' : 'Edit Courier'}</span>
                  </button>
                </div>
              </div>

              {isEditingShipping ? (
                /* Inline shipping edit form */
                <form onSubmit={handleSaveShipping} className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Courier</label>
                    <input
                      type="text"
                      list="detail-couriers"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="Enter courier partner name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none text-xs font-medium"
                      required
                    />
                    <datalist id="detail-couriers">
                      {POPULAR_COURIERS.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tracking Number / AWB</label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number or AWB"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Shipping Status</label>
                      <select
                        value={shippingStatus}
                        onChange={(e) => setShippingStatus(e.target.value as NonNullable<Order['shippingStatus']>)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none text-xs"
                      >
                        <option value="not_shipped">Pending Dispatch</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimated Delivery</label>
                    <input
                      type="text"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      placeholder="Enter estimated delivery timeframe"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg outline-none text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingShipping(false)}
                      className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingFulfillment}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      {updatingFulfillment && <RefreshCw size={11} className="animate-spin" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Readonly Shipping Display */
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Destination Address</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {shippingAddr?.street || 'Address Line'}
                      {shippingAddr?.addressLine2 ? `, ${shippingAddr.addressLine2}` : ''}
                    </p>
                    {shippingAddr?.landmark && (
                      <p className="text-slate-500 text-[11px]">Landmark: {shippingAddr.landmark}</p>
                    )}
                    <p className="font-medium text-slate-700">
                      {shippingAddr?.city || 'City'}, {shippingAddr?.state || 'State'} - <PincodeDisplay pincode={shippingAddr?.zipCode} />
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Courier Partner</span>
                      <p className="font-bold text-slate-800">{order.carrier || 'Not assigned'}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Shipping Status</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${shippingInfo.color}`}>
                        {shippingInfo.label}
                      </span>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Tracking / AWB Number</span>
                        <span className="font-mono font-bold text-slate-800">{order.trackingNumber}</span>
                      </div>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Track Package</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. PRODUCTS & FINANCIAL SUMMARY */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package size={15} className="text-blue-600" /> Products Ordered ({order.items?.length || 0})
            </h3>

            {/* Items List */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/60 transition-colors text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 object-contain bg-white border border-slate-200 rounded-lg p-1 shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center shrink-0 text-slate-400">
                        <Package size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate" title={item.name}>{item.name}</p>
                      {item.sku && <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>}
                      <p className="text-slate-500 mt-0.5">
                        Qty: <strong className="text-slate-800">{item.quantity}</strong> × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(item.totalPrice || item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal || total)}</span>
              </div>

              {Boolean(order.discount) && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}

              {Number(order.tax || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax ({(order as any).taxRate ? `${(order as any).taxRate}%` : 'Included'}):</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(order.tax || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping & Handling:</span>
                <span className="font-semibold text-slate-800">
                  {order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="text-base text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* 5. PAYMENT & FINANCIAL CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-600" /> Payment & Transaction
              </h3>
              <div className="flex items-center gap-2.5">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('payments');
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    title="Open Payments Ledger"
                  >
                    <span>Payments</span>
                    <ExternalLink size={11} />
                  </button>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${paymentInfo.badgeClass}`}>
                  {paymentInfo.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Payment Method</span>
                <p className="font-bold text-slate-800 mt-0.5 capitalize">
                  {order.orderSource === 'pos' 
                    ? `POS (${order.payment?.paymentMethod || 'Cash'})`
                    : (order.payment?.provider || order.payment?.paymentMethod || 'Razorpay Gateway')}
                </p>
                {order.payment?.cardLast4 && (
                  <span className="text-[10px] text-slate-500 block font-mono">Card ending in •••• {order.payment.cardLast4}</span>
                )}
                {order.payment?.upiRef && (
                  <span className="text-[10px] text-slate-500 block font-mono">UPI Ref: {order.payment.upiRef}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Amount Paid</span>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">
                  {(order.payment?.paymentStatus === 'captured' || order.payment?.paymentStatus === 'paid')
                    ? formatCurrency(order.payment?.amountPaid || total) 
                    : 'Pending Collection'}
                </p>
                {order.payment?.changeGiven !== undefined && order.payment?.changeGiven > 0 && (
                  <span className="text-[10px] text-slate-500 block">Change Returned: ₹{Number(order.payment.changeGiven).toLocaleString('en-IN')}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Refund Status</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {order.payment?.paymentStatus === 'refunded' ? (
                    <span className="text-purple-700">Fully Refunded ({formatCurrency(order.payment?.refundedAmount || total)})</span>
                  ) : order.payment?.paymentStatus === 'partially_refunded' ? (
                    <span className="text-amber-700">Partially Refunded ({formatCurrency(order.payment?.refundedAmount)})</span>
                  ) : canRefund ? (
                    <span className="text-emerald-700">Refund Available ({formatCurrency(remainingRefundable)})</span>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </p>
              </div>
            </div>

            {order.payment?.razorpayPaymentId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Payment Gateway Reference</span>
                  <span className="font-mono font-bold text-slate-800">{order.payment.razorpayPaymentId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.payment?.razorpayPaymentId || '', 'payId')}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 text-[11px] font-medium flex items-center gap-1"
                >
                  {copiedField === 'payId' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>Copy</span>
                </button>
              </div>
            )}
          </div>

          {/* 6. EXPANDABLE ADVANCED / DIAGNOSTIC SECTION */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors text-xs font-bold text-slate-600"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Advanced & Technical Diagnostics</span>
                <span className="text-[10px] font-normal text-slate-400">(Database IDs, Webhook payload, audit logs)</span>
              </div>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvanced && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">System Record ID:</span>
                    <span className="text-slate-800 select-all">{order.id}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Customer User ID:</span>
                    <span className="text-slate-800 select-all">{order.userId}</span>
                  </div>
                  {order.payment?.razorpayOrderId && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Razorpay Order ID:</span>
                      <span className="text-slate-800 select-all">{order.payment.razorpayOrderId}</span>
                    </div>
                  )}
                  {order.payment?.verifiedAt && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Payment Verification Date:</span>
                      <span className="text-slate-800">{formatOrderDateTime(order.payment.verifiedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 text-[10px]">
                  <span className="text-slate-400 block mb-1">Raw Order Snapshot Metadata:</span>
                  <pre className="text-slate-700 overflow-x-auto p-1 bg-slate-50 rounded">
                    {JSON.stringify({
                      status: order.status,
                      subtotal: order.subtotal,
                      tax: order.tax,
                      shippingCharge: order.shippingCharge,
                      grandTotal: order.grandTotal,
                      carrier: order.carrier || null,
                      trackingNumber: order.trackingNumber || null,
                      shippingStatus: order.shippingStatus || null
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Need to cancel or refund? Use the contextual action buttons above.
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Credit Note View Modal */}
      {viewCreditNote && (
        <CreditNoteModal
          creditNote={viewCreditNote}
          onClose={() => setViewCreditNote(null)}
        />
      )}

      {/* Credit Note Issuance Modal */}
      {isCreateCNOpen && (
        <CreateCreditNoteModal
          initialOrder={order}
          onClose={() => setIsCreateCNOpen(false)}
          onSuccess={(newCN) => {
            setIsCreateCNOpen(false);
            setViewCreditNote(newCN);
          }}
        />
      )}
    </div>
  );
}
