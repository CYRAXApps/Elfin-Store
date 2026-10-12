import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  ChevronRight, 
  Search, 
  ShoppingBag, 
  FileText, 
  HelpCircle,
  RotateCcw,
  Star
} from 'lucide-react';
import { Order } from '../../types';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

interface OrdersSubViewProps {
  orders: Order[];
  loading?: boolean;
  onOpenInvoice?: (order: Order) => void;
  onOpenHelp?: (order: Order) => void;
}

type FilterStatus = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export function OrdersSubView({
  orders,
  loading = false,
  onOpenInvoice,
  onOpenHelp,
}: OrdersSubViewProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Count orders per status category
  const orderCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      const s = order.status;
      if (s === 'delivered') {
        counts.delivered++;
      } else if (s === 'shipped' || s === 'out_for_delivery') {
        counts.shipped++;
      } else if (s === 'cancelled' || s === 'returned' || s === 'refunded') {
        counts.cancelled++;
      } else {
        // pending, confirmed, processing
        counts.processing++;
      }
    });

    return counts;
  }, [orders]);

  // Filter orders by selected filter tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (filter === 'processing') {
        if (!['pending', 'confirmed', 'processing'].includes(order.status)) return false;
      } else if (filter === 'shipped') {
        if (!['shipped', 'out_for_delivery'].includes(order.status)) return false;
      } else if (filter === 'delivered') {
        if (order.status !== 'delivered') return false;
      } else if (filter === 'cancelled') {
        if (!['cancelled', 'returned', 'refunded'].includes(order.status)) return false;
      }

      // 2. Search Query (Order ID, Invoice #, Product Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesOrderId = order.id.toLowerCase().includes(query);
        const matchesInvoice = order.invoiceNumber?.toLowerCase().includes(query) || false;
        const matchesProduct = order.items.some((item) =>
          item.name.toLowerCase().includes(query)
        );
        return matchesOrderId || matchesInvoice || matchesProduct;
      }

      return true;
    });
  }, [orders, filter, searchQuery]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Delivered',
          badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
          dotClass: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'shipped':
        return {
          label: 'Shipped',
          badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200/80',
          dotClass: 'bg-blue-500',
          icon: Truck,
        };
      case 'out_for_delivery':
        return {
          label: 'Out for Delivery',
          badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
          dotClass: 'bg-indigo-500',
          icon: Truck,
        };
      case 'cancelled':
      case 'returned':
      case 'refunded':
        return {
          label: status === 'refunded' ? 'Refunded' : status === 'returned' ? 'Returned' : 'Cancelled',
          badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80',
          dotClass: 'bg-rose-500',
          icon: XCircle,
        };
      case 'confirmed':
        return {
          label: 'Order Confirmed',
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80',
          dotClass: 'bg-amber-500',
          icon: Clock,
        };
      case 'processing':
      case 'pending':
      default:
        return {
          label: 'Processing',
          badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200/80',
          dotClass: 'bg-amber-500',
          icon: Clock,
        };
    }
  };

  const handleNavigateToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              My Orders
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              View all your ordered products, current statuses, and delivery updates.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <ShoppingBag size={13} /> Continue Shopping
          </Link>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Orders', count: orderCounts.all },
              { id: 'processing', label: 'Processing', count: orderCounts.processing },
              { id: 'shipped', label: 'Shipped', count: orderCounts.shipped },
              { id: 'delivered', label: 'Delivered', count: orderCounts.delivered },
              { id: 'cancelled', label: 'Cancelled', count: orderCounts.cancelled },
            ].map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as FilterStatus)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product or Order ID..."
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Orders List / Loading / Empty States */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => (
            <div
              key={k}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse shadow-xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-36 bg-slate-200 rounded-md" />
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
                  <div className="h-3 w-1/3 bg-slate-100 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 sm:p-14 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-slate-100">
            <Package size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {searchQuery
              ? 'No matching orders found'
              : filter === 'all'
              ? 'No orders placed yet'
              : `No ${filter} orders`}
          </h3>
          <p className="text-slate-500 text-xs mb-5 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different keyword or filter.`
              : "When you place orders, your purchased items, live status, and delivery details will appear here."}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <ShoppingBag size={14} /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const orderDateStr = formatDate(order.createdAt);
            const formattedOrderId = order.id.slice(0, 8).toUpperCase();
            const invoiceNum = order.invoiceNumber || `EST-${formattedOrderId}`;
            const totalAmount = order.grandTotal || order.totalAmount || 0;

            // Delivery estimate / status string
            let deliveryText = '';
            if (order.status === 'delivered') {
              deliveryText = `Delivered on ${orderDateStr}`;
            } else if (order.status === 'shipped' || order.status === 'out_for_delivery') {
              deliveryText = order.estimatedDelivery
                ? `Arriving by ${order.estimatedDelivery}`
                : 'Arriving in 2-3 business days';
            } else if (order.status === 'cancelled' || order.status === 'returned' || order.status === 'refunded') {
              deliveryText = `${statusConfig.label}`;
            } else {
              deliveryText = order.estimatedDelivery
                ? `Expected delivery by ${order.estimatedDelivery}`
                : 'Expected in 3-5 business days';
            }

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all overflow-hidden group"
              >
                {/* Order Summary Header Bar */}
                <div className="bg-slate-50/70 border-b border-slate-100 px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">
                        Order #{formattedOrderId}
                      </span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{orderDateStr}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-900">₹{Number(totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenInvoice && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInvoice(order);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        title="Download / View Tax Invoice"
                      >
                        <FileText size={13} />
                        <span>Invoice</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Ordered Products List */}
                <div className="divide-y divide-slate-100">
                  {(order.items || []).map((item, idx) => {
                    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
                    const quantity = Number(item.quantity || 1);
                    const itemTotal = Number(item.totalPrice ?? (unitPrice * quantity));
                    const optSrc = getOptimizedImageUrl(item.image, { width: 240, quality: 80 });

                    return (
                      <div
                        key={idx}
                        onClick={() => handleNavigateToOrder(order.id)}
                        className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group/item"
                      >
                        {/* Product Image Thumbnail */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl p-0 border border-slate-200/80 shrink-0 flex items-center justify-center overflow-hidden relative group-hover/item:border-blue-300 transition-colors">
                          {optSrc ? (
                            <img
                              src={optSrc}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              width={80}
                              height={80}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 group-hover/item:scale-105"
                            />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>

                        {/* Product Details & Delivery Status */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dotClass}`} />
                            <span className="text-[11px] font-semibold text-slate-600 truncate">
                              {deliveryText}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover/item:text-blue-600 transition-colors line-clamp-1 sm:line-clamp-2">
                            {item.name}
                          </h4>

                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-1 text-xs text-slate-500">
                            <span>
                              Qty: <strong className="text-slate-800 font-bold">{quantity}</strong>
                            </span>
                            <span>•</span>
                            <span>₹{Number(unitPrice || 0).toLocaleString('en-IN')} each</span>
                            <span>•</span>
                            <span className="font-bold text-slate-900">
                              Item Total: ₹{Number(itemTotal || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Navigation Arrow */}
                        <div className="flex items-center text-slate-400 group-hover/item:text-blue-600 group-hover/item:translate-x-0.5 transition-all shrink-0">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Card Footer Actions */}
                <div className="px-4 py-3 sm:px-5 bg-slate-50/40 border-t border-slate-100">
                  {order.status === 'delivered' ? (
                    <div className="flex flex-col gap-2 w-full">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Star size={14} className="text-amber-500 fill-amber-500" /> 
                        Write a product review
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(order.items || []).map((item, idx) => (
                          <Link
                            key={idx}
                            to={`/product/${item.productId || item.name.toLowerCase().replace(/\s+/g, '-')}?tab=reviews&action=write`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-lg text-[11px] font-bold transition-all shadow-2xs"
                          >
                            Review {item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-medium py-1">
                      Reviews will be unlocked once this order is delivered.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
