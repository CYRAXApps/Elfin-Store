export interface Product {
  id?: string;
  storeId?: string;
  storeName?: string;
  name: string;
  description: string;
  shortSpecification?: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating?: number;
  reviewsCount?: number;
  category: string;
  brand: string;
  image: string;
  thumbnail?: string;
  images?: string[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  inStock?: boolean;
  features?: string[];
  specifications?: Record<string, string>;
  stock?: number;
  reservedStock?: number;
  availableStock?: number;
  lowStockThreshold?: number;
  costPrice?: number;
  locationId?: string;
  barcode?: string;
  sku?: string;
  hsnCode?: string;
  taxRate?: number;
  isFeatured?: boolean;
  featured?: boolean;
  isPublished?: boolean;
  status?: 'draft' | 'published' | string;
  shortDescription?: string;
  warranty?: string;
  weight?: string | number;
  dimensions?: string;
  shippingRequired?: boolean;
  shippingClass?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  slug?: string;
  description?: string;
  order?: number;
  featured?: boolean;
  active?: boolean;
  itemCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  slug?: string;
  description?: string;
  order?: number;
  featured?: boolean;
  active?: boolean;
  itemCount?: number;
}

export interface StoreInfo {
  storeId: string;
  storeName: string;
  storeType?: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'INACTIVE' | string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  pincode?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  storeId?: string;
  selectedVariant?: {
    id?: string;
    name?: string;
    sku?: string;
    price?: number;
    attributes?: Record<string, string>;
  };
}

export interface Address {
  id?: string;
  fullName: string;
  email?: string;
  phone: string;
  street: string;
  addressLine1?: string;
  address?: string;
  addressLine2?: string;
  locality?: string;
  postOffice?: string;
  city: string;
  district?: string;
  state: string;
  zipCode?: string;
  postalCode?: string;
  pincode?: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
  addressType?: 'home' | 'work' | 'other';
  customAddressType?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  totalPrice: number;
  sku?: string;
  hsnCode?: string;
  taxRate?: number;
  variant?: string;
  shipmentId?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingStatus?: ShippingStatus;
  estimatedDelivery?: string;
}

export type ShippingStatus = 
  | 'not_shipped' 
  | 'ready_to_ship' 
  | 'label_created' 
  | 'shipped' 
  | 'dispatched' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'delivery_failed' 
  | 'returned';

export interface OrderShipment {
  id?: string;
  shipmentNumber?: string;
  carrier?: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingStatus?: ShippingStatus;
  estimatedDelivery?: string;
  shippingDate?: string;
  shippedAt?: any;
  deliveredAt?: any;
  deliveryAttempts?: number;
  failedDeliveryReason?: string;
  deliveryNotes?: string;
  shippingNotes?: string;
  itemIndices?: number[];
  items?: OrderItem[];
  timeline?: Array<{
    status: string;
    title: string;
    timestamp: any;
    location?: string;
    note?: string;
    performedBy?: string;
  }>;
}

export interface BusinessDetails {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  gstin: string;
  pan?: string;
  supportEmail: string;
  supportPhone: string;
}

export interface ShippingSettings {
  shippingEnabled: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  defaultShippingCharge: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

export interface Order {
  id: string;
  invoiceNumber?: string;
  posInvoiceNumber?: string;
  creditNoteId?: string;
  creditNoteNumber?: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned' | 'refunded' | 'completed';
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string;
  tax: number;
  shippingCharge: number;
  grandTotal: number;
  totalAmount: number; // for backward compatibility
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  sellerDetails?: BusinessDetails;
  refundDetails?: {
    refundId?: string;
    status?: string;
    amount?: number;
    method?: string;
    initiatedAt?: any;
    estimatedCompletion?: string;
  };
  payment?: {
    provider: string;
    paymentMethod?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentStatus: 'pending' | 'captured' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'authorized' | 'created';
    amountPaid?: number;
    amountReceived?: number;
    amountTendered?: number;
    changeGiven?: number;
    changeAmount?: number;
    cardLast4?: string;
    cardType?: string;
    upiRef?: string;
    reference?: string;
    posSaleId?: string;
    transactionId?: string;
    verifiedAt?: any;
    capturedAt?: any;
    refundedAmount?: number;
    refundAmount?: number;
    refundStatus?: string;
    lastRefundDate?: any;
    refundDate?: any;
    refundReason?: string;
    refundId?: string;
    splitBreakdown?: {
      cash?: number;
      upi?: number;
      card?: number;
      cashTendered?: number;
      changeDue?: number;
      upiRef?: string;
      cardLast4?: string;
      cardType?: string;
    };
    splitDetails?: Array<{
      method: string;
      amount: number;
      reference?: string;
      cardLast4?: string;
    }>;
  };
  shippingStatus?: ShippingStatus;
  courier?: string;
  shippingDate?: string;
  dispatchedAt?: any;
  deliveredAt?: any;
  deliveryAttempts?: number;
  failedDeliveryReason?: string;
  deliveryNotes?: string;
  shippingNotes?: string;
  shipments?: OrderShipment[];
  orderSource?: 'pos' | 'online';
  staffName?: string;
  posStaff?: {
    uid?: string;
    name?: string;
    email?: string;
  };
  cashier?: {
    uid?: string;
    name?: string;
    email?: string;
  };
  cancelReason?: string;
  cancellationReason?: string;
  cancelledAt?: any;
  returnReason?: string;
  returns?: any;
  returnRequest?: any;
  returnedAt?: any;
  timeline?: Array<{
    status: string;
    title: string;
    timestamp: any;
    note?: string;
    location?: string;
    performedBy?: string;
  }>;
  createdAt: any;
  updatedAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  orderId?: string;
  orderNumber?: string;
  type: 'order' | 'payment' | 'shipping' | 'refund' | 'invoice' | 'account' | 'stock' | 'system' | 'promo';
  channel: 'email' | 'in_app' | 'sms' | 'whatsapp';
  recipient: string;
  subject?: string;
  title?: string;
  message: string;
  templateId?: string;
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'cancelled';
  provider?: string;
  providerMessageId?: string;
  attemptCount?: number;
  errorMessage?: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: any;
  sentAt?: any;
  updatedAt?: any;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  paymentNotifications: boolean;
  shippingUpdates: boolean;
  deliveryNotifications: boolean;
  promotionalNotifications: boolean;
}

export type PaymentStatusType = 'created' | 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  isPos?: boolean;
  posInvoiceNumber?: string;
  invoiceNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignatureVerified?: boolean;
  gatewayReferenceId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: PaymentStatusType;
  orderStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  userId?: string;
  createdAt: any;
  updatedAt?: any;
  capturedAt?: any;
  refundStatus?: 'none' | 'pending' | 'partially_refunded' | 'refunded';
  refundedAmount?: number;
  refundId?: string;
  refundDate?: string;
  refundMethod?: string;
  refundReason?: string;
  relatedReturnId?: string;
  failureReason?: string;
  itemsCount?: number;
  posPaymentMethod?: 'cash' | 'upi' | 'card' | 'split' | string;
  posSplitBreakdown?: {
    cash?: number;
    upi?: number;
    card?: number;
    total?: number;
    cashTendered?: number;
    changeDue?: number;
    upiRef?: string;
    cardLast4?: string;
    cardType?: string;
  };
  posSplitDetails?: Array<{
    method: string;
    amount: number;
    reference?: string;
    cardLast4?: string;
  }>;
  posCashTendered?: number;
  posChangeAmount?: number;
  posUpiRef?: string;
  posCardLast4?: string;
  posCardType?: string;
  posStaffName?: string;
  rawOrder?: Order;
}

export interface PaymentRefund {
  id: string;
  paymentId: string;
  razorpayPaymentId?: string;
  orderId: string;
  invoiceNumber?: string;
  customerName: string;
  customerEmail: string;
  originalAmount: number;
  refundAmount: number;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'cancelled';
  reason: string;
  adminEmail: string;
  adminId?: string;
  createdAt: any;
  processedAt?: any;
  razorpayRefundId?: string;
}

export interface WebhookEventRecord {
  id: string;
  eventId?: string;
  eventType?: string;
  event?: string;
  entityId?: string;
  receivedAt?: any;
  createdAt?: any;
  signatureVerified?: boolean;
  signatureValid?: boolean;
  status: string;
  orderId?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount?: number;
  error?: string;
  retries?: number;
  rawPayload?: any;
}

export interface PaymentAuditRecord {
  id: string;
  action: string;
  actor?: string;
  adminEmail?: string;
  targetId?: string;
  orderId?: string;
  paymentId?: string;
  details?: string;
  status?: string;
  result?: string;
  createdAt?: any;
  timestamp?: any;
}

export interface PaymentHealthStatus {
  status: string;
  paymentMode: 'test' | 'live';
  keyId: string;
  timestamp: string;
  configuredSecret: boolean;
  configuredWebhookSecret: boolean;
}

export interface ReadinessCheckItem {
  id: number;
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  category: 'Credentials' | 'Architecture' | 'Security' | 'Gateway' | 'Database';
  description: string;
}

export type LiveSystemStatus = 
  | 'TEST_MODE'
  | 'LIVE_READY'
  | 'LIVE_ACTIVE'
  | 'LIVE_VERIFIED'
  | 'LIVE_VERIFICATION_FAILED';

export interface RealPaymentVerificationReport {
  status: 'NOT_PERFORMED' | 'PASS' | 'FAIL';
  paymentCapture: 'NOT_VERIFIED' | 'VERIFIED';
  webhookReceived: 'NOT_VERIFIED' | 'VERIFIED';
  inventoryDeduction: 'NOT_VERIFIED' | 'VERIFIED';
  orderMapping: 'NOT_VERIFIED' | 'VERIFIED';
  reconciliation: 'NOT_VERIFIED' | 'VERIFIED';
  isLivePayment: boolean;
  verifiedPaymentId?: string;
  verifiedOrderId?: string;
  amount?: number;
  currency?: string;
  diagnosticMessage?: string;
  timestamp?: string;
}

export interface LiveReadinessReport {
  paymentMode: 'test' | 'live';
  systemStatus: LiveSystemStatus;
  isLiveKey: boolean;
  readyForLive: boolean;
  credentials: {
    keyIdStatus: 'Configured' | 'Missing';
    keySecretStatus: 'Configured' | 'Missing';
    webhookSecretStatus: 'Configured' | 'Missing';
    keyPrefix: string;
  };
  checks22: ReadinessCheckItem[];
  realPaymentVerification?: RealPaymentVerificationReport;
  telemetry: {
    baseUrl: string;
    webhookUrl: string;
    lastWebhookReceived?: { id: string; event: string; time: string } | null;
    lastSuccessfulPayment?: { id: string; amount: number; time: string; isLive: boolean } | null;
    lastFailedPayment?: { id: string; time: string } | null;
    serverHealth: 'healthy' | 'warning' | 'error';
  };
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address?: string;
  gstin?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  referenceNumber: string;
  purchaseDate: string;
  items: PurchaseItem[];
  totalItems: number;
  totalCost: number;
  status: 'draft' | 'received' | 'cancelled';
  createdBy: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  receivedAt?: any;
}

export type InventoryLedgerType = 
  | 'purchase'
  | 'sale'
  | 'reservation'
  | 'reservation_release'
  | 'adjustment'
  | 'return'
  | 'damaged'
  | 'expired'
  | 'manual_correction';

export interface InventoryLedgerEntry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: InventoryLedgerType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  referenceType?: 'purchase' | 'order' | 'adjustment' | 'return' | 'manual';
  referenceId?: string;
  reason: string;
  unitCost?: number;
  locationId?: string;
  createdBy: string;
  createdAt: any;
  notes?: string;
}

