import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Package, Search, X, Calendar, Filter, RefreshCw, 
  Clock, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check, 
  MapPin, Phone, Eye, Printer, Edit3, ArrowRight, RotateCcw,
  SlidersHorizontal, ChevronRight, AlertCircle, ShieldAlert
} from 'lucide-react';
import { Order, ShippingStatus } from '../../../types';
import { db } from '../../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { hasStaffPermission } from '../../../utils/staffPermissions';
import { 
  formatCurrency, 
  formatOrderDateTime, 
  getEffectiveShippingStatus, 
  getShippingStatusLabel,
  POPULAR_COURIERS
} from '../orders/orderUtils';
import { ShipmentModal } from './ShipmentModal';
import { TrackingUpdateModal } from './TrackingUpdateModal';
import { ShipmentDetailsModal } from './ShipmentDetailsModal';
import { ShippingLabelModal } from './ShippingLabelModal';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';

interface ShippingDashboardProps {
  onNavigateTab?: (tab: string, params?: any) => void;
}

export function ShippingDashboard({ onNavigateTab }: ShippingDashboardProps) {
  const { user } = useAuth();
  const canUpdateStatus = user?.role === 'admin' || hasStaffPermission(user, 'orders_update_status');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [statusTab, setStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'last_7_days' | 'last_30_days'>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  // Active Modals
  const [shipmentModalOrder, setShipmentModalOrder] = useState<Order | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<{ order: Order; mode: 'status' | 'failed' } | null>(null);
  const [detailsModalOrder, setDetailsModalOrder] = useState<Order | null>(null);
  const [labelModalOrder, setLabelModalOrder] = useState<Order | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

        setOrders(fetched);
        setLoading(false);

        // Keep modal order in sync if open
        if (detailsModalOrder) {
          const up = fetched.find(o => o.id === detailsModalOrder.id);
          if (up) setDetailsModalOrder(up);
        }
      },
      (err) => {
        console.error('Error listening to orders for shipping dashboard:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [detailsModalOrder?.id]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Status Counts
  const counts = useMemo(() => {
    const res = {
      all: 0,
      ready_to_ship: 0,
      shipped: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      delivery_failed: 0,
    };

    orders.forEach((o) => {
      // Exclude cancelled/returned for shipping operations dashboard
      if (o.status === 'cancelled' || o.status === 'returned') return;
      
      const st = getEffectiveShippingStatus(o);
      res.all++;

      if (st === 'ready_to_ship' || st === 'label_created' || (o.status === 'processing' && !o.trackingNumber)) {
        res.ready_to_ship++;
      } else if (st === 'shipped' || st === 'dispatched') {
        res.shipped++;
      } else if (st === 'in_transit') {
        res.in_transit++;
      } else if (st === 'out_for_delivery') {
        res.out_for_delivery++;
      } else if (st === 'delivered') {
        res.delivered++;
      } else if (st === 'delivery_failed') {
        res.delivery_failed++;
      }
    });

    return res;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;
    const q = searchQuery.toLowerCase().trim();

    return orders.filter((o) => {
      // Filter out cancelled orders unless explicitly searching
      if ((o.status === 'cancelled' || o.status === 'returned') && !q) {
        return false;
      }

      const effectiveStatus = getEffectiveShippingStatus(o);

      // 1. Status Tab filter
      if (statusTab !== 'all') {
        if (statusTab === 'ready_to_ship') {
          if (effectiveStatus !== 'ready_to_ship' && effectiveStatus !== 'label_created' && !(o.status === 'processing' && !o.trackingNumber)) {
            return false;
          }
        } else if (statusTab === 'shipped') {
          if (effectiveStatus !== 'shipped' && effectiveStatus !== 'dispatched') return false;
        } else if (statusTab === 'in_transit') {
          if (effectiveStatus !== 'in_transit') return false;
        } else if (statusTab === 'out_for_delivery') {
          if (effectiveStatus !== 'out_for_delivery') return false;
        } else if (statusTab === 'delivered') {
          if (effectiveStatus !== 'delivered') return false;
        } else if (statusTab === 'delivery_failed') {
          if (effectiveStatus !== 'delivery_failed') return false;
        }
      }

      // 2. Courier Filter
      if (courierFilter !== 'all') {
        const orderCourier = (o.carrier || o.courier || '').toLowerCase();
        if (!orderCourier.includes(courierFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateFilter !== 'all') {
        const orderTime = o.createdAt?.toMillis ? o.createdAt.toMillis() : (o.createdAt ? new Date(o.createdAt).getTime() : 0);
        if (orderTime > 0) {
          const diff = now - orderTime;
          if (dateFilter === 'today' && diff > oneDay) return false;
          if (dateFilter === 'last_7_days' && diff > sevenDays) return false;
          if (dateFilter === 'last_30_days' && diff > thirtyDays) return false;
        }
      }

      // 4. Search query
      if (q) {
        const inv = (o.invoiceNumber || '').toLowerCase();
        const id = (o.id || '').toLowerCase();
        const cust = (o.shippingAddress?.fullName || '').toLowerCase();
        const phone = (o.shippingAddress?.phone || '').toLowerCase();
        const tracking = (o.trackingNumber || '').toLowerCase();
        const city = (o.shippingAddress?.city || '').toLowerCase();
        const pincode = (o.shippingAddress?.pincode || '').toLowerCase();
        const courier = (o.carrier || o.courier || '').toLowerCase();

        const matches =
          inv.includes(q) ||
          id.includes(q) ||
          cust.includes(q) ||
          phone.includes(q) ||
          tracking.includes(q) ||
          city.includes(q) ||
          pincode.includes(q) ||
          courier.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [orders, statusTab, courierFilter, dateFilter, searchQuery]);

  const resetFilters = () => {
    setStatusTab('all');
    setSearchQuery('');
    setDateFilter('all');
    setCourierFilter('all');
  };

  const hasActiveFilters = statusTab !== 'all' || searchQuery.trim() || dateFilter !== 'all' || courierFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Truck className="text-slate-800" size={24} />
              Shipping & Delivery Management
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-100">
              {orders.length} Shipments
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Manage dispatch pipelines, courier tracking codes, delivery attempts, and customer notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Package size={14} className="text-slate-500" />
              <span>Back to Orders</span>
            </button>
          )}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('store-settings', { initialSubTab: 'shipping' })}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <MapPin size={14} className="text-blue-600" />
              <span>Coverage Zones (State → District → PINs)</span>
            </button>
          )}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('store-settings', { initialSubTab: 'shipping' })}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span>Shipping Rates & Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Key Operational Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Ready to Ship */}
        <button
          type="button"
          onClick={() => setStatusTab(statusTab === 'ready_to_ship' ? 'all' : 'ready_to_ship')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusTab === 'ready_to_ship'
              ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200 shadow-sm'
              : 'bg-white hover:bg-indigo-50/40 text-slate-800 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusTab === 'ready_to_ship' ? 'text-indigo-100' : 'text-indigo-700'
            }`}>
              Ready to Ship
            </span>
            <Package size={16} className={statusTab === 'ready_to_ship' ? 'text-indigo-200' : 'text-indigo-600'} />
          </div>
          <div className="text-2xl font-black mt-2 leading-none">
            {counts.ready_to_ship}
          </div>
          <p className={`text-[10px] mt-1 truncate ${statusTab === 'ready_to_ship' ? 'text-indigo-100' : 'text-slate-400'}`}>
            Packed & labeled
          </p>
        </button>

        {/* Shipped / Dispatched */}
        <button
          type="button"
          onClick={() => setStatusTab(statusTab === 'shipped' ? 'all' : 'shipped')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusTab === 'shipped'
              ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200 shadow-sm'
              : 'bg-white hover:bg-purple-50/40 text-slate-800 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusTab === 'shipped' ? 'text-purple-100' : 'text-purple-700'
            }`}>
              Shipped
            </span>
            <Truck size={16} className={statusTab === 'shipped' ? 'text-purple-200' : 'text-purple-600'} />
          </div>
          <div className="text-2xl font-black mt-2 leading-none">
            {counts.shipped}
          </div>
          <p className={`text-[10px] mt-1 truncate ${statusTab === 'shipped' ? 'text-purple-100' : 'text-slate-400'}`}>
            Picked by courier
          </p>
        </button>

        {/* In Transit */}
        <button
          type="button"
          onClick={() => setStatusTab(statusTab === 'in_transit' ? 'all' : 'in_transit')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusTab === 'in_transit'
              ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 shadow-sm'
              : 'bg-white hover:bg-blue-50/40 text-slate-800 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusTab === 'in_transit' ? 'text-blue-100' : 'text-blue-700'
            }`}>
              In Transit
            </span>
            <Clock size={16} className={statusTab === 'in_transit' ? 'text-blue-200' : 'text-blue-600'} />
          </div>
          <div className="text-2xl font-black mt-2 leading-none">
            {counts.in_transit}
          </div>
          <p className={`text-[10px] mt-1 truncate ${statusTab === 'in_transit' ? 'text-blue-100' : 'text-slate-400'}`}>
            Between logistics hubs
          </p>
        </button>

        {/* Out for Delivery */}
        <button
          type="button"
          onClick={() => setStatusTab(statusTab === 'out_for_delivery' ? 'all' : 'out_for_delivery')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusTab === 'out_for_delivery'
              ? 'bg-cyan-600 text-white border-cyan-600 ring-2 ring-cyan-200 shadow-sm'
              : 'bg-white hover:bg-cyan-50/40 text-slate-800 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusTab === 'out_for_delivery' ? 'text-cyan-100' : 'text-cyan-700'
            }`}>
              Out for Delivery
            </span>
            <MapPin size={16} className={statusTab === 'out_for_delivery' ? 'text-cyan-200' : 'text-cyan-600'} />
          </div>
          <div className="text-2xl font-black mt-2 leading-none">
            {counts.out_for_delivery}
          </div>
          <p className={`text-[10px] mt-1 truncate ${statusTab === 'out_for_delivery' ? 'text-cyan-100' : 'text-slate-400'}`}>
            With local delivery rider
          </p>
        </button>

        {/* Delivered */}
        <button
          type="button"
          onClick={() => setStatusTab(statusTab === 'delivered' ? 'all' : 'delivered')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusTab === 'delivered'
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200 shadow-sm'
              : 'bg-white hover:bg-emerald-50/40 text-slate-800 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusTab === 'delivered' ? 'text-emerald-100' : 'text-emerald-700'
            }`}>
              Delivered
            </span>
            <CheckCircle2 size={16} className={statusTab === 'delivered' ? 'text-emerald-200' : 'text-emerald-600'} />
          </div>
          <div className="text-2xl font-black mt-2 leading-none">
            {counts.delivered}
          </div>
          <p className={`text-[10px] mt-1 truncate ${statusTab === 'delivered' ? 'text-emerald-100' : 'text-slate-400'}`}>
            Received by customer
          </p>
        </button>

        {/* Delivery Failed */}
        <button
          type="button"
          onClick={() => setStatusTab(statusTab === 'delivery_failed' ? 'all' : 'delivery_failed')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            statusTab === 'delivery_failed'
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200 shadow-sm'
              : 'bg-white hover:bg-rose-50/40 text-slate-800 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusTab === 'delivery_failed' ? 'text-rose-100' : 'text-rose-700'
            }`}>
              Delivery Failed
            </span>
            <AlertTriangle size={16} className={statusTab === 'delivery_failed' ? 'text-rose-200' : 'text-rose-600'} />
          </div>
          <div className="text-2xl font-black mt-2 leading-none">
            {counts.delivery_failed}
          </div>
          <p className={`text-[10px] mt-1 truncate ${statusTab === 'delivery_failed' ? 'text-rose-100' : 'text-slate-400'}`}>
            Needs re-dispatch/action
          </p>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Customer, Phone, AWB / Tracking code, City..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <select
              value={statusTab}
              onChange={(e) => setStatusTab(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Shipping Statuses ({counts.all})</option>
              <option value="ready_to_ship">Ready to Ship ({counts.ready_to_ship})</option>
              <option value="shipped">Shipped ({counts.shipped})</option>
              <option value="in_transit">In Transit ({counts.in_transit})</option>
              <option value="out_for_delivery">Out for Delivery ({counts.out_for_delivery})</option>
              <option value="delivered">Delivered ({counts.delivered})</option>
              <option value="delivery_failed">Delivery Failed ({counts.delivery_failed})</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>

            {/* Courier Filter */}
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Couriers</option>
              {POPULAR_COURIERS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Clear Filters button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Shipments Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw size={28} className="animate-spin text-blue-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Shipments & Tracking Data...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Truck size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Shipments Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No orders match the current shipping status, courier filter, or search keyword.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Show All Shipments
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Order & Placement</th>
                  <th className="p-4">Customer & Destination</th>
                  <th className="p-4">Package Contents</th>
                  <th className="p-4">Courier & AWB</th>
                  <th className="p-4">Dispatch & Est. Delivery</th>
                  <th className="p-4">Shipping Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
                  const effectiveStatus = getEffectiveShippingStatus(order);
                  const statusInfo = getShippingStatusLabel(effectiveStatus);
                  const addr = order.shippingAddress;
                  const items = order.items || [];
                  const isPos = order.orderSource === 'pos' || order.id?.startsWith('pos_ord_');

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order & Placement */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDetailsModalOrder(order)}
                              className="font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            >
                              #{inv}
                            </button>
                            <button
                              onClick={() => copyToClipboard(inv, `inv_${order.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title="Copy Order ID"
                            >
                              {copiedField === `inv_${order.id}` ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {formatOrderDateTime(order.createdAt)}
                          </p>
                          {isPos && (
                            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                              Counter POS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer & Destination */}
                      <td className="p-4 align-top">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-slate-900">{addr?.fullName || 'Customer'}</p>
                          <p className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Phone size={11} className="text-slate-400" /> {addr?.phone || 'No phone'}
                          </p>
                          <p className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {addr?.city ? (
                                <>
                                  {addr.city}, {addr.state || ''} - <PincodeDisplay pincode={addr.pincode} />
                                </>
                              ) : (
                                'No address provided'
                              )}
                            </span>
                          </p>
                        </div>
                      </td>

                      {/* Package Contents */}
                      <td className="p-4 align-top">
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-800">
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {items[0]?.name || 'Standard Package'}
                            {items.length > 1 && ` +${items.length - 1} more`}
                          </p>
                          <p className="text-[11px] font-bold text-slate-900">
                            {formatCurrency(order.grandTotal || order.totalAmount || 0)}
                          </p>
                        </div>
                      </td>

                      {/* Courier & AWB */}
                      <td className="p-4 align-top">
                        <div className="space-y-1 text-xs">
                          {order.trackingNumber ? (
                            <>
                              <p className="font-bold text-slate-900">
                                {order.carrier || order.courier || 'Express Courier'}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {order.trackingNumber}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(order.trackingNumber!, `awb_${order.id}`)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title="Copy AWB"
                                >
                                  {copiedField === `awb_${order.id}` ? (
                                    <Check size={12} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline font-bold inline-flex items-center gap-0.5"
                                >
                                  <span>Live Track</span> <ExternalLink size={10} />
                                </a>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => setShipmentModalOrder(order)}
                              disabled={!canUpdateStatus}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Truck size={12} /> Assign Courier
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Dispatch & Est. Delivery */}
                      <td className="p-4 align-top">
                        <div className="space-y-1 text-xs">
                          <p className="text-[11px] text-slate-500">
                            Dispatched: <strong className="text-slate-700">{order.shippingDate || (order.dispatchedAt ? formatOrderDateTime(order.dispatchedAt) : 'Pending')}</strong>
                          </p>
                          <p className="text-[11px] text-emerald-700 font-bold">
                            Est: {order.estimatedDelivery || (effectiveStatus === 'delivered' ? 'Delivered' : '3-5 business days')}
                          </p>
                        </div>
                      </td>

                      {/* Shipping Status Badge */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{statusInfo.label}</span>
                          </span>

                          {effectiveStatus === 'delivery_failed' && (
                            <div className="text-[10px] font-semibold text-rose-700 bg-rose-50 p-1.5 rounded-md border border-rose-200 max-w-[170px]">
                              <span>Failed (Attempt {order.deliveryAttempts || 1})</span>
                              {order.failedDeliveryReason && (
                                <p className="text-[9px] text-rose-600 truncate mt-0.5">
                                  {order.failedDeliveryReason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Update Tracking */}
                          <button
                            onClick={() => setTrackingModalOrder({ order, mode: 'status' })}
                            disabled={!canUpdateStatus}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                            title="Update Tracking & Delivery Status"
                          >
                            <Clock size={15} />
                          </button>

                          {/* Record Failed Attempt */}
                          {effectiveStatus !== 'delivered' && (
                            <button
                              onClick={() => setTrackingModalOrder({ order, mode: 'failed' })}
                              disabled={!canUpdateStatus}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                              title="Record Failed Delivery Attempt"
                            >
                              <AlertTriangle size={15} />
                            </button>
                          )}

                          {/* Edit / Assign Shipment */}
                          <button
                            onClick={() => setShipmentModalOrder(order)}
                            disabled={!canUpdateStatus}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            title="Assign or Edit Courier / AWB"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Print Label */}
                          <button
                            onClick={() => setLabelModalOrder(order)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            title="Print Dispatch Slip & Shipping Label"
                          >
                            <Printer size={15} />
                          </button>

                          {/* View Shipment Details */}
                          <button
                            onClick={() => setDetailsModalOrder(order)}
                            className="p-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors"
                            title="View Full Shipment Details & Journey"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="block lg:hidden divide-y divide-slate-200">
            {filteredOrders.map((order) => {
              const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
              const effectiveStatus = getEffectiveShippingStatus(order);
              const statusInfo = getShippingStatusLabel(effectiveStatus);
              const addr = order.shippingAddress;
              const items = order.items || [];

              return (
                <div key={order.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailsModalOrder(order)}
                          className="font-bold text-xs text-blue-600 hover:underline font-mono"
                        >
                          #{inv}
                        </button>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatOrderDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">
                        {formatCurrency(order.grandTotal || order.totalAmount || 0)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="text-xs text-slate-600 space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-900">{addr?.fullName || 'Customer'}</p>
                    <p className="text-[11px]">{addr?.phone}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {addr?.city}, {addr?.state} - <PincodeDisplay pincode={addr?.pincode} />
                    </p>
                  </div>

                  {/* Courier & AWB */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block uppercase">Courier</span>
                      <span className="font-bold text-slate-800">
                        {order.carrier || order.courier || 'Pending'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium block uppercase">Tracking / AWB</span>
                      <span className="font-mono font-bold text-slate-900">
                        {order.trackingNumber || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                    <button
                      onClick={() => setDetailsModalOrder(order)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Details
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShipmentModalOrder(order)}
                        disabled={!canUpdateStatus}
                        className="px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Edit Courier
                      </button>
                      <button
                        onClick={() => setTrackingModalOrder({ order, mode: 'status' })}
                        disabled={!canUpdateStatus}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-2xs"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Assign / Edit Shipment Modal */}
      {shipmentModalOrder && (
        <ShipmentModal
          order={shipmentModalOrder}
          isOpen={Boolean(shipmentModalOrder)}
          onClose={() => setShipmentModalOrder(null)}
          onSuccess={() => {}}
        />
      )}

      {/* 2. Update Tracking Modal (Status / Failed attempt) */}
      {trackingModalOrder && (
        <TrackingUpdateModal
          order={trackingModalOrder.order}
          initialMode={trackingModalOrder.mode}
          isOpen={Boolean(trackingModalOrder)}
          onClose={() => setTrackingModalOrder(null)}
          onSuccess={() => {}}
        />
      )}

      {/* 3. Shipment Details Modal */}
      {detailsModalOrder && (
        <ShipmentDetailsModal
          order={detailsModalOrder}
          isOpen={Boolean(detailsModalOrder)}
          onClose={() => setDetailsModalOrder(null)}
          onEditShipment={(ord) => {
            setDetailsModalOrder(null);
            setShipmentModalOrder(ord);
          }}
          onUpdateTracking={(ord) => {
            setDetailsModalOrder(null);
            setTrackingModalOrder({ order: ord, mode: 'status' });
          }}
          onPrintSlip={(ord) => {
            setDetailsModalOrder(null);
            setLabelModalOrder(ord);
          }}
        />
      )}

      {/* 4. Shipping Slip / Label Modal */}
      {labelModalOrder && (
        <ShippingLabelModal
          order={labelModalOrder}
          isOpen={Boolean(labelModalOrder)}
          onClose={() => setLabelModalOrder(null)}
        />
      )}
    </div>
  );
}
