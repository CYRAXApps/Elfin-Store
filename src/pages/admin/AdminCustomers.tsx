import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { 
  Users, 
  MessageSquare, 
  RotateCcw, 
  ShoppingBag, 
  UserCheck, 
  Clock, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Wallet,
  Database
} from 'lucide-react';
import { CustomerData, CustomerDetailsModal } from './customers/CustomerDetailsModal';
import { CustomerList } from './customers/CustomerList';
import { AddCustomerModal } from './customers/AddCustomerModal';
import { CustomerMigrationModal } from './customers/CustomerMigrationModal';
import { SupportRequestsManager } from './customers/SupportRequestsManager';
import { ReturnsManager } from './customers/ReturnsManager';
import { StoreCreditManager } from './customers/StoreCreditManager';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { SupportTicket, ReturnRequest, Order } from '../../types';
import { normalizeTicketStatus, normalizeReturnStatus } from './customers/customerUtils';

// Module-level in-memory cache for instant zero-latency admin tab navigation
let cachedRawUsers: any[] = [];
let cachedRawOrders: any[] = [];
let cachedRawTickets: SupportTicket[] = [];
let cachedRawReturns: ReturnRequest[] = [];
let cachedCustomersLoaded = false;

export interface AdminCustomersProps {
  onNavigateTab?: (tab: string, params?: any) => void;
  initialSubTab?: 'all' | 'support' | 'returns' | string;
  forcedStoreId?: string;
}