export interface InventoryOverviewMetrics {
  totalProducts: number;
  totalSKUs: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  reservedStockTotal: number;
  availableStockTotal: number;
  totalStockValue: number;
  costValueAvailable: boolean;
  recentlyUpdatedCount: number;
  pendingRestockCount: number;
}

export interface RestockSuggestion {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  unitsSold30Days: number;
  recommendedOrderQty: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reason: string;
  supplierId?: string;
  supplierName?: string;
}

// Stage 17: Customer Support, Help Center, Tickets & Returns Types
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketStatus = 'open' | 'new' | 'in_progress' | 'waiting_on_customer' | 'waiting_customer' | 'resolved' | 'closed';
export type SupportTicketCategory = 
  | 'order_issue' 
  | 'shipping_tracking' 
  | 'return_refund' 
  | 'product_inquiry' 
  | 'payment_issue' 
  | 'technical' 
  | 'general';

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'support_agent';
  message: string;
  attachments?: string[];
  isInternal?: boolean;
  createdAt: any;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  invoiceNumber?: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  subject: string;
  description: string;
  attachments?: string[];
  assignedTo?: string;
  assignedAgentName?: string;
  rating?: number;
  feedback?: string;
  createdAt: any;
  updatedAt: any;
  lastMessageAt?: any;
  closedAt?: any;
}

