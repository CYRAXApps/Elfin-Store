import React, { useState } from 'react';
import { 
  X, Truck, Calendar, Link as LinkIcon, FileText, CheckCircle2, 
  AlertCircle, Package, ArrowRight, Bell, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { Order, ShippingStatus } from '../../../types';
import { POPULAR_COURIERS, generateTrackingUrl } from '../orders/orderUtils';
import { db } from '../../../firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';

interface ShipmentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShipmentModal({ order, isOpen, onClose, onSuccess }: ShipmentModalProps) {
  const { user } = useAuth();
  
  // Format today's date YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [carrier, setCarrier] = useState<string>(order.carrier || order.courier || 'Delhivery');
  const [customCarrier, setCustomCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>(order.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState<string>(order.trackingUrl || '');
  const [shippingDate, setShippingDate] = useState<string>(order.shippingDate || today);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>(order.estimatedDelivery || '');
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(
    order.shippingStatus || (order.status === 'delivered' ? 'delivered' : order.status === 'shipped' ? 'shipped' : 'ready_to_ship')
  );
  const [shippingNotes, setShippingNotes] = useState<string>(order.shippingNotes || '');
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const effectiveCarrier = carrier === 'other' ? (customCarrier.trim() || 'Custom Courier') : carrier;

  // Auto update tracking URL when carrier or tracking number changes
  const handleTrackingNumberChange = (val: string) => {
    setTrackingNumber(val);
    if (carrier !== 'other' && val.trim()) {
      const autoUrl = generateTrackingUrl(carrier, val.trim());
      if (autoUrl) {
        setTrackingUrl(autoUrl);
      }
    }
  };

  const handleCarrierChange = (newCarrier: string) => {
    setCarrier(newCarrier);
    if (newCarrier !== 'other' && trackingNumber.trim()) {
      const autoUrl = generateTrackingUrl(newCarrier, trackingNumber.trim());
      if (autoUrl) {
        setTrackingUrl(autoUrl);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveCarrier) {
      setErrorMsg('Please select or specify a shipping courier partner.');
      return;
    }
    if (!trackingNumber.trim()) {
      setErrorMsg('Please provide a tracking / AWB code for this shipment.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const staffName = user?.displayName || user?.email || 'Store Admin';
      const nowIso = new Date().toISOString();

      // Timeline entry
      const timelineEntry = {
        status: shippingStatus,
        title: shippingStatus === 'ready_to_ship' ? 'Ready to Ship (AWB Generated)'
             : shippingStatus === 'shipped' ? `Shipment Dispatched via ${effectiveCarrier}`
             : shippingStatus === 'in_transit' ? `In Transit via ${effectiveCarrier}`
             : shippingStatus === 'out_for_delivery' ? 'Out for Delivery'
             : shippingStatus === 'delivered' ? 'Shipment Delivered'
             : 'Shipment Updated',
        timestamp: nowIso,
        note: shippingNotes || `Carrier: ${effectiveCarrier}, AWB: ${trackingNumber.trim()}`,
        performedBy: staffName
      };

      const existingTimeline = Array.isArray(order.timeline) ? order.timeline : [];
      const updatedTimeline = [...existingTimeline, timelineEntry];

      // Update Order Status if shippingStatus calls for it
      let targetOrderStatus = order.status;
      if (shippingStatus === 'shipped' || shippingStatus === 'in_transit') {
        if (targetOrderStatus !== 'delivered' && targetOrderStatus !== 'out_for_delivery') {
          targetOrderStatus = 'shipped';
        }
      } else if (shippingStatus === 'out_for_delivery') {
        if (targetOrderStatus !== 'delivered') {
          targetOrderStatus = 'out_for_delivery';
        }
      } else if (shippingStatus === 'delivered') {
        targetOrderStatus = 'delivered';
      }

      const updates: any = {
        carrier: effectiveCarrier,
        courier: effectiveCarrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
        shippingDate: shippingDate || today,
        estimatedDelivery: estimatedDelivery.trim(),
        shippingStatus,
        shippingNotes: shippingNotes.trim(),
        status: targetOrderStatus,
        timeline: updatedTimeline,
        updatedAt: serverTimestamp()
      };

      if (shippingStatus === 'shipped' && !order.dispatchedAt) {
        updates.dispatchedAt = serverTimestamp();
      }
      if (shippingStatus === 'delivered' && !order.deliveredAt) {
        updates.deliveredAt = serverTimestamp();
      }

      // Also maintain shipments array
      const shipmentObject = {
        id: `ship_${Date.now()}`,
        shipmentNumber: `SHP-${order.id.slice(0, 6).toUpperCase()}-1`,
        carrier: effectiveCarrier,
        courier: effectiveCarrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim(),
        shippingStatus,
        shippingDate: shippingDate || today,
        estimatedDelivery: estimatedDelivery.trim(),
        shippingNotes: shippingNotes.trim(),
        shippedAt: updates.dispatchedAt || order.dispatchedAt || nowIso,
        timeline: [timelineEntry]
      };

      updates.shipments = [shipmentObject];

      // Execute Firestore update
      await updateDoc(doc(db, 'orders', order.id), updates);

      // Customer notification
      if (notifyCustomer) {
        try {
          const notifTitle = shippingStatus === 'delivered'
            ? `Order #${inv} Delivered!`
            : shippingStatus === 'out_for_delivery'
            ? `Order #${inv} is Out for Delivery! 📦`
            : `Order #${inv} Dispatched via ${effectiveCarrier}! 🚀`;

          const notifMsg = shippingStatus === 'delivered'
            ? `Your package has been successfully delivered. Thank you for shopping with us!`
            : `Your order has been shipped via ${effectiveCarrier} with tracking number ${trackingNumber.trim()}.${estimatedDelivery ? ` Expected delivery: ${estimatedDelivery}.` : ''}`;

          await addDoc(collection(db, 'notifications'), {
            userId: order.userId,
            orderId: order.id,
            orderNumber: inv,
            type: 'shipping',
            channel: 'in_app',
            recipient: order.shippingAddress?.email || (order as any).customerEmail || order.userId || 'customer',
            subject: notifTitle,
            title: notifTitle,
            message: notifMsg,
            templateId: shippingStatus === 'delivered' ? 'order_delivered' : 'order_shipped',
            status: 'sent',
            provider: 'firestore_realtime',
            attemptCount: 1,
            read: false,
            createdAt: serverTimestamp(),
            sentAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn('Notification queuing failed non-fatally:', notifErr);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create/assign shipment:', err);
      setErrorMsg(err.message || 'Failed to save shipment details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {order.trackingNumber ? 'Edit / Reassign Shipment' : 'Create & Assign Shipment'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Order #{inv} • {order.shippingAddress?.fullName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Destination Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <span>Delivery Destination</span>
              <span>{order.items?.length || 1} Item(s)</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {order.shippingAddress?.fullName} ({order.shippingAddress?.phone})
            </p>
            <p className="text-slate-600">
              {order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - <PincodeDisplay pincode={order.shippingAddress?.pincode} />
            </p>
          </div>

          {/* Courier Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Courier / Shipping Partner <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_COURIERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCarrierChange(c)}
                  className={`p-2.5 text-xs font-medium rounded-xl border text-left flex items-center justify-between transition-all ${
                    carrier === c
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{c}</span>
                  {carrier === c && <CheckCircle2 size={14} className="text-blue-600 shrink-0 ml-1" />}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleCarrierChange('other')}
                className={`p-2.5 text-xs font-medium rounded-xl border text-left flex items-center justify-between transition-all ${
                  carrier === 'other'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-100 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>Other Courier</span>
                {carrier === 'other' && <CheckCircle2 size={14} className="text-blue-600 shrink-0 ml-1" />}
              </button>
            </div>

            {carrier === 'other' && (
              <input
                type="text"
                value={customCarrier}
                onChange={(e) => setCustomCarrier(e.target.value)}
                placeholder="Enter courier partner name (e.g. India Post, Local Porter, Self Fleet)"
                className="w-full mt-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            )}
          </div>

          {/* Tracking / AWB Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Tracking / AWB Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => handleTrackingNumberChange(e.target.value)}
                placeholder="e.g. DEL1234567890, 789456123"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Shipping Date
              </label>
              <input
                type="date"
                value={shippingDate}
                onChange={(e) => setShippingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Expected Delivery Date & Direct Tracking URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Expected Delivery Date
              </label>
              <input
                type="text"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                placeholder="e.g. 24 Oct, 2026 or Tomorrow"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Initial Delivery Status
              </label>
              <select
                value={shippingStatus}
                onChange={(e) => setShippingStatus(e.target.value as ShippingStatus)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
              >
                <option value="ready_to_ship">Ready to Ship (Label Generated)</option>
                <option value="shipped">Shipped / Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Direct Tracking Web Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Direct Tracking Web Link</span>
              <span className="text-[11px] text-slate-400 font-normal">Auto-filled if known</span>
            </label>
            <div className="relative">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://track.courier.com/..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Shipping Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Shipping Notes / Instructions (Optional)
            </label>
            <input
              type="text"
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              placeholder="e.g. Fragile electronic items, evening delivery requested"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Customer Notification Toggle */}
          <label className="flex items-center gap-2.5 p-3 bg-blue-50/70 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-blue-900 block flex items-center gap-1">
                <Bell size={12} className="text-blue-600" /> Notify Customer
              </span>
              <span className="text-blue-700 text-[11px]">
                Sends in-app alert & notification with courier name & AWB number.
              </span>
            </div>
          </label>

          {/* Modal Footer Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving Shipment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Confirm & Save Shipment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
