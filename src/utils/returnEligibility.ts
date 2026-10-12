import { Order, OrderItem } from '../types';

export interface EligibleItem {
  productId: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  isReturnable: boolean;
  returnableReason: string;
}

export interface ReturnEligibilityResult {
  eligible: boolean;
  reason?: string;
  returnWindowDays: number;
  daysRemaining: number;
  items: EligibleItem[];
  pickupAddress?: any;
}

const DEFAULT_NON_RETURNABLE_CATEGORIES = [
  'software',
  'digital code',
  'gift cards',
  'hygiene',
  'in-ear'
];

/**
 * Shared Return Eligibility Calculator
 * Strictly follows return policy:
 * - Only delivered orders
 * - Within 7-day return window from delivery date
 * - Not already returned or cancelled
 * - Items not already returned in an active return request
 * - Non-returnable categories excluded
 */
export function calculateReturnEligibility(
  order: Order,
  activeReturnRequests: any[] = [],
  returnWindowDays: number = 7
): ReturnEligibilityResult {
  if (!order) {
    return {
      eligible: false,
      reason: 'Order information is missing.',
      returnWindowDays,
      daysRemaining: 0,
      items: []
    };
  }

  if (order.status === 'returned') {
    return {
      eligible: false,
      reason: 'This order has already been returned and refunded.',
      returnWindowDays,
      daysRemaining: 0,
      items: []
    };
  }

  if (order.status === 'cancelled') {
    return {
      eligible: false,
      reason: 'This order was cancelled prior to dispatch.',
      returnWindowDays,
      daysRemaining: 0,
      items: []
    };
  }

  if (order.status !== 'delivered') {
    return {
      eligible: false,
      reason: `Return/Replacement is only available for delivered orders. Current order status: ${order.status.replace(/_/g, ' ')}.`,
      returnWindowDays,
      daysRemaining: returnWindowDays,
      items: []
    };
  }

  // Calculate delivery date
  let deliveryDate: Date = new Date();
  if ((order as any).deliveredAt) {
    const raw = (order as any).deliveredAt;
    deliveryDate = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
  } else if (order.updatedAt) {
    const raw = order.updatedAt;
    deliveryDate = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
  } else if (order.createdAt) {
    const raw = order.createdAt;
    deliveryDate = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
  }

  const now = Date.now();
  const timeDiff = Math.max(0, now - deliveryDate.getTime());
  const daysSinceDelivery = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (daysSinceDelivery > returnWindowDays) {
    return {
      eligible: false,
      reason: `The return window of ${returnWindowDays} days has expired (${daysSinceDelivery} days elapsed since delivery).`,
      returnWindowDays,
      daysRemaining: 0,
      items: []
    };
  }

  const daysRemaining = Math.max(0, returnWindowDays - daysSinceDelivery);

  // Map active return items to avoid duplicates
  const activeReturnedProductIds = new Set<string>();
  activeReturnRequests.forEach((ret) => {
    if (ret.status !== 'rejected' && ret.status !== 'cancelled') {
      (ret.items || []).forEach((it: any) => {
        if (it.productId) activeReturnedProductIds.add(it.productId);
      });
    }
  });

  // Evaluate items
  const evaluatedItems: EligibleItem[] = (order.items || []).map((item) => {
    const pId = item.productId || `prod-${(item.name || '').toLowerCase().replace(/\s+/g, '-')}`;
    const cat = ((item as any).category || '').toLowerCase();
    const isNonReturnableCat = DEFAULT_NON_RETURNABLE_CATEGORIES.some((c) => cat.includes(c));

    let isReturnable = true;
    let returnableReason = `Eligible for return or replacement (${daysRemaining} days left)`;

    if (isNonReturnableCat) {
      isReturnable = false;
      returnableReason = 'Non-returnable product category';
    } else if (activeReturnedProductIds.has(pId)) {
      isReturnable = false;
      returnableReason = 'Return or replacement already in progress for this item';
    }

    return {
      productId: pId,
      name: item.name,
      category: (item as any).category || '',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      image: item.image,
      isReturnable,
      returnableReason
    };
  });

  const hasEligibleItems = evaluatedItems.some((i) => i.isReturnable);

  if (!hasEligibleItems) {
    return {
      eligible: false,
      reason: 'All products in this order are either non-returnable or already have a return/replacement request in progress.',
      returnWindowDays,
      daysRemaining,
      items: evaluatedItems,
      pickupAddress: order.shippingAddress
    };
  }

  return {
    eligible: true,
    returnWindowDays,
    daysRemaining,
    items: evaluatedItems,
    pickupAddress: order.shippingAddress
  };
}