export type ReturnRequestStatus = 
  | 'requested' 
  | 'under_review'
  | 'approved' 
  | 'pickup_scheduled' 
  | 'received' 
  | 'inspected' 
  | 'refund_processing'
  | 'completed' 
  | 'refunded'
  | 'rejected' 
  | 'cancelled'
  | 'picked_up'
  | 'inspection'
  | 'approve_refund'
  | 'approved_replacement'
  | 'shipped'
  | 'delivered'
  | 'closed';

export type ReturnDisposition = 'restock' | 'damaged' | 'refurbish' | 'discard';

export interface ReturnItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  reason: string;
  condition: 'unopened' | 'opened' | 'defective' | 'damaged_in_transit';
  requestedResolution: 'refund' | 'replacement';
  image?: string;
}


export interface ReturnPickupDetails {
  date?: string;
  timeWindow?: string;
  courier?: string;
  trackingNumber?: string;
  pickedUpAt?: any;
}

export interface ReturnInspectionDetails {
  productReceived: boolean;
  productCondition: string;
  accessoriesComplete: boolean;
  packagingCondition: string;
  notes?: string;
  result: 'approved' | 'rejected' | 'pending';
  inspectedAt?: any;
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  invoiceNumber?: string;
  userId: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: ReturnItem[];
  status: ReturnRequestStatus;
  overallReason: string;
  requestedResolution?: 'refund' | 'replacement';
  comments?: string;
  pickupAddress: Address;
  trackingNumber?: string;
  carrier?: string;
  refundStatus: 'none' | 'pending' | 'issued' | 'rejected' | 'completed' | 'not_applicable';
  refundAmount: number;
  refundDestination?: 'store_credit' | 'original' | 'original_payment';
  razorpayRefundId?: string;
  creditNoteId?: string;
  creditNoteNumber?: string;
  refundDetails?: any;
  replacementDetails?: any;
  timeline?: Array<{
    status: string;
    timestamp: string;
    message: string;
    updatedBy?: string;
  }>;
  disposition?: ReturnDisposition;
  adminNotes?: string;
  pickupDetails?: ReturnPickupDetails;
  inspectionDetails?: ReturnInspectionDetails;
  rejectionReason?: string;
  rejectedAt?: any;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

export type CreditNoteStatus = 'issued' | 'applied' | 'cancelled';

export interface CreditNoteItem {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
  hsnCode?: string;
  reason?: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string; // e.g. "CN-EST-2026-0001"
  orderId: string;
  invoiceNumber: string;
  orderSource?: 'online' | 'pos';
  returnRequestId?: string;
  returnNumber?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerGstin?: string;
  shippingAddress?: any;
  billingAddress?: any;
  sellerDetails?: {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
    gstin: string;
    pan?: string;
  };
  items: CreditNoteItem[];
  subtotal: number;
  taxableAmount: number;
  taxRate?: number;
  taxAdjustment: number;
  cgstAdjustment?: number;
  sgstAdjustment?: number;
  igstAdjustment?: number;
  totalCreditAmount: number;
  refundMethod?: 'original_payment' | 'store_credit' | 'bank_transfer' | 'pos_cash' | 'other';
  refundTransactionId?: string;
  reason: string;
  adminNotes?: string;
  issuedByEmail: string;
  issuedByName?: string;
  status: CreditNoteStatus;
  cancellationReason?: string;
  cancelledAt?: any;
  cancelledBy?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  helpfulCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface HelpArticle {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  helpfulCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface SupportSettings {
  returnWindowDays: number;
  autoApproveReturns: boolean;
  nonReturnableCategories: string[];
  supportEmail: string;
  supportPhone: string;
  businessHours: string;
  slaResponseHours: number;
  slaResolutionHours: number;
}

export interface SupportOverviewMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  totalReturns: number;
  activeReturns: number;
  completedReturns: number;
  totalRefundedAmount: number;
  avgResponseTimeHours: number;
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
}

// ==========================================
// STAGE 18: LOYALTY, STORE CREDIT & GIFT CARDS
// ==========================================

export interface LoyaltyAccount {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  availablePoints: number;
  pendingPoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  tierId: string;
  tierName?: string;
  currentTier?: string;
  multiplier?: number;
  createdAt: any;
  updatedAt: any;
}

export type LoyaltyTransactionType =
  | 'purchase_earned'
  | 'purchase_reversed'
  | 'refund_reversal'
  | 'reward_redeemed'
  | 'manual_adjustment'
  | 'promotional_bonus'
  | 'points_expired'
  | 'points_refunded';

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  orderId?: string;
  orderNumber?: string;
  type: LoyaltyTransactionType;
  points: number; // positive or negative
  balanceAfter: number;
  referenceId?: string;
  description: string;
  status: 'completed' | 'pending' | 'cancelled';
  expiresAt?: any;
  createdAt: any;
}

export interface LoyaltySettings {
  pointsEarningEnabled: boolean;
  pointsPerRupeeSpent: number; // e.g. 1 point for every ₹100 spent = 0.01
  pointsPerHundredSpent?: number;
  minOrderValueForPoints: number;
  maxPointsPerOrder: number;
  pointsExpiryDays: number;
  pointExpiryDays?: number;
  welcomeBonusPoints?: number;
  loyaltyEnabled?: boolean;
  pointsRedemptionEnabled: boolean;
  pointsPerRupee: number; // e.g. 10 points = ₹1 => 0.1 ₹/point
  minimumPointsToRedeem: number;
  maximumPointsPerOrder: number;
  maximumRedemptionPercentage: number; // e.g. 20% max discount of order total
  refundPointsDeductionPolicy: 'proportional' | 'full' | 'none';
  storeCreditEnabled: boolean;
  giftCardsEnabled: boolean;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minLifetimeSpend: number;
  minLifetimePoints: number;
  pointsMultiplier: number; // e.g. 1.0, 1.25, 1.5, 2.0
  multiplier?: number;
  minimumPoints?: number;
  tierBenefits: string[];
  perks?: string[];
  status: 'active' | 'inactive';
  sortOrder: number;
  badgeColor?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type RewardType = 'discount' | 'coupon' | 'store_credit' | 'product' | 'shipping_benefit';

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  rewardType: RewardType;
  pointsRequired: number;
  cashValue: number;
  productId?: string;
  couponId?: string;
  stockLimit?: number;
  redeemedCount: number;
  status: 'active' | 'draft' | 'archived';
  startDate?: string;
  endDate?: string;
  createdAt: any;
  updatedAt: any;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardName?: string;
  rewardType?: RewardType;
  pointsUsed: number;
  rewardValue: number;
  couponId?: string;
  status: 'pending' | 'issued' | 'used' | 'expired' | 'cancelled';
  createdAt: any;
  usedAt?: any;
  expiresAt?: any;
}

export interface StoreCredit {
  id: string;
  userId: string;
  balance: number;
  availableCredit?: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  userName?: string;
  userEmail?: string;
  totalCredited?: number;
  totalUsed?: number;
  lastActivityAt?: any;
  lastActivity?: any;
  transactionCount?: number;
  status?: 'active' | 'zero' | 'suspended';
  createdAt: any;
  updatedAt: any;
}

export type StoreCreditTxType =
  | 'refund_credit'
  | 'gift_card_credit'
  | 'promotional_credit'
  | 'manual_credit'
  | 'order_debit'
  | 'credit_expired'
  | 'adjustment';

export interface StoreCreditTransaction {
  id: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  userName?: string;
  userEmail?: string;
  type: StoreCreditTxType;
  amount: number; // positive for addition, negative for debit
  previousBalance?: number;
  balanceAfter: number;
  orderId?: string;
  relatedOrderId?: string;
  refundId?: string;
  returnId?: string;
  relatedReturnId?: string;
  referenceId?: string;
  reason?: string;
  note?: string;
  adminEmail?: string;
  adminId?: string;
  description: string;
  createdAt: any;
}

export type GiftCardStatus = 'inactive' | 'active' | 'partially_used' | 'fully_used' | 'expired' | 'cancelled' | 'disabled';

export interface GiftCard {
  id: string;
  code: string; // e.g. "ELEC-9X42-K89P"
  name?: string;
  initialValue: number;
  remainingBalance: number;
  currency?: string;
  status: GiftCardStatus;
  purchaserUserId?: string;
  purchaserName?: string;
  purchaserEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  expiryDate?: string;
  expiresAt?: any;
  createdAt: any;
  updatedAt: any;
}

export type GiftCardTxType = 'activation' | 'redemption' | 'refund' | 'adjustment' | 'expiry' | 'cancellation';

export interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  code?: string;
  type: GiftCardTxType;
  amount: number;
  balanceAfter: number;
  orderId?: string;
  userId?: string;
  referenceId?: string;
  note?: string;
  createdAt: any;
}

