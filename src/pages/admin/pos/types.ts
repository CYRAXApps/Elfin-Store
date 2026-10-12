export interface PosCartItem {
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  image: string;
  unitPrice: number;
  availableStock: number;
  quantity: number;
  discountType: 'flat' | 'percent';
  discountValue: number;
  discountAmount: number;
  taxRate: number; // e.g. 18
  hsnCode?: string;
  category?: string;
  brand?: string;
}

export interface PosCustomer {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isWalkIn: boolean;
}

export type PosPaymentMethod = 'cash' | 'upi' | 'card' | 'split' | 'bank_transfer' | 'custom' | string;
export type PosPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PosSplitBreakdown {
  cash: number;
  cashTendered?: number;
  upi: number;
  upiRef?: string;
  card: number;
  cardLast4?: string;
  cardType?: string;
  cardRef?: string;
}

export interface PosPaymentState {
  method: PosPaymentMethod;
  customMethodName?: string;
  customMethodId?: string;
  cashTendered: number;
  referenceNumber: string;
  cardLast4: string;
  cardType: string;
  upiRef: string;
  paymentStatus: PosPaymentStatus;
  isConfirmed?: boolean;
  splitBreakdown?: PosSplitBreakdown;
  splitConfirmed?: {
    upi?: boolean;
    card?: boolean;
  };
}

export interface PosSaleRecord {
  id: string;
  invoiceNumber: string;
  orderSource?: string;
  createdAt: any;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    sku?: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  payment: {
    paymentMethod: string;
    paymentStatus: string;
    amountPaid: number;
    referenceNumber?: string;
  };
  status: string;
  returnReason?: string;
  returnedAt?: any;
}
