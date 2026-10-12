import React from 'react';
import { Eye, FileText, ArrowRight, Package, Truck, ExternalLink } from 'lucide-react';
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

interface OrderTableRowProps {
  key?: React.Key;
  order: Order;
  onViewOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
  onQuickAction: (order: Order, actionType: string) => void;
}

export function OrderTableRow({
  order,
  onViewOrder,
  onViewInvoice,
  onQuickAction
}: OrderTableRowProps) {
  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const total = order.grandTotal || order.totalAmount || 0;
  const statusInfo = getOrderStatusInfo(order.status);
  const paymentInfo = getPaymentStatusInfo(order.payment);
  const shippingStatus = getEffectiveShippingStatus(order);
  const shippingInfo = getShippingStatusLabel(shippingStatus);
  const primaryAction = getPrimaryNextAction(order);

  // Items preview
  const itemsCount = order.items?.length || 0;
  const firstItem = order.items?.[0];
  const itemsSnippet = firstItem 
    ? `${firstItem.name}${itemsCount > 1 ? ` + ${itemsCount - 1} more` : ''}`
    : 'No items';

  const customerName = order.shippingAddress?.fullName || 'Customer';
  const customerCity = order.shippingAddress?.city 
    ? `${order.shippingAddress.city}, ${order.shippingAddress.state}` 
    : 'India';

  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0 text-xs">
      {/* 1. Order Number */}
      <td className="p-4">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 font-mono text-xs hover:text-blue-600 transition-colors">
          <span>#{inv}</span>
          {order.orderSource === 'pos' && (
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-100 text-blue-800 tracking-normal font-sans">
              POS
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          ID: {order.id.slice(0, 8)}
        </div>
      </td>

      {/* 2. Date */}
      <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
        {formatOrderDate(order.createdAt)}
      </td>

      {/* 3. Customer */}
      <td className="p-4">
        <div className="font-bold text-slate-800 truncate max-w-[150px]" title={customerName}>
          {customerName}
        </div>
        <div className="text-[11px] text-slate-400 truncate max-w-[150px]" title={customerCity}>
          {customerCity}
        </div>
      </td>

      {/* 4. Items */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          {firstItem?.image ? (
            <img 
              src={firstItem.image} 
              alt="" 
              className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0" 
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
              <Package size={14} />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-semibold text-slate-800 truncate block max-w-[140px]" title={itemsSnippet}>
              {itemsSnippet}
            </span>
            <span className="text-[10px] text-slate-400">
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </td>

      {/* 5. Total Amount */}
      <td className="p-4 font-black text-slate-900 whitespace-nowrap text-sm">
        {formatCurrency(total)}
      </td>

      {/* 6. Payment Status */}
      <td className="p-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${paymentInfo.badgeClass}`}>
          {paymentInfo.label}
        </span>
        {order.payment?.provider && (
          <span className="block text-[10px] text-slate-400 capitalize mt-0.5">
            {order.payment.provider}
          </span>
        )}
      </td>

      {/* 7. Order Status */}
      <td className="p-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
          <span>{statusInfo.label}</span>
        </span>
      </td>

      {/* 8. Shipping Status */}
      <td className="p-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${shippingInfo.color}`}>
          {shippingInfo.label}
        </span>
        {order.carrier && (
          <span className="block text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]" title={`${order.carrier} ${order.trackingNumber ? `#${order.trackingNumber}` : ''}`}>
            {order.carrier}
          </span>
        )}
      </td>

      {/* 9. Quick Action & View Order */}
      <td className="p-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {/* Contextual Quick Action Button */}
          {primaryAction && (
            <button
              onClick={() => onQuickAction(order, primaryAction.type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 shrink-0 ${primaryAction.colorClass}`}
              title={primaryAction.label}
            >
              <span>{primaryAction.label}</span>
            </button>
          )}

          {/* View Order Button */}
          <button
            onClick={() => onViewOrder(order)}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-semibold flex items-center gap-1 px-2.5 border border-slate-200"
            title="View full order details & management screen"
          >
            <Eye size={14} />
            <span className="text-xs">View</span>
          </button>

          {/* Invoice shortcut */}
          <button
            onClick={() => onViewInvoice(order)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="View GST Tax Invoice"
          >
            <FileText size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
