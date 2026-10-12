import React, { useState, useEffect, useMemo } from 'react';
import {
  Gift,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  History,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Lock,
  Unlock,
  Ban,
  User,
  CreditCard,
  Edit2,
  Send,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { GiftCard, GiftCardTransaction } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export interface GiftCardsManagerProps {
  onViewOrder?: (orderId: string) => void;
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

export const GiftCardsManager: React.FC<GiftCardsManagerProps> = ({ onViewOrder }) => {
  const { user } = useAuth();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'partially_used' | 'fully_used' | 'expired' | 'disabled'>('all');
  const [unmaskedCardIds, setUnmaskedCardIds] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Issue New Card Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueValue, setIssueValue] = useState<number>(1000);
  const [customValue, setCustomValue] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('Store Administration');
  const [personalMessage, setPersonalMessage] = useState<string>('');
  const [expiryMonths, setExpiryMonths] = useState<number>(12);
  const [neverExpires, setNeverExpires] = useState<boolean>(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Adjust Balance Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedCardForAdjust, setSelectedCardForAdjust] = useState<GiftCard | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Customer compensation');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Card Ledger / Transactions Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCardForHistory, setSelectedCardForHistory] = useState<GiftCard | null>(null);
  const [cardTransactions, setCardTransactions] = useState<GiftCardTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch gift cards
  const fetchGiftCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/gift-cards');
      const data = await parseJsonResponse(res, 'Failed to fetch gift cards');
      setCards(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching gift cards:', err);
      setError(err?.message || 'Could not load gift cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftCards();
  }, []);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        c.code.toLowerCase().includes(search) ||
        (c.recipientName && c.recipientName.toLowerCase().includes(search)) ||
        (c.recipientEmail && c.recipientEmail.toLowerCase().includes(search)) ||
        (c.id && c.id.toLowerCase().includes(search));

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const isExpired = c.expiryDate && new Date(c.expiryDate).getTime() < Date.now();
        if (statusFilter === 'expired') {
          return isExpired || c.status === 'expired';
        }
        if (c.status !== statusFilter) return false;
      }

      return true;
    });
  }, [cards, searchTerm, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalActive = 0;
    let totalLiability = 0;
    let totalIssuedValue = 0;
    let totalRedeemedValue = 0;

    cards.forEach(c => {
      const remaining = c.remainingBalance || 0;
      const initial = c.initialValue || 0;
      const isExpired = c.expiryDate && new Date(c.expiryDate).getTime() < Date.now();

      totalIssuedValue += initial;
      if (c.status === 'active' || c.status === 'partially_used') {
        if (!isExpired) {
          totalActive++;
          totalLiability += remaining;
        }
      }
      totalRedeemedValue += Math.max(0, initial - remaining);
    });

    return {
      totalCards: cards.length,
      totalActive,
      totalLiability,
      totalIssuedValue,
      totalRedeemedValue
    };
  }, [cards]);

  // Toggle Mask / Unmask
  const toggleMask = (cardId: string) => {
    setUnmaskedCardIds(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Copy Code
  const handleCopyCode = (cardId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(cardId);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Helper: Mask code (e.g. EST-••••-4921)
  const formatCardCode = (code: string, isUnmasked: boolean) => {
    if (isUnmasked) return code;
    if (code.length <= 4) return code;
    const parts = code.split('-');
    if (parts.length >= 3) {
      return `${parts[0]}-••••-${parts[parts.length - 1]}`;
    }
    return `${code.slice(0, 4)}••••${code.slice(-4)}`;
  };

  // Open Issue Modal
  const handleOpenIssue = () => {
    setIssueValue(1000);
    setCustomValue('');
    setCustomCode('');
    setRecipientName('');
    setRecipientEmail('');
    setSenderName(user?.displayName || 'Store Administration');
    setPersonalMessage('');
    setExpiryMonths(12);
    setNeverExpires(false);
    setShowIssueModal(true);
  };

  // Submit Issue Gift Card
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customValue ? parseFloat(customValue) : issueValue;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Please select or enter a valid gift card amount.');
      return;
    }

    setIsSubmittingIssue(true);
    try {
      let expDate: string | undefined = undefined;
      if (!neverExpires && expiryMonths > 0) {
        const d = new Date();
        d.setMonth(d.getMonth() + expiryMonths);
        expDate = d.toISOString();
      }

      const res = await fetch('/api/admin/gift-cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialValue: finalAmount,
          customCode: customCode.trim() || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          recipientName: recipientName.trim() || undefined,
          personalMessage: personalMessage.trim() || undefined,
          expiryDate: expDate,
          adminEmail: user?.email || 'admin'
        })
      });

      const data = await parseJsonResponse(res, 'Failed to issue gift card');

      setSuccessMsg(`Successfully issued Gift Card ${data.code} for ₹${finalAmount.toLocaleString('en-IN')}!`);
      setShowIssueModal(false);
      await fetchGiftCards();
    } catch (err: any) {
      alert(err?.message || 'Error issuing gift card');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Toggle Card Status (disable / enable / cancel)
  const handleUpdateStatus = async (card: GiftCard, newStatus: 'active' | 'disabled' | 'cancelled') => {
    const actionName = newStatus === 'active' ? 'enable' : newStatus === 'cancelled' ? 'cancel' : 'disable';
    if (!confirm(`Are you sure you want to ${actionName} gift card ${card.code}?`)) return;

    try {
      const res = await fetch('/api/admin/gift-cards/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          status: newStatus,
          adminEmail: user?.email || 'admin'
        })
      });
      await parseJsonResponse(res, 'Failed to update card status');

      setSuccessMsg(`Gift Card ${card.code} status updated to ${newStatus}.`);
      await fetchGiftCards();
    } catch (err: any) {
      alert(err?.message || 'Error updating card status');
    }
  };

  // Open Adjust Balance Modal
  const handleOpenAdjust = (card: GiftCard) => {
    setSelectedCardForAdjust(card);
    setAdjustAmount('');
    setAdjustReason('Promotional bonus');
    setShowAdjustModal(true);
  };

  // Submit Balance Adjustment
  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForAdjust) return;

    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum === 0) {
      alert('Please enter a valid positive or negative adjustment amount.');
      return;
    }

    if (amountNum < 0 && Math.abs(amountNum) > (selectedCardForAdjust.remainingBalance || 0)) {
      alert(`Cannot deduct ₹${Math.abs(amountNum)}. Remaining balance is ₹${selectedCardForAdjust.remainingBalance}.`);
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const res = await fetch('/api/admin/gift-cards/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: selectedCardForAdjust.id,
          amount: amountNum,
          reason: adjustReason.trim() || 'Manual balance adjustment',
          adminEmail: user?.email || 'admin'
        })
      });

      const data = await parseJsonResponse(res, 'Failed to adjust balance');

      setSuccessMsg(`Card ${selectedCardForAdjust.code} balance updated to ₹${data.newBalance}.`);
      setShowAdjustModal(false);
      await fetchGiftCards();
    } catch (err: any) {
      alert(err?.message || 'Error adjusting card balance');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Open Card History / Transactions
  const handleOpenHistory = async (card: GiftCard) => {
    setSelectedCardForHistory(card);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/gift-cards/transactions?cardId=${encodeURIComponent(card.id)}`);
      const data = await parseJsonResponse(res, 'Failed to load card ledger');
      setCardTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      alert(err?.message || 'Error loading card history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Alert Notices */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg">
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
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Cards */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Gift Cards</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Gift size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalActive}
            <span className="text-xs font-normal text-slate-500 ml-1.5">/ {stats.totalCards} total</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Available for online and POS redemption</p>
        </div>

        {/* Total Outstanding Liability */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining Balance</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-purple-700 mt-2">
            ₹{Number(stats.totalLiability || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Current unredeemed merchant balance</p>
        </div>

        {/* Total Issued Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Issued</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(stats.totalIssuedValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Total face value issued since inception</p>
        </div>

        {/* Total Redeemed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Redeemed</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={18} />
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2">
            ₹{Number(stats.totalRedeemedValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {stats.totalIssuedValue > 0 ? Math.round((stats.totalRedeemedValue / stats.totalIssuedValue) * 100) : 0}% redemption rate
          </p>
        </div>
      </div>

      {/* ACTION & TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by card code, recipient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter & Issue Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Card Statuses</option>
              <option value="active">Active</option>
              <option value="partially_used">Partially Used</option>
              <option value="fully_used">Fully Redeemed</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled / Cancelled</option>
            </select>

            <button
              onClick={fetchGiftCards}
              disabled={loading}
              title="Refresh cards"
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleOpenIssue}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>Issue Gift Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* GIFT CARDS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && cards.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Loading gift cards...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-3">
              <Gift size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-900">No gift cards found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Issue promotional or custom digital gift cards to delight customers and drive store loyalty.
            </p>
            <button
              onClick={handleOpenIssue}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Issue First Gift Card
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Card Code</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4 text-right">Initial Value</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCards.map((card) => {
                  const isUnmasked = Boolean(unmaskedCardIds[card.id]);
                  const isCopied = copiedCodeId === card.id;
                  const isExpired = card.expiryDate && new Date(card.expiryDate).getTime() < Date.now();
                  const effectiveStatus = isExpired && card.status === 'active' ? 'expired' : card.status;

                  return (
                    <tr key={card.id} className="hover:bg-indigo-50/20 transition-colors group">
                      {/* Code with Mask Toggle & Copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 text-xs tracking-wider">
                            {formatCardCode(card.code, isUnmasked)}
                          </span>
                          <button
                            onClick={() => toggleMask(card.id)}
                            title={isUnmasked ? 'Mask code' : 'Unmask full code'}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          >
                            {isUnmasked ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => handleCopyCode(card.id, card.code)}
                            title="Copy code"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          >
                            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        {card.recipientName || card.recipientEmail ? (
                          <div>
                            <p className="font-bold text-slate-900">{card.recipientName || 'Gift Recipient'}</p>
                            <p className="text-[11px] text-slate-500">{card.recipientEmail || 'No email'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Promotional / Open Card</span>
                        )}
                      </td>

                      {/* Initial Value */}
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        ₹{(card.initialValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-black text-sm ${card.remainingBalance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          ₹{(card.remainingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4">
                        {card.expiryDate ? (
                          <div>
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {new Date(card.expiryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            {isExpired && (
                              <span className="block text-[10px] text-rose-500 font-bold">Expired</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">No Expiry</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            effectiveStatus === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : effectiveStatus === 'partially_used'
                              ? 'bg-blue-100 text-blue-800'
                              : effectiveStatus === 'fully_used'
                              ? 'bg-slate-200 text-slate-600'
                              : effectiveStatus === 'expired'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {effectiveStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ledger */}
                          <button
                            onClick={() => handleOpenHistory(card)}
                            title="View Card History / Redemptions"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <History size={15} />
                          </button>

                          {/* Adjust Balance */}
                          <button
                            onClick={() => handleOpenAdjust(card)}
                            title="Adjust Card Balance"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Enable/Disable/Cancel */}
                          {card.status === 'disabled' || card.status === 'cancelled' ? (
                            <button
                              onClick={() => handleUpdateStatus(card, 'active')}
                              title="Reactivate Gift Card"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Unlock size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(card, 'disabled')}
                              title="Disable Gift Card"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Lock size={15} />
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
        )}
      </div>

      {/* MODAL 1: ISSUE GIFT CARD MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Gift size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Issue New Gift Card</h3>
                  <p className="text-xs text-slate-500">Create promotional or customer digital gift cards</p>
                </div>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-4 text-xs">
              {/* Value Preset Pills */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Card Amount (₹)</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[500, 1000, 2500, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setIssueValue(amt);
                        setCustomValue('');
                      }}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                        issueValue === amt && !customValue
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount in ₹..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Custom Code (Optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custom Code (Optional — leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP-BONUS-2026"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    placeholder="Enter recipient email address"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Expiry Settings */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Validity / Expiry</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-indigo-600 font-bold">
                    <input
                      type="checkbox"
                      checked={neverExpires}
                      onChange={(e) => setNeverExpires(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Never Expires</span>
                  </label>
                </div>
                {!neverExpires && (
                  <select
                    value={expiryMonths}
                    onChange={(e) => setExpiryMonths(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value={1}>Valid for 1 Month</option>
                    <option value={3}>Valid for 3 Months</option>
                    <option value={6}>Valid for 6 Months</option>
                    <option value={12}>Valid for 1 Year (Standard)</option>
                    <option value={24}>Valid for 2 Years</option>
                  </select>
                )}
              </div>

              {/* Optional Note / Message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Personal Message / Note</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Congratulations on reaching Gold Tier!"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIssue}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingIssue ? 'Issuing Card...' : 'Issue Gift Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST BALANCE MODAL */}
      {showAdjustModal && selectedCardForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Adjust Gift Card Balance</h3>
              <button onClick={() => setShowAdjustModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs space-y-1">
              <p className="font-mono font-bold text-indigo-900">{selectedCardForAdjust.code}</p>
              <div className="flex justify-between text-slate-600">
                <span>Current Remaining Balance:</span>
                <span className="font-bold text-slate-900">₹{selectedCardForAdjust.remainingBalance}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adjustment Amount in ₹ (+ to add, - to deduct)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500 or -200"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Promotional goodwill bonus"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Updating...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CARD TRANSACTION HISTORY */}
      {showHistoryModal && selectedCardForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">Card Ledger & Redemptions</h3>
                <p className="text-xs font-mono text-indigo-700 font-bold">{selectedCardForHistory.code}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              {loadingHistory ? (
                <div className="p-8 text-center">
                  <RefreshCw size={20} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Loading card ledger...</p>
                </div>
              ) : cardTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No redemptions or adjustments recorded yet for this card.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance After</th>
                      <th className="py-2.5 px-3">Reference / Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cardTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-900 whitespace-nowrap">
                          ₹{tx.balanceAfter}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {tx.orderId ? `Order: ${tx.orderId}` : tx.note || 'Adjustment'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
