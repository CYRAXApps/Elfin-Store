import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  Eye, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  CreditCard,
  Copy,
  Trash2
} from 'lucide-react';
import { CustomerData } from './CustomerDetailsModal';
import { 
  formatCurrency, 
  formatDate, 
  getWhatsAppUrl, 
  getCallUrl, 
  getEmailUrl 
} from './customerUtils';

interface CustomerListProps {
  customers: CustomerData[];
  loading: boolean;
  onSelectCustomer: (customer: CustomerData) => void;
  onViewOrders: (email: string) => void;
  onToggleStatus: (customerId: string, currentDisabled: boolean) => Promise<void>;
  onAddCustomer?: () => void;
  onDeleteCustomer?: (customerId: string) => Promise<void>;
  onRemoveAllCustomers?: () => Promise<void>;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading,
  onSelectCustomer,
  onViewOrders,
  onToggleStatus,
  onAddCustomer,
  onDeleteCustomer,
  onRemoveAllCustomers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [spendingFilter, setSpendingFilter] = useState<'all' | 'with_orders' | 'high_value' | 'no_orders'>('all');
  const [sortBy, setSortBy] = useState<'joined_desc' | 'spent_desc' | 'spent_asc' | 'orders_desc' | 'credit_desc' | 'name_asc'>('joined_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, spendingFilter, sortBy, itemsPerPage]);

  // Filter and sort
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Search term: name, mobile, email, or id
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').toLowerCase().includes(q);
        const matchesId = (c.id || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) return false;
      }

      // Status filter
      const isDisabled = c.disabled || c.status === 'disabled';
      if (statusFilter === 'active' && isDisabled) return false;
      if (statusFilter === 'disabled' && !isDisabled) return false;

