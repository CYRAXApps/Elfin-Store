import { FieldValue, getDb } from './serverDb';

function getTargetDb(db: any): any {
  return (db && typeof db.collection === 'function') ? db : getDb();
}
import crypto from 'crypto';
import {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltySettings,
  LoyaltyTier,
  RewardItem,
  RewardRedemption,
  StoreCredit,
  StoreCreditTransaction,
  GiftCard,
  GiftCardTransaction,
  LoyaltyCampaign,
  LoyaltyOverviewMetrics
} from './src/types';

// Default Loyalty Settings
export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  pointsEarningEnabled: true,
  pointsPerRupeeSpent: 0.01, // 1 point for every ₹100 spent
  minOrderValueForPoints: 500,
  maxPointsPerOrder: 5000,
  pointsExpiryDays: 365,
  pointsRedemptionEnabled: true,
  pointsPerRupee: 10, // 10 points = ₹1 discount (0.10 ₹ per point)
  minimumPointsToRedeem: 100, // min 100 points (₹10 value)
  maximumPointsPerOrder: 20000, // max 20,000 points (₹2,000) per order
  maximumRedemptionPercentage: 25, // max 25% of order subtotal
  refundPointsDeductionPolicy: 'proportional',
  storeCreditEnabled: true,
  giftCardsEnabled: true
};

