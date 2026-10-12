import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  addDoc, 
  collection,
  query,
  where,
  getDocs, 
  arrayUnion,
  increment 
} from 'firebase/firestore';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  HelpCircle, 
  RotateCcw, 
  ChevronLeft, 
  Copy, 
  Check, 
  MapPin, 
  Phone, 
  CreditCard, 
  ExternalLink, 
  AlertTriangle, 
  ShoppingBag, 
  ShieldCheck, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Navigation,
  Box,
  Compass,
  RefreshCw,
  Loader2,
  DollarSign
} from 'lucide-react';
import { Order, OrderItem, OrderShipment } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { OrderHelpModal } from '../components/account/OrderHelpModal';
import { ReturnOrderModal } from '../components/account/ReturnOrderModal';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { useShopActions } from '../context/ShopContext';
import { formatFullAddressString } from '../services/pincodeService';

interface TimelineStep {
  key: string;
  stepNumber: number;
  label: string;
  sublabel: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

/**
 * Resolves the official online tracking URL for major Indian & international couriers.
 */
export function getCourierTrackingUrl(carrier?: string, trackingNumber?: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  if (!trackingNumber) return '';

  const c = (carrier || '').toLowerCase().trim();
  const awb = encodeURIComponent(trackingNumber.trim());

  if (c.includes('blue dart') || c.includes('bluedart')) {
    return `https://www.bluedart.com/tracking?trackNumber=${awb}`;
  }
  if (c.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${awb}`;
  }
  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?trk_no=${awb}`;
  }
  if (c.includes('xpressbees') || c.includes('xpress bees')) {
    return `https://www.xpressbees.com/track?isawb=true&trackid=${awb}`;
  }
  if (c.includes('shadowfax')) {
    return `https://tracker.shadowfax.in/#/track?awb=${awb}`;
  }
  if (c.includes('ekart')) {
    return `https://ekartlogistics.com/shipmenttrack/${awb}`;
  }
  if (c.includes('ecom express') || c.includes('ecom')) {
    return `https://ecomexpress.in/tracking/?awb_full_detail=${awb}`;
  }
  if (c.includes('india post') || c.includes('speed post')) {
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
  }
  if (c.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${awb}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent((carrier || 'courier') + ' tracking ' + trackingNumber)}`;
}

export function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shopActions = useShopActions();

  const isNewlyPlaced = Boolean(location.state?.newlyPlaced);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(isNewlyPlaced);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Modals state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Ordered by mistake');
  const [cancelNotes, setCancelNotes] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Return / Replace Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [selectedProductForReturn, setSelectedProductForReturn] = useState<string | undefined>(undefined);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  // Reorder toast state
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const orderRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(
      orderRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Order;
          // Check ownership / access permissions strictly
          const isAllowed = 
            data.userId === user.uid || 
            (user.email && data.customerEmail === user.email) || 
            (user as any).role === 'admin' || 
            (user as any).isAdmin ||
            (user as any).role === 'staff';

          if (isAllowed) {
            setOrder(data);
            setNotFound(false);

            // Fetch return requests
            import('firebase/firestore').then(({ collection, query, where, getDocs }) => {
              const q = query(collection(db, 'return_requests'), where('orderId', '==', docSnap.id));
              getDocs(q).then((snap) => {
                const reqs: any[] = [];
                snap.forEach(d => reqs.push({ id: d.id, ...d.data() }));
                setReturnRequests(reqs);
              }).catch(console.error);
            });
          } else {
            setOrder(null);
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Notice fetching order details:', error?.message || error);
        setNotFound(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId, user]);

  const copyToClipboard = (text: string, type: 'id' | 'tracking') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedTracking(text);
      setTimeout(() => setCopiedTracking(null), 2000);
    }
  };

  const formatTimestamp = (ts: any, withTime = true): string => {
    if (!ts) return '';
    try {
      const date = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {})
      });
    } catch {
      return '';
    }
  };

  // Build the 6 tracking milestones
  const getTimelineSteps = (currentOrder: Order): TimelineStep[] => {
    const status = currentOrder.status;

    let currentStepNumber = 1;
    if (status === 'confirmed') currentStepNumber = 2;
    else if (status === 'processing') currentStepNumber = 3;
    else if (status === 'shipped') currentStepNumber = 4;
    else if (status === 'out_for_delivery') currentStepNumber = 5;
    else if (status === 'delivered') currentStepNumber = 6;
    else if (status === 'cancelled' || status === 'returned' || status === 'refunded') {
      currentStepNumber = -1; // cancelled / return state handled separately
    }

    // Lookup explicit timeline records from order if available
    const timelineArr = currentOrder.timeline || [];
    const getTimeFor = (st: string) => {
      const found = timelineArr.find((t) => t.status === st);
      if (found?.timestamp) return formatTimestamp(found.timestamp);
      return undefined;
    };

    const placedTime = getTimeFor('pending') || formatTimestamp(currentOrder.createdAt);
    const confirmedTime = getTimeFor('confirmed') || (currentStepNumber >= 2 ? formatTimestamp(currentOrder.createdAt) : undefined);
    const processingTime = getTimeFor('processing') || (currentStepNumber >= 3 ? formatTimestamp(currentOrder.updatedAt) : undefined);
    const shippedTime = getTimeFor('shipped') || (currentStepNumber >= 4 ? formatTimestamp(currentOrder.updatedAt) : undefined);
    const outTime = getTimeFor('out_for_delivery') || (currentStepNumber >= 5 ? formatTimestamp(currentOrder.updatedAt) : undefined);
    const deliveredTime = getTimeFor('delivered') || (currentStepNumber >= 6 ? formatTimestamp(currentOrder.updatedAt) : undefined);

    const carrierName = currentOrder.carrier || currentOrder.courier;

    return [
      {
        key: 'pending',
        stepNumber: 1,
        label: 'Order Placed',
        sublabel: 'We have received your order',
        timestamp: placedTime,
        isCompleted: currentStepNumber >= 1,
        isCurrent: currentStepNumber === 1
      },
      {
        key: 'confirmed',
        stepNumber: 2,
        label: 'Confirmed',
        sublabel: 'Order verified by seller',
        timestamp: confirmedTime,
        isCompleted: currentStepNumber >= 2,
        isCurrent: currentStepNumber === 2
      },
      {
        key: 'processing',
        stepNumber: 3,
        label: 'Processing',
        sublabel: 'Packed & ready for dispatch',
        timestamp: processingTime,
        isCompleted: currentStepNumber >= 3,
        isCurrent: currentStepNumber === 3
      },
      {
        key: 'shipped',
        stepNumber: 4,
        label: 'Dispatched',
        sublabel: carrierName ? `Handed to ${carrierName}` : 'Handed to courier partner',
        timestamp: shippedTime,
        isCompleted: currentStepNumber >= 4,
        isCurrent: currentStepNumber === 4
      },
      {
        key: 'out_for_delivery',
        stepNumber: 5,
        label: 'Out for Delivery',
        sublabel: 'Courier is delivering today',
        timestamp: outTime,
        isCompleted: currentStepNumber >= 5,
        isCurrent: currentStepNumber === 5
      },
      {
        key: 'delivered',
        stepNumber: 6,
        label: 'Delivered',
        sublabel: 'Package received by customer',
        timestamp: deliveredTime,
        isCompleted: currentStepNumber >= 6,
        isCurrent: currentStepNumber === 6
      }
    ];
  };

  // Determine normalized shipping status
  const getShippingStatusInfo = (currentOrder: Order) => {
    const rawShipping = currentOrder.shippingStatus;
    if (rawShipping === 'delivery_failed') {
      return { 
        label: `Delivery Attempt #${currentOrder.deliveryAttempts || 1} Failed`, 
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', 
        desc: currentOrder.failedDeliveryReason 
          ? `Courier reported: ${currentOrder.failedDeliveryReason}. Re-attempt will be scheduled shortly.`
          : 'Courier attempted delivery but was unsuccessful. Re-attempt will be scheduled.' 
      };
    }
    if (rawShipping === 'delivered' || currentOrder.status === 'delivered') {
      return { label: 'Delivered', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'Package delivered to recipient' };
    }
    if (rawShipping === 'out_for_delivery' || currentOrder.status === 'out_for_delivery') {
      return { label: 'Out for Delivery', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200', desc: 'Package is out with local courier agent' };
    }
    if (rawShipping === 'in_transit') {
      return { label: 'In Transit', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'Package is in transit between logistics hubs' };
    }
    if (rawShipping === 'shipped' || rawShipping === 'dispatched' || currentOrder.status === 'shipped') {
      return { label: 'Dispatched / In Transit', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', desc: 'Package handed over to courier partner' };
    }
    if (rawShipping === 'ready_to_ship' || rawShipping === 'label_created' || currentOrder.trackingNumber) {
      return { label: 'Ready to Ship', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', desc: 'Shipment label and AWB assigned; awaiting carrier pickup' };
    }
    if (currentOrder.status === 'cancelled') {
      return { label: 'Shipment Cancelled', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', desc: 'Shipment cancelled before dispatch' };
    }
    return { label: 'Pending Dispatch', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'Seller is packing items at warehouse' };
  };

  // Handle Order Cancellation in Firestore
  const handleConfirmCancelOrder = async () => {
    if (!order || isSubmittingCancel) return;
    setIsSubmittingCancel(true);

    try {
      const orderRef = doc(db, 'orders', order.id);
      const cancelEntry = {
        status: 'cancelled',
        title: 'Order Cancelled by Customer',
        timestamp: new Date().toISOString(),
        note: `Reason: ${cancelReason}${cancelNotes ? ` - Notes: ${cancelNotes}` : ''}`
      };

      const isPrepaid = order.payment?.paymentStatus === 'captured';
      const grandTotalAmount = Number(order.grandTotal || order.totalAmount || 0);

      // Generate a refund reference if prepaid
      const refundRefId = isPrepaid 
        ? `REF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        : undefined;

      const updates: any = {
        status: 'cancelled',
        shippingStatus: 'not_shipped',
        cancellationReason: cancelReason + (cancelNotes ? ` (${cancelNotes})` : ''),
        cancelledAt: serverTimestamp(),
        timeline: arrayUnion(cancelEntry),
        updatedAt: serverTimestamp()
      };

      if (isPrepaid) {
        updates['payment.refundStatus'] = 'initiated';
        updates['payment.refundId'] = refundRefId;
        updates['payment.refundAmount'] = grandTotalAmount;
        updates['refundDetails'] = {
          refundId: refundRefId,
          status: 'initiated',
          amount: grandTotalAmount,
          method: order.payment?.provider || 'Original Payment Method',
          initiatedAt: new Date().toISOString(),
          estimatedCompletion: '3-5 business days'
        };
      }

      await updateDoc(orderRef, updates);

      // Restock inventory for cancelled order items
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId) {
            try {
              const pRef = doc(db, 'products', item.productId);
              await updateDoc(pRef, {
                stock: increment(item.quantity || 1),
                inStock: true,
                updatedAt: serverTimestamp()
              });
            } catch (pErr) {
              console.warn('Failed to restock product on cancel:', item.productId, pErr);
            }
          }
        }
      }

      // Dispatch customer in-app notification
      if (user?.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          orderId: order.id,
          orderNumber: order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`,
          type: 'order',
          channel: 'in_app',
          recipient: user.email || 'customer',
          subject: `Order Cancelled: #${order.invoiceNumber || order.id.slice(0, 8).toUpperCase()}`,
          title: `Order Cancelled Successfully`,
          message: `Your order #${order.invoiceNumber || order.id.slice(0, 8).toUpperCase()} has been cancelled. ${isPrepaid ? `A refund of ₹${grandTotalAmount.toLocaleString('en-IN')} has been initiated to your original payment method.` : ''}`,
          templateId: 'order_cancellation',
          status: 'sent',
          provider: 'firestore_realtime',
          attemptCount: 1,
          read: false,
          createdAt: serverTimestamp(),
          sentAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      setIsCancelModalOpen(false);
      setCancelSuccessMsg(
        isPrepaid 
          ? `Order cancelled. Refund of ₹${grandTotalAmount.toLocaleString('en-IN')} initiated (Ref: ${refundRefId}).` 
          : 'Your order has been cancelled successfully.'
      );
      setTimeout(() => setCancelSuccessMsg(null), 6000);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Could not cancel order. Please try again or contact support.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Reorder single item or all items
  const handleBuyAgain = (item?: OrderItem) => {
    if (!order) return;
    const itemsToAdd = item ? [item] : order.items;

    itemsToAdd.forEach((itm) => {
      shopActions.addToCart(
        {
          id: itm.productId || `prod-${itm.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: itm.name,
          price: itm.unitPrice,
          originalPrice: itm.unitPrice * 1.15,
          image: itm.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
          category: 'electronics',
          brand: 'ElectroStore',
          rating: 4.8,
          reviewsCount: 42,
          stock: 50,
          inStock: true,
          discountPercentage: 15,
          description: itm.name,
          isFeatured: false
        },
        itm.quantity || 1
      );
    });

    setReorderSuccessMsg(
      item 
        ? `Added "${item.name}" to your cart!` 
        : `Added ${order.items.length} items from this order to your cart!`
    );
    setTimeout(() => setReorderSuccessMsg(null), 4000);
  };

  // Open Return Modal
  const handleOpenReturnModal = (productId?: string) => {
    setSelectedProductForReturn(productId);
    setIsReturnModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl pt-6 pb-20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-36 bg-slate-200 rounded"></div>
          <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200"></div>
              <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200"></div>
              <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 pt-8 pb-20 text-center max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Package size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Sign In to View Order</h2>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Please sign in with your registered customer mobile number or email to view this order details, live shipment tracking, and official invoice.
          </p>
          <Link
            to={`/login?redirect=${encodeURIComponent(`/orders/${orderId}`)}`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-xl font-bold transition-colors inline-block text-xs shadow-xs"
          >
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="container mx-auto px-3 sm:px-4 max-w-2xl pt-12 pb-20 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto">
            We couldn't find the requested order. It may have been moved, or you might not have permission to view it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} /> Back to My Orders
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invoiceNum = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const isPaid = order.payment?.paymentStatus === 'captured';
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const isRefunded = order.status === 'refunded';
  const isDelivered = order.status === 'delivered';
  const isShipped = order.status === 'shipped' || order.status === 'out_for_delivery';

  // Return window calculation: check if delivered within 7 days
  const deliveredDate = order.updatedAt?.toDate ? order.updatedAt.toDate() : order.updatedAt ? new Date(order.updatedAt) : null;
  const isWithinReturnWindow = isDelivered; // eligible when delivered

  // Cancellation validity: only pending, confirmed, or processing
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);
  const canReturn = isDelivered && !isReturned && !isCancelled;

  // Refund details detection
  const hasRefund = isRefunded || isReturned || (isCancelled && isPaid) || Boolean(order.payment?.refundId) || Boolean(order.payment?.refundStatus);
  const refundAmount = Number(order.refundDetails?.amount || order.payment?.refundAmount || order.grandTotal || order.totalAmount || 0);
  const refundId = order.refundDetails?.refundId || order.payment?.refundId;
  const refundStatus = order.refundDetails?.status || order.payment?.refundStatus || (isRefunded ? 'completed' : 'initiated');

  const timelineSteps = getTimelineSteps(order);
  const shippingStatusInfo = getShippingStatusInfo(order);
  const subtotal = Number(order.subtotal || (order.items || []).reduce((acc, itm) => acc + Number(itm.totalPrice ?? ((itm.unitPrice ?? itm.price ?? 0) * (itm.quantity || 1))), 0));
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || 0);
  const shippingCharge = Number(order.shippingCharge || 0);
  const grandTotal = Number(order.grandTotal || order.totalAmount || (subtotal - discount + tax + shippingCharge));

  // Check if courier/tracking information exists
  const hasCourierTracking = Boolean(order.trackingNumber || order.carrier || order.courier);
  const trackingUrl = getCourierTrackingUrl(order.carrier || order.courier, order.trackingNumber, order.trackingUrl);

  // Check for multi-shipments
  const hasMultipleShipments = Boolean(order.shipments && order.shipments.length > 1);

  // Latest timeline event note
  const latestTimelineEvent = order.timeline && order.timeline.length > 0
    ? order.timeline[order.timeline.length - 1]
    : null;

  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-5xl pt-4 pb-20 min-h-[75vh]">
      {/* Top Breadcrumb Navigation & Primary Global Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft size={15} /> Back to My Orders
        </Link>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cancel Order Button (if eligible) */}
          {canCancel && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <XCircle size={13} className="text-rose-600" />
              <span>Cancel Order</span>
            </button>
          )}

          {/* Download Invoice Button */}
          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <FileText size={13} className="text-blue-600" />
            <span>Download Invoice</span>
          </button>

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <HelpCircle size={13} />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Newly Placed Order Celebration Banner */}
      {showCelebrationBanner && (
        <div className="mb-5 p-5 sm:p-6 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/15 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 text-white">
                <CheckCircle2 size={28} className="stroke-[2.5]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
                  <span>Order Confirmed</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Thank you! Your order has been placed.
                </h2>
                <p className="text-xs text-emerald-50 mt-0.5 leading-relaxed">
                  {order?.payment?.provider === 'cod' || location.state?.paymentMethod === 'cod'
                    ? `Cash on Delivery confirmed. ₹${grandTotal.toLocaleString('en-IN')} will be collected upon package delivery.`
                    : `Your online payment of ₹${grandTotal.toLocaleString('en-IN')} was securely verified & captured. We are preparing your shipment.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => setShowCelebrationBanner(false)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alerts */}
      {cancelSuccessMsg && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {returnSuccessMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{returnSuccessMsg}</span>
          </div>
          <Link
            to="/account?view=returns"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
          >
            View Returns <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {reorderSuccessMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
          <Link
            to="/cart"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
          >
            View Cart <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* 1. ORDER SUMMARY HERO CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Order #{invoiceNum}
              </h1>
              <button
                onClick={() => copyToClipboard(invoiceNum, 'id')}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors"
                title="Copy Order / Invoice Number"
              >
                {copiedId === invoiceNum ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>

              {/* Status Badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isDelivered
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isCancelled || isReturned || isRefunded
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : order.status === 'out_for_delivery'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : order.status === 'shipped'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>

              {/* Payment Status Pill */}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : isRefunded
                    ? 'bg-purple-50 text-purple-700 border border-purple-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}
              >
                {isPaid ? 'Payment: Paid' : isRefunded ? 'Payment: Refunded' : 'Payment: Pending'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>Placed on {formatTimestamp(order.createdAt, true) || 'N/A'}</span>
              <span className="text-slate-300">•</span>
              <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 sm:text-right">
            {canReturn && (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Return / Replace
              </button>
            )}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Amount
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

            {/* RETURN REQUEST STATUS CARDS */}
      {returnRequests.filter(r => r.status !== 'rejected' && r.status !== 'cancelled').map(req => {
        const isReplace = req.requestedResolution === 'replacement';
        
        let steps = [];
        if (isReplace) {
          steps = [
            { label: 'Requested', key: 'requested', complete: true },
            { label: 'Approved', key: 'approved', complete: ['approved','pickup_scheduled','picked_up','received','inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Picked Up', key: 'picked_up', complete: ['picked_up','received','inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Received', key: 'received', complete: ['received','inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Inspection', key: 'inspection', complete: ['inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Shipped', key: 'shipped', complete: ['shipped','delivered','closed'].includes(req.status) },
            { label: 'Delivered', key: 'delivered', complete: ['delivered','closed'].includes(req.status) }
          ];
        } else {
          steps = [
            { label: 'Requested', key: 'requested', complete: true },
            { label: 'Approved', key: 'approved', complete: ['approved','pickup_scheduled','picked_up','received','inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Picked Up', key: 'picked_up', complete: ['picked_up','received','inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Received', key: 'received', complete: ['received','inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Inspection', key: 'inspection', complete: ['inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Refunded', key: 'refunded', complete: ['approve_refund','refunded','closed'].includes(req.status) }
          ];
        }
        
        // Find current step index
        let currentIdx = steps.length - 1;
        while(currentIdx >= 0 && !steps[currentIdx].complete) currentIdx--;

        return (
          <div key={req.id} className="bg-purple-50/70 rounded-2xl border border-purple-200 p-4 sm:p-5 mb-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 text-sm">{isReplace ? 'Replacement' : 'Return'} Request: {req.returnNumber || req.id}</h3>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Status: <span className="font-bold capitalize">{req.status.replace(/_/g, ' ')}</span>
                  </p>
                </div>
              </div>
              <Link to="/account?view=returns" className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1.5 bg-white rounded-lg border border-purple-100 shadow-sm cursor-pointer whitespace-nowrap text-center">
                View Details
              </Link>
            {req.pickupDetails && (
              <div className="mt-3 mb-1 p-3 bg-white rounded-xl border border-purple-100 flex items-start gap-3">
                <Truck className="text-purple-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-purple-900">Pickup Scheduled: {req.pickupDetails.date} ({req.pickupDetails.timeWindow})</p>
                  {(req.pickupDetails.courier || req.pickupDetails.trackingNumber) && (
                    <p className="text-xs text-purple-700 mt-0.5">
                      {req.pickupDetails.courier} {req.pickupDetails.trackingNumber ? ` - ${req.pickupDetails.trackingNumber}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            
                        {req.inspectionDetails && req.inspectionDetails.result === 'rejected' && (
              <div className="mt-3 mb-1 p-3 bg-white rounded-xl border border-rose-100 flex items-start gap-3">
                <XCircle className="text-rose-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-rose-900">Inspection Rejected</p>
                  {req.inspectionDetails.notes && (
                    <p className="text-xs text-rose-700 mt-0.5">{req.inspectionDetails.notes}</p>
                  )}
                </div>
              </div>
            )}
            
            {req.status === 'refunded' && !isReplace && (
              <div className="mt-3 mb-1 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <DollarSign className="text-emerald-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900">Refund Processed</p>
                  <p className="text-xs text-emerald-700 mt-0.5">₹{Number(req.refundDetails?.amount || req.refundAmount || 0).toLocaleString('en-IN')} has been refunded to your original payment method.</p>
                  {(req.refundDetails?.refundId || req.razorpayRefundId) && (
                     <p className="text-[10px] text-emerald-600 font-mono mt-1">Transaction Ref: {req.refundDetails?.refundId || req.razorpayRefundId}</p>
                  )}
                </div>
              </div>
            )}
            
            {(req.status === 'shipped' || req.status === 'delivered') && isReplace && (
              <div className="mt-3 mb-1 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <Package className="text-emerald-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900">Replacement Dispatched</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Your replacement product is on its way.</p>
                  {req.replacementDetails && (
                    <div className="mt-1 text-xs text-emerald-800 font-medium">
                      <span>Courier: {req.replacementDetails.courier || 'Express Courier'}</span>
                      {req.replacementDetails.trackingNumber && (
                        <span className="ml-2 font-mono">AWB: {req.replacementDetails.trackingNumber}</span>
                      )}
                      {req.replacementDetails.estimatedDeliveryDate && (
                        <p className="text-[11px] text-emerald-600 mt-0.5">Est. Delivery: {req.replacementDetails.estimatedDeliveryDate}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

            <div className="pt-4 flex justify-between relative"> 
               <div className="absolute top-[26px] left-[10px] right-[10px] h-0.5 bg-purple-100 z-0 hidden sm:block" /> 
               <div 
                 className="absolute top-[26px] left-[10px] h-0.5 bg-purple-500 z-0 hidden sm:block transition-all duration-500" 
                 style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }} 
               /> 
               
               {/* Mobile vertical line */} 
               <div className="absolute left-[13px] top-6 bottom-4 w-0.5 bg-purple-100 z-0 sm:hidden" /> 
               <div 
                 className="absolute left-[13px] top-6 w-0.5 bg-purple-500 z-0 sm:hidden transition-all duration-500" 
                 style={{ height: `${(currentIdx / (steps.length - 1)) * 100}%` }} 
               /> 
               <div className="flex flex-col sm:flex-row justify-between w-full gap-4 sm:gap-2"> 
                 {steps.map((s, idx) => { 
                   const isCompleted = idx <= currentIdx; 
                   const isCurrent = idx === currentIdx; 
                   return ( 
                     <div key={s.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-1.5 relative z-10 w-full sm:w-auto"> 
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${ 
                         isCompleted ? 'bg-purple-600 text-white shadow-sm ring-2 ring-white' : 'bg-white text-slate-300 border-2 border-slate-200' 
                       }`}> 
                         {isCompleted ? <CheckCircle2 size={14} className="stroke-[3]" /> : (idx + 1)} 
                       </div> 
                       <span className={`text-[10px] font-bold ${ 
                         isCurrent ? 'text-purple-900' : isCompleted ? 'text-purple-600' : 'text-slate-400' 
                       } sm:w-16 leading-tight`}> 
                         {s.label} 
                       </span> 
                     </div> 
                   ); 
                 })} 
               </div> 
            </div> 
          </div> 
        ); 
      })}

      {/* 2. REAL REFUND STATUS CARD (If Cancelled Prepaid / Returned / Refunded) */}
      {hasRefund && (
        <div className="bg-purple-50/70 rounded-2xl border border-purple-200 p-4 sm:p-5 mb-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <DollarSign size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-purple-950 text-sm sm:text-base">
                    Refund Status: {refundStatus === 'completed' ? 'Credited to Source' : 'Refund Initiated'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    refundStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}>
                    {refundStatus}
                  </span>
                </div>
                <p className="text-xs text-purple-800 mt-0.5">
                  Refund of <strong>₹{Number(refundAmount || 0).toLocaleString('en-IN')}</strong> will be credited to your {order.payment?.provider || 'Original Payment Source'}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Refund Amount</span>
              <span className="text-base sm:text-lg font-extrabold text-purple-900">
                ₹{Number(refundAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Refund Reference ID</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-purple-950 bg-white/80 px-2 py-0.5 rounded border border-purple-200">
                  {refundId}
                </span>
                <button
                  onClick={() => copyToClipboard(refundId, 'id')}
                  className="p-1 text-purple-600 hover:text-purple-900 rounded"
                  title="Copy Refund Reference"
                >
                  {copiedId === refundId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Destination</span>
              <p className="font-semibold text-purple-950 mt-0.5">
                {order.payment?.provider || 'Razorpay / Bank Account'}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Expected Credit Timeline</span>
              <p className="font-semibold text-purple-950 mt-0.5">
                Usually 3–5 business days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHIPPING & DELIVERY DETAILS HERO SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Truck size={17} className="text-blue-600" /> Shipping & Delivery Details
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${shippingStatusInfo.badgeClass}`}>
                {shippingStatusInfo.label}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {shippingStatusInfo.desc}
            </p>
          </div>

          {/* Prominent Track Order Button if tracking exists */}
          {hasCourierTracking && trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Navigation size={13} />
              <span>Track Order Live</span>
              <ExternalLink size={12} className="ml-0.5" />
            </a>
          )}
        </div>

        {/* Courier & AWB Tracking Card (When Tracking Available) */}
        {hasCourierTracking ? (
          <div className="bg-slate-50/90 rounded-xl p-3.5 sm:p-4 border border-slate-200 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Courier Partner */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Truck size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Courier Partner</span>
                  <p className="font-bold text-slate-900 text-sm">{order.carrier || order.courier || 'Express Courier'}</p>
                  <span className="text-[11px] text-slate-500">Surface / Air Express</span>
                </div>
              </div>

              {/* AWB Tracking Code */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Box size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">AWB / Tracking Number</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                      {order.trackingNumber || 'Pending AWB Generation'}
                    </span>
                    {order.trackingNumber && (
                      <button
                        onClick={() => copyToClipboard(order.trackingNumber!, 'tracking')}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-white transition-colors"
                        title="Copy AWB Code"
                      >
                        {copiedTracking === order.trackingNumber ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Estimated Delivery Date */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Delivery</span>
                  <p className="font-bold text-emerald-800 text-sm">
                    {order.estimatedDelivery || (isDelivered ? 'Delivered' : 'Expected in 3-5 business days')}
                  </p>
                  <span className="text-[11px] text-slate-500">To {order.shippingAddress?.city || 'Shipping Address'}</span>
                </div>
              </div>
            </div>

            {/* Latest Update Note if present */}
            {latestTimelineEvent?.note && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Compass size={13} className="text-blue-600 shrink-0" />
                  <span><strong>Latest Update:</strong> {latestTimelineEvent.note}</span>
                </span>
                {latestTimelineEvent.timestamp && (
                  <span className="text-slate-400 font-medium">
                    {formatTimestamp(latestTimelineEvent.timestamp, true)}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Notice when tracking is not yet available */
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-slate-900">
                Tracking information will be available after shipment
              </h4>
              <p className="text-slate-600 mt-1 leading-relaxed">
                The seller is currently processing and packing your order. As soon as the courier partner picks up your package and generates the AWB tracking code, live shipment tracking and courier details will appear right here.
              </p>
              {order.estimatedDelivery && (
                <p className="text-blue-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Clock size={13} /> Expected Delivery: {order.estimatedDelivery}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Multi-Shipment Support */}
        {hasMultipleShipments && order.shipments && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Package Fulfillment ({order.shipments.length} Separate Shipments)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.shipments.map((shipment: OrderShipment, sIdx: number) => {
                const sTrackingUrl = getCourierTrackingUrl(shipment.carrier || shipment.courier, shipment.trackingNumber, shipment.trackingUrl);
                return (
                  <div key={sIdx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Box size={14} className="text-blue-600" />
                        Shipment {sIdx + 1} of {order.shipments!.length}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        {shipment.shippingStatus || 'In Transit'}
                      </span>
                    </div>

                    {shipment.items && shipment.items.length > 0 && (
                      <div className="py-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Items in this package:</span>
                        <ul className="list-disc list-inside text-slate-700 text-[11px] mt-0.5">
                          {shipment.items.map((it, itIdx) => (
                            <li key={itIdx} className="truncate">{it.name} (Qty: {it.quantity})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-500">
                          {shipment.carrier || 'Express'} • {shipment.trackingNumber ? `AWB: ${shipment.trackingNumber}` : 'AWB Pending'}
                        </p>
                      </div>
                      {shipment.trackingNumber && sTrackingUrl && (
                        <a
                          href={sTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-bold text-blue-600 inline-flex items-center gap-1"
                        >
                          Track <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. STEP-BY-STEP ORDER & DELIVERY TIMELINE */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-blue-600" /> Delivery Timeline
          </h3>

          {isCancelled ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">Order & Shipment Cancelled</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  {order.cancellationReason || 'This order was cancelled.'} If payment was captured, refund is initiated automatically to your original payment method.
                </p>
                {order.payment?.refundId && (
                  <p className="text-[11px] font-mono text-rose-800 mt-1">
                    Refund Reference: {order.payment.refundId}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Desktop Horizontal Stepper */}
              <div className="hidden md:block py-2">
                <div className="grid grid-cols-6 relative">
                  {/* Connecting line */}
                  <div className="absolute top-4 left-[8.33%] right-[8.33%] h-1 bg-slate-100 -z-0">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                      style={{
                        width: `${
                          timelineSteps.filter((s) => s.isCompleted).length > 1
                            ? ((timelineSteps.filter((s) => s.isCompleted).length - 1) / 5) * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>

                  {timelineSteps.map((step) => (
                    <div key={step.key} className="flex flex-col items-center text-center relative z-10 px-1">
                      {/* Step Dot */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          step.isCompleted
                            ? 'bg-blue-600 text-white shadow-xs'
                            : step.isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                            : 'bg-white border-2 border-slate-200 text-slate-300'
                        }`}
                      >
                        {step.isCompleted ? (
                          <Check size={16} className="stroke-[2.5]" />
                        ) : (
                          <span className="text-xs font-bold">{step.stepNumber}</span>
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={`text-xs font-bold mt-2 ${
                          step.isCompleted || step.isCurrent ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Sublabel */}
                      <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 px-1">
                        {step.sublabel}
                      </span>

                      {/* Completed Timestamp */}
                      {step.timestamp && (
                        <span className="text-[10px] font-semibold text-blue-600 mt-1 bg-blue-50/80 px-1.5 py-0.5 rounded">
                          {step.timestamp}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Vertical Stepper */}
              <div className="md:hidden space-y-4 py-1">
                {timelineSteps.map((step, idx) => {
                  const isLast = idx === timelineSteps.length - 1;
                  return (
                    <div key={step.key} className="flex items-start gap-3 relative">
                      {!isLast && (
                        <div
                          className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px ${
                            step.isCompleted ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          step.isCompleted
                            ? 'bg-blue-600 text-white'
                            : step.isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-white border-2 border-slate-200 text-slate-300'
                        }`}
                      >
                        {step.isCompleted ? (
                          <Check size={14} className="stroke-[2.5]" />
                        ) : (
                          <span className="text-[11px] font-bold">{step.stepNumber}</span>
                        )}
                      </div>

                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-bold ${
                              step.isCompleted || step.isCurrent ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {step.timestamp && (
                            <span className="text-[10px] text-blue-600 font-semibold">
                              {step.timestamp}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.sublabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. TWO-COLUMN DETAILS: ORDERED ITEMS & PAYMENT (Left) + ADDRESS & ACTIONS (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN: ORDERED PRODUCTS LIST & BILL BREAKDOWN */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ordered Products Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Package size={15} className="text-blue-600" /> Ordered Items ({order.items.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {(order.items || []).map((item, idx) => {
                const optSrc = getOptimizedImageUrl(item.image, { width: 240, quality: 80 });
                const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
                const quantity = Number(item.quantity || 1);
                const itemTotal = Number(item.totalPrice ?? (unitPrice * quantity));
                const pId = item.productId || `prod-${(item.name || '').toLowerCase().replace(/\s+/g, '-')}`;

                return (
                  <div key={idx} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                      {/* Standard Product Image Frame */}
                      <div className="w-16 h-16 sm:w-18 sm:h-18 bg-slate-100 rounded-xl p-0 border border-slate-200/90 flex items-center justify-center shrink-0 overflow-hidden">
                        {optSrc ? (
                          <img
                            src={optSrc}
                            alt={item.name}
                            className="w-full h-full object-cover mix-blend-multiply"
                            loading="lazy"
                          />
                        ) : (
                          <Package size={20} className="text-slate-300" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <Link
                          to={item.productId ? `/product/${item.productId}` : '/shop'}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
                        >
                          {item.name}
                        </Link>
                        
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span>Qty: <strong>{quantity}</strong></span>
                          <span>•</span>
                          <span>Price: <strong>₹{Number(unitPrice || 0).toLocaleString('en-IN')}</strong> each</span>
                        </div>

                        {/* Variant / Option if available */}
                        {item.variant && (
                          <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            Option: {item.variant}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Item Contextual Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="sm:text-right">
                        <span className="text-[10px] text-slate-400 block sm:hidden">Item Total</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          ₹{Number(itemTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {/* 1. Buy Again per Item */}
                        <button
                          onClick={() => handleBuyAgain(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          title="Add this item to cart"
                        >
                          Buy Again
                        </button>

                        {/* 2. Return / Replace per Item (If delivered) */}
                        {(() => {
                           const hasActiveReturn = returnRequests.some(rr => 
                             rr.status !== 'rejected' && rr.status !== 'cancelled' && 
                             (rr.items || []).some((i: any) => i.productId === pId)
                           );
                           if (canReturn && !hasActiveReturn) {
                             return (
                               <button
                                 onClick={() => handleOpenReturnModal(pId)}
                                 className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                                 title="Return or replace this item"
                               >
                                 Return / Replace
                               </button>
                             );
                           } else if (hasActiveReturn) {
                             const retReq = returnRequests.find(rr => rr.status !== 'rejected' && rr.status !== 'cancelled' && (rr.items || []).some((i: any) => i.productId === pId));
                             const isReplace = retReq?.requestedResolution === 'replacement';
                             return (
                               <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">
                                 {isReplace ? 'Replacement' : 'Return'} {retReq?.status.replace(/_/g, ' ')}
                               </span>
                             );
                           }
                           return null;
                        })()}


                        {/* 3. Review Item (If delivered) */}
                        {isDelivered && (
                          <Link
                            to={`/product/${item.productId}?tab=reviews`}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Breakdown / Bill Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center gap-1.5">
              <CreditCard size={15} className="text-blue-600" /> Price Details
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({order.items.length} items)</span>
                <span className="font-medium text-slate-900">₹{Number(subtotal || 0).toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>- ₹{Number(discount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              {Number(tax || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax ({(order as any).taxRate ? `${(order as any).taxRate}%` : 'Included'})</span>
                  <span className="font-medium text-slate-900">₹{Number(tax || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping / Delivery Fee</span>
                <span className="font-medium text-slate-900">
                  {shippingCharge === 0 ? (
                    <strong className="text-emerald-600 uppercase text-[11px]">FREE</strong>
                  ) : (
                    `₹${Number(shippingCharge || 0).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-base text-blue-600">₹{Number(grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DELIVERY ADDRESS, PAYMENT INFO & ACTIONS */}
        <div className="space-y-4">
          {/* DELIVERY ADDRESS CARD */}
          {order.shippingAddress && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
              <h3 className="text-sm font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-600" /> Delivery Address
              </h3>

              <div className="text-xs space-y-1.5">
                <p className="font-bold text-slate-900 text-sm">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {formatFullAddressString(order.shippingAddress)}
                </p>
                {order.shippingAddress.phone && (
                  <p className="text-slate-500 pt-1 flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" />
                    <span>Phone: <strong className="text-slate-700">{order.shippingAddress.phone}</strong></span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PAYMENT INFORMATION CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 mb-3 border-b border-slate-100 flex items-center gap-1.5">
              <CreditCard size={15} className="text-blue-600" /> Payment Information
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Method</span>
                <span className="font-bold text-slate-900 uppercase">
                  {order.payment?.provider || 'Razorpay / Prepaid'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRefunded
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.payment?.paymentStatus || (isPaid ? 'Captured' : 'Pending')}
                </span>
              </div>

              {order.payment?.razorpayPaymentId && (
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-slate-500">Transaction ID</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {order.payment.razorpayPaymentId.slice(0, 14)}...
                    </span>
                    <button
                      onClick={() => copyToClipboard(order.payment!.razorpayPaymentId!, 'id')}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                      title="Copy Transaction ID"
                    >
                      {copiedId === order.payment.razorpayPaymentId ? (
                        <Check size={11} className="text-emerald-600" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {order.payment?.refundId && (
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-purple-700">
                  <span>Refund ID</span>
                  <span className="font-mono text-[11px] font-semibold">{order.payment.refundId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INVOICE MODAL */}
      {isInvoiceOpen && (
        <InvoiceModal
          order={order}
          onClose={() => setIsInvoiceOpen(false)}
        />
      )}

      {/* RETURN & REPLACEMENT MODAL */}
      {isReturnModalOpen && user && (
        <ReturnOrderModal
          order={order}
          preSelectedProductId={selectedProductForReturn}
          userId={user.uid}
          userEmail={user.email || ''}
          userName={user.displayName || ''}
          onClose={() => setIsReturnModalOpen(false)}
          onSuccess={(returnId) => {
            setIsReturnModalOpen(false);
            setReturnSuccessMsg(`Return request #${returnId} submitted successfully! Doorstep pickup will be scheduled.`);
            setTimeout(() => setReturnSuccessMsg(null), 6000);
          }}
        />
      )}

      {/* HELP & SUPPORT MODAL */}
      {isHelpOpen && user && (
        <OrderHelpModal
          order={order}
          userId={user.uid}
          userEmail={user.email || ''}
          userName={user.displayName || ''}
          onClose={() => setIsHelpOpen(false)}
          onTicketCreated={() => {
            setIsHelpOpen(false);
            navigate('/account?view=tickets');
          }}
          onReturnInitiated={() => {
            setIsHelpOpen(false);
            navigate('/account?view=returns');
          }}
        />
      )}

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" /> Cancel Order #{invoiceNum}
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isSubmittingCancel}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              Are you sure you want to cancel this order? {isPaid ? 'Since this order was prepaid, the full amount will be refunded directly to your original payment source within 3-5 business days.' : 'This order will be cancelled immediately.'}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={isSubmittingCancel}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found lower price elsewhere">Found lower price elsewhere</option>
                  <option value="Change of delivery address">Change of delivery address</option>
                  <option value="Expected delivery is too late">Expected delivery is too late</option>
                  <option value="Decided on another product">Decided on another product</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  disabled={isSubmittingCancel}
                  rows={2}
                  placeholder="Provide any additional comments..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isSubmittingCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isSubmittingCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingCancel ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
