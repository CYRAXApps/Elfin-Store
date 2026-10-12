import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, RotateCcw, DollarSign, Truck, Package, RefreshCw } from 'lucide-react';
import { Order } from '../../../types';
import { POPULAR_COURIERS, formatCurrency, generateTrackingUrl } from './orderUtils';
import { useAuth } from '../../../context/AuthContext';

// 1. Confirm Status Change Modal (e.g. Confirm Order, Start Processing, Mark Delivered)
interface ConfirmStatusModalProps {
  order: Order;
  targetStatus: Order['status'];
  targetLabel: string;
  onConfirm: (notifyCustomer: boolean) => Promise<void>;
  onClose: () => void;
}

export function ConfirmStatusModal({
  order,
  targetStatus,
  targetLabel,
  onConfirm,
  onClose
}: ConfirmStatusModalProps) {
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(notifyCustomer);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Update Order Status</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-500">Order Number:</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{inv}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500">New Status:</span>
              <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wide">
                {targetLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="notify-cust"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="notify-cust" className="text-xs text-slate-700 font-medium cursor-pointer">
              Send status notification update to customer
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>{submitting ? 'Updating...' : `Confirm & Update`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Shipping & Tracking Modal (Prompt when marking shipped or updating courier)
interface ShipOrderModalProps {
  order: Order;
  onSave: (data: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery: string;
    shippingStatus: NonNullable<Order['shippingStatus']>;
    markAsShipped: boolean;
    notifyCustomer: boolean;
  }) => Promise<void>;
  onClose: () => void;
  isShippingStatusTransition?: boolean;
}

export function ShipOrderModal({
  order,
  onSave,
  onClose,
  isShippingStatusTransition = false
}: ShipOrderModalProps) {
  const [carrier, setCarrier] = useState(order.carrier || 'Delhivery');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.estimatedDelivery || '');
  const [shippingStatus, setShippingStatus] = useState<NonNullable<Order['shippingStatus']>>(
    order.shippingStatus || (isShippingStatusTransition ? 'dispatched' : 'not_shipped')
  );
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleCarrierChange = (val: string) => {
    setCarrier(val);
    if (!trackingUrl && trackingNumber) {
      setTrackingUrl(generateTrackingUrl(val, trackingNumber));
    }
  };

  const handleTrackingNumberChange = (val: string) => {
    setTrackingNumber(val);
    if (carrier && (!trackingUrl || trackingUrl === generateTrackingUrl(carrier, trackingNumber))) {
      setTrackingUrl(generateTrackingUrl(carrier, val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        carrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || generateTrackingUrl(carrier, trackingNumber.trim()),
        estimatedDelivery: estimatedDelivery.trim(),
        shippingStatus,
        markAsShipped: isShippingStatusTransition,
        notifyCustomer
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isShippingStatusTransition ? 'Dispatch Order & Add Tracking' : 'Update Shipping & Tracking'}
              </h3>
              <p className="text-[11px] text-slate-500">Enter courier details for the customer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Logistics / Courier Partner <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="popular-couriers"
              value={carrier}
              onChange={(e) => handleCarrierChange(e.target.value)}
              placeholder="Enter courier partner name"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-xs font-medium"
              required
            />
            <datalist id="popular-couriers">
              {POPULAR_COURIERS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {POPULAR_COURIERS.slice(0, 5).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCarrierChange(c)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                    carrier === c
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tracking Number / AWB <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => handleTrackingNumberChange(e.target.value)}
                placeholder="Enter tracking number or AWB"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Estimated Delivery
              </label>
              <input
                type="text"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                placeholder="Enter estimated delivery timeframe"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Shipping Status
            </label>
            <select
              value={shippingStatus}
              onChange={(e) => setShippingStatus(e.target.value as NonNullable<Order['shippingStatus']>)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-xs font-semibold"
            >
              <option value="not_shipped">Pending Dispatch</option>
              <option value="label_created">AWB / Label Created</option>
              <option value="dispatched">Dispatched / Handed to Courier</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Direct Tracking URL <span className="text-slate-400 font-normal">(Auto-generated or custom)</span>
            </label>
            <input
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ship-notify-cust"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="ship-notify-cust" className="text-xs text-slate-700 font-medium cursor-pointer">
              Send tracking link & courier details to customer
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>{submitting ? 'Saving...' : isShippingStatusTransition ? 'Mark Shipped & Save' : 'Save Shipping Info'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Cancel Order Modal (Required Confirmation)
interface CancelOrderModalProps {
  order: Order;
  onConfirm: (reason: string, restoreInventory: boolean) => Promise<void>;
  onClose: () => void;
}

export function CancelOrderModal({
  order,
  onConfirm,
  onClose
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('Customer requested cancellation');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(reason, restoreInventory);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const isPaid = order.payment?.paymentStatus === 'captured';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Cancel Order</h3>
              <p className="text-[11px] text-slate-500">Action requires store owner confirmation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-900 space-y-1">
            <p className="font-bold">Order #{inv}</p>
            <p className="text-[11px] text-rose-700">
              Total: {formatCurrency(order.grandTotal || order.totalAmount)} • Status: {order.status}
            </p>
            {isPaid && (
              <p className="text-[11px] font-semibold text-rose-800 pt-1">
                ⚠️ Payment is currently Paid/Captured. You can issue a refund after cancelling.
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-xs font-medium"
            >
              <option value="Customer requested cancellation">Customer requested cancellation</option>
              <option value="Item out of stock">Item out of stock / Inventory shortage</option>
              <option value="Incorrect shipping address provided">Incorrect shipping address provided</option>
              <option value="Suspected fraudulent order">Suspected fraudulent order</option>
              <option value="Payment authorization issue">Payment authorization issue</option>
              <option value="Other">Other store owner reason</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="restore-stock-cb"
              checked={restoreInventory}
              onChange={(e) => setRestoreInventory(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
            />
            <label htmlFor="restore-stock-cb" className="text-xs text-slate-700 font-medium cursor-pointer">
              Restock product quantities back into active inventory
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Do Not Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>{submitting ? 'Cancelling...' : 'Confirm Cancellation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. Start Return Modal
interface ReturnOrderModalProps {
  order: Order;
  onConfirm: (reason: string, restock: boolean) => Promise<void>;
  onClose: () => void;
}

export function ReturnOrderModal({
  order,
  onConfirm,
  onClose
}: ReturnOrderModalProps) {
  const [reason, setReason] = useState('Customer reported defect or wrong item');
  const [restock, setRestock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(reason, restock);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-orange-600">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center font-bold">
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Process Customer Return</h3>
              <p className="text-[11px] text-slate-500">Record item return and update order status</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Return Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-xs font-medium"
            >
              <option value="Customer reported defect or wrong item">Defective or damaged in transit</option>
              <option value="Wrong item shipped">Wrong item shipped by warehouse</option>
              <option value="Customer changed mind / return window">Customer return request</option>
              <option value="Undeliverable package returned by courier">Undeliverable package returned by courier (RTO)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="return-restock-cb"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="return-restock-cb" className="text-xs text-slate-700 font-medium cursor-pointer">
              Product is inspected and suitable to restock into sellable inventory
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>{submitting ? 'Processing...' : 'Mark as Returned'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. Issue Refund Modal (Required Confirmation & Real Gateway Integration)
interface RefundOrderModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundOrderModal({
  order,
  onClose,
  onSuccess
}: RefundOrderModalProps) {
  const { user } = useAuth();
  const grandTotal = Number(order.grandTotal || order.totalAmount || 0);
  const alreadyRefunded = Number(order.payment?.refundedAmount || 0);
  const maxRefundable = Math.max(0, grandTotal - alreadyRefunded);

  const [amount, setAmount] = useState<number>(maxRefundable);
  const [reason, setReason] = useState('Customer return or cancellation refund');
  const [restoreStock, setRestoreStock] = useState(false);
  const [destination, setDestination] = useState<'original_payment' | 'store_credit'>('original_payment');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > maxRefundable) {
      setErrorMsg(`Please enter a valid refund amount between ₹1 and ₹${maxRefundable}.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: Number(amount),
          reason,
          restoreStock,
          refundDestination: destination,
          adminEmail: user?.email || 'admin'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process refund on payment gateway.');
      }

      alert(`✅ Refund of ${formatCurrency(amount)} successfully processed! Gateway ID: ${data.refundId || 'Processed'}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Refund error:', err);
      setErrorMsg(err.message || 'Refund transaction could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-purple-700">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Issue Order Refund</h3>
              <p className="text-[11px] text-slate-500">Secure Razorpay Gateway & Financial Processing</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500">Order Total:</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{formatCurrency(grandTotal)}</p>
            </div>
            <div>
              <span className="text-slate-500">Available to Refund:</span>
              <p className="font-bold text-emerald-600 text-sm mt-0.5">{formatCurrency(maxRefundable)}</p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Refund Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min={1}
                max={maxRefundable}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-20 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-purple-500"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(maxRefundable)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-bold"
              >
                Full (₹{maxRefundable})
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Refund Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestination('original_payment')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  destination === 'original_payment'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">Original Payment</div>
                <div className="text-[10px] text-slate-400 font-normal">Razorpay source account</div>
              </button>

              <button
                type="button"
                onClick={() => setDestination('store_credit')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  destination === 'store_credit'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">Store Credit Wallet</div>
                <div className="text-[10px] text-slate-400 font-normal">Instant customer credit</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Refund Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="refund-restore-stock"
              checked={restoreStock}
              onChange={(e) => setRestoreStock(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="refund-restore-stock" className="text-xs text-slate-700 font-medium cursor-pointer">
              Restore refunded item quantities to inventory
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || maxRefundable <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <RefreshCw size={12} className="animate-spin" />}
              <span>{submitting ? 'Processing via Gateway...' : `Confirm Refund of ${formatCurrency(amount)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
