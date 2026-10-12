import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  Coins,
  CreditCard,
  Gift,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Copy,
  AlertCircle
} from 'lucide-react';
import {
  LoyaltyAccount,
  LoyaltyTier,
  RewardItem,
  LoyaltyTransaction,
  StoreCredit,
  GiftCard
} from '../types';

export function LoyaltyRewards() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'rewards' | 'tiers' | 'credit' | 'giftcards' | 'history'>('rewards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [storeCredit, setStoreCredit] = useState<StoreCredit | null>(null);
  const [myGiftCards, setMyGiftCards] = useState<GiftCard[]>([]);

  // Gift Card Purchase State
  const [gcAmount, setGcAmount] = useState(500);
  const [gcRecipientName, setGcRecipientName] = useState('');
  const [gcRecipientEmail, setGcRecipientEmail] = useState('');
  const [gcMessage, setGcMessage] = useState('');
  const [purchasingGc, setPurchasingGc] = useState(false);

  // Gift Card Validation Check
  const [checkGcCode, setCheckGcCode] = useState('');
  const [checkGcResult, setCheckGcResult] = useState<any | null>(null);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const userId = user.uid || user.email;
      const [resAccount, resTiers, resRewards, resGc] = await Promise.all([
        fetch(`/api/loyalty/account?userId=${encodeURIComponent(userId!)}`).then(r => r.json()),
        fetch('/api/loyalty/tiers').then(r => r.json()),
        fetch('/api/loyalty/rewards').then(r => r.json()),
        fetch(`/api/gift-cards/my-cards?userId=${encodeURIComponent(userId!)}`).then(r => r.json())
      ]);

      if (resAccount.account) setAccount(resAccount.account);
      if (resAccount.transactions) setTransactions(resAccount.transactions);
      if (resAccount.storeCredit) setStoreCredit(resAccount.storeCredit);
      if (Array.isArray(resTiers)) setTiers(resTiers);
      if (Array.isArray(resRewards)) setRewards(resRewards);
      if (Array.isArray(resGc)) setMyGiftCards(resGc);
    } catch (err: any) {
      setError('Failed to load loyalty account details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleRedeemReward = async (rewardId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const userId = user.uid || user.email;
      const res = await fetch('/api/loyalty/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rewardId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'Reward redeemed successfully!');
        fetchUserData();
      } else {
        setError(data.error || 'Failed to redeem reward');
      }
    } catch (err: any) {
      setError(err.message || 'Error redeeming reward');
    }
  };

  const handlePurchaseGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchasingGc(true);
    setError('');
    setSuccessMsg('');
    try {
      const userId = user.uid || user.email;
      const res = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaserUserId: userId,
          initialValue: gcAmount,
          recipientEmail: gcRecipientEmail,
          recipientName: gcRecipientName,
          personalMessage: gcMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Gift Card code ${data.giftCard.code} generated successfully!`);
        setGcRecipientName('');
        setGcRecipientEmail('');
        setGcMessage('');
        fetchUserData();
      } else {
        setError(data.error || 'Failed to purchase gift card');
      }
    } catch (err: any) {
      setError(err.message || 'Error purchasing gift card');
    } finally {
      setPurchasingGc(false);
    }
  };

  const handleValidateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkGcCode.trim()) return;
    try {
      const res = await fetch('/api/gift-cards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: checkGcCode.trim().toUpperCase() })
      });
      const data = await res.json();
      setCheckGcResult(data);
    } catch (err: any) {
      setCheckGcResult({ valid: false, error: 'Failed to validate code' });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 pt-4 pb-16 max-w-4xl text-center">
        <Coins size={48} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Join Electro Club Loyalty & Rewards</h2>
        <p className="text-slate-600 mb-6">Sign in or create an account to start earning points on every order, tier perks, and store credit.</p>
        <Link to="/login?redirect=/rewards" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors inline-block">
          Sign In to View Rewards
        </Link>
      </div>
    );
  }

  // Calculate tier progress
  const currentTierObj = tiers.find(t => t.name.toLowerCase() === (account?.currentTier || 'bronze').toLowerCase()) || tiers[0];
  const currentTierIdx = tiers.findIndex(t => t.id === currentTierObj?.id);
  const nextTierObj = tiers[currentTierIdx + 1] || null;

  let progressPercent = 100;
  let pointsNeeded = 0;

  if (nextTierObj && account) {
    const currentMin = currentTierObj ? currentTierObj.minimumPoints : 0;
    const nextMin = nextTierObj.minimumPoints;
    const currentEarned = account.lifetimeEarnedPoints;
    pointsNeeded = Math.max(0, nextMin - currentEarned);

    const range = nextMin - currentMin;
    const achieved = currentEarned - currentMin;
    progressPercent = range > 0 ? Math.min(100, Math.max(0, Math.round((achieved / range) * 100))) : 100;
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-4 pb-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl space-y-6">
        
        {/* Customer Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Award size={220} />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 border border-amber-400/30 mb-2">
                  <Sparkles size={14} /> Electro Rewards Member
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome back, {user.displayName || 'Rewards VIP'}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  Earn points on every purchase, unlock higher tier multipliers, and redeem for store credit.
                </p>
              </div>

              {/* Tier Badge */}
              <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 flex items-center gap-3 shrink-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-inner"
                  style={{ backgroundColor: currentTierObj?.badgeColor || '#3B82F6' }}
                >
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Loyalty Tier</p>
                  <p className="text-lg font-black text-white">{account?.currentTier || 'Bronze'}</p>
                  <p className="text-[11px] text-amber-400 font-medium">
                    {account?.multiplier || 1.0}x Points Multiplier
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Coins size={14} className="text-amber-400" /> Available Points
                </p>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {(account?.availablePoints || 0).toLocaleString()} <span className="text-xs font-normal text-slate-300">pts</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Worth ₹{Math.floor((account?.availablePoints || 0) / 10)} discount
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={14} className="text-emerald-400" /> Store Credit Balance
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  ₹{(storeCredit?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Auto-applied at checkout</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={14} className="text-blue-400" /> Lifetime Earned
                </p>
                <p className="text-2xl font-black text-white mt-1">
                  {(account?.lifetimeEarnedPoints || 0).toLocaleString()} <span className="text-xs font-normal text-slate-300">pts</span>
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-indigo-400" /> Redeemed Points
                </p>
                <p className="text-2xl font-black text-slate-200 mt-1">
                  {(account?.redeemedPoints || 0).toLocaleString()} <span className="text-xs font-normal text-slate-300">pts</span>
                </p>
              </div>
            </div>

            {/* Next Tier Progress Bar */}
            {nextTierObj && (
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1">
                    Progress to <span className="text-amber-400">{nextTierObj.name} Tier</span> ({nextTierObj.multiplier}x Multiplier)
                  </span>
                  <span className="text-amber-300">{Number(pointsNeeded || 0).toLocaleString()} pts remaining</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notifications / Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex flex-wrap gap-2 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'rewards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift size={16} /> Redeem Rewards Catalog
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tiers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award size={16} /> Tier Perks & Benefits
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'credit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard size={16} /> Store Credit Wallet
          </button>
          <button
            onClick={() => setActiveTab('giftcards')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'giftcards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Gift size={16} /> Digital Gift Cards
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={16} /> Points History
          </button>
        </div>

        {/* TAB 1: REWARDS CATALOG */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Available Rewards & Vouchers</h3>
                <p className="text-xs text-slate-500">Exchange your points for instant discount coupons or direct store credit.</p>
              </div>
              <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-2">
                <Coins size={18} className="text-amber-600" />
                <span>Your Available Balance: {(account?.availablePoints || 0).toLocaleString()} Points</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map(reward => {
                const canAfford = (account?.availablePoints || 0) >= reward.pointsRequired;
                return (
                  <div key={reward.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {reward.rewardType === 'store_credit' ? 'Store Credit' : 'Discount Voucher'}
                        </span>
                        <span className="text-xl font-black text-amber-600 flex items-center gap-1">
                          <Coins size={18} /> {reward.pointsRequired} pts
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{reward.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{reward.description}</p>
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-semibold border border-slate-100">
                        Value: ₹{reward.cashValue} Off Order Total
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        disabled={!canAfford}
                        onClick={() => handleRedeemReward(reward.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? (
                          <>
                            <Sparkles size={14} /> Redeem for {reward.pointsRequired} Points
                          </>
                        ) : (
                          `Need ${(reward.pointsRequired - (account?.availablePoints || 0)).toLocaleString()} more pts`
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: TIER PERKS */}
        {activeTab === 'tiers' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Loyalty Tier Hierarchy & Multipliers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map(tier => {
                const isCurrent = (account?.currentTier || 'bronze').toLowerCase() === tier.name.toLowerCase();
                return (
                  <div
                    key={tier.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isCurrent
                        ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black text-white"
                        style={{ backgroundColor: tier.badgeColor }}
                      >
                        {tier.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">
                          Your Tier
                        </span>
                      )}
                    </div>

                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {Number(tier.minimumPoints || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">pts</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-4">{tier.multiplier}x Multiplier on orders</p>

                    <div className="space-y-1.5 border-t border-slate-200/80 pt-3 text-xs">
                      {(tier.perks || []).map((perk, i) => (
                        <p key={i} className="text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {perk}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: STORE CREDIT */}
        {activeTab === 'credit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Store Credit Balance</h3>
                <p className="text-xs text-slate-500">Store credit is automatically deducted from cart totals during checkout.</p>
              </div>

              <div className="bg-emerald-50 text-emerald-800 px-5 py-3 rounded-2xl border border-emerald-200 text-right">
                <p className="text-[10px] uppercase font-bold text-emerald-600">Available Wallet Balance</p>
                <p className="text-2xl font-black text-emerald-700">
                  ₹{(storeCredit?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
              <p className="font-bold text-slate-900 mb-1">How Store Credit Works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Store credit is issued for processed product returns, order refunds, and loyalty reward redemptions.</li>
                <li>Store credit never expires and can be combined with discount coupons and gift cards at checkout.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL GIFT CARDS */}
        {activeTab === 'giftcards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Gift Card Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="text-indigo-600" size={20} /> Purchase Digital Gift Card
              </h3>
              <p className="text-xs text-slate-500">Send an instant digital gift card to friends or family.</p>

              <form onSubmit={handlePurchaseGiftCard} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Gift Amount (₹)</label>
                  <div className="flex gap-2">
                    {[250, 500, 1000, 2500, 5000].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setGcAmount(amt)}
                        className={`flex-1 py-2 rounded-xl font-bold border ${
                          gcAmount === amt
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={gcRecipientName}
                    onChange={e => setGcRecipientName(e.target.value)}
                    placeholder="Enter recipient name"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    value={gcRecipientEmail}
                    onChange={e => setGcRecipientEmail(e.target.value)}
                    placeholder="Enter recipient email address"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Personal Message</label>
                  <textarea
                    rows={2}
                    value={gcMessage}
                    onChange={e => setGcMessage(e.target.value)}
                    placeholder="Enter personal message (optional)"
                    className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={purchasingGc}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Gift size={16} /> Purchase Gift Card (₹{gcAmount})
                </button>
              </form>
            </div>

            {/* Check Code / Purchased Gift Cards List */}
            <div className="space-y-6">
              {/* Gift Card Validator */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Validate Gift Card Code</h3>
                <form onSubmit={handleValidateGiftCard} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 12-character Code"
                    value={checkGcCode}
                    onChange={e => setCheckGcCode(e.target.value)}
                    className="flex-1 uppercase font-mono border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Validate
                  </button>
                </form>

                {checkGcResult && (
                  <div className={`p-3 rounded-xl text-xs ${
                    checkGcResult.valid ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {checkGcResult.valid ? (
                      <p>✅ Valid Code! Remaining Balance: <strong>₹{checkGcResult.card.remainingBalance}</strong></p>
                    ) : (
                      <p>❌ {checkGcResult.error || 'Invalid or expired code.'}</p>
                    )}
                  </div>
                )}
              </div>

              {/* My Purchased Gift Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Your Issued & Purchased Gift Cards</h3>
                {myGiftCards.length === 0 ? (
                  <p className="text-xs text-slate-500">No gift cards purchased yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myGiftCards.map(gc => (
                      <div key={gc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-mono font-bold text-indigo-600 text-sm">{gc.code}</p>
                          <p className="text-slate-500">To: {gc.recipientName || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600 text-sm">₹{gc.remainingBalance}</p>
                          <p className="text-[10px] text-slate-400">Initial: ₹{gc.initialValue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: POINTS HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Points Activity Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Points Delta</th>
                    <th className="p-3">Balance After</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-bold uppercase text-[10px] text-slate-500">{tx.type}</td>
                      <td className={`p-3 font-bold ${tx.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{tx.balanceAfter} pts</td>
                      <td className="p-3 text-slate-600 max-w-sm truncate">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