export interface LoyaltyCampaign {
  id: string;
  name: string;
  description: string;
  type: 'points_multiplier' | 'bonus_points' | 'double_points';
  pointsMultiplier: number;
  multiplier?: number;
  bonusPoints: number;
  minimumOrderValue: number;
  eligibleProducts?: string[];
  eligibleCategories?: string[];
  eligibleCustomers?: string[];
  startDate: any;
  endDate: any;
  status: 'active' | 'draft' | 'ended';
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface LoyaltyOverviewMetrics {
  totalMembers: number;
  activeMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
  pointsExpired: number;
  outstandingPoints: number;
  storeCreditBalance: number;
  giftCardValueSold: number;
  giftCardValueRedeemed: number;
  rewardsRedeemed: number;
}

// ==========================================
// SUPPORT & INQUIRIES
// ==========================================

export type InquiryStatus = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export interface InquiryInternalNote {
  id: string;
  note: string;
  author: string;
  createdAt: string;
}

export interface CustomerInquiry {
  id: string;
  inquiryId: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  internalNotes?: InquiryInternalNote[];
  createdAt: any;
  updatedAt: any;
}

export interface UserReview {
  id: string;
  userId: string;
  productId: string;
  productName?: string;
  productImage?: string;
  rating: number;
  title?: string;
  comment?: string;
  reviewImage?: string;
  verifiedPurchase?: boolean;
  createdAt: any;
  updatedAt?: any;
}

// ==========================================
// POS SETTINGS & CONFIGURATION
// ==========================================

export interface PosSettings {
  // 1. General
  posEnabled: boolean;
  currency: string;
  defaultPosPage: 'terminal' | 'history';
  defaultCustomer: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';

