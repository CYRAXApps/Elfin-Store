import React from 'react';
import { Search, X, Filter, Calendar, DollarSign, CreditCard, Truck, RotateCcw } from 'lucide-react';

export interface OrderFilterState {
  statusTab: string;
  searchQuery: string;
  dateFilter: 'all' | 'today' | 'last_7_days' | 'last_30_days';
  paymentMethodFilter?: 'all' | 'cash' | 'upi' | 'card' | 'razorpay' | 'cod';
  paymentFilter: 'all' | 'captured' | 'pending' | 'refunded' | 'failed';
  shippingFilter: 'all' | 'not_shipped' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered';
  amountFilter: 'all' | 'under_1000' | '1000_10000' | '10000_50000' | 'above_50000';
}

export interface OrderStatusCounts {
  all: number;
  pos?: number;
  new: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  refunded: number;
  returns?: number;
}

interface OrderFiltersProps {
  filters: OrderFilterState;
  counts: OrderStatusCounts;
  onChange: (newFilters: OrderFilterState) => void;
  onReset: () => void;
}

export function OrderFilters({
  filters,
  counts,
  onChange,
  onReset
}: OrderFiltersProps) {
  const statusTabs = [
    { key: 'all', label: 'All Orders', count: counts.all },
    { key: 'new', label: 'Pending', count: counts.new, badge: 'bg-amber-100 text-amber-800' },
    { key: 'processing', label: 'Processing', count: counts.processing, badge: 'bg-indigo-100 text-indigo-800' },
    { key: 'shipped', label: 'Shipped', count: counts.shipped, badge: 'bg-purple-100 text-purple-800' },
    { key: 'delivered', label: 'Delivered', count: counts.delivered, badge: 'bg-emerald-100 text-emerald-800' },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, badge: 'bg-rose-100 text-rose-800' },
    { key: 'pos', label: 'POS Sales', count: counts.pos || 0, badge: 'bg-blue-100 text-blue-800' },
    { key: 'returns', label: 'Returns & Replacements', count: counts.returns !== undefined ? counts.returns : '...', badge: 'bg-rose-100 text-rose-800' },
  ];

  const hasActiveFilters = 
    filters.statusTab !== 'all' ||
    Boolean(filters.searchQuery.trim()) ||
    filters.dateFilter !== 'all' ||
    (filters.paymentMethodFilter && filters.paymentMethodFilter !== 'all') ||
    filters.paymentFilter !== 'all' ||
    filters.shippingFilter !== 'all' ||
    filters.amountFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Top row: Search and Status Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search order #, customer name, email, phone, city..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Clear Filters Button if any filter applied */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors shrink-0"
          >
            <RotateCcw size={13} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Primary Simple Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = filters.statusTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange({ ...filters, statusTab: tab.key })}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : tab.badge || 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Structured Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 bg-white border border-slate-200 rounded-xl">
        {/* Date Filter */}
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={filters.dateFilter}
            onChange={(e) => onChange({ ...filters, dateFilter: e.target.value as OrderFilterState['dateFilter'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center gap-1.5">
          <CreditCard size={14} className="text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={filters.paymentMethodFilter || 'all'}
            onChange={(e) => onChange({ ...filters, paymentMethodFilter: e.target.value as any })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash (Counter)</option>
            <option value="upi">UPI / QR Code</option>
            <option value="card">Card (POS / Gateway)</option>
            <option value="razorpay">Online (Razorpay)</option>
            <option value="cod">Cash on Delivery (COD)</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="flex items-center gap-1.5">
          <DollarSign size={14} className="text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={filters.paymentFilter}
            onChange={(e) => onChange({ ...filters, paymentFilter: e.target.value as OrderFilterState['paymentFilter'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="captured">Paid / Completed</option>
            <option value="pending">Pending Payment</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Shipping Status Filter */}
        <div className="flex items-center gap-1.5">
          <Truck size={14} className="text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={filters.shippingFilter}
            onChange={(e) => onChange({ ...filters, shippingFilter: e.target.value as OrderFilterState['shippingFilter'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">All Fulfillment</option>
            <option value="not_shipped">Pending Dispatch</option>
            <option value="dispatched">Dispatched / In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered / Handed Over</option>
          </select>
        </div>

        {/* Amount Filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={filters.amountFilter}
            onChange={(e) => onChange({ ...filters, amountFilter: e.target.value as OrderFilterState['amountFilter'] })}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="all">Any Amount</option>
            <option value="under_1000">Under ₹1,000</option>
            <option value="1000_10000">₹1,000 - ₹10,000</option>
            <option value="10000_50000">₹10,000 - ₹50,000</option>
            <option value="above_50000">Above ₹50,000</option>
          </select>
        </div>
      </div>
    </div>
  );
}