export function AdminCustomers({ onNavigateTab, initialSubTab = 'all', forcedStoreId }: AdminCustomersProps = {}) {
  // Main sub-tabs: 'all' (All Customers) | 'support' (Support Requests) | 'returns' (Returns & Refunds) | 'store-credit' (Store Credit)
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'support' | 'returns' | 'store-credit'>(() => {
    if (initialSubTab === 'support' || initialSubTab === 'tickets') return 'support';
    if (initialSubTab === 'returns') return 'returns';
    if (initialSubTab === 'store-credit' || initialSubTab === 'credit' || initialSubTab === 'wallet') return 'store-credit';
    return 'all';
  });

  // Sync when initialSubTab changes from sidebar clicks
  useEffect(() => {
    if (initialSubTab === 'support' || initialSubTab === 'tickets') {
      setActiveSubTab('support');
    } else if (initialSubTab === 'returns') {
      setActiveSubTab('returns');
    } else if (initialSubTab === 'store-credit' || initialSubTab === 'credit' || initialSubTab === 'wallet') {
      setActiveSubTab('store-credit');
    } else if (initialSubTab === 'all' || initialSubTab === 'customers') {
      setActiveSubTab('all');
    }
  }, [initialSubTab]);

  // Raw Firestore collections state initialized from cache
  const [rawUsers, setRawUsers] = useState<any[]>(() => cachedRawUsers);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [auditConflicts, setAuditConflicts] = useState<any[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>(() => cachedRawOrders);
  const [rawTickets, setRawTickets] = useState<SupportTicket[]>(() => cachedRawTickets);
  const [rawReturns, setRawReturns] = useState<ReturnRequest[]>(() => cachedRawReturns);
  const [rawStoreCredits, setRawStoreCredits] = useState<Record<string, number>>({});
  const [rawLoyalty, setRawLoyalty] = useState<Record<string, { points: number; tier: string }>>({});
  const [rawInquiries, setRawInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(!cachedCustomersLoaded);

  // Fetch identity conflicts from server audit diagnostics
  const fetchConflicts = async () => {
    try {
      const res = await fetch('/api/auth/otp/audit-conflicts');
      const data = await res.json();
      const conflictList = data.conflicts || data.data?.conflicts || [];
      if (data.success && Array.isArray(conflictList)) {
        setAuditConflicts(conflictList);
      }
    } catch (err) {
      console.warn('Notice loading identity conflict audit:', err);
    }
  };

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 20000);
    return () => clearInterval(interval);
  }, []);

  // Selected item modal states & Add customer modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [initialTicketIdToOpen, setInitialTicketIdToOpen] = useState<string | undefined>(undefined);
  const [initialReturnIdToOpen, setInitialReturnIdToOpen] = useState<string | undefined>(undefined);

  // 1. Real-time Firestore Users Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      cachedRawUsers = usersList;
      cachedCustomersLoaded = true;
      setRawUsers(usersList);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to users collection:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 1b. Real-time Firestore Customers Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const custList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawCustomers(custList);
    }, (err) => {
      console.warn('Error listening to customers collection:', err);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Firestore Orders Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      cachedRawOrders = ordersList;
      setRawOrders(ordersList);
    }, (err) => {
      console.error('Error listening to orders collection:', err);
    });
    return () => unsub();
  }, []);

  // 3. Real-time Firestore Support Tickets Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
      const ticketsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
      cachedRawTickets = ticketsList;
      setRawTickets(ticketsList);
    }, (err) => {
      console.error('Error listening to support_tickets collection:', err);
    });
    return () => unsub();
  }, []);

  // 4. Real-time Firestore Return Requests Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'return_requests'), (snapshot) => {
      const returnsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReturnRequest));
      cachedRawReturns = returnsList;
      setRawReturns(returnsList);
    }, (err) => {
      console.error('Error listening to return_requests collection:', err);
    });
    return () => unsub();
  }, []);

  // 5. Real-time Store Credits Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'storeCredits'), (snapshot) => {
      const map: Record<string, number> = {};
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        map[docSnap.id] = Number(d.balance) || 0;
        if (d.userId) map[d.userId] = Number(d.balance) || 0;
      });
      setRawStoreCredits(map);
    }, (err) => console.warn('Store credits listener:', err));
    return () => unsub();
  }, []);

  // 6. Real-time Loyalty Accounts Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'loyaltyAccounts'), (snapshot) => {
      const map: Record<string, { points: number; tier: string }> = {};
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        map[docSnap.id] = { points: d.points || 0, tier: d.tierName || d.tier || 'Bronze' };
        if (d.userId) map[d.userId] = { points: d.points || 0, tier: d.tierName || d.tier || 'Bronze' };
      });
      setRawLoyalty(map);
    }, (err) => console.warn('Loyalty accounts listener:', err));
    return () => unsub();
  }, []);

  // 7. Real-time Inquiries Listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inquiries'), (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setRawInquiries(list);
    }, (err) => console.warn('Inquiries listener:', err));
    return () => unsub();
  }, []);

  // Aggregate Customer Data by joining Users & Customers with Orders, Tickets, Returns, and Store Credit
  const customersData: CustomerData[] = useMemo(() => {
    // Merge rawUsers and rawCustomers by document ID / UID
    const mergedMap = new Map<string, any>();

    for (const u of rawUsers) {
      if (u && u.id) {
        mergedMap.set(u.id, { ...u });
      }
    }

    for (const c of rawCustomers) {
      if (c && c.id) {
        const existing = mergedMap.get(c.id) || {};
        mergedMap.set(c.id, {
          ...existing,
          ...c,
          displayName: c.displayName || c.name || existing.displayName || existing.name,
          email: c.email || existing.email,
          phoneNumber: c.phoneNumber || c.phone || existing.phoneNumber || existing.phone,
          isPhoneVerified: c.isPhoneVerified ?? existing.isPhoneVerified ?? true,
          isEmailVerified: c.isEmailVerified ?? existing.isEmailVerified ?? false,
          status: c.status || existing.status || (c.disabled || existing.disabled ? 'disabled' : 'active'),
          disabled: Boolean(c.disabled || existing.disabled || c.status === 'disabled' || existing.status === 'disabled')
        });
      }
    }

    const mergedList = Array.from(mergedMap.values());

    // Filter to actual customer accounts (exclude owner, admin and staff)
    const validUsers = mergedList.filter(u => {
      if (
        u.id === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' ||
        u.isPrimaryOwner ||
        u.role === 'admin' ||
        u.role === 'owner' ||
        u.role === 'manager' ||
        u.role === 'staff' ||
        (u.email && u.email.toLowerCase().trim() === 'ritamsaha0000@gmail.com')
      ) {
        return false;
      }
      return u.role === 'customer' || !u.role;
    });

    // Build lookup maps to find conflicting accounts across users
    const phoneMap = new Map<string, string[]>();
    const emailMap = new Map<string, string[]>();

    for (const u of validUsers) {
      const p = (u.phoneNumber || u.phone || '').replace(/\D/g, '');
      const last10 = p.length >= 10 ? p.slice(-10) : '';
      if (last10) {
        const arr = phoneMap.get(last10) || [];
        arr.push(u.id);
        phoneMap.set(last10, arr);
      }

      const e = (u.email || '').toLowerCase().trim();
      if (e && !e.endsWith('@electrostore.local')) {
        const arr = emailMap.get(e) || [];
        arr.push(u.id);
        emailMap.set(e, arr);
      }
    }

    return validUsers.map(user => {
      const userEmail = (user.email || '').toLowerCase().trim();
      const userId = user.id;
      const rawP = (user.phoneNumber || user.phone || '').replace(/\D/g, '');
      const last10 = rawP.length >= 10 ? rawP.slice(-10) : '';

      // Conflict detection
      let identityConflict = false;
      let conflictType: string | undefined = undefined;
      let conflictDetails: string | undefined = undefined;
      const conflictingWith: Array<{ uid: string; docId: string; collection: string; mobile?: string; email?: string }> = [];

      // Check server audit conflicts
      const serverConflict = auditConflicts.find(ac => 
        (Array.isArray(ac.affectedUids) && ac.affectedUids.includes(userId)) ||
        (ac.credential && (ac.credential === userEmail || ac.credential === user.phoneNumber || ac.credential === user.phone))
      );

      if (serverConflict) {
        identityConflict = true;
        conflictType = serverConflict.type;
        conflictDetails = serverConflict.details;
        if (Array.isArray(serverConflict.records)) {
          for (const rec of serverConflict.records) {
            if (rec.uid !== userId) {
              conflictingWith.push({
                uid: rec.uid,
                docId: rec.docId || rec.uid,
                collection: rec.collection || 'customers',
                mobile: rec.mobile,
                email: rec.email
              });
            }
          }
        }
      }

      // Check local phone collision
      if (last10 && phoneMap.has(last10)) {
        const collidingUids = phoneMap.get(last10)!.filter(id => id !== userId);
        if (collidingUids.length > 0) {
          identityConflict = true;
          conflictType = conflictType || 'DIFF_UID_SAME_PHONE';
          conflictDetails = conflictDetails || `Mobile number (${user.phoneNumber || user.phone}) is also registered under account(s): ${collidingUids.join(', ')}.`;
          for (const cUid of collidingUids) {
            if (!conflictingWith.some(cw => cw.uid === cUid)) {
              conflictingWith.push({
                uid: cUid,
                docId: cUid,
                collection: 'customers',
                mobile: user.phoneNumber || user.phone
              });
            }
          }
        }
      }

      // Check local email collision
      if (userEmail && !userEmail.endsWith('@electrostore.local') && emailMap.has(userEmail)) {
        const collidingUids = emailMap.get(userEmail)!.filter(id => id !== userId);
        if (collidingUids.length > 0) {
          identityConflict = true;
          conflictType = conflictType || 'DIFF_UID_SAME_EMAIL';
          conflictDetails = conflictDetails || `Email address (${userEmail}) is also registered under account(s): ${collidingUids.join(', ')}.`;
          for (const cUid of collidingUids) {
            if (!conflictingWith.some(cw => cw.uid === cUid)) {
              conflictingWith.push({
                uid: cUid,
                docId: cUid,
                collection: 'customers',
                email: userEmail
              });
            }
          }
        }
      }

      // Find all orders for this customer
      const userOrders = rawOrders.filter(o => {
        const orderUserId = o.userId;
        const orderEmail = (o.shippingAddress?.email || o.customerEmail || o.email || '').toLowerCase().trim();
        return (orderUserId && orderUserId === userId) || (userEmail && orderEmail === userEmail);
      });

      // Sort user orders newest first
      userOrders.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });

      const totalOrders = userOrders.length;
      const totalSpent = userOrders.reduce((sum, ord) => sum + Number(ord.grandTotal || ord.totalAmount || 0), 0);
      const latestOrder = userOrders[0];

      // Find return requests for this customer
      const userReturns = rawReturns.filter(r => {
        const retUserId = r.userId;
        const retEmail = (r.customerEmail || '').toLowerCase().trim();
        return (retUserId && retUserId === userId) || (userEmail && retEmail === userEmail);
      });

      // Find support tickets for this customer
      const userTickets = rawTickets.filter(t => {
        const tickUserId = t.userId;
        const tickEmail = (t.customerEmail || '').toLowerCase().trim();
        return (tickUserId && tickUserId === userId) || (userEmail && tickEmail === userEmail);
      });

      // Find inquiries for this customer
      const userInquiries = rawInquiries.filter(i => {
        const inqUserId = i.userId;
        const inqEmail = (i.email || '').toLowerCase().trim();
        return (inqUserId && inqUserId === userId) || (userEmail && inqEmail === userEmail);
      });

      const storeCreditBalance = rawStoreCredits[user.id] ?? Number(user.storeCredit || 0);
      const loyalty = rawLoyalty[user.id] || { points: Number(user.loyaltyPoints || 0), tier: user.loyaltyTier || 'Standard' };

      return {
        id: user.id,
        name: user.displayName || user.name || (userOrders[0]?.shippingAddress?.fullName) || 'Customer',
        email: user.email || (userOrders[0]?.shippingAddress?.email) || '',
        phone: user.phoneNumber || user.phone || (userOrders[0]?.shippingAddress?.phoneNumber),
        phoneVerified: Boolean(user.isPhoneVerified ?? user.phoneVerified ?? (user.phoneNumber || user.phone)),
        emailVerified: Boolean(user.isEmailVerified ?? user.emailVerified),
        identityConflict,
        conflictType,
        conflictDetails,
        conflictingWith,
        role: user.role || 'customer',
        status: user.disabled ? 'disabled' : (user.status || 'active'),
        disabled: Boolean(user.disabled || user.status === 'disabled'),
        notes: user.notes || user.adminNotes || '',
        createdAt: user.createdAt,
        totalOrders,
        totalSpent,
        storeCredit: storeCreditBalance,
        loyaltyPoints: loyalty.points,
        loyaltyTier: loyalty.tier,
        lastOrderDate: latestOrder?.createdAt,
        lastOrderNumber: latestOrder?.invoiceNumber || latestOrder?.id?.slice(0, 8),
        shippingAddress: user.shippingAddress || latestOrder?.shippingAddress,
        orders: userOrders,
        returns: userReturns,
        tickets: userTickets,
        inquiries: userInquiries
      };
    });
  }, [rawUsers, rawCustomers, auditConflicts, rawOrders, rawReturns, rawTickets, rawStoreCredits, rawLoyalty, rawInquiries]);

  // Keep selectedCustomer live when data updates
  useEffect(() => {
    if (selectedCustomer) {
      const refreshed = customersData.find(c => c.id === selectedCustomer.id);
      if (refreshed) {
        setSelectedCustomer(refreshed);
      }
    }
  }, [customersData]);

  // KPI summary counts for top tabs
  const activeTicketsCount = useMemo(() => {
    return rawTickets.filter(t => {
      const norm = normalizeTicketStatus(t.status);
      return norm === 'new' || norm === 'in_progress';
    }).length;
  }, [rawTickets]);

  const activeReturnsCount = useMemo(() => {
    return rawReturns.filter(r => {
      const norm = normalizeReturnStatus(r.status);
      return norm === 'requested' || norm === 'under_review' || norm === 'approved' || norm === 'received';
    }).length;
  }, [rawReturns]);

  // Save Customer Admin Notes
  const handleSaveCustomerNotes = async (customerId: string, notes: string) => {
    try {
      const noteUpdates = {
        notes,
        adminNotes: notes,
        updatedAt: serverTimestamp()
      };
      await Promise.all([
        setDoc(doc(db, 'users', customerId), noteUpdates, { merge: true }),
        setDoc(doc(db, 'customers', customerId), noteUpdates, { merge: true })
      ]);

      fetch(`/api/admin/users/${customerId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      }).catch(() => {});
    } catch (err: any) {
      console.error('Failed to save customer notes:', err);
      throw err;
    }
  };

  // Account Toggle Handler (Real Firestore write to `users/{userId}` and `customers/{userId}`)
  const handleToggleAccountStatus = async (customerId: string, currentDisabled: boolean) => {
    try {
      const nextDisabled = !currentDisabled;
      const statusUpdates = {
        disabled: nextDisabled,
        status: nextDisabled ? 'disabled' : 'active',
        updatedAt: serverTimestamp()
      };
      await Promise.all([
        setDoc(doc(db, 'users', customerId), statusUpdates, { merge: true }),
        setDoc(doc(db, 'customers', customerId), statusUpdates, { merge: true })
      ]);

      // Also call backend API endpoint for dual guarantee
      fetch(`/api/admin/users/${customerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: nextDisabled, status: nextDisabled ? 'disabled' : 'active' })
      }).catch(() => {});
    } catch (err: any) {
      console.error('Error toggling account status:', err);
      alert(`Could not update account status: ${err?.message || 'Permission or network error'}`);
    }
  };

  // Delete Single Customer Handler
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete customer');
      }
      setSelectedCustomer(null);
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      alert(`Could not delete customer: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  // Remove All Customers Handler
  const handleRemoveAllCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove all customers');
      }
      setSelectedCustomer(null);
    } catch (err: any) {
      console.error('Error removing all customers:', err);
      alert(`Could not remove all customers: ${err?.message || 'Unknown error'}`);
      throw err;
    }
  };

  // Support Ticket Status Update
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      // 1. Update Firestore
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // 2. Call backend route
      fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});
    } catch (err: any) {
      console.error('Failed to update ticket status:', err);
      throw err;
    }
  };

  // Send Ticket Reply / Internal Note
  const handleSendTicketReply = async (ticketId: string, message: string, isInternal: boolean) => {
    const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'admin_panel',
        senderName: 'Store Support Admin',
        senderRole: 'admin',
        message,
        isInternal: Boolean(isInternal)
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send message');
    }
  };

  // Return Processing
  const handleProcessReturn = async (payload: {
    returnId: string;
    status: string;
    disposition?: string;
    adminNotes?: string;
  }) => {
    // 1. Direct Firestore update for instantaneous UI reactivity
    const retRef = doc(db, 'return_requests', payload.returnId);
    const updates: any = {
      status: payload.status,
      updatedAt: serverTimestamp()
    };
    if (payload.disposition) updates.disposition = payload.disposition;
    if (payload.adminNotes !== undefined) updates.adminNotes = payload.adminNotes;
    await updateDoc(retRef, updates);

    // 2. Call backend route for inventory logging & business events
    fetch(`/api/admin/support/returns/${payload.returnId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  };

  // Real Gateway / Store Credit Refund Execution via `/api/admin/orders/refund`
  const handleExecuteRefund = async (payload: {
    orderId: string;
    refundAmount: number;
    reason: string;
    restoreStock: boolean;
    returnId: string;
    refundDestination?: 'original_payment' | 'store_credit';
  }): Promise<{ success: boolean; razorpayRefundId?: string; error?: string }> => {
    try {
      const response = await fetch('/api/admin/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: payload.orderId,
          refundAmount: payload.refundAmount,
          reason: payload.reason,
          restoreStock: payload.restoreStock,
          adminEmail: 'Admin',
          returnId: payload.returnId,
          refundDestination: payload.refundDestination || 'original_payment'
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: resData.error || 'Payment gateway refund failed'
        };
      }

      // If Razorpay succeeded, update Return document to 'completed' / 'refunded'
      const retRef = doc(db, 'return_requests', payload.returnId);
      await updateDoc(retRef, {
        status: 'completed',
        refundStatus: 'issued',
        razorpayRefundId: resData.razorpayRefundId || `rfnd_${Date.now()}`,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        razorpayRefundId: resData.razorpayRefundId
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error executing refund'
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Integrated Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-slate-800" size={24} />
              Customer & Support Hub
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-100">
              {customersData.length} Customers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Easily manage store customers, support conversations, and product returns in one simple dashboard.
          </p>
        </div>

        {/* Cohesive Sub-Tabs (All Customers, Support Requests, Returns & Refunds) */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1 self-start sm:self-auto overflow-x-auto scrollbar-none">
          <button
            id="admin-subtab-customers-btn"
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>All Customers</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {customersData.length}
            </span>
          </button>

          <button
            id="admin-subtab-support-btn"
            onClick={() => setActiveSubTab('support')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'support'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>Support Requests</span>
            {activeTicketsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {activeTicketsCount}
              </span>
            )}
          </button>

          <button
            id="admin-subtab-returns-btn"
            onClick={() => setActiveSubTab('returns')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'returns'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-purple-600" />
            <span>Returns & Refunds</span>
            {activeReturnsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white">
                {activeReturnsCount}
              </span>
            )}
          </button>

          <button
            id="admin-subtab-store-credit-btn"
            onClick={() => setActiveSubTab('store-credit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'store-credit'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Wallet className="w-4 h-4 text-purple-600" />
            <span>Store Credit</span>
          </button>

          <button
            id="admin-customer-migration-audit-btn"
            onClick={() => setIsMigrationModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            title="Step 4 Customer Identity Migration & Audit"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Identity Audit & Migration</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ALL CUSTOMERS */}
      {activeSubTab === 'all' && (
        <CustomerList
          customers={customersData}
          loading={loading}
          onSelectCustomer={(cust) => setSelectedCustomer(cust)}
          onAddCustomer={() => setIsAddCustomerOpen(true)}
          onViewOrders={(email) => {
            if (onNavigateTab) {
              onNavigateTab('orders', { customerEmail: email });
            }
          }}
          onToggleStatus={handleToggleAccountStatus}
          onDeleteCustomer={handleDeleteCustomer}
          onRemoveAllCustomers={handleRemoveAllCustomers}
        />
      )}

      {/* SUB-TAB 2: SUPPORT REQUESTS */}
      {activeSubTab === 'support' && (
        <SupportRequestsManager
          tickets={rawTickets}
          loading={loading}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onSendReply={handleSendTicketReply}
          onViewOrder={(ordId) => {
            const match = rawOrders.find(o => o.id === ordId);
            if (match) {
              setInspectingOrder(match as Order);
            } else if (onNavigateTab) {
              onNavigateTab('orders', { orderId: ordId });
            }
          }}
          initialSelectedTicketId={initialTicketIdToOpen}
        />
      )}

      {/* SUB-TAB 3: RETURNS & REFUNDS */}
      {activeSubTab === 'returns' && (
        <ReturnsManager
          returns={rawReturns}
          loading={loading}
          onProcessReturn={handleProcessReturn}
          onExecuteRefund={handleExecuteRefund}
          onViewOrder={(ordId) => {
            const match = rawOrders.find(o => o.id === ordId);
            if (match) {
              setInspectingOrder(match as Order);
            } else if (onNavigateTab) {
              onNavigateTab('orders', { orderId: ordId });
            }
          }}
          initialSelectedReturnId={initialReturnIdToOpen}
        />
      )}

      {/* SUB-TAB 4: STORE CREDIT */}
      {activeSubTab === 'store-credit' && (
        <StoreCreditManager
          onViewOrder={(ordId) => {
            const match = rawOrders.find(o => o.id === ordId);
            if (match) {
              setInspectingOrder(match as Order);
            } else if (onNavigateTab) {
              onNavigateTab('orders', { orderId: ordId });
            }
          }}
          onViewCustomer={(custEmailOrId) => {
            const match = customersData.find(c => c.id === custEmailOrId || c.email === custEmailOrId);
            if (match) {
              setSelectedCustomer(match);
            }
          }}
        />
      )}

      {/* CUSTOMER DETAILS MODAL */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        onToggleAccountStatus={handleToggleAccountStatus}
        onDeleteCustomer={handleDeleteCustomer}
        onSaveNotes={handleSaveCustomerNotes}
        onViewOrder={(ord) => setInspectingOrder(ord as Order)}
        onViewReturn={(ret) => {
          setSelectedCustomer(null);
          setActiveSubTab('returns');
          setInitialReturnIdToOpen(ret.id);
        }}
        onViewTicket={(tk) => {
          setSelectedCustomer(null);
          setActiveSubTab('support');
          setInitialTicketIdToOpen(tk.id);
        }}
        onGoToOrders={(email) => {
          if (onNavigateTab) {
            onNavigateTab('orders', { customerEmail: email });
          }
        }}
      />

      {/* ADD CUSTOMER MODAL */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      {/* STEP 4 CUSTOMER IDENTITY & MIGRATION AUDIT MODAL */}
      <CustomerMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onMigrationComplete={() => {
          fetchConflicts();
        }}
      />

      {/* ORDER DETAILS INSPECTOR MODAL */}
      {inspectingOrder && (
        <OrderDetailsModal
          order={inspectingOrder}
          onClose={() => setInspectingOrder(null)}
          onViewInvoice={() => {}}
          onUpdateStatus={async (orderId, newStatus) => {
            try {
              const orderRef = doc(db, 'orders', orderId);
              await updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() });
              setInspectingOrder(prev => prev ? { ...prev, status: newStatus } : null);
            } catch (e) {
              console.error(e);
            }
          }}
          onUpdateFulfillment={async () => {}}
          onTriggerCancel={() => {}}
          onTriggerReturn={() => {}}
          onTriggerRefund={() => {}}
        />
      )}
    </div>
  );
}
