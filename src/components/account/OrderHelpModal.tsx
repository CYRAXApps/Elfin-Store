import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Truck, 
  AlertTriangle, 
  RotateCcw, 
  CreditCard, 
  XCircle, 
  MessageSquare, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight,
  Send,
  Loader2,
  Package,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Order, SupportTicketCategory, SupportTicketPriority } from '../../types';
import { PincodeDisplay } from '../common/PincodeDisplay';

interface OrderHelpModalProps {
  order: Order;
  userId: string;
  userEmail: string;
  userName: string;
  onClose: () => void;
  onTicketCreated?: (ticketId: string) => void;
  onReturnInitiated?: (orderId: string) => void;
}

type HelpActionType = 
  | 'overview' 
  | 'track' 
  | 'delivery_issue' 
  | 'cancel_order' 
  | 'return_product' 
  | 'refund_issue' 
  | 'payment_issue' 
  | 'other_issue';

export function OrderHelpModal({
  order,
  userId,
  userEmail,
  userName,
  onClose,
  onTicketCreated,
  onReturnInitiated
}: OrderHelpModalProps) {
  const [selectedAction, setSelectedAction] = useState<HelpActionType>('overview');
  
  // Tracking state
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Ticket Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);

  // Return Form State (if user chooses Return Product)
  const [returnEligibility, setReturnEligibility] = useState<any | null>(null);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; qty: number; reason: string; condition: string }>>({});
  const [overallReturnReason, setOverallReturnReason] = useState('defective');
  const [returnComments, setReturnComments] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  const invoiceNum = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const totalAmount = Number(order.grandTotal || order.totalAmount || 0);
  const isDelivered = order.status === 'delivered';
  const isShipped = order.status === 'shipped' || order.status === 'out_for_delivery';
  const isCancellable = order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing';
  const isCancelled = order.status === 'cancelled' || order.status === 'returned';
  const isPaid = order.payment?.paymentStatus === 'captured';

  // Set default subject and category when selecting an issue
  const handleSelectIssue = (action: HelpActionType) => {
    setSelectedAction(action);
    setTicketError(null);
    setTicketSuccess(null);

    switch (action) {
      case 'delivery_issue':
        setSubject(`Delivery Issue for Order #${invoiceNum}`);
        setDescription('My shipment is delayed / I need delivery instructions or package location update.');
        setPriority('high');
        break;
      case 'cancel_order':
        setSubject(`Order Cancellation Request #${invoiceNum}`);
        setDescription('I would like to cancel this order before dispatch. Please process refund to my original payment method.');
        setPriority('high');
        break;
      case 'return_product':
        // Fetch eligibility
        loadReturnEligibility();
        break;
      case 'refund_issue':
        setSubject(`Refund Query for Order #${invoiceNum}`);
        setDescription('I would like to check the refund status, credited amount, and bank reference for this order.');
        setPriority('medium');
        break;
      case 'payment_issue':
        setSubject(`Payment / Invoicing Query for Order #${invoiceNum}`);
        setDescription('I have a query regarding payment debit, invoice details, or duplicate deduction.');
        setPriority('medium');
        break;
      case 'other_issue':
        setSubject(`Support Request for Order #${invoiceNum}`);
        setDescription('');
        setPriority('medium');
        break;
      default:
        break;
    }
  };

  const loadReturnEligibility = async () => {
    setLoadingEligibility(true);
    setReturnError(null);
    try {
      const res = await fetch(`/api/support/returns/eligibility?orderId=${order.id}&userId=${userId}`).then(r => r.json());
      setReturnEligibility(res);
      if (res.eligible && res.items) {
        const initItems: Record<string, any> = {};
        res.items.forEach((it: any) => {
          initItems[it.productId] = {
            selected: it.isReturnable,
            qty: 1,
            reason: 'Defective / Not working as expected',
            condition: 'opened'
          };
        });
        setSelectedItems(initItems);
      }
    } catch (err: any) {
      setReturnError('Failed to check return eligibility. Please try again.');
    } finally {
      setLoadingEligibility(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent, category: SupportTicketCategory) => {
    e.preventDefault();
    if (!description.trim()) {
      setTicketError('Please provide a brief description of your issue.');
      return;
    }

    setSubmittingTicket(true);
    setTicketError(null);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customerName: userName || userEmail.split('@')[0] || 'Customer',
          customerEmail: userEmail,
          orderId: order.id,
          category,
          priority,
          subject: subject.trim() || `Help with Order #${invoiceNum}`,
          description: description.trim()
        })
      }).then(r => r.json());

      if (res.success) {
        setTicketSuccess(`Support Ticket #${res.ticketNumber} created successfully! Our team will respond shortly.`);
        if (onTicketCreated) onTicketCreated(res.id);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setTicketError(res.error || 'Failed to submit support request.');
      }
    } catch (err: any) {
      setTicketError(err.message || 'An error occurred while creating support ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReturn: any[] = [];
    
    if (returnEligibility?.items) {
      returnEligibility.items.forEach((it: any) => {
        const sel = selectedItems[it.productId];
        if (sel && sel.selected) {
          itemsToReturn.push({
            productId: it.productId,
            productName: it.name || it.productName || 'Product',
            sku: it.sku || '',
            quantity: sel.qty || 1,
            unitPrice: it.price || it.unitPrice || 0,
            reason: sel.reason || overallReturnReason,
            condition: sel.condition || 'opened',
            requestedResolution: 'refund'
          });
        }
      });
    }

    if (itemsToReturn.length === 0) {
      setReturnError('Please select at least one item from this order to return.');
      return;
    }

    setSubmittingReturn(true);
    setReturnError(null);
    try {
      const res = await fetch('/api/support/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          userId,
          customerName: userName || userEmail.split('@')[0] || 'Customer',
          customerEmail: userEmail,
          items: itemsToReturn,
          overallReason: overallReturnReason,
          comments: returnComments,
          pickupAddress: returnEligibility?.pickupAddress || order.shippingAddress
        })
      }).then(r => r.json());

      if (res.success) {
        setReturnSuccess(`Return request #${res.returnNumber} submitted successfully! Pickup will be scheduled shortly.`);
        if (onReturnInitiated) onReturnInitiated(order.id);
        setTimeout(() => {
          onClose();
        }, 2400);
      } else {
        setReturnError(res.error || 'Failed to submit return request.');
      }
    } catch (err: any) {
      setReturnError(err.message || 'Error creating return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const copyTracking = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">Order Assistance & Support</h3>
              <p className="text-[11px] text-slate-500">
                Order #{invoiceNum} • <span className="font-semibold capitalize text-slate-700">{order.status.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs space-y-4">
          
          {/* Order Snapshot Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-slate-900">Invoice #{invoiceNum}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isPaid ? 'Paid' : 'Payment Pending'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] truncate">
                {order.items?.length || 1} items • ₹{Number(totalAmount || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fulfillment</span>
              <span className="font-bold text-blue-700 capitalize text-xs">
                {order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* VIEW 1: OVERVIEW & OPTIONS */}
          {selectedAction === 'overview' && (
            <div>
              <p className="font-bold text-slate-800 mb-2.5">What do you need help with regarding this order?</p>
              <div className="space-y-2">
                
                {/* 1. Track Order */}
                <button
                  onClick={() => setSelectedAction('track')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Truck size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700">Track Order & Courier Status</p>
                      <p className="text-slate-500 text-[11px]">Check live dispatch, estimated delivery & AWB number</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600" />
                </button>

                {/* 2. Delivery Issue */}
                <button
                  onClick={() => handleSelectIssue('delivery_issue')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-amber-700">Delivery Issue</p>
                      <p className="text-slate-500 text-[11px]">Delayed shipment, courier not reachable, or address update</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-amber-600" />
                </button>

                {/* 3. Cancel Order (Relevant for pre-delivery) */}
                {isCancellable && (
                  <button
                    onClick={() => handleSelectIssue('cancel_order')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <XCircle size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-red-700">Cancel Order</p>
                        <p className="text-slate-500 text-[11px]">Request cancellation before shipment dispatch</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-red-600" />
                  </button>
                )}

                {/* 4. Return Product (Relevant for delivered) */}
                {isDelivered && (
                  <button
                    onClick={() => handleSelectIssue('return_product')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <RotateCcw size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700">Return Product / Replacement</p>
                        <p className="text-slate-500 text-[11px]">Initiate 7-day return, pickup schedule & refund</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-600" />
                  </button>
                )}

                {/* 5. Refund Issue */}
                {(isCancelled || isDelivered || Number(order.payment?.refundedAmount || 0) > 0) && (
                  <button
                    onClick={() => handleSelectIssue('refund_issue')}
                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-purple-700">Refund Issue</p>
                        <p className="text-slate-500 text-[11px]">Check bank credit status or missing refund</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-600" />
                  </button>
                )}

                {/* 6. Payment Issue */}
                <button
                  onClick={() => handleSelectIssue('payment_issue')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700">Payment & Invoicing Issue</p>
                      <p className="text-slate-500 text-[11px]">Double debit, tax invoice inquiry, or transaction receipt</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600" />
                </button>

                {/* 7. Other Issue */}
                <button
                  onClick={() => handleSelectIssue('other_issue')}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-slate-900">Other Issue</p>
                      <p className="text-slate-500 text-[11px]">Ask questions about product manuals, setup, or warranty</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                </button>

              </div>
            </div>
          )}

          {/* VIEW 2: TRACK ORDER */}
          {selectedAction === 'track' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Truck size={16} className="text-blue-600" /> Live Tracking Details
                </h4>
                <button
                  onClick={() => setSelectedAction('overview')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  ← Back to Options
                </button>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-blue-700 capitalize bg-blue-100/60 px-2 py-0.5 rounded text-[11px]">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-bold text-slate-800">
                    {order.estimatedDelivery || '3 to 5 business days'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Courier Partner:</span>
                  <span className="font-bold text-slate-800">
                    {order.carrier || 'Blue Dart / Delhivery Express'}
                  </span>
                </div>

                {order.trackingNumber ? (
                  <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                    <span className="text-slate-500">AWB Tracking Number:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-blue-200">
                      <span>{order.trackingNumber}</span>
                      <button
                        onClick={() => copyTracking(order.trackingNumber!)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        title="Copy AWB"
                      >
                        {copiedTracking ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[11px] italic pt-1 border-t border-blue-100">
                    AWB will be assigned as soon as the package is dispatched from our fulfillment center.
                  </div>
                )}

                {order.trackingUrl && (
                  <div className="pt-2">
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Track on Courier Website <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              {order.shippingAddress && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Destination Address</span>
                  <p className="font-bold text-slate-900">{order.shippingAddress.fullName} • +91 {order.shippingAddress.phone}</p>
                  <p className="text-slate-600 text-[11px]">
                    {order.shippingAddress.street || ''}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}, {order.shippingAddress.city}, {order.shippingAddress.state} - <PincodeDisplay pincode={order.shippingAddress.zipCode || order.shippingAddress.postalCode} />
                  </p>
                </div>
              )}

              {/* Still have issue? */}
              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Package not moving or delayed?</span>
                <button
                  onClick={() => handleSelectIssue('delivery_issue')}
                  className="font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Raise Delivery Issue →
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: RETURN PRODUCT FLOW */}
          {selectedAction === 'return_product' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <RotateCcw size={16} className="text-emerald-600" /> Request Product Return
                </h4>
                <button
                  onClick={() => setSelectedAction('overview')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  ← Back to Options
                </button>
              </div>

              {loadingEligibility ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="animate-spin mx-auto mb-2 text-blue-600" size={20} />
                  Verifying return eligibility...
                </div>
              ) : returnSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-slate-900 text-sm">Return Request Registered</h5>
                  <p className="text-emerald-800 text-xs">{returnSuccess}</p>
                </div>
              ) : returnEligibility && !returnEligibility.eligible ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                  <ShieldAlert size={28} className="text-amber-600 mx-auto" />
                  <h5 className="font-bold text-slate-900 text-sm">Not Eligible for Return</h5>
                  <p className="text-amber-800 text-xs">{returnEligibility.reason}</p>
                  <button
                    onClick={() => handleSelectIssue('other_issue')}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline inline-block cursor-pointer"
                  >
                    Contact Support Instead →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReturn} className="space-y-3">
                  {returnError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                      {returnError}
                    </div>
                  )}

                  <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-semibold">
                      Eligible Window: {returnEligibility?.daysRemaining || 7} days remaining
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Doorstep Pickup
                    </span>
                  </div>

                  {/* Items selector */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block">Select Items to Return:</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {order.items?.map((item, idx) => {
                        const sel = selectedItems[item.productId] || { selected: false, qty: 1, reason: '', condition: 'opened' };
                        return (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-xl border transition-all ${
                              sel.selected ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <input
                                type="checkbox"
                                id={`ret-item-${idx}`}
                                checked={sel.selected}
                                onChange={(e) => {
                                  setSelectedItems({
                                    ...selectedItems,
                                    [item.productId]: { ...sel, selected: e.target.checked }
                                  });
                                }}
                                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={`ret-item-${idx}`} className="font-bold text-slate-900 block truncate cursor-pointer">
                                  {item.name}
                                </label>
                                <p className="text-slate-500 text-[11px]">
                                  Qty: {item.quantity || 1} • ₹{Number(item.unitPrice || item.totalPrice || 0).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>

                            {sel.selected && (
                              <div className="mt-2.5 pl-6 grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <label className="text-slate-500 block mb-0.5">Condition</label>
                                  <select
                                    value={sel.condition}
                                    onChange={(e) => {
                                      setSelectedItems({
                                        ...selectedItems,
                                        [item.productId]: { ...sel, condition: e.target.value }
                                      });
                                    }}
                                    className="w-full p-1.5 rounded border border-slate-200 bg-white"
                                  >
                                    <option value="opened">Opened / Inspected</option>
                                    <option value="unopened">Unopened / Sealed</option>
                                    <option value="defective">Defective / Malfunctioning</option>
                                    <option value="damaged_in_transit">Damaged in Transit</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-slate-500 block mb-0.5">Reason</label>
                                  <select
                                    value={sel.reason}
                                    onChange={(e) => {
                                      setSelectedItems({
                                        ...selectedItems,
                                        [item.productId]: { ...sel, reason: e.target.value }
                                      });
                                    }}
                                    className="w-full p-1.5 rounded border border-slate-200 bg-white"
                                  >
                                    <option value="Defective / Not working">Defective / Not working</option>
                                    <option value="Damaged / Broken in box">Damaged in box</option>
                                    <option value="Wrong item received">Wrong item received</option>
                                    <option value="Item not as described">Item not as described</option>
                                    <option value="Missing parts / accessories">Missing accessories</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Additional details for pickup & inspection:</label>
                    <textarea
                      rows={2}
                      value={returnComments}
                      onChange={(e) => setReturnComments(e.target.value)}
                      placeholder="Enter additional details for pickup and inspection..."
                      className="w-full p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReturn}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submittingReturn ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    Submit Return Request
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW 4: TICKET FORM FOR ISSUES (Delivery, Cancel, Refund, Payment, Other) */}
          {(selectedAction === 'delivery_issue' || 
            selectedAction === 'cancel_order' || 
            selectedAction === 'refund_issue' || 
            selectedAction === 'payment_issue' || 
            selectedAction === 'other_issue') && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-blue-600" /> 
                  {selectedAction === 'delivery_issue' && 'Report Delivery Issue'}
                  {selectedAction === 'cancel_order' && 'Request Order Cancellation'}
                  {selectedAction === 'refund_issue' && 'Refund Query'}
                  {selectedAction === 'payment_issue' && 'Payment & Invoicing Support'}
                  {selectedAction === 'other_issue' && 'Order Assistance'}
                </h4>
                <button
                  onClick={() => setSelectedAction('overview')}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  ← Back to Options
                </button>
              </div>

              {ticketSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-slate-900 text-sm">Ticket Submitted</h5>
                  <p className="text-emerald-800 text-xs">{ticketSuccess}</p>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => handleSubmitTicket(
                    e, 
                    selectedAction === 'delivery_issue' ? 'shipping_tracking' : 
                    selectedAction === 'cancel_order' ? 'order_issue' :
                    selectedAction === 'refund_issue' ? 'return_refund' :
                    selectedAction === 'payment_issue' ? 'payment_issue' : 'general'
                  )} 
                  className="space-y-3"
                >
                  {ticketError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                      {ticketError}
                    </div>
                  )}

                  {/* Cancellation Note */}
                  {selectedAction === 'cancel_order' && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                      <strong>Note:</strong> If this order has already entered dispatch packaging, our support agent will notify the courier to return to origin immediately and trigger your full refund.
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Associated Order</label>
                      <input
                        type="text"
                        disabled
                        value={`#${invoiceNum}`}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Describe your issue in detail</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      placeholder="Enter issue details..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submittingTicket ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    Submit Support Request
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-blue-600" /> Fast Response within 24 hours
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