      // Spending filter
      if (spendingFilter === 'with_orders' && c.totalOrders === 0) return false;
      if (spendingFilter === 'high_value' && c.totalSpent < 10000) return false;
      if (spendingFilter === 'no_orders' && c.totalOrders > 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'spent_desc') return b.totalSpent - a.totalSpent;
      if (sortBy === 'spent_asc') return a.totalSpent - b.totalSpent;
      if (sortBy === 'orders_desc') return b.totalOrders - a.totalOrders;
      if (sortBy === 'credit_desc') return (b.storeCredit || 0) - (a.storeCredit || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      // joined_desc
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [customers, searchTerm, statusFilter, spendingFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const startItem = filteredCustomers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredCustomers.length);

  // Key KPI metrics
  const totalCount = customers.length;
  const activeCount = customers.filter(c => !c.disabled && c.status !== 'disabled').length;
  const customersWithOrders = customers.filter(c => c.totalOrders > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (spendingFilter !== 'all' ? 1 : 0);

  const handleRemoveAll = async () => {
    if (!onRemoveAllCustomers) return;
    try {
      setIsRemovingAll(true);
      await onRemoveAllCustomers();
      setConfirmRemoveAll(false);
    } catch (e: any) {
      alert(`Error removing customers: ${e?.message || 'Failed'}`);
    } finally {
      setIsRemovingAll(false);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, customerId: string) => {
    e.stopPropagation();
    if (!onDeleteCustomer) return;
    if (!window.confirm(`Are you sure you want to permanently remove this customer?`)) return;
    try {
      setDeletingCustomerId(customerId);
      await onDeleteCustomer(customerId);
    } catch (e: any) {
      alert(`Error deleting customer: ${e?.message || 'Failed'}`);
    } finally {
      setDeletingCustomerId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeCount} active</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Purchasing</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{customersWithOrders}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {totalCount > 0 ? `${Math.round((customersWithOrders / totalCount) * 100)}% conversion` : '0%'}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lifetime all orders</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Spending</span>
            <User className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">
            {customersWithOrders > 0 ? formatCurrency(totalRevenue / customersWithOrders) : '₹0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Per purchasing client</p>
        </div>
      </div>

      {/* Main Bar: [ Search customers ] [ Filter ] [ Add Customer ] */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input: Name, Mobile, Email */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="customer-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, mobile, email..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Toggle Button */}
            <div className="relative">
              <button
                id="customer-filter-toggle-btn"
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilterCount > 0 || showFilterDropdown
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Popover */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-20 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">Filter Customers</span>
                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Account Status
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['all', 'active', 'disabled'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize text-center transition-colors ${
                            statusFilter === st
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st === 'all' ? 'All' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spending Filter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Order History
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'with_orders', label: 'Has Orders' },
                        { id: 'high_value', label: 'High Value (₹10k+)' },
                        { id: 'no_orders', label: 'No Orders' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSpendingFilter(item.id as any)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-colors truncate ${
                            spendingFilter === item.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('all');
                        setSpendingFilter('all');
                      }}
                      className="w-full py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold text-center border-t border-slate-100 pt-2"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sort Selector */}
            <select
              id="customer-sort-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="joined_desc">Newest Customers</option>
              <option value="spent_desc">Highest Spending</option>
              <option value="orders_desc">Most Orders</option>
              <option value="credit_desc">Store Credit Balance</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>

            {/* [ Add Customer ] Button */}
            {onAddCustomer && (
              <button
                id="add-customer-btn"
                type="button"
                onClick={onAddCustomer}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </button>
            )}

            {/* [ Remove All Customers ] Button */}
            {customers.length > 0 && onRemoveAllCustomers && (
              <button
                id="remove-all-customers-btn"
                type="button"
                onClick={() => setConfirmRemoveAll(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Remove All Customers</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Active Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Active filters:</span>
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                Status: {statusFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
              </span>
            )}
            {spendingFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                Spending: {spendingFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSpendingFilter('all')} />
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSpendingFilter('all');
                setSearchTerm('');
              }}
              className="text-slate-500 hover:text-slate-800 text-[11px] underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Customers List Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading customer directory...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No customers found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || spendingFilter !== 'all'
              ? 'No registered customers match your selected search or filter criteria.'
              : 'Registered store customers will automatically appear here.'}
          </p>
          {(searchTerm || statusFilter !== 'all' || spendingFilter !== 'all') && (
            <button
              id="reset-customer-search-btn"
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSpendingFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on screens >= lg) */}
          {/* Columns: Customer (Name & Email) | Mobile | Firebase UID | Status | Orders | Total Spent | Store Credit | Action */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Mobile</th>
                    <th className="py-3.5 px-4">Firebase UID</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Orders</th>
                    <th className="py-3.5 px-4">Total Spent</th>
                    <th className="py-3.5 px-4">Store Credit</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedCustomers.map((customer) => {
                    const isDisabled = customer.disabled || customer.status === 'disabled';
                    const storeCreditBalance = customer.storeCredit || 0;

                    return (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => onSelectCustomer(customer)}
                      >
                        {/* 1. Customer Name & Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ${
                              isDisabled ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'
                            }`}>
                              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 truncate block">
                                {customer.name || 'Unnamed Customer'}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-slate-500 text-[11px] truncate">
                                  {customer.email || 'No email provided'}
                                </span>
                                {customer.emailVerified && (
                                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 shrink-0">
                                    Email Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Mobile */}
                        <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                          {customer.phone ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{customer.phone}</span>
                              </div>
                              {customer.phoneVerified !== false && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  Phone Verified
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* 3. Firebase UID (Permanent Identity) */}
                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200 text-slate-700 font-mono text-[11px]">
                            <span title={customer.id}>{customer.id.length > 16 ? `${customer.id.slice(0, 14)}...` : customer.id}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(customer.id);
                              }}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Copy permanent Firebase UID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 4. Status & Conflict */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              isDisabled 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {isDisabled ? 'Disabled' : 'Active'}
                            </span>

                            {customer.identityConflict && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                Identity Conflict
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Orders */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            customer.totalOrders > 0 
                              ? 'bg-slate-100 text-slate-800' 
                              : 'text-slate-400'
                          }`}>
                            {customer.totalOrders}
                          </span>
                        </td>

                        {/* 6. Total Spent */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-xs">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </td>

                        {/* 7. Store Credit */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs ${
                            storeCreditBalance > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'text-slate-500'
                          }`}>
                            <CreditCard className="w-3 h-3" />
                            <span>{formatCurrency(storeCreditBalance)}</span>
                          </span>
                        </td>

                        {/* 6. Last Order */}
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          {customer.lastOrderDate ? (
                            <div>
                              <p className="font-semibold text-slate-800">{formatDate(customer.lastOrderDate)}</p>
                              {customer.lastOrderNumber && (
                                <p className="text-slate-400 text-[11px]">#{customer.lastOrderNumber}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* 7. Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`view-customer-btn-${customer.id}`}
                              type="button"
                              onClick={() => onSelectCustomer(customer)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="View customer details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            {onDeleteCustomer && (
                              <button
                                id={`delete-customer-btn-${customer.id}`}
                                type="button"
                                disabled={deletingCustomerId === customer.id}
                                onClick={(e) => handleDeleteSingle(e, customer.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors inline-flex items-center cursor-pointer disabled:opacity-50"
                                title="Delete customer permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Visible on screens < lg) */}
          <div className="lg:hidden space-y-3">
            {paginatedCustomers.map((customer) => {
              const isDisabled = customer.disabled || customer.status === 'disabled';
              const storeCreditBalance = customer.storeCredit || 0;

              return (
                <div 
                  key={customer.id} 
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
                  onClick={() => onSelectCustomer(customer)}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ${
                        isDisabled ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white'
                      }`}>
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {customer.name || 'Unnamed Customer'}
                          </h4>
                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            isDisabled 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isDisabled ? 'Disabled' : 'Active'}
                          </span>

                          {customer.identityConflict && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                              Identity Conflict
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{customer.email || 'No email'}</p>
                          {customer.emailVerified && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 shrink-0">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer(customer);
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      {onDeleteCustomer && (
                        <button
                          type="button"
                          disabled={deletingCustomerId === customer.id}
                          onClick={(e) => handleDeleteSingle(e, customer.id)}
                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs disabled:opacity-50"
                          title="Delete customer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Firebase UID permanent identity pill */}
                  <div className="flex items-center justify-between px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-[11px] text-slate-600 font-mono" onClick={(e) => e.stopPropagation()}>
                    <span className="truncate">UID: {customer.id}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.id);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title="Copy UID"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Card Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Mobile</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {customer.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Orders</span>
                      <span className="font-bold text-slate-900">{customer.totalOrders}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Total Spent</span>
                      <span className="font-bold text-slate-900">{formatCurrency(customer.totalSpent)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Store Credit</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(storeCreditBalance)}</span>
                    </div>
                  </div>

                  {/* Last Order & Joined */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Last Order: {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'None'}</span>
                    {isDisabled && (
                      <span className="text-rose-600 font-bold">Account Disabled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{filteredCustomers.length}</strong> customers</span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1">
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-1 text-xs font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Remove All Customers Confirmation Modal */}
      {confirmRemoveAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Remove All Customers?</h3>
              <p className="text-xs text-slate-500">
                This will permanently delete all {customers.length} registered customer accounts and profiles from the database. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRemovingAll}
                onClick={() => setConfirmRemoveAll(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingAll}
                onClick={handleRemoveAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isRemovingAll ? 'Removing...' : 'Yes, Remove All Customers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