  // 2. Billing
  allowDiscount: boolean;
  maxDiscountPercent: number;
  allowManualPriceChange: boolean;
  requireConfirmationBeforeSale: boolean;
  autoClearCartAfterSale: boolean;
  enableHoldBill: boolean;
  enableRecallHeldBill: boolean;

  // 3. Tax & GST
  useStoreGstSettings: boolean;
  gstPricingMode: 'exclusive' | 'inclusive';
  enableTaxInvoice: boolean;
  showGstBreakdown: boolean;
  showCgstSgst: boolean;
  showIgst: boolean;

  // 4. Payment
  enableCash: boolean;
  enableUpi: boolean;
  enableCard: boolean;
  defaultPaymentMethod: 'cash' | 'upi' | 'card';
  allowSplitPayment: boolean;
  requirePaymentConfirmation: boolean;
  upiId: string;
  upiDisplayName: string;
  upiAppsText: string;
  upiInstructions: string;
  upiQrCodeUrl: string;
  upiQrMode: 'dynamic' | 'custom';

  // 5. Invoice & Receipt
  invoiceFormat: 'thermal' | 'a4';
  showStoreLogo: boolean;
  showStoreAddress: boolean;
  showStorePhone: boolean;
  showGstin: boolean;
  showCustomerDetails: boolean;
  showPaymentMethod: boolean;
  showTaxBreakdown: boolean;
  showDiscount: boolean;
  autoOpenInvoiceAfterSale: boolean;
  autoPrintAfterSale: boolean;
  invoicePrefix: string;
  autoInvoiceNumbering: boolean;

