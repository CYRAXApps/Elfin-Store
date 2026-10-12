import { Order } from '../../../types';

export const POPULAR_COURIERS = [
  'Blue Dart',
  'Delhivery',
  'DTDC',
  'India Post',
  'Shadowfax',
  'FedEx',
  'Ekart Logistics',
  'Ecom Express',
  'XpressBees'
];

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatOrderDate(timestamp: any): string {
  if (!timestamp) return 'N/A';
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

export function formatOrderDateTime(timestamp: any): string {
  if (!timestamp) return 'N/A';
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
}

export function getEffectiveShippingStatus(order: Order): string {
  if (order.shippingStatus) {
    return order.shippingStatus;
  }
  if (order.status === 'delivered') return 'delivered';
  if (order.status === 'out_for_delivery') return 'out_for_delivery';
  if (order.status === 'shipped') return 'shipped';
  if (order.status === 'returned') return 'returned';
  if (order.trackingNumber || order.carrier) return 'ready_to_ship';
  if (order.status === 'processing') return 'ready_to_ship';
  return 'not_shipped';
}

export function getShippingStatusLabel(shippingStatus: string): { label: string; color: string } {
  switch (shippingStatus) {
    case 'delivered':
      return { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'out_for_delivery':
      return { label: 'Out for Delivery', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    case 'in_transit':
      return { label: 'In Transit', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'shipped':
    case 'dispatched':
      return { label: 'Shipped', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'ready_to_ship':
    case 'label_created':
      return { label: 'Ready to Ship', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'delivery_failed':
      return { label: 'Delivery Failed', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'returned':
      return { label: 'Returned', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'not_shipped':
    default:
      return { label: 'Pending Packing', color: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
}

export const FAILED_DELIVERY_REASONS = [
  { id: 'customer_unavailable', label: 'Customer Unavailable / Door Closed' },
  { id: 'incorrect_address', label: 'Incomplete or Incorrect Address' },
  { id: 'phone_unreachable', label: 'Customer Phone Not Reachable / Switched Off' },
  { id: 'customer_refused', label: 'Customer Refused Delivery' },
  { id: 'cod_not_ready', label: 'Cash on Delivery (COD) Amount Not Ready' },
  { id: 'pincode_unreachable', label: 'Delivery Area Unreachable / Restricted Zone' },
  { id: 'customer_rescheduled', label: 'Customer Requested Reschedule' },
  { id: 'weather_delay', label: 'Severe Weather / Logistics Delay' },
  { id: 'other', label: 'Other Operational Issue' },
];

export function getOrderStatusInfo(status: Order['status'] | undefined): {
  label: string;
  badgeClass: string;
  dotColor: string;
  icon: string;
} {
  switch (status) {
    case 'pending':
      return {
        label: 'New Order',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        icon: '⏳'
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        icon: '📋'
      };
    case 'processing':
      return {
        label: 'Processing',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dotColor: 'bg-indigo-500',
        icon: '⚙️'
      };
    case 'shipped':
      return {
        label: 'Shipped',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        dotColor: 'bg-purple-500',
        icon: '🚚'
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        dotColor: 'bg-teal-500',
        icon: '📦'
      };
    case 'delivered':
      return {
        label: 'Delivered',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
        icon: '✅'
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
        icon: '❌'
      };
    case 'returned':
      return {
        label: 'Returned',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
        dotColor: 'bg-orange-500',
        icon: '↩️'
      };
    case 'refunded':
      return {
        label: 'Refunded',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        dotColor: 'bg-slate-500',
        icon: '💰'
      };
    default:
      return {
        label: 'Unknown',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400',
        icon: '❓'
      };
  }
}

export function getPaymentStatusInfo(payment: Order['payment']): {
  label: string;
  badgeClass: string;
  isPaid: boolean;
  refundStatus: 'none' | 'available' | 'partially_refunded' | 'refunded' | 'failed';
} {
  const status = payment?.paymentStatus;
  const isPaid = status === 'captured';
  const isRefunded = status === 'refunded';
  const isPartiallyRefunded = status === 'partially_refunded';

  if (isRefunded) {
    return {
      label: 'Refunded',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      isPaid: false,
      refundStatus: 'refunded'
    };
  }

  if (isPartiallyRefunded) {
    return {
      label: 'Partial Refund',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      isPaid: true,
      refundStatus: 'partially_refunded'
    };
  }

  if (isPaid) {
    return {
      label: 'Paid',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      isPaid: true,
      refundStatus: 'available'
    };
  }

  if (status === 'failed') {
    return {
      label: 'Failed',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      isPaid: false,
      refundStatus: 'failed'
    };
  }

  return {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    isPaid: false,
    refundStatus: 'none'
  };
}

export function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  if (!trackingNumber) return '';
  const cleanCourier = carrier.trim().toLowerCase();
  const cleanNumber = encodeURIComponent(trackingNumber.trim());

  if (cleanCourier.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${cleanNumber}`;
  }
  if (cleanCourier.includes('blue dart') || cleanCourier.includes('bluedart')) {
    return `https://www.bluedart.com/tracking?numbers=${cleanNumber}`;
  }
  if (cleanCourier.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${cleanNumber}`;
  }
  if (cleanCourier.includes('india post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
  }
  if (cleanCourier.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${cleanNumber}`;
  }
  if (cleanCourier.includes('shadowfax')) {
    return `https://tracker.shadowfax.in/#/track?trackingId=${cleanNumber}`;
  }
  if (cleanCourier.includes('xpressbees')) {
    return `https://www.xpressbees.com/track?tracking_id=${cleanNumber}`;
  }
  return '';
}

export type OrderQuickActionType = 
  | 'confirm' 
  | 'process' 
  | 'ship' 
  | 'deliver' 
  | 'cancel' 
  | 'return' 
  | 'refund';

export interface NextActionInfo {
  type: OrderQuickActionType;
  label: string;
  colorClass: string;
  isDestructive?: boolean;
}

export function getPrimaryNextAction(order: Order): NextActionInfo | null {
  switch (order.status) {
    case 'pending':
      return {
        type: 'confirm',
        label: 'Confirm Order',
        colorClass: 'bg-blue-600 hover:bg-blue-700 text-white'
      };
    case 'confirmed':
      return {
        type: 'process',
        label: 'Start Processing',
        colorClass: 'bg-indigo-600 hover:bg-indigo-700 text-white'
      };
    case 'processing':
      return {
        type: 'ship',
        label: 'Mark Shipped',
        colorClass: 'bg-purple-600 hover:bg-purple-700 text-white'
      };
    case 'shipped':
    case 'out_for_delivery':
      return {
        type: 'deliver',
        label: 'Mark Delivered',
        colorClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
      };
    case 'delivered':
      return {
        type: 'return',
        label: 'Start Return',
        colorClass: 'bg-slate-800 hover:bg-slate-900 text-white'
      };
    default:
      return null;
  }
}
