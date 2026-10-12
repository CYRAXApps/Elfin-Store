import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot, 
  addDoc, 
  increment 
} from 'firebase/firestore';
import { 
  ShoppingBag, 
  RefreshCw, 
  PackageX, 
  CheckCircle2, 
  Truck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { Order } from '../../types';
import { InvoiceModal } from '../../components/InvoiceModal';
import { 
  OrderFilters, 
  OrderFilterState, 
  OrderStatusCounts 
} from './orders/OrderFilters';
import { OrderTableRow } from './orders/OrderTableRow';
import { OrderCardMobile } from './orders/OrderCardMobile';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { 
  ConfirmStatusModal, 
  ShipOrderModal, 
  CancelOrderModal, 
  ReturnOrderModal, 
  RefundOrderModal 
} from './orders/OrderActionModals';
import { getEffectiveShippingStatus } from './orders/orderUtils';
import { AdminReturnsManager } from './AdminReturnsManager';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export interface AdminOrdersProps {
  initialStatusFilter?: string;
  customerEmailFilter?: string;
  forcedStoreId?: string;
  onNavigateTab?: (tab: string, params?: any) => void;
}

const DEFAULT_FILTERS: OrderFilterState = {
  statusTab: 'all',
  searchQuery: '',
  dateFilter: 'all',
  paymentFilter: 'all',
  shippingFilter: 'all',
  amountFilter: 'all'
};

const normalizeStatus = (s?: string): string => {
  if (!s) return 'all';
  if (s === 'pending') return 'new';
  return s;
};

// Module-level cache for instant tab switching without loading flicker
let cachedAdminOrders: Order[] = [];

export function AdminOrders({ initialStatusFilter, customerEmailFilter, forcedStoreId, onNavigateTab }: AdminOrdersProps = {}) {
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ELECTRO STORE';
  const [orders, setOrders] = useState<Order[]>(() => cachedAdminOrders);
  const [loading, setLoading] = useState<boolean>(() => cachedAdminOrders.length === 0);

  const [returnsCount, setReturnsCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'return_requests'), (snap) => {
      const activeReturns = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(d => !['closed', 'rejected', 'cancelled'].includes(d.status));
      const storeReturns = forcedStoreId 
        ? activeReturns.filter(d => d.storeId === forcedStoreId)
        : activeReturns;
      setReturnsCount(storeReturns.length);
    });
    return () => unsubscribe();
  }, [forcedStoreId]);

  // Scoped orders
  const scopedOrders = useMemo(() => {
    if (!forcedStoreId) return orders;
    return orders.filter(o => o.storeId === forcedStoreId);
  }, [orders, forcedStoreId]);

  // Filter State
  const [filters, setFilters] = useState<OrderFilterState>({
    ...DEFAULT_FILTERS,
    statusTab: normalizeStatus(initialStatusFilter),
    searchQuery: customerEmailFilter || ''
  });

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const selectedOrderIdRef = React.useRef<string | null>(null);
  selectedOrderIdRef.current = selectedOrder?.id || null;
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Contextual action modals
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    order: Order;
    targetStatus: Order['status'];
    targetLabel: string;
  } | null>(null);

  const [shipModalOrder, setShipModalOrder] = useState<{
    order: Order;
    isTransition: boolean;
  } | null>(null);

  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);

  // Sync props if provided externally
  useEffect(() => {
    if (initialStatusFilter) {
      setFilters(prev => ({ ...prev, statusTab: normalizeStatus(initialStatusFilter) }));
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (customerEmailFilter) {
      setFilters(prev => ({ ...prev, searchQuery: customerEmailFilter }));
    }
  }, [customerEmailFilter]);

  // Real-time Firestore Listener
  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        })) as Order[];

        // Sort newest first
        fetched.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tB - tA;
        });

        cachedAdminOrders = fetched;
        setOrders(fetched);
        setLoading(false);

        // Update selectedOrder if it was modified
        if (selectedOrderIdRef.current) {
          const updatedSelected = fetched.find((o) => o.id === selectedOrderIdRef.current);
          if (updatedSelected) {
            setSelectedOrder(updatedSelected);
          }
        }
      },
      (error) => {
        console.warn('Notice fetching orders:', error?.message || error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Send Notification Helper
  const sendCustomerNotification = async (order: Order, newStatus: Order['status']) => {
    try {
      const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
      let title = `Order #${inv} Updated`;
      let message = `Your order status has been updated to ${newStatus.replace('_', ' ').toUpperCase()}.`;
      let templateId = 'order_processing';

      if (newStatus === 'confirmed') {
        title = `Order #${inv} Confirmed! ✅`;
        message = `Thank you! Your order #${inv} has been confirmed and is being prepped for dispatch.`;
        templateId = 'order_confirmed';
      } else if (newStatus === 'processing') {
        title = `Order #${inv} Processing ⚙️`;
        message = `Good news! Your order is currently being inspected and packaged in our warehouse.`;
        templateId = 'order_processing';
      } else if (newStatus === 'shipped') {
        title = `Order #${inv} Shipped! 🚀`;
        message = `Your order is on its way via ${order.carrier || 'Express Logistics'}.${order.trackingNumber ? ` Tracking Number: ${order.trackingNumber}` : ''}`;
        templateId = 'order_shipped';
      } else if (newStatus === 'out_for_delivery') {
        title = `Order #${inv} Out for Delivery! 📦`;
        message = `Your package is out with the delivery courier today!`;
        templateId = 'order_shipped';
      } else if (newStatus === 'delivered') {
        title = `Order #${inv} Delivered! 🎉`;
        message = `Your order has been delivered successfully. Thank you for shopping with ${storeName}!`;
        templateId = 'order_delivered';
      } else if (newStatus === 'cancelled') {
        title = `Order #${inv} Cancelled`;
        message = `Your order #${inv} has been cancelled. If any payment was captured, your refund is being initiated.`;
        templateId = 'order_cancelled';
      } else if (newStatus === 'returned') {
        title = `Order #${inv} Return Received`;
        message = `We have received your returned item(s) for order #${inv}.`;
        templateId = 'order_returned';
      }

      await addDoc(collection(db, 'notifications'), {
        userId: order.userId,
        orderId: order.id,
        orderNumber: inv,
        type: newStatus === 'cancelled' ? 'order' : 'shipping',
        channel: 'in_app',
        recipient: order.shippingAddress?.email || (order as any).customerEmail || order.userId || 'customer',
        subject: title,
        title,
        message,
        templateId,
        status: 'sent',
        provider: 'firestore_realtime',
        attemptCount: 1,
        read: false,
        createdAt: serverTimestamp(),
        sentAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Notification queuing failed non-fatally:', err);
    }
  };

  // Status Counts
  const counts: OrderStatusCounts = useMemo(() => {
    return {
      all: scopedOrders.length,
      pos: scopedOrders.filter((o) => o.orderSource === 'pos' || o.id?.startsWith('pos_ord_') || (o.invoiceNumber && o.invoiceNumber.includes('POS'))).length,
      new: scopedOrders.filter((o) => o.status === 'pending').length,
      processing: scopedOrders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length,
      shipped: scopedOrders.filter((o) => o.status === 'shipped' || o.status === 'out_for_delivery').length,
      delivered: scopedOrders.filter((o) => o.status === 'delivered').length,
      cancelled: scopedOrders.filter((o) => o.status === 'cancelled').length,
      returned: scopedOrders.filter((o) => o.status === 'returned').length,
      refunded: scopedOrders.filter((o) => o.status === 'refunded' || o.payment?.paymentStatus === 'refunded').length,
      returns: returnsCount
    };
  }, [scopedOrders, returnsCount]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

    return scopedOrders.filter((o) => {
      const isPosSale = o.orderSource === 'pos' || o.id?.startsWith('pos_ord_') || Boolean(o.invoiceNumber && o.invoiceNumber.includes('POS'));

      // Status Tab filter
      if (filters.statusTab !== 'all') {
        if (filters.statusTab === 'pos' && !isPosSale) return false;
        if (filters.statusTab === 'new' && o.status !== 'pending') return false;
        if (filters.statusTab === 'processing' && o.status !== 'confirmed' && o.status !== 'processing') return false;
        if (filters.statusTab === 'shipped' && o.status !== 'shipped' && o.status !== 'out_for_delivery') return false;
        if (filters.statusTab === 'delivered' && o.status !== 'delivered') return false;
        if (filters.statusTab === 'cancelled' && o.status !== 'cancelled') return false;
        if (filters.statusTab === 'returned' && o.status !== 'returned') return false;
        if (filters.statusTab === 'refunded' && o.status !== 'refunded' && o.payment?.paymentStatus !== 'refunded') return false;
      }

      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const inv = (o.invoiceNumber || '').toLowerCase();
        const id = (o.id || '').toLowerCase();
        const name = (o.shippingAddress?.fullName || (o as any).customerName || '').toLowerCase();
        const email = (o.shippingAddress?.email || (o as any).customerEmail || o.userId || '').toLowerCase();
        const phone = (o.shippingAddress?.phone || (o as any).customerPhone || '').toLowerCase();
        const city = (o.shippingAddress?.city || '').toLowerCase();
        const state = (o.shippingAddress?.state || '').toLowerCase();
        const method = (o.payment?.paymentMethod || o.payment?.provider || '').toLowerCase();
        const items = Array.isArray(o.items) ? o.items.map((i: any) => i.name || '').join(' ').toLowerCase() : '';

        const matches = 
          inv.includes(q) ||
          id.includes(q) ||
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          state.includes(q) ||
          method.includes(q) ||
          items.includes(q);

        if (!matches) return false;
      }

      // Date Filter
      if (filters.dateFilter !== 'all') {
        const orderTime = o.createdAt?.toMillis ? o.createdAt.toMillis() : (o.createdAt ? new Date(o.createdAt).getTime() : 0);
        if (orderTime > 0) {
          const diff = now - orderTime;
          if (filters.dateFilter === 'today' && diff > oneDay) return false;
          if (filters.dateFilter === 'last_7_days' && diff > sevenDays) return false;
          if (filters.dateFilter === 'last_30_days' && diff > thirtyDays) return false;
        }
      }

      // Payment Method Filter
      if (filters.paymentMethodFilter && filters.paymentMethodFilter !== 'all') {
        const pMethod = (o.payment?.paymentMethod || o.payment?.provider || '').toLowerCase();
        if (filters.paymentMethodFilter === 'cash') {
          if (!pMethod.includes('cash')) return false;
        } else if (filters.paymentMethodFilter === 'upi') {
          if (!pMethod.includes('upi')) return false;
        } else if (filters.paymentMethodFilter === 'card') {
          if (!pMethod.includes('card')) return false;
        } else if (filters.paymentMethodFilter === 'razorpay') {
          if (!pMethod.includes('razorpay') && !pMethod.includes('online')) return false;
        } else if (filters.paymentMethodFilter === 'cod') {
          if (!pMethod.includes('cod') && !pMethod.includes('delivery')) return false;
        }
      }

      // Payment Status Filter
      if (filters.paymentFilter !== 'all') {
        const payStatus = o.payment?.paymentStatus;
        if (filters.paymentFilter === 'captured') {
          if (payStatus !== 'captured' && payStatus !== 'paid') return false;
        } else if (filters.paymentFilter === 'pending') {
          if (payStatus === 'captured' || payStatus === 'paid' || payStatus === 'refunded' || payStatus === 'failed') return false;
        } else if (filters.paymentFilter === 'refunded') {
          if (payStatus !== 'refunded' && payStatus !== 'partially_refunded' && o.status !== 'refunded') return false;
        } else if (filters.paymentFilter === 'failed') {
          if (payStatus !== 'failed') return false;
        }
      }

      // Shipping Filter
      if (filters.shippingFilter !== 'all') {
        const effective = getEffectiveShippingStatus(o);
        if (filters.shippingFilter !== effective) return false;
      }

      // Amount Filter
      if (filters.amountFilter !== 'all') {
        const amt = Number(o.grandTotal || o.totalAmount || 0);
        if (filters.amountFilter === 'under_1000' && amt >= 1000) return false;
        if (filters.amountFilter === '1000_10000' && (amt < 1000 || amt > 10000)) return false;
        if (filters.amountFilter === '10000_50000' && (amt < 10000 || amt > 50000)) return false;
        if (filters.amountFilter === 'above_50000' && amt <= 50000) return false;
      }

      return true;
    });
  }, [orders, filters]);

  // Primary Action Trigger from Table / Mobile
  const handleQuickAction = (order: Order, actionType: string) => {
    switch (actionType) {
      case 'confirm':
        setConfirmStatusModal({
          order,
          targetStatus: 'confirmed',
          targetLabel: 'Confirmed'
        });
        break;
      case 'process':
        setConfirmStatusModal({
          order,
          targetStatus: 'processing',
          targetLabel: 'Processing'
        });
        break;
      case 'ship':
        setShipModalOrder({
          order,
          isTransition: true
        });
        break;
      case 'deliver':
        setConfirmStatusModal({
          order,
          targetStatus: 'delivered',
          targetLabel: 'Delivered'
        });
        break;
      case 'cancel':
        setCancelModalOrder(order);
        break;
      case 'return':
        setReturnModalOrder(order);
        break;
      case 'refund':
        setRefundModalOrder(order);
        break;
      default:
        setSelectedOrder(order);
    }
  };

  // Direct Status Update Handler (from Modal or Quick Actions)
  const handleUpdateStatus = async (
    orderId: string, 
    newStatus: Order['status'], 
    notifyCustomer: boolean
  ) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      if (notifyCustomer) {
        await sendCustomerNotification(target, newStatus);
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(err.message || 'Failed to update order status');
    }
  };

  // Fulfillment / Shipping Update Handler
  const handleUpdateFulfillment = async (
    orderId: string,
    fulfillmentData: {
      carrier: string;
      trackingNumber: string;
      trackingUrl: string;
      estimatedDelivery: string;
      shippingStatus: NonNullable<Order['shippingStatus']>;
      notifyCustomer: boolean;
      markAsShipped?: boolean;
    }
  ) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    try {
      const updates: any = {
        carrier: fulfillmentData.carrier,
        trackingNumber: fulfillmentData.trackingNumber,
        trackingUrl: fulfillmentData.trackingUrl,
        estimatedDelivery: fulfillmentData.estimatedDelivery,
        shippingStatus: fulfillmentData.shippingStatus,
        updatedAt: serverTimestamp()
      };

      if (fulfillmentData.markAsShipped && target.status !== 'shipped' && target.status !== 'out_for_delivery' && target.status !== 'delivered') {
        updates.status = 'shipped';
      }

      await updateDoc(doc(db, 'orders', orderId), updates);

      if (fulfillmentData.notifyCustomer) {
        await sendCustomerNotification(
          { ...target, carrier: fulfillmentData.carrier, trackingNumber: fulfillmentData.trackingNumber },
          updates.status || target.status
        );
      }
    } catch (err: any) {
      console.error('Error updating fulfillment:', err);
      alert(err.message || 'Failed to update fulfillment');
    }
  };

  // Cancel Handler
  const handleConfirmCancel = async (reason: string, restoreInventory: boolean) => {
    if (!cancelModalOrder) return;
    const order = cancelModalOrder;

    try {
      // 1. Update Order in Firestore
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Restock Inventory if requested
      if (restoreInventory && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            try {
              const pRef = doc(db, 'products', item.productId);
              await updateDoc(pRef, {
                stock: increment(item.quantity || 1),
                updatedAt: serverTimestamp()
              });
            } catch (pErr) {
              console.warn('Failed to restock product:', item.productId, pErr);
            }
          }
        }
      }

      // 3. Notify Customer
      await sendCustomerNotification(order, 'cancelled');

      alert(`✅ Order cancelled successfully.${restoreInventory ? ' Inventory restocked.' : ''}`);
      setCancelModalOrder(null);
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      alert(err.message || 'Could not cancel order');
    }
  };

  // Return Handler
  const handleConfirmReturn = async (reason: string, restock: boolean) => {
    if (!returnModalOrder) return;
    const order = returnModalOrder;

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'returned',
        returnReason: reason,
        returnedAt: serverTimestamp(),
        shippingStatus: 'returned',
        updatedAt: serverTimestamp()
      });

      if (restock && order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            try {
              const pRef = doc(db, 'products', item.productId);
              await updateDoc(pRef, {
                stock: increment(item.quantity || 1),
                updatedAt: serverTimestamp()
              });
            } catch (pErr) {
              console.warn('Failed to restock product:', item.productId, pErr);
            }
          }
        }
      }

      await sendCustomerNotification(order, 'returned');
      alert(`✅ Order marked as Returned.${restock ? ' Stock restored.' : ''}`);
      setReturnModalOrder(null);
    } catch (err: any) {
      console.error('Failed to mark return:', err);
      alert(err.message || 'Could not process return');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <RefreshCw size={28} className="animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Loading Store Orders...
        </p>
      </div>
    );
  }

  if (filters.statusTab === 'returns') {
    return <AdminReturnsManager />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title & Quick Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Orders Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process new orders, assign courier tracking numbers, and manage customer shipments easily.
          </p>
        </div>

        {/* Quick summary pill */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
            {orders.length} Total Orders
          </span>
          {counts.new > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{counts.new} New Orders</span>
            </span>
          )}
        </div>
      </div>

      {/* Orders Filter Component */}
      <OrderFilters
        filters={filters}
        counts={counts}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Orders List Container */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <PackageX size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No orders match the current filter selection or search query.
            </p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Order #</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Order Status</th>
                      <th className="p-4">Shipping Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <OrderTableRow
                        key={order.id}
                        order={order}
                        onViewOrder={(ord) => setSelectedOrder(ord)}
                        onViewInvoice={(ord) => setInvoiceOrder(ord)}
                        onQuickAction={handleQuickAction}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile & Tablet Card View (Hidden on large screens) */}
            <div className="block lg:hidden space-y-3">
              {filteredOrders.map((order) => (
                <OrderCardMobile
                  key={order.id}
                  order={order}
                  onViewOrder={(ord) => setSelectedOrder(ord)}
                  onViewInvoice={(ord) => setInvoiceOrder(ord)}
                  onQuickAction={handleQuickAction}
                />
              ))}
            </div>

            {/* Pagination / Results count footer */}
            <div className="text-center text-xs text-slate-400 font-medium py-2">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </>
        )}
      </div>

      {/* 1. Full Order Management & Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onViewInvoice={(ord) => setInvoiceOrder(ord)}
          onNavigateTab={onNavigateTab}
          onUpdateStatus={handleUpdateStatus}
          onUpdateFulfillment={handleUpdateFulfillment}
          onTriggerCancel={(ord) => setCancelModalOrder(ord)}
          onTriggerReturn={(ord) => setReturnModalOrder(ord)}
          onTriggerRefund={(ord) => setRefundModalOrder(ord)}
        />
      )}

      {/* 2. Status Confirmation Modal */}
      {confirmStatusModal && (
        <ConfirmStatusModal
          order={confirmStatusModal.order}
          targetStatus={confirmStatusModal.targetStatus}
          targetLabel={confirmStatusModal.targetLabel}
          onConfirm={async (notifyCust) => {
            await handleUpdateStatus(
              confirmStatusModal.order.id,
              confirmStatusModal.targetStatus,
              notifyCust
            );
          }}
          onClose={() => setConfirmStatusModal(null)}
        />
      )}

      {/* 3. Mark Shipped / Logistics Modal */}
      {shipModalOrder && (
        <ShipOrderModal
          order={shipModalOrder.order}
          isShippingStatusTransition={shipModalOrder.isTransition}
          onSave={async (data) => {
            await handleUpdateFulfillment(shipModalOrder.order.id, data);
          }}
          onClose={() => setShipModalOrder(null)}
        />
      )}

      {/* 4. Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <CancelOrderModal
          order={cancelModalOrder}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelModalOrder(null)}
        />
      )}

      {/* 5. Return Order Modal */}
      {returnModalOrder && (
        <ReturnOrderModal
          order={returnModalOrder}
          onConfirm={handleConfirmReturn}
          onClose={() => setReturnModalOrder(null)}
        />
      )}

      {/* 6. Refund Modal */}
      {refundModalOrder && (
        <RefundOrderModal
          order={refundModalOrder}
          onClose={() => setRefundModalOrder(null)}
          onSuccess={() => {
            // Updated via real-time onSnapshot automatically
          }}
        />
      )}

      {/* 7. GST Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
