import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Minus,
  Search,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Filter,
  ShieldAlert,
  Calendar,
  User,
  FileText,
  DollarSign,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';
import { StoreCredit, StoreCreditTransaction } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export interface StoreCreditManagerProps {
  onViewOrder?: (orderId: string) => void;
  onViewCustomer?: (customerId: string) => void;
}

// Safe JSON response parser that handles non-JSON / error pages gracefully
async function parseJsonResponse(res: Response, defaultError: string) {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!res.ok) {
    if (isJson) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `${defaultError} (${res.status})`);
    }
    const text = await res.text().catch(() => '');
    throw new Error(text && text.length < 200 && !text.includes('<') ? text : `${defaultError} (Status ${res.status})`);
  }
  if (isJson) {
    return await res.json();
  }
  throw new Error('Invalid server response: Expected JSON format');
}

export const StoreCreditManager: React.FC<StoreCreditManagerProps> = ({
  onViewOrder,
  onViewCustomer
}) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<StoreCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'zero'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'activity_desc' | 'name_asc'>('balance_desc');

  // Manual Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<StoreCredit | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReasonType, setAdjustReasonType] = useState<string>('Goodwill Gesture');
  const [adjustCustomReason, setAdjustCustomReason] = useState<string>('');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [adjustOrderId, setAdjustOrderId] = useState<string>('');
  const [adjustReturnId, setAdjustReturnId] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState<StoreCredit | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<StoreCreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');

  // Fetch all store credit accounts
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/store-credit/accounts');
      const data = await parseJsonResponse(res, 'Failed to fetch store credit accounts');
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching store credit accounts:', err);
      setError(err?.message || 'Could not load store credit accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filtered & Sorted Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Search
      const search = searchTerm.toLowerCase();
      const displayName = acc.userName || acc.customerName || '';
      const displayEmail = acc.userEmail || acc.customerEmail || '';
      const matchSearch =
        !search ||
        acc.userId.toLowerCase().includes(search) ||
        displayName.toLowerCase().includes(search) ||
        displayEmail.toLowerCase().includes(search);

      if (!matchSearch) return false;

      const bal = acc.availableCredit !== undefined ? acc.availableCredit : (acc.balance || 0);

      // Balance filter
      if (balanceFilter === 'positive' && bal <= 0) return false;
      if (balanceFilter === 'zero' && bal > 0) return false;

      // Status filter
      if (statusFilter !== 'all' && acc.status !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      const balA = a.availableCredit !== undefined ? a.availableCredit : (a.balance || 0);
      const balB = b.availableCredit !== undefined ? b.availableCredit : (b.balance || 0);
      if (sortBy === 'balance_desc') return balB - balA;
      if (sortBy === 'activity_desc') {
        const dateA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : (a.lastActivity ? new Date(a.lastActivity).getTime() : 0);
        const dateB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : (b.lastActivity ? new Date(b.lastActivity).getTime() : 0);
        return dateB - dateA;
      }
      if (sortBy === 'name_asc') {
        const nameA = a.userName || a.customerName || a.userEmail || a.customerEmail || a.userId;
        const nameB = b.userName || b.customerName || b.userEmail || b.customerEmail || b.userId;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  }, [accounts, searchTerm, balanceFilter, statusFilter, sortBy]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalOutstanding = 0;
    let customersWithBalance = 0;
    let totalCreditedLifetime = 0;
    let totalUsedLifetime = 0;

    accounts.forEach(acc => {
      const balance = acc.availableCredit !== undefined ? acc.availableCredit : (acc.balance || 0);
      totalOutstanding += balance;
      if (balance > 0) customersWithBalance++;
      totalCreditedLifetime += acc.totalCredited || 0;
      totalUsedLifetime += acc.totalUsed || 0;
    });

    return {
      totalOutstanding,
      customersWithBalance,
      totalCreditedLifetime,
      totalUsedLifetime,
      totalAccounts: accounts.length
    };
  }, [accounts]);

  // Handle open adjust modal
  const handleOpenAdjustModal = (account: StoreCredit, defaultType: 'credit' | 'debit' = 'credit') => {
    setAdjustTargetUser(account);
    setAdjustType(defaultType);
    setAdjustAmount('');
    setAdjustReasonType(defaultType === 'credit' ? 'Goodwill Gesture' : 'Billing Correction');
    setAdjustCustomReason('');
    setAdjustNote('');
    setAdjustOrderId('');
    setAdjustReturnId('');
    setShowAdjustModal(true);
  };

  // Submit manual adjustment
  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) return;

    const numAmount = parseFloat(adjustAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    const currentBal = adjustTargetUser.availableCredit || 0;
    if (adjustType === 'debit' && numAmount > currentBal) {
      alert(`Cannot deduct ₹${numAmount.toLocaleString('en-IN')}. Maximum available balance is ₹${currentBal.toLocaleString('en-IN')}.`);
      return;
    }

    const finalReason = adjustReasonType === 'Other'
      ? (adjustCustomReason.trim() || 'Manual store credit adjustment')
      : (adjustCustomReason.trim() ? `${adjustReasonType}: ${adjustCustomReason.trim()}` : adjustReasonType);

    setIsSubmittingAdjust(true);
    try {
      const endpoint = '/api/admin/store-credit/adjust';
      const body = {
        userId: adjustTargetUser.userId,
        userEmail: adjustTargetUser.userEmail || '',
        userName: adjustTargetUser.userName || '',
        amount: adjustType === 'credit' ? numAmount : -numAmount,
        reason: finalReason,
        note: adjustNote.trim() || undefined,
        relatedOrderId: adjustOrderId.trim() || undefined,
        relatedReturnId: adjustReturnId.trim() || undefined,
        adminEmail: user?.email || 'admin'
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await parseJsonResponse(res, 'Failed to adjust store credit');

      setSuccessMsg(
        `Successfully ${adjustType === 'credit' ? 'credited' : 'deducted'} ₹${numAmount.toLocaleString('en-IN')} for ${adjustTargetUser.userName || adjustTargetUser.userEmail || adjustTargetUser.userId}. New Balance: ₹${(data.newBalance ?? (currentBal + (adjustType === 'credit' ? numAmount : -numAmount))).toLocaleString('en-IN')}`
      );
      setShowAdjustModal(false);
      await fetchAccounts();
    } catch (err: any) {
      console.error('Error submitting adjustment:', err);
      alert(err?.message || 'Failed to apply store credit adjustment');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Toggle account status (active vs suspended)
  const handleToggleStatus = async (account: StoreCredit) => {
    const newStatus = account.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'suspend' : 'reactivate';
    if (!confirm(`Are you sure you want to ${actionLabel} store credit for ${account.userName || account.userEmail || account.userId}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/store-credit/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.userId,
          status: newStatus,
          adminEmail: user?.email || 'admin'
        })
      });
      await parseJsonResponse(res, 'Failed to update status');

      setSuccessMsg(`Store credit account for ${account.userName || account.userEmail || account.userId} is now ${newStatus}.`);
      await fetchAccounts();
    } catch (err: any) {
      alert(err?.message || 'Failed to update store credit account status');
    }
  };

  // View history
  const handleOpenHistory = async (account: StoreCredit) => {
    setSelectedAccountForHistory(account);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setHistoryFilterType('all');
    try {
      const res = await fetch(`/api/admin/store-credit/transactions?userId=${encodeURIComponent(account.userId)}`);
      const data = await parseJsonResponse(res, 'Failed to load transaction history');
      setHistoryTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading history:', err);
      alert(err?.message || 'Failed to fetch transaction history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredHistoryTransactions = useMemo(() => {
    if (historyFilterType === 'all') return historyTransactions;
    return historyTransactions.filter(tx => tx.type === historyFilterType);
  }, [historyTransactions, historyFilterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-900 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Liability</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Wallet size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(stats.totalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total unredeemed credit across customer wallets
          </p>
        </div>

        {/* Customers with Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Wallets</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <User size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {stats.customersWithBalance}
            <span className="text-xs font-normal text-slate-500 ml-1.5">/ {stats.totalAccounts} customers</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {stats.totalAccounts > 0 ? Math.round((stats.customersWithBalance / stats.totalAccounts) * 100) : 0}% of accounts hold store credit
          </p>
        </div>

        {/* Total Credited Lifetime */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Credited</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">
            ₹{Number(stats.totalCreditedLifetime || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Issued via refunds, goodwill & promotions
          </p>
        </div>

        {/* Total Used Lifetime */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Redeemed</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mt-2">
            ₹{Number(stats.totalUsedLifetime || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Redeemed at online checkout & counter POS
          </p>
        </div>
      </div>

      {/* SEARCH, FILTER & ACTION TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by customer name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Balance filter */}
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">All Balances</option>
              <option value="positive">Balance &gt; ₹0 Only</option>
              <option value="zero">Zero Balance</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="balance_desc">Sort: Highest Credit First</option>
              <option value="activity_desc">Sort: Recent Activity</option>
              <option value="name_asc">Sort: Customer Name (A-Z)</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchAccounts}
              disabled={loading}
              title="Refresh ledger"
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ACCOUNTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && accounts.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading store credit records...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving customer wallets and ledger balances</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-3">
              <Wallet size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-900">No store credit accounts found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || balanceFilter !== 'all' || statusFilter !== 'all'
                ? 'No customer accounts match your active search filters.'
                : 'Customer store credit will automatically appear here when issued via returns, refunds, or manual adjustments.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Available Credit</th>
                  <th className="py-3 px-4 text-right">Total Credited</th>
                  <th className="py-3 px-4 text-right">Total Used</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAccounts.map((acc) => {
                  const hasBalance = (acc.availableCredit || 0) > 0;
                  const isSuspended = acc.status === 'suspended';

                  return (
                    <tr
                      key={acc.id || acc.userId}
                      className="hover:bg-purple-50/20 transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs shrink-0">
                            {(acc.userName || acc.userEmail || acc.userId || 'C')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {acc.userName || 'Customer'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {acc.userEmail || acc.userId}
                            </p>
                            <span className="inline-block font-mono text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                              ID: {acc.userId.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Available Credit */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-block text-right">
                          <span
                            className={`text-sm font-black ${
                              hasBalance ? 'text-purple-700' : 'text-slate-400'
                            }`}
                          >
                            ₹{(acc.availableCredit || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                          {hasBalance && (
                            <span className="block text-[10px] font-bold text-emerald-600">
                              Active Balance
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Credited */}
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                        ₹{(acc.totalCredited || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* Total Used */}
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        ₹{(acc.totalUsed || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4">
                        {acc.lastActivityAt ? (
                          <div>
                            <p className="font-medium text-slate-700">
                              {new Date(acc.lastActivityAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(acc.lastActivityAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No activity</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuspended ? 'bg-rose-600' : 'bg-emerald-600'
                            }`}
                          />
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Credit */}
                          <button
                            onClick={() => handleOpenAdjustModal(acc, 'credit')}
                            title="Add Store Credit"
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>

                          {/* Deduct Credit */}
                          <button
                            onClick={() => handleOpenAdjustModal(acc, 'debit')}
                            disabled={!hasBalance}
                            title="Deduct Store Credit"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={13} />
                            <span>Deduct</span>
                          </button>

                          {/* View History */}
                          <button
                            onClick={() => handleOpenHistory(acc)}
                            title="View Full Ledger History"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <History size={16} />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(acc)}
                            title={isSuspended ? 'Reactivate wallet' : 'Suspend wallet'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSuspended
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                          >
                            {isSuspended ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: MANUAL ADJUSTMENT MODAL */}
      {showAdjustModal && adjustTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Manual Store Credit Adjustment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target: <strong className="text-slate-700">{adjustTargetUser.userName || adjustTargetUser.userEmail || adjustTargetUser.userId}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance Ribbon */}
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Current Available Balance:</span>
                <span className="ml-1.5 font-black text-purple-900 text-sm">
                  ₹{(adjustTargetUser.availableCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-purple-200/60 text-purple-900 px-2 py-0.5 rounded">
                Verified Ledger
              </span>
            </div>

            {/* Adjustment Form */}
            <form onSubmit={handleSubmitAdjustment} className="space-y-4 text-xs">
              {/* Adjustment Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      adjustType === 'credit'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Plus size={14} /> Add Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      adjustType === 'debit'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Minus size={14} /> Deduct Credit (-)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount in Indian Rupees (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Reason Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Standard Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={adjustReasonType}
                  onChange={(e) => setAdjustReasonType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="Goodwill Gesture">Goodwill Gesture / Customer Satisfaction</option>
                  <option value="Promotional Incentive">Promotional Campaign / Special Offer</option>
                  <option value="Return / Refund Adjustment">Return / Exchange Balance Adjustment</option>
                  <option value="Billing Correction">Billing Error Correction</option>
                  <option value="VIP Customer Perk">VIP Customer Reward Perk</option>
                  <option value="System Reconciliation">System Audit / Balance Reconciliation</option>
                  <option value="Other">Other (Custom Reason)</option>
                </select>
              </div>

              {/* Custom Reason / Details */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compensating for delivery delay on Order #EST-9921"
                  value={adjustCustomReason}
                  onChange={(e) => setAdjustCustomReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Optional Internal Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Internal Staff Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional internal context for other administrators..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Optional Order / Return link */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Related Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ord_12345"
                    value={adjustOrderId}
                    onChange={(e) => setAdjustOrderId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Related Return ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ret_67890"
                    value={adjustReturnId}
                    onChange={(e) => setAdjustReturnId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Projected Balance Preview */}
              {adjustAmount && !isNaN(parseFloat(adjustAmount)) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Previous Balance:</span>
                    <span>₹{(adjustTargetUser.availableCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Adjustment ({adjustType === 'credit' ? '+' : '-'}):</span>
                    <span className={adjustType === 'credit' ? 'text-purple-600' : 'text-rose-600'}>
                      {adjustType === 'credit' ? '+' : '-'}₹{parseFloat(adjustAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-black text-slate-900">
                    <span>Projected New Balance:</span>
                    <span className="text-purple-700">
                      ₹{Math.max(
                        0,
                        (adjustTargetUser.availableCredit || 0) +
                          (adjustType === 'credit' ? parseFloat(adjustAmount) : -parseFloat(adjustAmount))
                      ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Audit Notice */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-900 text-[11px]">
                <ShieldAlert size={14} className="shrink-0 mt-0.5 text-blue-600" />
                <p>
                  This manual adjustment will create an immutable transaction entry in both the store credit ledger and payment audit logs attributed to <strong>{user?.email || 'Admin'}</strong>.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  disabled={isSubmittingAdjust}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingAdjust ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Recording Ledger...</span>
                    </>
                  ) : (
                    <span>Confirm Adjustment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSACTION HISTORY MODAL */}
      {showHistoryModal && selectedAccountForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Store Credit Ledger History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Account: <strong className="text-slate-800">{selectedAccountForHistory.userName || selectedAccountForHistory.userEmail || selectedAccountForHistory.userId}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance Summary Card */}
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-bold text-slate-500">Current Available Balance</p>
                <p className="text-2xl font-black text-purple-900">
                  ₹{(selectedAccountForHistory.availableCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-500">Lifetime Credited: <strong className="text-emerald-700">₹{(selectedAccountForHistory.totalCredited || 0).toLocaleString('en-IN')}</strong></p>
                <p className="text-slate-500">Lifetime Redeemed: <strong className="text-slate-800">₹{(selectedAccountForHistory.totalUsed || 0).toLocaleString('en-IN')}</strong></p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 text-xs font-bold">
              <button
                onClick={() => setHistoryFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  historyFilterType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Entries ({historyTransactions.length})
              </button>
              <button
                onClick={() => setHistoryFilterType('refund_credit')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  historyFilterType === 'refund_credit'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Refund Credits
              </button>
              <button
                onClick={() => setHistoryFilterType('manual_credit')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  historyFilterType === 'manual_credit'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Manual Adjustments
              </button>
              <button
                onClick={() => setHistoryFilterType('checkout_debit')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  historyFilterType === 'checkout_debit'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Checkout Redemptions
              </button>
            </div>

            {/* Ledger Records Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              {loadingHistory ? (
                <div className="p-10 text-center">
                  <RefreshCw size={24} className="animate-spin text-purple-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Loading ledger records...</p>
                </div>
              ) : filteredHistoryTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No transaction records found matching this filter.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Adjustment</th>
                      <th className="py-2.5 px-3 text-right">Balance After</th>
                      <th className="py-2.5 px-3">Reason & Note</th>
                      <th className="py-2.5 px-3">Staff / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistoryTransactions.map((tx) => {
                      const isCredit = (tx.amount || 0) > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          {/* Date */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                tx.type.includes('credit')
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {tx.type.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={`font-black ${
                                isCredit ? 'text-purple-600' : 'text-rose-600'
                              }`}
                            >
                              {isCredit ? '+' : ''}₹{Math.abs(tx.amount || 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                              })}
                            </span>
                          </td>

                          {/* Balance After */}
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800 whitespace-nowrap">
                            ₹{(tx.balanceAfter || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2
                            })}
                          </td>

                          {/* Reason & Note */}
                          <td className="py-2.5 px-3 max-w-xs">
                            <p className="font-semibold text-slate-800 leading-snug">
                              {tx.reason || 'Store credit update'}
                            </p>
                            {tx.note && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">
                                Note: {tx.note}
                              </p>
                            )}
                          </td>

                          {/* Staff / Reference */}
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {tx.adminEmail && (
                              <p className="font-medium text-slate-700 truncate max-w-[130px]" title={tx.adminEmail}>
                                {tx.adminEmail}
                              </p>
                            )}
                            {tx.relatedOrderId && (
                              <span className="font-mono text-[10px] text-blue-600 block">
                                Ord: {tx.relatedOrderId}
                              </span>
                            )}
                            {tx.relatedReturnId && (
                              <span className="font-mono text-[10px] text-purple-600 block">
                                Ret: {tx.relatedReturnId}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
