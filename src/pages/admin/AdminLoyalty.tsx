import React, { useState, useEffect } from 'react';
import {
  Award,
  Coins,
  CreditCard,
  Gift,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2,
  RefreshCw,
  Sparkles,
  Calendar,
  Percent,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import {
  LoyaltyAccount,
  LoyaltySettings,
  LoyaltyTier,
  RewardItem,
  GiftCard,
  LoyaltyCampaign,
  LoyaltyOverviewMetrics,
  LoyaltyTransaction,
  StoreCreditTransaction
} from '../../types';
import { GiftCardsManager } from './customers/GiftCardsManager';

export interface AdminLoyaltyProps {
  initialSubTab?: 'overview' | 'settings' | 'tiers' | 'rewards' | 'customers' | 'giftcards' | 'campaigns' | string;
}

export function AdminLoyalty({ initialSubTab }: AdminLoyaltyProps = {}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'tiers' | 'rewards' | 'customers' | 'giftcards' | 'campaigns'>(
    (initialSubTab as any) || 'overview'
  );

  useEffect(() => {
    if (initialSubTab && ['overview', 'settings', 'tiers', 'rewards', 'customers', 'giftcards', 'campaigns'].includes(initialSubTab)) {
      setActiveTab(initialSubTab as any);
    }
  }, [initialSubTab]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data States
  const [metrics, setMetrics] = useState<LoyaltyOverviewMetrics | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [customers, setCustomers] = useState<LoyaltyAccount[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([]);

  // Search & Filter
  const [searchCustomer, setSearchCustomer] = useState('');

  // Modals
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
  const [selectedUserForPoints, setSelectedUserForPoints] = useState<string>('');
  const [adjustPointsVal, setAdjustPointsVal] = useState<number>(0);
  const [adjustPointsReason, setAdjustPointsReason] = useState<string>('');

  const [showAdjustCreditModal, setShowAdjustCreditModal] = useState(false);
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<string>('');
  const [adjustCreditVal, setAdjustCreditVal] = useState<number>(0);
  const [adjustCreditReason, setAdjustCreditReason] = useState<string>('');

  const [showIssueGiftCardModal, setShowIssueGiftCardModal] = useState(false);
  const [issueGcValue, setIssueGcValue] = useState<number>(500);
  const [issueGcEmail, setIssueGcEmail] = useState<string>('');
  const [issueGcName, setIssueGcName] = useState<string>('');
  const [issueGcNote, setIssueGcNote] = useState<string>('');

  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Partial<RewardItem>>({
    name: '',
    description: '',
    pointsRequired: 500,
    rewardType: 'discount',
    cashValue: 50,
    status: 'active'
  });

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<LoyaltyCampaign>>({
    name: '',
    description: '',
    multiplier: 2.0,
    bonusPoints: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        resMetrics,
        resSettings,
        resTiers,
        resRewards,
        resCustomers,
        resTx,
        resGc,
        resCamp
      ] = await Promise.all([
        fetch('/api/admin/loyalty/overview').then(r => r.json()),
        fetch('/api/loyalty/settings').then(r => r.json()),
        fetch('/api/loyalty/tiers').then(r => r.json()),
        fetch('/api/loyalty/rewards').then(r => r.json()),
        fetch('/api/admin/loyalty/customers').then(r => r.json()),
        fetch('/api/admin/loyalty/transactions').then(r => r.json()),
        fetch('/api/admin/gift-cards').then(r => r.json()),
        fetch('/api/admin/loyalty/campaigns').then(r => r.json())
      ]);

      if (resMetrics) setMetrics(resMetrics);
      if (resSettings) setSettings(resSettings);
      if (Array.isArray(resTiers)) setTiers(resTiers);
      if (Array.isArray(resRewards)) setRewards(resRewards);
      if (Array.isArray(resCustomers)) setCustomers(resCustomers);
      if (Array.isArray(resTx)) setTransactions(resTx);
      if (Array.isArray(resGc)) setGiftCards(resGc);
      if (Array.isArray(resCamp)) setCampaigns(resCamp);
    } catch (err: any) {
      setError('Failed to load loyalty administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/loyalty/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Loyalty program settings updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.error || 'Failed to update settings');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    }
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPoints || !adjustPointsVal || !adjustPointsReason) {
      alert('Please fill in user ID, non-zero points adjustment, and audit reason.');
      return;
    }
    try {
      const res = await fetch('/api/admin/loyalty/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForPoints,
          points: adjustPointsVal,
          reason: adjustPointsReason,
          adminEmail: 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully adjusted ${adjustPointsVal > 0 ? '+' : ''}${adjustPointsVal} points.`);
        setShowAdjustPointsModal(false);
        setAdjustPointsVal(0);
        setAdjustPointsReason('');
        fetchData();
      } else {
        alert(data.error || 'Failed to adjust points');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting point adjustment');
    }
  };

  const handleAdjustCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCredit || !adjustCreditVal || !adjustCreditReason) {
      alert('Please fill in user ID, non-zero credit amount, and audit reason.');
      return;
    }
    try {
      const res = await fetch('/api/admin/store-credit/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForCredit,
          amount: adjustCreditVal,
          reason: adjustCreditReason,
          adminEmail: 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully adjusted ₹${adjustCreditVal.toFixed(2)} store credit.`);
        setShowAdjustCreditModal(false);
        setAdjustCreditVal(0);
        setAdjustCreditReason('');
        fetchData();
      } else {
        alert(data.error || 'Failed to adjust store credit');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting store credit adjustment');
    }
  };

  const handleIssueGiftCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issueGcValue < 50) {
      alert('Gift card value must be at least ₹50');
      return;
    }
    try {
      const res = await fetch('/api/admin/gift-cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialValue: issueGcValue,
          recipientEmail: issueGcEmail,
          recipientName: issueGcName,
          note: issueGcNote,
          adminEmail: 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Gift Card ${data.giftCard.code} issued successfully!`);
        setShowIssueGiftCardModal(false);
        setIssueGcValue(500);
        setIssueGcEmail('');
        setIssueGcName('');
        setIssueGcNote('');
        fetchData();
      } else {
        alert(data.error || 'Failed to issue gift card');
      }
    } catch (err: any) {
      alert(err.message || 'Error issuing gift card');
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/loyalty/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReward)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Reward catalog item saved successfully.');
        setShowRewardModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to save reward');
      }
    } catch (err: any) {
      alert('Error saving reward item');
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/loyalty/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCampaign)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Bonus point campaign saved successfully.');
        setShowCampaignModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to save campaign');
      }
    } catch (err: any) {
      alert('Error saving campaign');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.userId.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.currentTier.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Coins className="text-amber-400" size={28} /> Customer Loyalty & Rewards Center
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Manage customer rewards, tier multipliers, immutable points ledgers, store credit balances, and digital gift cards with automated server-side fraud prevention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setShowAdjustPointsModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Coins size={16} /> Adjust Points
          </button>
          <button
            onClick={() => setShowAdjustCreditModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <CreditCard size={16} /> Adjust Store Credit
          </button>
          <button
            onClick={() => setShowIssueGiftCardModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Gift size={16} /> Issue Gift Card
          </button>
          <button
            onClick={fetchData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm px-4 pt-2">
        <nav className="flex flex-wrap gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp size={16} /> Overview KPIs
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings size={16} /> Program Rules
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'tiers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award size={16} /> Loyalty Tiers
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'rewards'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift size={16} /> Rewards Catalog
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} /> Customers & Ledger
          </button>
          <button
            onClick={() => setActiveTab('giftcards')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'giftcards'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard size={16} /> Digital Gift Cards
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'campaigns'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag size={16} /> Bonus Campaigns
          </button>
        </nav>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Coins size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding Points</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  {(metrics?.outstandingPoints || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">pts</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Issued: {(metrics?.pointsIssued || 0).toLocaleString()} | Redeemed: {(metrics?.pointsRedeemed || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Store Credit Reserve</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{(metrics?.storeCreditBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Available across customer wallets</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Gift size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Gift Cards Sold</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  ₹{(metrics?.giftCardValueSold || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Redeemed: ₹{(metrics?.giftCardValueRedeemed || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Loyalty Members</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                  {metrics?.totalMembers || 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {metrics?.activeMembers || 0} active point holders
                </p>
              </div>
            </div>
          </div>

          {/* Quick System Integrity Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={20} /> Security & Ledger Rules Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Server-Only Point Adjustments</p>
                <p className="text-slate-600">Client-side mutation of loyalty points, tier multiplier, or store credit is strictly restricted. All mutations execute via server admin transactions.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Immutable Ledger Audit Trail</p>
                <p className="text-slate-600">All earning, redemption, order reversals, and manual adjustments append permanent, non-deletable transaction records with user and order references.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 mb-1">Proportional Order Refunds</p>
                <p className="text-slate-600">When orders are refunded via Admin Payments, earned loyalty points are automatically reversed proportionally and store credit options are made available.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM RULES & SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Loyalty Program Configuration</h3>
              <p className="text-xs text-slate-500">Define conversion ratios, minimum redemptions, and feature toggles.</p>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Save Configuration
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Points Earned per ₹100 Spent</label>
              <input
                type="number"
                value={settings.pointsPerHundredSpent ?? 1}
                onChange={e => setSettings({ ...settings, pointsPerHundredSpent: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Base rate before tier multiplier (e.g. 1 point per ₹100)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Points Equivalent to ₹1 Discount</label>
              <input
                type="number"
                value={settings.pointsPerRupee ?? 10}
                onChange={e => setSettings({ ...settings, pointsPerRupee: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">E.g. 10 points = ₹1 discount</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Points to Redeem</label>
              <input
                type="number"
                value={settings.minimumPointsToRedeem ?? 100}
                onChange={e => setSettings({ ...settings, minimumPointsToRedeem: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Minimum points required before redemption at checkout</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Points Allowed per Order</label>
              <input
                type="number"
                value={settings.maximumPointsPerOrder ?? 5000}
                onChange={e => setSettings({ ...settings, maximumPointsPerOrder: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Redemption % of Subtotal</label>
              <input
                type="number"
                value={settings.maximumRedemptionPercentage}
                onChange={e => setSettings({ ...settings, maximumRedemptionPercentage: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Caps point discount percentage (e.g. max 50% of cart)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Point Expiry (Days)</label>
              <input
                type="number"
                value={settings.pointExpiryDays}
                onChange={e => setSettings({ ...settings, pointExpiryDays: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Set to 0 for points that never expire</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Welcome Signup Bonus Points</label>
              <input
                type="number"
                value={settings.welcomeBonusPoints}
                onChange={e => setSettings({ ...settings, welcomeBonusPoints: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.loyaltyEnabled}
                onChange={e => setSettings({ ...settings, loyaltyEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Loyalty Program</p>
                <p className="text-[11px] text-slate-500">Allow customers to earn & redeem points</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.storeCreditEnabled}
                onChange={e => setSettings({ ...settings, storeCreditEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Store Credit</p>
                <p className="text-[11px] text-slate-500">Allow wallet store credit refunds & usages</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.giftCardsEnabled}
                onChange={e => setSettings({ ...settings, giftCardsEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Digital Gift Cards</p>
                <p className="text-[11px] text-slate-500">Allow purchase & checkout redemptions</p>
              </div>
            </label>
          </div>
        </form>
      )}

      {/* TAB 3: LOYALTY TIERS */}
      {activeTab === 'tiers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Loyalty Tier Hierarchy</h3>
              <p className="text-xs text-slate-500">Customers advance tiers based on lifetime points earned.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map(tier => (
              <div key={tier.id} className="border border-slate-200 rounded-2xl p-5 relative bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black text-white"
                      style={{ backgroundColor: tier.badgeColor }}
                    >
                      {tier.name}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{tier.multiplier}x Multiplier</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 mb-1">
                    {Number(tier.minimumPoints || 0).toLocaleString()} <span className="text-xs font-medium text-slate-500">pts</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-4">Minimum lifetime points threshold</p>

                  <div className="space-y-1.5 border-t border-slate-200 pt-3">
                    <p className="text-xs font-bold text-slate-700">Perks:</p>
                    {(tier.perks || []).map((perk, idx) => (
                      <p key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {perk}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Rewards Catalog</h3>
              <p className="text-xs text-slate-500">Items customers can redeem using accumulated points.</p>
            </div>
            <button
              onClick={() => {
                setEditingReward({
                  name: '',
                  description: '',
                  pointsRequired: 500,
                  rewardType: 'discount',
                  cashValue: 50,
                  status: 'active'
                });
                setShowRewardModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Reward
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {item.rewardType}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-xl font-black text-amber-600">{item.pointsRequired} pts</span>
                    <span className="text-xs text-slate-500">(Value: ₹{item.cashValue})</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                  <span>Redeemed: {item.redeemedCount || 0} times</span>
                  <button
                    onClick={() => {
                      setEditingReward(item);
                      setShowRewardModal(true);
                    }}
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER ACCOUNTS & POINTS LEDGER */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Customer Loyalty Accounts & Ledger</h3>
              <p className="text-xs text-slate-500">View balances, tiers, and issue manual adjustments.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search user ID or tier..."
                value={searchCustomer}
                onChange={e => setSearchCustomer(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Current Tier</th>
                  <th className="p-3">Available Points</th>
                  <th className="p-3">Lifetime Earned</th>
                  <th className="p-3">Redeemed</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{cust.userId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-blue-600">
                        {cust.currentTier}
                      </span>
                    </td>
                    <td className="p-3 font-black text-amber-600">{Number(cust.availablePoints || 0).toLocaleString()} pts</td>
                    <td className="p-3 font-semibold text-slate-700">{Number(cust.lifetimeEarnedPoints || 0).toLocaleString()} pts</td>
                    <td className="p-3 text-slate-500">{Number(cust.redeemedPoints || 0).toLocaleString()} pts</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUserForPoints(cust.userId);
                          setShowAdjustPointsModal(true);
                        }}
                        className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                      >
                        Adjust Points
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUserForCredit(cust.userId);
                          setShowAdjustCreditModal(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                      >
                        Adjust Credit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Points Ledger */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Recent Immutable Points Transactions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">User ID</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Points</th>
                    <th className="p-2.5">Balance After</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 15).map(tx => (
                    <tr key={tx.id}>
                      <td className="p-2.5 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="p-2.5 font-medium text-slate-800">{tx.userId}</td>
                      <td className="p-2.5 uppercase text-[10px] font-bold text-slate-500">{tx.type}</td>
                      <td className={`p-2.5 font-bold ${tx.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                      </td>
                      <td className="p-2.5 text-slate-700 font-semibold">{tx.balanceAfter} pts</td>
                      <td className="p-2.5 text-slate-600 max-w-xs truncate">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DIGITAL GIFT CARDS */}
      {activeTab === 'giftcards' && (
        <GiftCardsManager />
      )}

      {/* TAB 7: BONUS CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Promotional Bonus Campaigns</h3>
              <p className="text-xs text-slate-500">Run double points weekends, category bonuses, and flash events.</p>
            </div>
            <button
              onClick={() => {
                setEditingCampaign({
                  name: '',
                  description: '',
                  multiplier: 2.0,
                  bonusPoints: 0,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  isActive: true
                });
                setShowCampaignModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus size={16} /> Create Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    camp.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {camp.isActive ? 'Active' : 'Disabled'}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {camp.multiplier}x Points
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{camp.name}</h4>
                <p className="text-xs text-slate-600 mt-1">{camp.description}</p>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                  <span>
                    <Calendar size={12} className="inline mr-1" /> {camp.startDate} to {camp.endDate}
                  </span>
                  <button
                    onClick={() => {
                      setEditingCampaign(camp);
                      setShowCampaignModal(true);
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: MANUAL POINTS ADJUSTMENT */}
      {showAdjustPointsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Manual Points Adjustment</h3>
            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Customer User ID</label>
                <input
                  type="text"
                  required
                  value={selectedUserForPoints}
                  onChange={e => setSelectedUserForPoints(e.target.value)}
                  placeholder="Enter user ID or email"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Points Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustPointsVal}
                  onChange={e => setAdjustPointsVal(Number(e.target.value))}
                  placeholder="Enter points adjustment"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">Use positive numbers to award, negative to deduct.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Audit Reason</label>
                <textarea
                  required
                  rows={2}
                  value={adjustPointsReason}
                  onChange={e => setAdjustPointsReason(e.target.value)}
                  placeholder="Enter reason for adjustment"
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustPointsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL STORE CREDIT ADJUSTMENT */}
      {showAdjustCreditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Manual Store Credit Adjustment</h3>
            <form onSubmit={handleAdjustCreditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Customer User ID</label>
                <input
                  type="text"
                  required
                  value={selectedUserForCredit}
                  onChange={e => setSelectedUserForCredit(e.target.value)}
                  placeholder="Enter user ID or email"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount in ₹ (+ or -)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustCreditVal}
                  onChange={e => setAdjustCreditVal(Number(e.target.value))}
                  placeholder="Enter credit amount"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Audit Reason</label>
                <textarea
                  required
                  rows={2}
                  value={adjustCreditReason}
                  onChange={e => setAdjustCreditReason(e.target.value)}
                  placeholder="Enter reason for store credit adjustment"
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustCreditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE PROMO GIFT CARD */}
      {showIssueGiftCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Issue Promotional Gift Card</h3>
            <form onSubmit={handleIssueGiftCardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Value (₹)</label>
                <input
                  type="number"
                  required
                  value={issueGcValue}
                  onChange={e => setIssueGcValue(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={issueGcName}
                  onChange={e => setIssueGcName(e.target.value)}
                  placeholder="Enter recipient name"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={issueGcEmail}
                  onChange={e => setIssueGcEmail(e.target.value)}
                  placeholder="Enter recipient email"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Note / Message</label>
                <input
                  type="text"
                  value={issueGcNote}
                  onChange={e => setIssueGcNote(e.target.value)}
                  placeholder="Enter admin note or message"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueGiftCardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Issue Gift Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT REWARD ITEM */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingReward.id ? 'Edit Reward Item' : 'Add New Reward Item'}
            </h3>
            <form onSubmit={handleSaveReward} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reward Name</label>
                <input
                  type="text"
                  required
                  value={editingReward.name}
                  onChange={e => setEditingReward({ ...editingReward, name: e.target.value })}
                  placeholder="Enter reward name"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingReward.description}
                  onChange={e => setEditingReward({ ...editingReward, description: e.target.value })}
                  placeholder="Enter reward description"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Points Required</label>
                  <input
                    type="number"
                    required
                    value={editingReward.pointsRequired}
                    onChange={e => setEditingReward({ ...editingReward, pointsRequired: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cash Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingReward.cashValue}
                    onChange={e => setEditingReward({ ...editingReward, cashValue: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reward Type</label>
                <select
                  value={editingReward.rewardType}
                  onChange={e => setEditingReward({ ...editingReward, rewardType: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="discount">Discount Coupon</option>
                  <option value="store_credit">Direct Store Credit</option>
                  <option value="coupon">Custom Coupon Code</option>
                  <option value="free_product">Free Gift Item</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CAMPAIGN */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCampaign.id ? 'Edit Bonus Campaign' : 'Create Bonus Campaign'}
            </h3>
            <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={editingCampaign.name}
                  onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                  placeholder="Enter campaign name"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Point Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingCampaign.multiplier}
                    onChange={e => setEditingCampaign({ ...editingCampaign, multiplier: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bonus Points</label>
                  <input
                    type="number"
                    value={editingCampaign.bonusPoints}
                    onChange={e => setEditingCampaign({ ...editingCampaign, bonusPoints: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editingCampaign.startDate}
                    onChange={e => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editingCampaign.endDate}
                    onChange={e => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCampaign.isActive}
                  onChange={e => setEditingCampaign({ ...editingCampaign, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-bold text-slate-800">Campaign Active</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
