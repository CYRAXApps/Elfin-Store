import React from 'react';
import { Eye, FileText, Package, Truck, ArrowRight, User } from 'lucide-react';
import { Order } from '../../../types';
import { 
  formatCurrency, 
  formatOrderDate, 
  getOrderStatusInfo, 
  getPaymentStatusInfo, 
  getEffectiveShippingStatus, 
  getShippingStatusLabel,
  getPrimaryNextAction 
} from './orderUtils';

interface OrderCardMobileProps {
  key?: React.Key;
  order: Order;
  onViewOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
  onQuickAction: (order: Order, actionType: string) => void;
}

export function OrderCardMobile({
  order,
  onViewOrder,
  onViewInvoice,
  onQuickAction
}: OrderCardMobileProps) {
  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const total = order.grandTotal || order.totalAmount || 0;
  const statusInfo = getOrderStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment);
  const shippingStatus = getEffectiveShippingStatus(order);
  const shippingInfo = getShippingStatusLabel(shippingStatus);
  const primaryAction = getPrimaryNextAction(order);

  const customerName = order.shippingAddress?.fullName || 'Customer';
  const customerCity = order.shippingAddress?.city 
    ? `${order.shippingAddress.city}, ${order.shippingAddress.state}` 
    : 'India';

  const itemsCount = order.items?.length || 0;
  const firstItem = order.items?.[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Header: Order #, Date, and Badges */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 font-mono text-sm">
              #{inv}
            </span>
            {order.orderSource === 'pos' && (
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 tracking-normal font-sans">
                POS
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {formatOrderDate(order.createdAt)}
          </span>
        </div>

        {/* Order Status Badge */}
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
          <span>{statusInfo.label}</span>
        </span>
      </div>

      {/* Customer & Destination */}
      <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-2 min-w-0">
          <User size={13} className="text-slate-400 shrink-0" />
          <span className="font-bold text-slate-800 truncate">{customerName}</span>
        </div>
        <span className="text-slate-400 text-[11px] truncate shrink-0 ml-2">{customerCity}</span>
      </div>

      {/* Items Preview & Amount */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {firstItem?.image ? (
            <img 
              src={firstItem.image} 
              alt="" 
              className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
              <Package size={16} />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate" title={firstItem?.name || ''}>
              {firstItem?.name || 'No items'}
            </p>
            <p className="text-[11px] text-slate-400">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
          <p className="font-black text-slate-900 text-sm">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Payment & Shipping Badges */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Payment:</span>
          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border text-[10px] ${paymentInfo.badgeClass}`}>
            {paymentInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Shipping:</span>
          <span className={`px-2 py-0.5 rounded-md font-semibold border text-[10px] ${shippingInfo.color}`}>
            {shippingInfo.label}
          </span>
        </div>
      </div>

      {/* Mobile Actions Toolbar */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {primaryAction ? (
          <button
            onClick={() => onQuickAction(order, primaryAction.type)}
            className={`flex-1 min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${primaryAction.colorClass}`}
          >
            <span>{primaryAction.label}</span>
          </button>
        ) : null}

        <button
          onClick={() => onViewOrder(order)}
          className={`min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${!primaryAction ? 'flex-1' : ''}`}
        >
          <Eye size={14} />
          <span>View Order</span>
        </button>

        <button
          onClick={() => onViewInvoice(order)}
          className="min-h-[42px] px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center"
          title="GST Tax Invoice"
        >
          <FileText size={15} />
        </button>
      </div>
    </div>
  );
}