  // 6. Product & Stock
  enableBarcodeSkuSearch: boolean;
  showStockQuantity: boolean;
  allowSellingOutOfStock: boolean;
  allowQuantityAboveStock: boolean;
  lowStockWarning: boolean;
  lowStockThreshold: number;
  autoDeductStock: boolean;

  // 7. Customer
  allowWalkInBilling: boolean;
  customerSelectionOptional: boolean;
  defaultCustomerType: 'walk_in' | 'registered';
  requireMobileNumber: boolean;
  allowNewCustomerCreation: boolean;
  showCustomerPurchaseHistory: boolean;

  // 8. Returns
  enablePosReturns: boolean;
  returnWindowDays: number;
  requireReturnReason: boolean;
  allowReplacement: boolean;
  refundMethod: 'original' | 'cash' | 'store_credit';

  // 9. Permissions
  accessPosRole: 'admin' | 'all';
  allowDiscountPermission: boolean;
  allowPriceChangePermission: boolean;
  allowCancelSalePermission: boolean;
  allowViewSalesHistoryPermission: boolean;
  allowProcessReturnPermission: boolean;
  allowProcessRefundPermission: boolean;

  // 10. Notifications
  notifyLowStock: boolean;
  notifySaleCompleted: boolean;
  notifyFailedPayment: boolean;
  notifyRefundProcessed: boolean;

