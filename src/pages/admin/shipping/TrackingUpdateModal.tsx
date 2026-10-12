import React, { useState } from 'react';
import { 
  X, Truck, MapPin, AlertTriangle, CheckCircle2, Clock, 
  RotateCcw, Bell, RefreshCw, AlertCircle, Calendar 
} from 'lucide-react';
import { Order, ShippingStatus } from '../../../types';
import { FAILED_DELIVERY_REASONS } from '../orders/orderUtils';
import { db } from '../../../firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

interface TrackingUpdateModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'status' | 'failed';
}

export function TrackingUpdateModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'status'
}: TrackingUpdateModalProps) {
  const { user } = useAuth();

  const [status, setStatus] = useState<ShippingStatus>(
    initialMode === 'failed' 
      ? 'delivery_failed' 
      : (order.shippingStatus || 'in_transit')
  );
  const [location, setLocation] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [failedReason, setFailedReason] = useState<string>(
    order.failedDeliveryReason || FAILED_DELIVERY_REASONS[0].id
  );
  const [deliveryAttempts, setDeliveryAttempts] = useState<number>(
    (order.deliveryAttempts || 0) + 1
  );
  const [nextAttemptDate, setNextAttemptDate] = useState<string>('');
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const staffName = user?.displayName || user?.email || 'Store Admin';
      const nowIso = new Date().toISOString();

      let title = '';
      let defaultNote = '';

      if (status === 'ready_to_ship') {
        title = 'Ready to Ship (AWB Generated)';
        defaultNote = 'Package is packed and labeled in warehouse.';
      } else if (status === 'shipped') {
        title = `Dispatched via ${order.carrier || 'Courier'}`;
        defaultNote = `Package dispatched from warehouse.${order.trackingNumber ? ` AWB: ${order.trackingNumber}` : ''}`;
      } else if (status === 'in_transit') {
        title = `In Transit${location ? ` - ${location}` : ''}`;
        defaultNote = location ? `Arrived at sorting facility in ${location}.` : 'Package in transit to delivery city.';
      } else if (status === 'out_for_delivery') {
        title = 'Out for Delivery';
        defaultNote = 'Package has been assigned to local courier agent for delivery today.';
      } else if (status === 'delivered') {
        title = 'Delivered to Customer';
        defaultNote = 'Shipment was successfully handed over to the customer.';
      } else if (status === 'delivery_failed') {
        const reasonObj = FAILED_DELIVERY_REASONS.find(r => r.id === failedReason);
        title = `Delivery Attempt #${deliveryAttempts} Failed`;
        defaultNote = `Courier reason: ${reasonObj?.label || failedReason}.${statusNote ? ` Note: ${statusNote}` : ''}`;
      }

      const noteText = statusNote.trim() || defaultNote;

      // New timeline entry
      const timelineEntry = {
        status,
        title,
        timestamp: nowIso,
        location: location.trim() || undefined,
        note: noteText,
        performedBy: staffName
      };

      const existingTimeline = Array.isArray(order.timeline) ? order.timeline : [];
      const updatedTimeline = [...existingTimeline, timelineEntry];

      // Prepare order updates
      const updates: any = {
        shippingStatus: status,
        timeline: updatedTimeline,
        updatedAt: serverTimestamp()
      };

      // Sync master order status
      if (status === 'delivered') {
        updates.status = 'delivered';
        if (!order.deliveredAt) {
          updates.deliveredAt = serverTimestamp();
        }
      } else if (status === 'out_for_delivery') {
        if (order.status !== 'delivered') {
          updates.status = 'out_for_delivery';
        }
      } else if (status === 'shipped' || status === 'in_transit') {
        if (order.status !== 'delivered' && order.status !== 'out_for_delivery') {
          updates.status = 'shipped';
        }
      }

      // If delivery failed
      if (status === 'delivery_failed') {
        const reasonLabel = FAILED_DELIVERY_REASONS.find(r => r.id === failedReason)?.label || failedReason;
        updates.failedDeliveryReason = reasonLabel;
        updates.deliveryAttempts = Number(deliveryAttempts) || 1;
        updates.deliveryNotes = statusNote.trim() || reasonLabel;
        if (nextAttemptDate) {
          updates.estimatedDelivery = nextAttemptDate;
        }
      }

      // Update Order document in Firestore
      await updateDoc(doc(db, 'orders', order.id), updates);

      // Customer notification
      if (notifyCustomer) {
        try {
          let notifTitle = `Order #${inv} Tracking Update`;
          let notifMsg = noteText;

          if (status === 'delivered') {
            notifTitle = `Order #${inv} Delivered! 🎉`;
            notifMsg = `Your package has been successfully delivered. Thank you for shopping with ELECTRO STORE!`;
          } else if (status === 'out_for_delivery') {
            notifTitle = `Order #${inv} Out for Delivery! 📦`;
            notifMsg = `Your package is out with the delivery agent and will be delivered to your address today.`;
          } else if (status === 'delivery_failed') {
            const reasonLabel = FAILED_DELIVERY_REASONS.find(r => r.id === failedReason)?.label || failedReason;
            notifTitle = `Delivery Attempt Notice for Order #${inv}`;
            notifMsg = `Delivery attempt #${deliveryAttempts} was unsuccessful (${reasonLabel}). Our courier partner will re-attempt delivery shortly.`;
          } else if (status === 'in_transit') {
            notifTitle = `Order #${inv} In Transit 🚚`;
            notifMsg = location 
              ? `Your package is moving towards you and was scanned at ${location}.` 
              : `Your package is currently in transit with our logistics partner.`;
          }

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
            templateId: status === 'delivered' ? 'order_delivered' : 'order_shipping_update',
            status: 'sent',
            provider: 'firestore_realtime',
            attemptCount: 1,
            read: false,
            createdAt: serverTimestamp(),
            sentAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn('Customer notification failed non-fatally:', notifErr);
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating tracking status:', err);
      setErrorMsg(err.message || 'Failed to update tracking status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              status === 'delivery_failed' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {status === 'delivery_failed' ? <AlertTriangle size={20} /> : <Truck size={20} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {status === 'delivery_failed' ? 'Record Delivery Attempt / Failure' : 'Update Tracking & Delivery Progress'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Order #{inv} • {order.carrier || 'Courier'} ({order.trackingNumber || 'No AWB'})
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Status Selection Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              New Shipping & Delivery Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'ready_to_ship', label: 'Ready to Ship', color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900' },
                { id: 'shipped', label: 'Dispatched', color: 'border-purple-200 bg-purple-50/50 text-purple-900' },
                { id: 'in_transit', label: 'In Transit', color: 'border-blue-200 bg-blue-50/50 text-blue-900' },
                { id: 'out_for_delivery', label: 'Out for Delivery', color: 'border-cyan-200 bg-cyan-50/50 text-cyan-900' },
                { id: 'delivered', label: 'Delivered', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900' },
                { id: 'delivery_failed', label: 'Delivery Failed', color: 'border-rose-200 bg-rose-50/50 text-rose-900' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as ShippingStatus)}
                  className={`p-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    status === st.id
                      ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* If Delivery Failed Specific Fields */}
          {status === 'delivery_failed' && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertTriangle size={15} className="text-rose-600" />
                <span>Record Failed Attempt Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-rose-900 block">
                    Reason for Delivery Failure <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={failedReason}
                    onChange={(e) => setFailedReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 font-medium"
                  >
                    {FAILED_DELIVERY_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-rose-900 block">
                    Attempt Count
                  </label>
                  <select
                    value={deliveryAttempts}
                    onChange={(e) => setDeliveryAttempts(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 font-medium"
                  >
                    <option value={1}>1st Attempt</option>
                    <option value={2}>2nd Attempt</option>
                    <option value={3}>3rd Attempt</option>
                    <option value={4}>4th Attempt (Final)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-900 block">
                  Next Scheduled Attempt / Re-dispatch Date (Optional)
                </label>
                <input
                  type="date"
                  value={nextAttemptDate}
                  onChange={(e) => setNextAttemptDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>
          )}

          {/* Current Hub / Location */}
          {status !== 'delivery_failed' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Current Hub / City Location (Optional)
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai Sorting Hub, Bengaluru Delivery Center"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}

          {/* Status Note / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Tracking Activity Remarks / Notes
            </label>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder={status === 'delivery_failed' ? 'e.g. Customer requested delivery after 6 PM tomorrow.' : 'e.g. Package scanned and loaded onto outbound express line.'}
              rows={2}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Notify customer toggle */}
          <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <Bell size={12} className="text-blue-600" /> Notify Customer
              </span>
              <span className="text-slate-500 text-[11px]">
                Sends customer an instant in-app tracking update alert.
              </span>
            </div>
          </label>

          {/* Footer Buttons */}
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
              className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                status === 'delivery_failed' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Update Tracking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