// Seed default tiers, rewards, campaigns, and settings if database is empty
export async function seedLoyaltyDataIfEmpty(db: any) {
  try {
    const targetDb = getTargetDb(db);

    // 1. Settings
    const settingsDoc = await targetDb.collection('settings').doc('loyalty').get();
    if (!settingsDoc.exists) {
      await targetDb.collection('settings').doc('loyalty').set(DEFAULT_LOYALTY_SETTINGS);
    }

    // 2. Tiers
    const tiersSnap = await targetDb.collection('loyaltyTiers').limit(1).get();
    if (tiersSnap.empty) {
      const defaultTiers: Partial<LoyaltyTier>[] = [
        {
          id: 'bronze',
          name: 'Bronze Member',
          minLifetimeSpend: 0,
          minLifetimePoints: 0,
          pointsMultiplier: 1.0,
          tierBenefits: ['Earn 1 point per ₹100', 'Birthday Bonus 100 pts', 'Standard Delivery'],
          status: 'active',
          sortOrder: 1,
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
        },
        {
          id: 'silver',
          name: 'Silver Elite',
          minLifetimeSpend: 15000,
          minLifetimePoints: 150,
          pointsMultiplier: 1.25,
          tierBenefits: ['1.25x Points Multiplier', '5% Off Coupon on Tier Up', 'Priority Customer Support'],
          status: 'active',
          sortOrder: 2,
          badgeColor: 'bg-slate-200 text-slate-800 border-slate-400'
        },
        {
          id: 'gold',
          name: 'Gold VIP',
          minLifetimeSpend: 50000,
          minLifetimePoints: 500,
          pointsMultiplier: 1.5,
          tierBenefits: ['1.5x Points Multiplier', 'Free Express Shipping', 'Early Access to Sales', '10% Off Annual Voucher'],
          status: 'active',
          sortOrder: 3,
          badgeColor: 'bg-amber-200 text-amber-900 border-amber-400'
        },
        {
          id: 'platinum',
          name: 'Platinum Titanium',
          minLifetimeSpend: 150000,
          minLifetimePoints: 1500,
          pointsMultiplier: 2.0,
          tierBenefits: ['2.0x Double Points', 'Complimentary Returns & Pickup', 'Personal Concierge Support', 'Exclusive Product Drop Access'],
          status: 'active',
          sortOrder: 4,
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
        }
      ];

      for (const tier of defaultTiers) {
        await targetDb.collection('loyaltyTiers').doc(tier.id!).set({
          ...tier,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 3. Rewards Catalog
    const rewardsSnap = await targetDb.collection('rewards').limit(1).get();
    if (rewardsSnap.empty) {
      const defaultRewards: Partial<RewardItem>[] = [
        {
          name: '₹100 Store Discount Voucher',
          description: 'Redeem 1,000 loyalty points for a ₹100 instant store discount voucher at checkout.',
          rewardType: 'discount',
          pointsRequired: 1000,
          cashValue: 100,
          redeemedCount: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: '₹500 Store Discount Voucher',
          description: 'Redeem 4,500 loyalty points (10% bonus value) for a ₹500 store voucher.',
          rewardType: 'discount',
          pointsRequired: 4500,
          cashValue: 500,
          redeemedCount: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: 'Free Premium Shipping Pass',
          description: 'Waive shipping fees on your next order regardless of cart subtotal.',
          rewardType: 'shipping_benefit',
          pointsRequired: 300,
          cashValue: 99,
          redeemedCount: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: 'Convert 2,000 Points to Store Credit',
          description: 'Add ₹200 directly into your ELECTRO STORE Credit balance for future orders.',
          rewardType: 'store_credit',
          pointsRequired: 2000,
          cashValue: 200,
          redeemedCount: 0,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const reward of defaultRewards) {
        const ref = targetDb.collection('rewards').doc();
        await ref.set({ id: ref.id, ...reward });
      }
    }

    // 4. Promotional Campaigns
    const campaignsSnap = await targetDb.collection('loyaltyCampaigns').limit(1).get();
    if (campaignsSnap.empty) {
      const defaultCampaigns: Partial<LoyaltyCampaign>[] = [
        {
          name: 'Festive Double Points Blast',
          description: 'Earn 2x loyalty points on all electronic purchases above ₹2,000.',
          type: 'points_multiplier',
          pointsMultiplier: 2.0,
          bonusPoints: 0,
          minimumOrderValue: 2000,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const camp of defaultCampaigns) {
        const ref = targetDb.collection('loyaltyCampaigns').doc();
        await ref.set({ id: ref.id, ...camp });
      }
    }
  } catch (err: any) {
    console.warn('[Loyalty] Notice during data seeding:', err?.message || err);
  }
}

// Helper: Fetch Loyalty Settings
export async function getLoyaltySettings(db: any): Promise<LoyaltySettings> {
  try {
    const targetDb = getTargetDb(db);
    const doc = await targetDb.collection('settings').doc('loyalty').get();
    if (doc.exists) {
      return { ...DEFAULT_LOYALTY_SETTINGS, ...doc.data() };
    }
  } catch (err: any) {
    console.warn('[Loyalty] Settings read fallback:', err?.message || err);
  }
  return DEFAULT_LOYALTY_SETTINGS;
}

// Helper: Save Loyalty Settings
export async function updateLoyaltySettings(db: any, settings: Partial<LoyaltySettings>) {
  const targetDb = getTargetDb(db);
  const merged = { ...DEFAULT_LOYALTY_SETTINGS, ...settings, updatedAt: new Date().toISOString() };
  await targetDb.collection('settings').doc('loyalty').set(merged, { merge: true });
  return merged;
}

// Helper: Get or Initialize Customer Loyalty Account
export async function getOrCreateLoyaltyAccount(db: any, userId: string, customerDetails?: { name?: string; email?: string }) {
  const targetDb = getTargetDb(db);

  const docRef = targetDb.collection('loyaltyAccounts').doc(userId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data();
    // Update name/email if provided and missing
    if (customerDetails && (customerDetails.name !== data.customerName || customerDetails.email !== data.customerEmail)) {
      await docRef.set({
        customerName: customerDetails.name || data.customerName || 'Customer',
        customerEmail: customerDetails.email || data.customerEmail || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    return { id: docSnap.id, ...data } as LoyaltyAccount;
  }

  // Create new account
  const newAccount: LoyaltyAccount = {
    id: userId,
    userId,
    customerName: customerDetails?.name || 'Customer',
    customerEmail: customerDetails?.email || '',
    availablePoints: 0,
    pendingPoints: 0,
    redeemedPoints: 0,
    expiredPoints: 0,
    lifetimeEarnedPoints: 0,
    lifetimeRedeemedPoints: 0,
    tierId: 'bronze',
    tierName: 'Bronze Member',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await docRef.set(newAccount);

  // Record welcome bonus transaction if configured
  await recordLoyaltyTransaction(targetDb, {
    userId,
    type: 'promotional_bonus',
    points: 50,
    balanceAfter: 50,
    description: 'Welcome Bonus Points for Joining ELECTRO STORE Loyalty',
    status: 'completed'
  });

  // Update account balance after welcome bonus
  await docRef.update({
    availablePoints: 50,
    lifetimeEarnedPoints: 50,
    updatedAt: new Date().toISOString()
  });

  newAccount.availablePoints = 50;
  newAccount.lifetimeEarnedPoints = 50;
  return newAccount;
}

// Helper: Record immutable loyalty transaction
export async function recordLoyaltyTransaction(
  db: any,
  data: {
    userId: string;
    orderId?: string;
    orderNumber?: string;
    type: LoyaltyTransaction['type'];
    points: number;
    balanceAfter: number;
    referenceId?: string;
    description: string;
    status?: 'completed' | 'pending' | 'cancelled';
    expiresAt?: string;
  }
) {
  const targetDb = getTargetDb(db);

  const txRef = targetDb.collection('loyaltyTransactions').doc();
  const txRecord: LoyaltyTransaction = {
    id: txRef.id,
    userId: data.userId,
    orderId: data.orderId || '',
    orderNumber: data.orderNumber || '',
    type: data.type,
    points: Math.round(data.points),
    balanceAfter: Math.round(data.balanceAfter),
    referenceId: data.referenceId || '',
    description: data.description,
    status: data.status || 'completed',
    expiresAt: data.expiresAt || null,
    createdAt: new Date().toISOString()
  };

  await txRef.set(txRecord);
  return txRecord;
}

// Helper: Evaluate and Update Loyalty Tier based on lifetime points/spend
export async function evaluateAndUpgradeTier(db: any, userId: string): Promise<{ previousTier: string; currentTier: string }> {
  const targetDb = getTargetDb(db);

  const accountRef = targetDb.collection('loyaltyAccounts').doc(userId);
  const accountSnap = await accountRef.get();
  if (!accountSnap.exists) return { previousTier: 'bronze', currentTier: 'bronze' };

  const account = accountSnap.data() as LoyaltyAccount;
  const previousTier = account.tierId || 'bronze';

  const tiersSnap = await targetDb.collection('loyaltyTiers').orderBy('sortOrder', 'asc').get();
  const tiers: LoyaltyTier[] = tiersSnap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyTier));

  let qualifiedTier = tiers.find(t => t.id === 'bronze') || tiers[0];

  // Find highest qualifying tier
  for (const tier of tiers) {
    if (tier.status === 'active') {
      if (account.lifetimeEarnedPoints >= tier.minLifetimePoints) {
        qualifiedTier = tier;
      }
    }
  }

  if (qualifiedTier && qualifiedTier.id !== previousTier) {
    await accountRef.update({
      tierId: qualifiedTier.id,
      tierName: qualifiedTier.name,
      updatedAt: new Date().toISOString()
    });

    return { previousTier, currentTier: qualifiedTier.id };
  }

  return { previousTier, currentTier: previousTier };
}

// Helper: Award Loyalty Points when an order payment is captured / order confirmed
export async function awardPointsForOrder(db: any, order: {
  id: string;
  invoiceNumber?: string;
  userId: string;
  grandTotal: number;
  subtotal: number;
  items?: any[];
}) {
  const targetDb = getTargetDb(db);

  const settings = await getLoyaltySettings(targetDb);
  if (!settings.pointsEarningEnabled) return { pointsEarned: 0 };

  // Check if points already awarded for this order
  const existingTx = await targetDb
    .collection('loyaltyTransactions')
    .where('orderId', '==', order.id)
    .where('type', '==', 'purchase_earned')
    .limit(1)
    .get();

  if (!existingTx.empty) {
    return { pointsEarned: existingTx.docs[0].data().points };
  }

  const amountForPoints = Math.max(0, order.subtotal || order.grandTotal || 0);
  if (amountForPoints < settings.minOrderValueForPoints) {
    return { pointsEarned: 0 };
  }

  // Get customer account and tier
  const account = await getOrCreateLoyaltyAccount(targetDb, order.userId);
  const tiersSnap = await targetDb.collection('loyaltyTiers').get();
  const tiersMap = new Map<string, LoyaltyTier>();
  tiersSnap.docs.forEach(d => tiersMap.set(d.id, d.data() as LoyaltyTier));

  const currentTier = tiersMap.get(account.tierId) || { pointsMultiplier: 1.0 };
  let multiplier = currentTier.pointsMultiplier || 1.0;

  // Check active campaigns
  const campaignsSnap = await targetDb.collection('loyaltyCampaigns').where('status', '==', 'active').get();
  campaignsSnap.docs.forEach(doc => {
    const camp = doc.data() as LoyaltyCampaign;
    if (amountForPoints >= (camp.minimumOrderValue || 0)) {
      if (camp.pointsMultiplier > multiplier) {
        multiplier = camp.pointsMultiplier;
      }
    }
  });

  let rawPoints = Math.floor(amountForPoints * settings.pointsPerRupeeSpent * multiplier);
  const pointsEarned = Math.min(settings.maxPointsPerOrder, Math.max(0, rawPoints));

  if (pointsEarned > 0) {
    const newAvailable = (account.availablePoints || 0) + pointsEarned;
    const newLifetime = (account.lifetimeEarnedPoints || 0) + pointsEarned;

    // Update account
    await targetDb.collection('loyaltyAccounts').doc(order.userId).update({
      availablePoints: newAvailable,
      lifetimeEarnedPoints: newLifetime,
      updatedAt: new Date().toISOString()
    });

    // Immutable transaction
    await recordLoyaltyTransaction(targetDb, {
      userId: order.userId,
      orderId: order.id,
      orderNumber: order.invoiceNumber || order.id,
      type: 'purchase_earned',
      points: pointsEarned,
      balanceAfter: newAvailable,
      description: `Earned ${pointsEarned} loyalty points on Order #${order.invoiceNumber || order.id}`,
      status: 'completed'
    });

    // Check tier upgrade
    await evaluateAndUpgradeTier(targetDb, order.userId);
  }

  return { pointsEarned };
}

// Helper: Reverse Loyalty Points when an order is refunded
export async function reversePointsForRefund(db: any, params: {
  orderId: string;
  refundAmount: number;
  totalOrderAmount: number;
  userId: string;
}) {
  const targetDb = getTargetDb(db);

  // Find original earned points transaction for this order
  const txSnap = await targetDb
    .collection('loyaltyTransactions')
    .where('orderId', '==', params.orderId)
    .where('type', '==', 'purchase_earned')
    .limit(1)
    .get();

  if (txSnap.empty) return { pointsReversed: 0 };

  const earnedTx = txSnap.docs[0].data() as LoyaltyTransaction;
  const originalPointsEarned = earnedTx.points || 0;
  if (originalPointsEarned <= 0) return { pointsReversed: 0 };

  // Check if reversal already recorded
  const reversedSnap = await targetDb
    .collection('loyaltyTransactions')
    .where('orderId', '==', params.orderId)
    .where('type', '==', 'purchase_reversed')
    .get();

  let alreadyReversedPoints = 0;
  reversedSnap.docs.forEach(d => {
    alreadyReversedPoints += Math.abs(d.data().points || 0);
  });

  const remainingReversable = Math.max(0, originalPointsEarned - alreadyReversedPoints);
  if (remainingReversable <= 0) return { pointsReversed: 0 };

  const ratio = Math.min(1.0, Math.max(0, params.refundAmount / (params.totalOrderAmount || 1)));
  const pointsToReverse = Math.min(remainingReversable, Math.round(originalPointsEarned * ratio));

  if (pointsToReverse > 0) {
    const accountRef = targetDb.collection('loyaltyAccounts').doc(params.userId);
    const accountSnap = await accountRef.get();
    if (accountSnap.exists) {
      const acc = accountSnap.data() as LoyaltyAccount;
      const currentAvail = acc.availablePoints || 0;
      const newAvail = Math.max(0, currentAvail - pointsToReverse); // Prevent negative balance

      await accountRef.update({
        availablePoints: newAvail,
        updatedAt: new Date().toISOString()
      });

      await recordLoyaltyTransaction(targetDb, {
        userId: params.userId,
        orderId: params.orderId,
        type: 'purchase_reversed',
        points: -pointsToReverse,
        balanceAfter: newAvail,
        description: `Reversed ${pointsToReverse} points for refunded Order #${params.orderId}`,
        status: 'completed'
      });
    }
  }

  return { pointsReversed: pointsToReverse };
}

// Helper: STORE CREDIT OPERATIONS
export async function getOrCreateStoreCredit(db: any, userId: string): Promise<StoreCredit> {
  const targetDb = getTargetDb(db);

  const docRef = targetDb.collection('storeCredits').doc(userId);
  const snap = await docRef.get();

  if (snap.exists) {
    return { id: snap.id, ...snap.data() } as StoreCredit;
  }

  const newCredit: StoreCredit = {
    id: userId,
    userId,
    balance: 0,
    currency: 'INR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await docRef.set(newCredit);
  return newCredit;
}

export async function addStoreCredit(
  db: any,
  params: {
    userId: string;
    amount: number;
    type: StoreCreditTransaction['type'];
    description: string;
    orderId?: string;
    refundId?: string;
    referenceId?: string;
  }
) {
  const targetDb = getTargetDb(db);

  const credit = await getOrCreateStoreCredit(targetDb, params.userId);
  const newBalance = Math.round((credit.balance + params.amount) * 100) / 100;

  await targetDb.collection('storeCredits').doc(params.userId).update({
    balance: newBalance,
    updatedAt: new Date().toISOString()
  });

  // Record ledger entry
  const txRef = targetDb.collection('storeCreditTransactions').doc();
  const txData: StoreCreditTransaction = {
    id: txRef.id,
    userId: params.userId,
    type: params.type,
    amount: Math.round(params.amount * 100) / 100,
    balanceAfter: newBalance,
    orderId: params.orderId || '',
    refundId: params.refundId || '',
    referenceId: params.referenceId || '',
    description: params.description,
    createdAt: new Date().toISOString()
  };

  await txRef.set(txData);
  return { newBalance, transaction: txData };
}

export async function debitStoreCredit(
  db: any,
  params: {
    userId: string;
    amount: number;
    orderId: string;
    description?: string;
  }
) {
  const targetDb = getTargetDb(db);

  const credit = await getOrCreateStoreCredit(targetDb, params.userId);
  if (credit.balance < params.amount) {
    throw new Error(`Insufficient store credit. Available: ₹${credit.balance.toFixed(2)}, Requested: ₹${params.amount.toFixed(2)}`);
  }

  const newBalance = Math.round((credit.balance - params.amount) * 100) / 100;

  await targetDb.collection('storeCredits').doc(params.userId).update({
    balance: newBalance,
    updatedAt: new Date().toISOString()
  });

  const txRef = targetDb.collection('storeCreditTransactions').doc();
  const txData: StoreCreditTransaction = {
    id: txRef.id,
    userId: params.userId,
    type: 'order_debit',
    amount: -Math.round(params.amount * 100) / 100,
    balanceAfter: newBalance,
    orderId: params.orderId,
    description: params.description || `Applied ₹${params.amount.toFixed(2)} store credit to Order #${params.orderId}`,
    createdAt: new Date().toISOString()
  };

  await txRef.set(txData);
  return { newBalance, transaction: txData };
}

// Helper: GIFT CARD OPERATIONS
export function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codePart1 = '';
  let codePart2 = '';
  let codePart3 = '';
  for (let i = 0; i < 4; i++) codePart1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) codePart2 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 4; i++) codePart3 += chars.charAt(Math.floor(Math.random() * chars.length));
  return `ELEC-${codePart1}-${codePart2}-${codePart3}`;
}

export async function validateGiftCard(db: any, code: string) {
  const targetDb = getTargetDb(db);

  const cleanCode = (code || '').trim().toUpperCase();
  const snap = await targetDb.collection('giftCards').where('code', '==', cleanCode).limit(1).get();

  if (snap.empty) {
    throw new Error('Invalid Gift Card code.');
  }

  const gc = snap.docs[0].data() as GiftCard;
  if (gc.status !== 'active' && gc.status !== 'partially_used') {
    throw new Error(`Gift Card is not active (Status: ${gc.status}).`);
  }

  if (gc.expiresAt && new Date(gc.expiresAt).getTime() < Date.now()) {
    await targetDb.collection('giftCards').doc(gc.id).update({ status: 'expired', updatedAt: new Date().toISOString() });
    throw new Error('Gift Card has expired.');
  }

  if (gc.remainingBalance <= 0) {
    throw new Error('Gift Card has zero remaining balance.');
  }

  return { id: snap.docs[0].id, ...gc };
}

export async function redeemGiftCardForOrder(
  db: any,
  params: {
    code: string;
    amountToRedeem: number;
    orderId: string;
    userId: string;
  }
) {
  const targetDb = getTargetDb(db);

  const gc = await validateGiftCard(targetDb, params.code);
  const actualRedeem = Math.min(gc.remainingBalance, params.amountToRedeem);
  if (actualRedeem <= 0) return { redeemedAmount: 0, newBalance: gc.remainingBalance };

  const newBalance = Math.round((gc.remainingBalance - actualRedeem) * 100) / 100;
  const newStatus = newBalance === 0 ? 'fully_used' : 'partially_used';

  await targetDb.collection('giftCards').doc(gc.id).update({
    remainingBalance: newBalance,
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  // Record GC transaction
  const txRef = targetDb.collection('giftCardTransactions').doc();
  const txData: GiftCardTransaction = {
    id: txRef.id,
    giftCardId: gc.id,
    code: gc.code,
    type: 'redemption',
    amount: -Math.round(actualRedeem * 100) / 100,
    balanceAfter: newBalance,
    orderId: params.orderId,
    userId: params.userId,
    createdAt: new Date().toISOString()
  };

  await txRef.set(txData);
  return { redeemedAmount: actualRedeem, newBalance, giftCardId: gc.id };
}

// Helper: Get Admin Loyalty KPIs & Metrics
export async function getAdminLoyaltyOverviewMetrics(db: any): Promise<LoyaltyOverviewMetrics> {
  const targetDb = getTargetDb(db);

  const [
    accountsSnap,
    txSnap,
    creditsSnap,
    giftCardsSnap,
    redemptionsSnap
  ] = await Promise.all([
    targetDb.collection('loyaltyAccounts').get().catch(() => ({ docs: [] })),
    targetDb.collection('loyaltyTransactions').get().catch(() => ({ docs: [] })),
    targetDb.collection('storeCredits').get().catch(() => ({ docs: [] })),
    targetDb.collection('giftCards').get().catch(() => ({ docs: [] })),
    targetDb.collection('rewardRedemptions').get().catch(() => ({ docs: [] }))
  ]);

  const totalMembers = accountsSnap.docs.length;
  let activeMembers = 0;
  let outstandingPoints = 0;

  accountsSnap.docs.forEach((doc: any) => {
    const d = doc.data ? doc.data() : doc;
    const avail = d.availablePoints || 0;
    outstandingPoints += avail;
    if (avail > 0 || (d.lifetimeEarnedPoints || 0) > 0) activeMembers++;
  });

  let pointsIssued = 0;
  let pointsRedeemed = 0;
  let pointsExpired = 0;

  txSnap.docs.forEach((doc: any) => {
    const d = doc.data ? doc.data() : doc;
    const p = d.points || 0;
    if (p > 0 && (d.type === 'purchase_earned' || d.type === 'promotional_bonus' || d.type === 'manual_adjustment')) {
      pointsIssued += p;
    } else if (d.type === 'reward_redeemed' || (p < 0 && d.type === 'manual_adjustment')) {
      pointsRedeemed += Math.abs(p);
    } else if (d.type === 'points_expired') {
      pointsExpired += Math.abs(p);
    }
  });

  let storeCreditBalance = 0;
  creditsSnap.docs.forEach((doc: any) => {
    const d = doc.data ? doc.data() : doc;
    storeCreditBalance += Number(d.balance || 0);
  });

  let giftCardValueSold = 0;
  let giftCardValueRedeemed = 0;
  giftCardsSnap.docs.forEach((doc: any) => {
    const d = doc.data ? doc.data() : doc;
    giftCardValueSold += Number(d.initialValue || 0);
    giftCardValueRedeemed += Number(d.initialValue || 0) - Number(d.remainingBalance || 0);
  });

  const rewardsRedeemed = redemptionsSnap.docs.length;

  return {
    totalMembers,
    activeMembers,
    pointsIssued,
    pointsRedeemed,
    pointsExpired,
    outstandingPoints,
    storeCreditBalance: Math.round(storeCreditBalance * 100) / 100,
    giftCardValueSold: Math.round(giftCardValueSold * 100) / 100,
    giftCardValueRedeemed: Math.round(giftCardValueRedeemed * 100) / 100,
    rewardsRedeemed
  };
}

// Helper: Redeem Reward Catalog Item
export async function redeemRewardCatalogItem(db: any, params: { userId: string; rewardId: string }) {
  const targetDb = getTargetDb(db);

  const rewardRef = targetDb.collection('rewards').doc(params.rewardId);
  const rewardSnap = await rewardRef.get();
  if (!rewardSnap.exists) throw new Error('Reward item not found.');

  const reward = { id: rewardSnap.id, ...rewardSnap.data() } as RewardItem;
  if (reward.status !== 'active') throw new Error('This reward is currently unavailable.');

  if (reward.stockLimit !== undefined && reward.stockLimit !== null && reward.redeemedCount >= reward.stockLimit) {
    throw new Error('This reward is out of stock.');
  }

  const account = await getOrCreateLoyaltyAccount(targetDb, params.userId);
  if (account.availablePoints < reward.pointsRequired) {
    throw new Error(`Insufficient points. Required: ${reward.pointsRequired}, Available: ${account.availablePoints}`);
  }

  const newAvailable = account.availablePoints - reward.pointsRequired;
  const newRedeemed = (account.redeemedPoints || 0) + reward.pointsRequired;

  // Deduct points from loyalty account
  await targetDb.collection('loyaltyAccounts').doc(params.userId).update({
    availablePoints: newAvailable,
    redeemedPoints: newRedeemed,
    lifetimeRedeemedPoints: (account.lifetimeRedeemedPoints || 0) + reward.pointsRequired,
    updatedAt: new Date().toISOString()
  });

  // Increment reward redeemed count
  await rewardRef.update({
    redeemedCount: (reward.redeemedCount || 0) + 1,
    updatedAt: new Date().toISOString()
  });

  // Record point transaction
  await recordLoyaltyTransaction(targetDb, {
    userId: params.userId,
    type: 'reward_redeemed',
    points: -reward.pointsRequired,
    balanceAfter: newAvailable,
    description: `Redeemed ${reward.pointsRequired} points for '${reward.name}'`,
    status: 'completed'
  });

  // Handle reward fulfillment based on reward type
  let generatedCouponCode = '';
  if (reward.rewardType === 'store_credit') {
    await addStoreCredit(targetDb, {
      userId: params.userId,
      amount: reward.cashValue,
      type: 'promotional_credit',
      description: `Store credit issued from redeeming reward: ${reward.name}`
    });
  } else if (reward.rewardType === 'discount' || reward.rewardType === 'coupon') {
    generatedCouponCode = `RWD-${reward.pointsRequired}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await targetDb.collection('coupons').doc(generatedCouponCode).set({
      code: generatedCouponCode,
      discountType: 'fixed',
      discountValue: reward.cashValue,
      minPurchase: 0,
      usageLimit: 1,
      timesUsed: 0,
      assignedUserId: params.userId,
      isActive: true,
      description: `Reward Coupon for ${reward.name}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Record redemption
  const redRef = targetDb.collection('rewardRedemptions').doc();
  const redemption: RewardRedemption = {
    id: redRef.id,
    userId: params.userId,
    rewardId: reward.id,
    rewardName: reward.name,
    rewardType: reward.rewardType,
    pointsUsed: reward.pointsRequired,
    rewardValue: reward.cashValue,
    couponId: generatedCouponCode || reward.couponId || '',
    status: 'issued',
    createdAt: new Date().toISOString()
  };

  await redRef.set(redemption);

  return {
    success: true,
    redemption,
    couponCode: generatedCouponCode,
    newPointsBalance: newAvailable
  };
}

// Helper: Calculate Checkout Totals Server-Side
export async function calculateCheckoutTotalsServer(
  db: any,
  params: {
    userId: string;
    subtotal: number;
    couponCode?: string;
    pointsToRedeem?: number;
    useStoreCredit?: boolean;
    giftCardCodes?: string[];
    shippingCharge?: number;
    tax?: number;
  }
) {
  const targetDb = getTargetDb(db);

  const settings = await getLoyaltySettings(targetDb);
  const rawSubtotal = Math.max(0, Number(params.subtotal) || 0);

  // 1. Coupon Discount Calculation
  let couponDiscount = 0;
  let appliedCouponCode = '';
  if (params.couponCode) {
    const cleanCode = params.couponCode.trim().toUpperCase();
    const couponDoc = await targetDb.collection('coupons').doc(cleanCode).get();
    if (couponDoc.exists) {
      const c = couponDoc.data();
      if (c.isActive && (!c.minPurchase || rawSubtotal >= c.minPurchase)) {
        appliedCouponCode = cleanCode;
        if (c.discountType === 'percentage') {
          couponDiscount = Math.round((rawSubtotal * (c.discountValue / 100)) * 100) / 100;
          if (c.maxDiscount && couponDiscount > c.maxDiscount) couponDiscount = c.maxDiscount;
        } else {
          couponDiscount = Math.min(c.discountValue, rawSubtotal);
        }
      }
    }
  }

  const subtotalAfterCoupon = Math.max(0, rawSubtotal - couponDiscount);

  // 2. Loyalty Points Discount Calculation
  let loyaltyPointsUsed = 0;
  let loyaltyDiscountAmount = 0;

  if (settings.pointsRedemptionEnabled && params.pointsToRedeem && params.pointsToRedeem >= settings.minimumPointsToRedeem && params.userId) {
    const account = await getOrCreateLoyaltyAccount(targetDb, params.userId);
    const available = account.availablePoints || 0;

    const requestedPoints = Math.min(available, Math.min(settings.maximumPointsPerOrder, Number(params.pointsToRedeem)));

    if (requestedPoints >= settings.minimumPointsToRedeem) {
      // Points conversion: pointsPerRupee points = ₹1
      const calculatedVal = Math.round((requestedPoints / (settings.pointsPerRupee || 10)) * 100) / 100;

      // Max redemption percentage cap of subtotalAfterCoupon
      const maxAllowedDiscountByPercentage = Math.round((subtotalAfterCoupon * (settings.maximumRedemptionPercentage / 100)) * 100) / 100;
      const actualDiscount = Math.min(calculatedVal, Math.min(subtotalAfterCoupon, maxAllowedDiscountByPercentage));

      if (actualDiscount > 0) {
        loyaltyDiscountAmount = actualDiscount;
        // Points used corresponding to actualDiscount
        loyaltyPointsUsed = Math.min(requestedPoints, Math.ceil(actualDiscount * (settings.pointsPerRupee || 10)));
      }
    }
  }

  const subtotalAfterLoyalty = Math.max(0, subtotalAfterCoupon - loyaltyDiscountAmount);

  // 3. Tax and Shipping
  const shippingCharge = Number(params.shippingCharge) || (subtotalAfterLoyalty > 1000 ? 0 : 99);
  const tax = Number(params.tax) || Math.round(subtotalAfterLoyalty * 0.18 * 100) / 100; // 18% GST estimate
  const grandTotalBeforeTenders = subtotalAfterLoyalty + shippingCharge + tax;

  // 4. Store Credit Tender
  let storeCreditUsed = 0;
  if (params.useStoreCredit && settings.storeCreditEnabled && params.userId) {
    const credit = await getOrCreateStoreCredit(targetDb, params.userId);
    if (credit.balance > 0) {
      storeCreditUsed = Math.min(credit.balance, grandTotalBeforeTenders);
      storeCreditUsed = Math.round(storeCreditUsed * 100) / 100;
    }
  }

  const remainingAfterCredit = Math.max(0, grandTotalBeforeTenders - storeCreditUsed);

  // 5. Gift Card Tenders
  let giftCardUsed = 0;
  const appliedGiftCards: Array<{ code: string; amountUsed: number }> = [];

  if (settings.giftCardsEnabled && Array.isArray(params.giftCardCodes) && params.giftCardCodes.length > 0) {
    let currentPayable = remainingAfterCredit;

    for (const rawCode of params.giftCardCodes) {
      if (currentPayable <= 0) break;
      try {
        const gc = await validateGiftCard(targetDb, rawCode);
        const gcDeduct = Math.min(gc.remainingBalance, currentPayable);
        if (gcDeduct > 0) {
          appliedGiftCards.push({ code: gc.code, amountUsed: gcDeduct });
          giftCardUsed += gcDeduct;
          currentPayable -= gcDeduct;
        }
      } catch {
        // Skip invalid gift card
      }
    }
  }

  giftCardUsed = Math.round(giftCardUsed * 100) / 100;
  const finalPayableAmount = Math.max(0, Math.round((grandTotalBeforeTenders - storeCreditUsed - giftCardUsed) * 100) / 100);

  return {
    subtotal: rawSubtotal,
    couponCode: appliedCouponCode,
    couponDiscount,
    loyaltyPointsUsed,
    loyaltyDiscountAmount,
    shippingCharge,
    tax,
    grandTotalBeforeTenders: Math.round(grandTotalBeforeTenders * 100) / 100,
    storeCreditUsed,
    giftCardUsed,
    appliedGiftCards,
    finalPayableAmount,
    isFullyPaidByTenders: finalPayableAmount === 0
  };
}

// Helper: Manual Admin Points Adjustment
export async function adminAdjustPoints(
  db: any,
  params: {
    userId: string;
    points: number; // positive or negative
    reason: string;
    adminEmail: string;
  }
) {
  const targetDb = getTargetDb(db);

  if (!params.points || params.points === 0) throw new Error('Points adjustment must be non-zero.');
  if (!params.reason) throw new Error('Adjustment reason is required.');

  const account = await getOrCreateLoyaltyAccount(targetDb, params.userId);
  const currentAvail = account.availablePoints || 0;
  const newAvail = Math.max(0, currentAvail + params.points);

  await targetDb.collection('loyaltyAccounts').doc(params.userId).update({
    availablePoints: newAvail,
    lifetimeEarnedPoints: params.points > 0 ? (account.lifetimeEarnedPoints || 0) + params.points : account.lifetimeEarnedPoints,
    updatedAt: new Date().toISOString()
  });

  const txRecord = await recordLoyaltyTransaction(targetDb, {
    userId: params.userId,
    type: 'manual_adjustment',
    points: params.points,
    balanceAfter: newAvail,
    description: `Admin Adjustment (${params.adminEmail}): ${params.reason}`,
    status: 'completed'
  });

  // Evaluate tier
  await evaluateAndUpgradeTier(targetDb, params.userId);

  return { newBalance: newAvail, transaction: txRecord };
}

// Helper: Manual Admin Store Credit Adjustment
export async function adminAdjustStoreCredit(
  db: any,
  params: {
    userId: string;
    amount: number; // positive or negative
    reason: string;
    adminEmail: string;
    adminId?: string;
    note?: string;
    orderId?: string;
    returnId?: string;
    referenceId?: string;
  }
) {
  const targetDb = getTargetDb(db);

  const numAmount = Number(params.amount);
  if (!numAmount || isNaN(numAmount) || numAmount === 0) {
    throw new Error('Store credit adjustment amount must be a non-zero number.');
  }
  if (!params.reason || !params.reason.trim()) {
    throw new Error('Adjustment reason is required.');
  }

  const credit = await getOrCreateStoreCredit(targetDb, params.userId);
  const previousBalance = Number(credit.balance || 0);

  // Prevent negative balance
  if (numAmount < 0 && previousBalance + numAmount < 0) {
    throw new Error(`Insufficient store credit balance. Current balance is ₹${previousBalance.toFixed(2)}. Cannot deduct ₹${Math.abs(numAmount).toFixed(2)}.`);
  }

  const newBalance = Math.max(0, Math.round((previousBalance + numAmount) * 100) / 100);
  const totalCredited = Number(credit.totalCredited || 0) + (numAmount > 0 ? numAmount : 0);
  const totalUsed = Number(credit.totalUsed || 0) + (numAmount < 0 ? Math.abs(numAmount) : 0);
  const nowIso = new Date().toISOString();

  // Fetch customer details if available for rich denormalized transactions
  let customerName = credit.customerName || '';
  let customerEmail = credit.customerEmail || '';
  let customerPhone = credit.customerPhone || '';
  try {
    const userDoc = await targetDb.collection('users').doc(params.userId).get();
    if (userDoc.exists) {
      const uData = userDoc.data();
      customerName = uData?.displayName || uData?.name || customerName;
      customerEmail = uData?.email || customerEmail;
      customerPhone = uData?.phoneNumber || uData?.phone || customerPhone;
    }
    customerName = (params as any).userName || (params as any).customerName || customerName || 'Customer';
    customerEmail = (params as any).userEmail || (params as any).customerEmail || customerEmail;
  } catch (err) {
    // Non-fatal
  }

  const effectiveOrderId = params.orderId || (params as any).relatedOrderId || '';
  const effectiveReturnId = params.returnId || (params as any).relatedReturnId || '';
  const creditStatus = newBalance > 0 ? 'active' : 'zero';

  await targetDb.collection('storeCredits').doc(params.userId).update({
    balance: newBalance,
    totalCredited: Math.round(totalCredited * 100) / 100,
    totalUsed: Math.round(totalUsed * 100) / 100,
    customerName,
    customerEmail,
    customerPhone,
    status: credit.status === 'suspended' ? 'suspended' : creditStatus,
    lastActivityAt: nowIso,
    updatedAt: nowIso
  });

  const txRef = targetDb.collection('storeCreditTransactions').doc();
  const txData: StoreCreditTransaction = {
    id: txRef.id,
    userId: params.userId,
    customerName,
    customerEmail,
    type: numAmount > 0 ? 'manual_credit' : 'adjustment',
    amount: Math.round(numAmount * 100) / 100,
    previousBalance,
    balanceAfter: newBalance,
    reason: params.reason.trim(),
    note: (params.note || '').trim(),
    adminEmail: params.adminEmail || 'Admin',
    adminId: params.adminId || '',
    orderId: effectiveOrderId,
    returnId: effectiveReturnId,
    referenceId: params.referenceId || '',
    description: numAmount > 0 
      ? `Manual Credit (+₹${numAmount.toFixed(2)}) by ${params.adminEmail || 'Admin'}: ${params.reason}${params.note ? ` - Note: ${params.note}` : ''}`
      : `Manual Debit (-₹${Math.abs(numAmount).toFixed(2)}) by ${params.adminEmail || 'Admin'}: ${params.reason}${params.note ? ` - Note: ${params.note}` : ''}`,
    createdAt: nowIso
  };

  await txRef.set(txData);

  // Record audit log entry in payment_audit
  try {
    const auditRef = targetDb.collection('payment_audit').doc();
    await auditRef.set({
      id: auditRef.id,
      action: numAmount > 0 ? 'STORE_CREDIT_MANUAL_ADDED' : 'STORE_CREDIT_MANUAL_DEDUCTED',
      adminEmail: params.adminEmail || 'Admin',
      adminId: params.adminId || '',
      userId: params.userId,
      customerEmail,
      previousBalance,
      adjustmentAmount: numAmount,
      newBalance,
      reason: params.reason,
      note: params.note || '',
      orderId: params.orderId || '',
      returnId: params.returnId || '',
      timestamp: FieldValue.serverTimestamp(),
      isoTimestamp: nowIso
    });
  } catch (auditErr) {
    console.warn('Store credit audit log write notice:', auditErr);
  }

  return { newBalance, previousBalance, transaction: txData };
}

// Helper: Get all store credit customer summaries
export async function getAllStoreCreditAccounts(db: any, search?: string) {
  const targetDb = getTargetDb(db);

  const [usersSnap, creditsSnap, txSnap] = await Promise.all([
    targetDb.collection('users').get().catch(() => ({ docs: [] })),
    targetDb.collection('storeCredits').get().catch(() => ({ docs: [] })),
    targetDb.collection('storeCreditTransactions').orderBy('createdAt', 'desc').limit(200).get().catch(() => ({ docs: [] }))
  ]);

  const creditsByUserId = new Map<string, any>();
  creditsSnap.docs.forEach((doc: any) => {
    creditsByUserId.set(doc.id, { id: doc.id, ...doc.data() });
  });

  const txByUserId = new Map<string, any[]>();
  txSnap.docs.forEach((doc: any) => {
    const d = { id: doc.id, ...doc.data() };
    const list = txByUserId.get(d.userId) || [];
    list.push(d);
    txByUserId.set(d.userId, list);
  });

  const result: any[] = [];
  const processedUserIds = new Set<string>();

  // Process all registered users
  usersSnap.docs.forEach((doc: any) => {
    const u = { id: doc.id, ...doc.data() };
    processedUserIds.add(u.id);

    const cred = creditsByUserId.get(u.id);
    const userTxs = txByUserId.get(u.id) || [];
    const balance = Number(cred?.balance || 0);

    // Compute totalCredited and totalUsed if not stored
    let totalCredited = Number(cred?.totalCredited || 0);
    let totalUsed = Number(cred?.totalUsed || 0);
    if (!totalCredited && !totalUsed && userTxs.length > 0) {
      userTxs.forEach((t: any) => {
        if (t.amount > 0) totalCredited += t.amount;
        if (t.amount < 0) totalUsed += Math.abs(t.amount);
      });
    }

    const lastActivity = cred?.lastActivityAt || userTxs[0]?.createdAt || cred?.updatedAt || u.updatedAt || u.createdAt;
    let status = cred?.status || (balance > 0 ? 'active' : 'zero');
    if (u.disabled) status = 'suspended';

    const custName = u.displayName || u.name || cred?.customerName || 'Customer';
    const custEmail = u.email || cred?.customerEmail || '';
    const roundedBalance = Math.round(balance * 100) / 100;

    result.push({
      id: u.id,
      userId: u.id,
      customerName: custName,
      customerEmail: custEmail,
      customerPhone: u.phoneNumber || u.phone || cred?.customerPhone || '',
      userName: custName,
      userEmail: custEmail,
      balance: roundedBalance,
      availableCredit: roundedBalance,
      currency: cred?.currency || 'INR',
      totalCredited: Math.round(totalCredited * 100) / 100,
      totalUsed: Math.round(totalUsed * 100) / 100,
      lastActivity,
      lastActivityAt: lastActivity,
      status,
      transactionCount: userTxs.length,
      createdAt: cred?.createdAt || u.createdAt
    });
  });

  // Also include any standalone storeCredits that had no direct user profile match
  creditsSnap.docs.forEach((doc: any) => {
    if (!processedUserIds.has(doc.id)) {
      const cred = { id: doc.id, ...doc.data() };
      const userTxs = txByUserId.get(doc.id) || [];
      const balance = Number(cred.balance || 0);
      const custName = cred.customerName || cred.userName || 'Customer';
      const custEmail = cred.customerEmail || cred.userEmail || '';
      const roundedBalance = Math.round(balance * 100) / 100;
      const lastAct = cred.lastActivityAt || cred.updatedAt || userTxs[0]?.createdAt;
      result.push({
        id: doc.id,
        userId: doc.id,
        customerName: custName,
        customerEmail: custEmail,
        customerPhone: cred.customerPhone || '',
        userName: custName,
        userEmail: custEmail,
        balance: roundedBalance,
        availableCredit: roundedBalance,
        currency: cred.currency || 'INR',
        totalCredited: Math.round(Number(cred.totalCredited || 0) * 100) / 100,
        totalUsed: Math.round(Number(cred.totalUsed || 0) * 100) / 100,
        lastActivity: lastAct,
        lastActivityAt: lastAct,
        status: cred.status || (balance > 0 ? 'active' : 'zero'),
        transactionCount: userTxs.length,
        createdAt: cred.createdAt
      });
    }
  });

  // Filter if search query passed
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    return result.filter(item => 
      item.customerName?.toLowerCase().includes(q) ||
      item.customerEmail?.toLowerCase().includes(q) ||
      item.customerPhone?.toLowerCase().includes(q) ||
      item.userId?.toLowerCase().includes(q)
    );
  }

  // Sort by balance descending, then lastActivity descending
  return result.sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    const tA = new Date(a.lastActivity || 0).getTime();
    const tB = new Date(b.lastActivity || 0).getTime();
    return tB - tA;
  });
}

// Helper: Get Store Credit Transactions History
export async function getStoreCreditTransactions(db: any, userId?: string, limitCount = 100) {
  const targetDb = getTargetDb(db);

  let q = targetDb.collection('storeCreditTransactions');
  if (userId) {
    q = q.where('userId', '==', userId);
  }
  
  const snap = await q.orderBy('createdAt', 'desc').limit(limitCount).get();
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

// Helper: Update Gift Card Status (e.g. active, cancelled, expired)
export async function updateGiftCardStatus(
  db: any,
  params: {
    giftCardId: string;
    status: GiftCard['status'];
    adminEmail: string;
    reason?: string;
  }
) {
  const targetDb = getTargetDb(db);

  const docRef = targetDb.collection('giftCards').doc(params.giftCardId);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Gift Card not found');

  const gc = snap.data() as GiftCard;
  const nowIso = new Date().toISOString();

  await docRef.update({
    status: params.status,
    updatedAt: nowIso
  });

  const txRef = targetDb.collection('giftCardTransactions').doc();
  const txData: GiftCardTransaction = {
    id: txRef.id,
    giftCardId: params.giftCardId,
    code: gc.code,
    type: params.status === 'cancelled' ? 'cancellation' : 'adjustment',
    amount: 0,
    balanceAfter: gc.remainingBalance,
    userId: `admin:${params.adminEmail}`,
    referenceId: params.reason || `Status changed to ${params.status}`,
    createdAt: nowIso
  };

  await txRef.set(txData);
  return { success: true, status: params.status, card: { ...gc, status: params.status, updatedAt: nowIso } };
}

// Helper: Adjust Gift Card Balance
export async function adjustGiftCardBalance(
  db: any,
  params: {
    giftCardId: string;
    amountDelta: number; // positive or negative
    reason: string;
    adminEmail: string;
    note?: string;
  }
) {
  const targetDb = getTargetDb(db);

  const docRef = targetDb.collection('giftCards').doc(params.giftCardId);
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Gift Card not found');

  const gc = snap.data() as GiftCard;
  const currentBalance = Number(gc.remainingBalance || 0);
  const delta = Number(params.amountDelta);

  if (!delta || isNaN(delta)) throw new Error('Adjustment amount must be a non-zero number');
  if (currentBalance + delta < 0) {
    throw new Error(`Insufficient gift card balance. Current: ₹${currentBalance.toFixed(2)}, cannot deduct ₹${Math.abs(delta).toFixed(2)}.`);
  }

  const newBalance = Math.max(0, Math.round((currentBalance + delta) * 100) / 100);
  let newStatus: GiftCard['status'] = gc.status;
  if (newBalance === 0) {
    newStatus = 'fully_used';
  } else if (newBalance < gc.initialValue) {
    newStatus = 'partially_used';
  } else {
    newStatus = 'active';
  }

  const nowIso = new Date().toISOString();

  await docRef.update({
    remainingBalance: newBalance,
    status: newStatus,
    updatedAt: nowIso
  });

  const txRef = targetDb.collection('giftCardTransactions').doc();
  const txData: GiftCardTransaction = {
    id: txRef.id,
    giftCardId: params.giftCardId,
    code: gc.code,
    type: 'adjustment',
    amount: Math.round(delta * 100) / 100,
    balanceAfter: newBalance,
    userId: `admin:${params.adminEmail}`,
    referenceId: `${params.reason}${params.note ? ` (${params.note})` : ''}`,
    createdAt: nowIso
  };

  await txRef.set(txData);
  return { success: true, newBalance, status: newStatus, transaction: txData };
}