  // 11. Advanced Settings
  printerWidthMm: number;
  barcodeScannerMode: 'auto' | 'keyboard_wedge' | 'camera';
  autoFocusSearchInput: boolean;
  soundFeedbackEnabled: boolean;
  receiptFooterNote: string;
}

export const defaultPosSettings: PosSettings = {
  // General
  posEnabled: true,
  currency: 'INR',
  defaultPosPage: 'terminal',
  defaultCustomer: 'Walk-in Customer',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',

  // Billing
  allowDiscount: true,
  maxDiscountPercent: 50,
  allowManualPriceChange: false,
  requireConfirmationBeforeSale: false,
  autoClearCartAfterSale: true,
  enableHoldBill: true,
  enableRecallHeldBill: true,

  // Tax & GST
  useStoreGstSettings: true,
  gstPricingMode: 'exclusive',
  enableTaxInvoice: true,
  showGstBreakdown: true,
  showCgstSgst: true,
  showIgst: true,

  // Payment
  enableCash: true,
  enableUpi: true,
  enableCard: true,
  defaultPaymentMethod: 'cash',
  allowSplitPayment: true,
  requirePaymentConfirmation: true,
  upiId: '',
  upiDisplayName: 'Scan to Pay via UPI',
  upiAppsText: 'GPay, PhonePe, Paytm, BHIM',
  upiInstructions: 'Verify receipt on soundbox, notification, or customer app before confirming.',
  upiQrCodeUrl: '',
  upiQrMode: 'dynamic',

  // Invoice & Receipt
  invoiceFormat: 'thermal',
  showStoreLogo: true,
  showStoreAddress: true,
  showStorePhone: true,
  showGstin: true,
  showCustomerDetails: true,
  showPaymentMethod: true,
  showTaxBreakdown: true,
  showDiscount: true,
  autoOpenInvoiceAfterSale: true,
  autoPrintAfterSale: false,
  invoicePrefix: 'POS-2026-',
  autoInvoiceNumbering: true,

  // Product & Stock
  enableBarcodeSkuSearch: true,
  showStockQuantity: true,
  allowSellingOutOfStock: false,
  allowQuantityAboveStock: false,
  lowStockWarning: true,
  lowStockThreshold: 5,
  autoDeductStock: true,

  // Customer
  allowWalkInBilling: true,
  customerSelectionOptional: true,
  defaultCustomerType: 'walk_in',
  requireMobileNumber: false,
  allowNewCustomerCreation: true,
  showCustomerPurchaseHistory: true,

  // Returns
  enablePosReturns: true,
  returnWindowDays: 30,
  requireReturnReason: true,
  allowReplacement: true,
  refundMethod: 'original',

  // Permissions
  accessPosRole: 'admin',
  allowDiscountPermission: true,
  allowPriceChangePermission: false,
  allowCancelSalePermission: true,
  allowViewSalesHistoryPermission: true,
  allowProcessReturnPermission: true,
  allowProcessRefundPermission: true,

  // Notifications
  notifyLowStock: true,
  notifySaleCompleted: true,
  notifyFailedPayment: true,
  notifyRefundProcessed: true,

  // Advanced
  printerWidthMm: 80,
  barcodeScannerMode: 'keyboard_wedge',
  autoFocusSearchInput: true,
  soundFeedbackEnabled: true,
  receiptFooterNote: 'Thank you for shopping at ElectroStore! Visit again.',
};

export interface StaffPermissions {
  // POS / Counter Billing
  pos_access: boolean;
  pos_view_sales: boolean;
  pos_manage_returns: boolean;

