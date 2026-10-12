import React, { useState } from 'react';
import { 
  X, Truck, Package, MapPin, Phone, Mail, Calendar, 
  ExternalLink, Copy, Check, MessageSquare, AlertTriangle, 
  Clock, CheckCircle2, RotateCcw, Printer, Edit3, ShieldAlert 
} from 'lucide-react';
import { Order } from '../../../types';
import { 
  formatCurrency, 
  formatOrderDateTime, 
  getShippingStatusLabel, 
  getEffectiveShippingStatus 
} from '../orders/orderUtils';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';

interface ShipmentDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onEditShipment: (order: Order) => void;
  onUpdateTracking: (order: Order) => void;
  onPrintSlip?: (order: Order) => void;
}

export function ShipmentDetailsModal({
  order,
  isOpen,
  onClose,
  onEditShipment,
  onUpdateTracking,
  onPrintSlip
}: ShipmentDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const effectiveShipping = getEffectiveShippingStatus(order);
  const shippingInfo = getShippingStatusLabel(effectiveShipping);
  const addr = order.shippingAddress;
  const items = order.items || [];
  const timeline = order.timeline || [];

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!addr?.phone) return;
    const cleanPhone = addr.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hello ${addr.fullName || 'Customer'}, regarding your ELECTRO STORE shipment for order #${inv}: Current shipping status is ${shippingInfo.label}.${order.trackingNumber ? ` Your ${order.carrier || 'courier'} tracking code is ${order.trackingNumber}.` : ''}`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Shipment Details: Order #{inv}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${shippingInfo.color}`}>
                  {shippingInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {formatOrderDateTime(order.createdAt)} • {items.length} Item(s)
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

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Failed Delivery Notice Banner if applicable */}
          {effectiveShipping === 'delivery_failed' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <AlertTriangle size={18} className="text-rose-600" />
                <span>Delivery Failed (Attempt #{order.deliveryAttempts || 1})</span>
              </div>
              <p className="text-xs text-rose-800">
                <strong>Reason:</strong> {order.failedDeliveryReason || 'Delivery partner was unable to reach the customer.'}
              </p>
              {order.deliveryNotes && (
                <p className="text-xs text-rose-700">
                  <strong>Notes:</strong> {order.deliveryNotes}
                </p>
              )}
              {order.estimatedDelivery && (
                <p className="text-xs text-rose-600 font-medium">
                  Next Expected Delivery: {order.estimatedDelivery}
                </p>
              )}
            </div>
          )}

          {/* Section 1: Courier & AWB Tracking Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={15} className="text-blue-600" /> Logistics & Courier Information
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditShipment(order)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <Edit3 size={12} /> Edit Courier
                </button>
                <button
                  onClick={() => onUpdateTracking(order)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <Clock size={12} /> Update Status
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Courier Partner</span>
                <span className="text-sm font-bold text-slate-800">
                  {order.carrier || order.courier || 'Pending Assignment'}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Tracking / AWB Number</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {order.trackingNumber || 'Not Generated'}
                  </span>
                  {order.trackingNumber && (
                    <button
                      onClick={() => copyToClipboard(order.trackingNumber!, 'tracking')}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="Copy Tracking Number"
                    >
                      {copiedField === 'tracking' ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Estimated Delivery</span>
                <span className="text-sm font-bold text-emerald-700">
                  {order.estimatedDelivery || (order.status === 'delivered' ? 'Delivered' : 'In 3-5 days')}
                </span>
              </div>
            </div>

            {/* Tracking Link & Dates */}
            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Shipping Date</span>
                <span className="text-slate-700 font-medium">
                  {order.shippingDate ? formatOrderDateTime(order.shippingDate) : (order.dispatchedAt ? formatOrderDateTime(order.dispatchedAt) : 'Pending')}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Live Tracking Link</span>
                {order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5"
                  >
                    <span>Open Courier Tracking Page</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No external URL provided</span>
                )}
              </div>
            </div>

            {order.shippingNotes && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Shipping Notes:</strong> {order.shippingNotes}
              </div>
            )}
          </div>

          {/* Section 2: Customer & Delivery Address */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={15} className="text-rose-600" /> Delivery Address & Customer
              </span>
              <div className="flex items-center gap-2">
                {addr?.phone && (
                  <button
                    onClick={handleOpenWhatsApp}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                    title="Message Customer on WhatsApp"
                  >
                    <MessageSquare size={12} /> WhatsApp
                  </button>
                )}
                {addr && (
                  <button
                    onClick={() => copyToClipboard(`${addr.fullName}, ${addr.addressLine1}, ${addr.city}, ${addr.state} - ${addr.pincode}. Phone: ${addr.phone}`, 'address')}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    {copiedField === 'address' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedField === 'address' ? 'Copied' : 'Copy Address'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-sm font-bold text-slate-900">{addr?.fullName || 'Customer'}</p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  {addr?.addressLine1}
                  {addr?.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  <br />
                  {addr?.city}, {addr?.state} - <PincodeDisplay pincode={addr?.pincode} />
                </p>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <a href={`tel:${addr?.phone}`} className="font-bold text-slate-800 hover:text-blue-600">
                    {addr?.phone || 'No phone provided'}
                  </a>
                </div>
                {(addr?.email || (order as any).customerEmail) && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{addr?.email || (order as any).customerEmail}</span>
                  </div>
                )}
                <div className="pt-1 text-[11px] text-slate-400 font-medium">
                  Payment: <strong className="text-slate-700">{order.payment?.paymentMethod || 'Online'}</strong> ({order.payment?.paymentStatus || 'pending'})
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Items in This Package */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={15} className="text-indigo-600" /> Package Contents ({items.length} Products)
            </span>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-slate-50/40">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <Package size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Qty: <strong className="text-slate-700">{item.quantity}</strong>
                        {item.sku && <span className="ml-2 font-mono text-slate-400">SKU: {item.sku}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(item.totalPrice || item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Full Tracking Activity Timeline & Audit Trail */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={15} className="text-blue-600" /> Complete Tracking Activity & Audit Trail
            </span>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No tracking events recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{event.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatOrderDateTime(event.timestamp)}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                          <MapPin size={11} /> {event.location}
                        </p>
                      )}
                      {event.note && (
                        <p className="text-[11px] text-slate-600">{event.note}</p>
                      )}
                      {event.performedBy && (
                        <p className="text-[10px] text-slate-400 italic">
                          Logged by: {event.performedBy}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {onPrintSlip && (
              <button
                onClick={() => onPrintSlip(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <Printer size={13} /> Print Dispatch Slip
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onUpdateTracking(order);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <Truck size={14} /> Update Tracking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