  // Orders
  orders_view: boolean;
  orders_update_status: boolean;
  orders_manage_returns: boolean;

  // Products
  products_view: boolean;
  products_edit: boolean;
  products_manage_inventory: boolean;
  products_delete?: boolean;

  // Customers
  customers_view: boolean;
  customers_manage?: boolean;

  // Marketing
  marketing_manage?: boolean;

  // Reviews
  reviews_manage: boolean;

  // Support
  support_view: boolean;
  support_manage: boolean;

  // Reports
  reports_view: boolean;

  // Settings
  settings_view: boolean;
  settings_manage?: boolean;

  // Admin & Staff
  staff_manage: boolean;

  // Notifications
  notifications_view?: boolean;
  notifications_manage?: boolean;
}

export interface StaffMember {
  id: string;
  uid?: string;
  name: string;
  displayName?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  isPrimaryOwner?: boolean;
  status: 'active' | 'disabled';
  permissions: StaffPermissions;
  lastLoginAt?: string | any;
  lastActivity?: string | any;
  createdAt?: string | any;
  updatedAt?: string | any;
  avatar?: string;
  notes?: string;
}

export interface AdminReviewItem {
  id: string;
  reviewId: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice?: number;
  productCurrentRating?: number;
  productCurrentReviewsCount?: number;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  rating: number;
  title: string;
  comment: string;
  reviewImage?: string | null;
  reviewImages?: string[];
  verifiedPurchase: boolean;
  orderId?: string | null;
  orderNumber?: string | null;
  orderDate?: string | null;
  orderTotal?: number | null;
  orderStatus?: string | null;
  status: 'approved' | 'rejected' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export type StoreType = 'MAIN_STORE' | 'PARTNER_STORE';
export type StoreStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface IBPStore {
  storeId: string;
  storeName: string;
  storeType: StoreType;
  ownerUid?: string | null;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  status: StoreStatus;
  approvalStatus: boolean;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  logoUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}




