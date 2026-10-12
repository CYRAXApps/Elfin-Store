import { DashboardWidgets } from "../components/account/DashboardWidgets";
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, isAdminOrOwner, isOwnerUser } from '../context/AuthContext';
import { getStaffRoleInfo, canAccessAdminPanel } from '../utils/staffPermissions';
import { useWishlistCount } from '../context/ShopContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  FileText, 
  ExternalLink, 
  MapPin, 
  Copy, 
  Check, 
  HelpCircle, 
  RotateCcw, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  ShoppingBag, 
  CreditCard,
  ChevronRight,
  Heart,
  Eye,
  Star,
  Bell,
  Building2,
  Lock,
  ArrowLeft,
  Settings,
  AlertCircle,
  FileCheck,
  CheckCircle,
  XCircle,
  KeyRound,
  Sliders,
  ShieldAlert,
  Headphones,
  FileQuestion,
  Receipt,
  Layers,
  LayoutDashboard,
  Wallet,
  Store
} from 'lucide-react';
import { Order } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { AddressManager } from '../components/AddressManager';
import { ProfileDetailsManager } from '../components/ProfileDetailsManager';
import { AccountSecurityManager } from '../components/AccountSecurityManager';
import { AccountPreferencesManager } from '../components/AccountPreferencesManager';
import { WishlistSubView } from '../components/account/WishlistSubView';
import { ReviewsSubView } from '../components/account/ReviewsSubView';
import { NotificationsSubView } from '../components/account/NotificationsSubView';
import { RecentlyViewedSubView } from '../components/account/RecentlyViewedSubView';
import { OrdersSubView } from '../components/account/OrdersSubView';
import { CustomerPaymentMethodsSubView } from '../components/account/CustomerPaymentMethodsSubView';
import { PartnerProgramSubView } from '../components/account/PartnerProgramSubView';
import { HelpAndSupportSection } from '../components/account/HelpAndSupportSection';
import { OrderHelpModal } from '../components/account/OrderHelpModal';

// Module-level cache for instantaneous Account tab transitions
const cachedUserOrders: Record<string, Order[]> = {};
const cachedUserProfile: Record<string, { gstin?: string; businessName?: string }> = {};
const cachedCounts: Record<string, {
  unreadNotifications: number;
  reviews: number;
  tickets: number;
  returns: number;
  addresses: number;
  fetchedAt: number;
}> = {};

export function Account() {
  const { user, firebaseUser, logout } = useAuth();
  const staffRole = useMemo(() => getStaffRoleInfo(user), [user]);
  const wishlistCount = useWishlistCount();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view: 'dashboard' by default, or 'orders', 'profile', 'addresses', 'payments', 'gst', 'security', 'preferences', 'partner', 'wishlist', 'recently-viewed', 'reviews', 'notifications', 'help', 'tickets', 'returns', 'refunds', 'support'
  const viewParam = searchParams.get('view') || searchParams.get('tab');
  const validViews = ['orders', 'profile', 'addresses', 'payments', 'gst', 'security', 'preferences', 'partner', 'wishlist', 'recently-viewed', 'reviews', 'notifications', 'help', 'tickets', 'returns', 'refunds', 'support'];
  const activeView = (viewParam && validViews.includes(viewParam)) 
    ? viewParam 
    : 'dashboard';

  // Active filter for orders: 'all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returns'
  const initialFilter = searchParams.get('status') || 'all';
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>(initialFilter);

  // Orders State with instant cache
  const [orders, setOrders] = useState<Order[]>(() => (user ? cachedUserOrders[user.uid] : []) || []);
  const [loadingOrders, setLoadingOrders] = useState(() => !(user && cachedUserOrders[user.uid]));
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedHelpOrder, setSelectedHelpOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Customer GST & Business Info State with cache
  const [gstin, setGstin] = useState(() => (user ? cachedUserProfile[user.uid]?.gstin : '') || '');
  const [businessName, setBusinessName] = useState(() => (user ? cachedUserProfile[user.uid]?.businessName : '') || '');
  const [savingGst, setSavingGst] = useState(false);
  const [gstSuccessMsg, setGstSuccessMsg] = useState('');

  // Password reset message state
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // Live Firestore Counts & Badges State initialized from cache
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.unreadNotifications : 0) || 0);
  const [reviewsCount, setReviewsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.reviews : 0) || 0);
  const [activeTicketsCount, setActiveTicketsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.tickets : 0) || 0);
  const [activeReturnsCount, setActiveReturnsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.returns : 0) || 0);
  const [addressesCount, setAddressesCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.addresses : 0) || 0);

  // Recently viewed count from local storage
  const recentlyViewedCount = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('electro_recently_viewed') || '[]');
      return Array.isArray(stored) ? stored.length : 0;
    } catch {
      return 0;
    }
  }, []);

  // Synchronize orderStatusFilter when searchParams change
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setOrderStatusFilter(status);
    }
  }, [searchParams]);

  // Fetch real customer orders with background real-time sync and caching
  useEffect(() => {
    if (!user) {
      setLoadingOrders(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      fetchedOrders.sort((a, b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      cachedUserOrders[user.uid] = fetchedOrders;
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    }, (error) => {
      console.warn("Notice fetching orders in Account:", error?.message || error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch customer user profile details (GST, etc.) with cache and offline resilience
  useEffect(() => {
    if (!user) return;
    if (cachedUserProfile[user.uid]) {
      const c = cachedUserProfile[user.uid];
      if (c.gstin) setGstin(c.gstin);
      if (c.businessName) setBusinessName(c.businessName);
      return;
    }
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid)).catch(() => null);
        if (userDoc && userDoc.exists()) {
          const data = userDoc.data();
          cachedUserProfile[user.uid] = { gstin: data.gstin, businessName: data.businessName };
          if (data.gstin) setGstin(data.gstin);
          if (data.businessName) setBusinessName(data.businessName);
        } else {
          // Check if user object from auth context has profile fields
          const uAny = user as any;
          if (uAny?.gstin) setGstin(uAny.gstin);
          if (uAny?.businessName) setBusinessName(uAny.businessName);
        }
      } catch (e: any) {
        // Fallback gracefully without unhandled errors if client is offline or DB pending
        const uAny = user as any;
        if (uAny?.gstin) setGstin(uAny.gstin);
        if (uAny?.businessName) setBusinessName(uAny.businessName);
        console.warn("Notice fetching user profile data (using local session fallback):", e?.message || e);
      }
    };
    fetchUserProfile();
  }, [user]);

  // Efficient consolidated background fetch for customer badge counts (60s TTL cache)
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    const existing = cachedCounts[user.uid];
    if (existing && now - existing.fetchedAt < 60000) {
      return;
    }

    Promise.all([
      getDocs(query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false))).catch(() => ({ size: 0, docs: [] } as any)),
      getDocs(collection(db, 'users', user.uid, 'reviews')).catch(() => ({ size: 0, docs: [] } as any)),
      getDocs(query(collection(db, 'support_tickets'), where('userId', '==', user.uid))).catch(() => ({ size: 0, docs: [] } as any)),
      getDocs(query(collection(db, 'return_requests'), where('userId', '==', user.uid))).catch(() => ({ size: 0, docs: [] } as any)),
      getDocs(collection(db, 'users', user.uid, 'addresses')).catch(() => ({ size: 0, docs: [] } as any)),
    ]).then(([notifsSnap, reviewsSnap, ticketsSnap, returnsSnap, addressesSnap]) => {
      const activeTickets = (ticketsSnap?.docs || []).filter((d: any) => {
        const s = d.data?.()?.status;
        return s !== 'closed' && s !== 'resolved';
      }).length;
      const activeReturns = (returnsSnap?.docs || []).filter((d: any) => {
        const s = d.data?.()?.status;
        return s !== 'refunded' && s !== 'rejected';
      }).length;

      const countsObj = {
        unreadNotifications: notifsSnap?.size || 0,
        reviews: reviewsSnap?.size || 0,
        tickets: activeTickets,
        returns: activeReturns,
        addresses: addressesSnap?.size || 0,
        fetchedAt: Date.now()
      };

      cachedCounts[user.uid] = countsObj;
      setUnreadNotificationsCount(countsObj.unreadNotifications);
      setReviewsCount(countsObj.reviews);
      setActiveTicketsCount(countsObj.tickets);
      setActiveReturnsCount(countsObj.returns);
      setAddressesCount(countsObj.addresses);
    }).catch(e => {
      console.warn("Badge counts fetch notice:", e?.message || e);
    });
  }, [user]);

  // Calculate order counts from real data
  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      returns: orders.filter(o => o.status === 'returned').length,
    };
  }, [orders]);

  // Filtered orders list for Orders subview
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    if (orderStatusFilter === 'pending') return orders.filter(o => o.status === 'pending');
    if (orderStatusFilter === 'processing') return orders.filter(o => o.status === 'processing' || o.status === 'confirmed');
    if (orderStatusFilter === 'shipped') return orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery');
    if (orderStatusFilter === 'delivered') return orders.filter(o => o.status === 'delivered');
    if (orderStatusFilter === 'cancelled') return orders.filter(o => o.status === 'cancelled');
    if (orderStatusFilter === 'returns') return orders.filter(o => o.status === 'returned');
    return orders;
  }, [orders, orderStatusFilter]);

  const copyTracking = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'processing': return 3;
      case 'shipped': return 4;
      case 'out_for_delivery': return 5;
      case 'delivered': return 6;
      default: return 2;
    }
  };

  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingGst(true);
    setGstSuccessMsg('');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        gstin: gstin.trim().toUpperCase(),
        businessName: businessName.trim()
      }, { merge: true });
      setGstSuccessMsg('GST & Business details updated successfully!');
      setTimeout(() => setGstSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Error saving GST details:', err);
    } finally {
      setSavingGst(false);
    }
  };

  const navigateToView = (view: string, status?: string) => {
    const params = new URLSearchParams();
    if (view !== 'dashboard') {
      params.set('view', view);
    }
    if (status) {
      params.set('status', status);
      setOrderStatusFilter(status);
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // LOGGED-OUT STATE
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-220px)] bg-slate-50/60 flex flex-col justify-center items-center py-6 sm:py-10 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center my-auto">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/80 shadow-2xs">
            <User size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Account Sign In</h1>
          <p className="text-slate-500 text-xs mt-1.5 mb-6 leading-relaxed max-w-xs mx-auto">
            Please sign in to access your orders, saved delivery addresses, GST tax billing, and support requests.
          </p>
          <Link 
            to="/login?redirect=/account" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3.5 px-5 rounded-xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
          >
            Sign In to Account
          </Link>
          <div className="mt-4 text-xs text-slate-500 font-medium">
            Don't have an account? <Link to="/login?redirect=/account" className="text-blue-600 font-bold hover:underline">Register now</Link>
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP NAVIGATION SIDEBAR COMPONENT
  const renderSidebar = () => {
    const isDashboard = activeView === 'dashboard';
    
    return (
      <aside className="space-y-4">
        {/* User Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-lg font-black shadow-2xs shrink-0 ring-2 ring-blue-50 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : user.displayName ? (
                user.displayName.charAt(0).toUpperCase()
              ) : (
                <User size={22} />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block">Hello,</span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {user.displayName || 'Customer'}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {user.phoneNumber ? (user.phoneNumber.startsWith('+') ? user.phoneNumber : `+91 ${user.phoneNumber}`) : (user.email || 'Customer')}
              </p>
            </div>
          </div>
          {staffRole.canAccessAdmin && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${staffRole.badgeColor} border`}>
                  <ShieldCheck size={12} /> {staffRole.title}
                </span>
                <Link to="/admin" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1">
                  Open Panel &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {staffRole.canAccessPos && (
                  <Link to="/admin/pos" className="text-[11px] font-bold py-1.5 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center gap-1">
                    <Receipt size={12} /> POS Terminal
                  </Link>
                )}
                {staffRole.canAccessOrders && (
                  <Link to="/admin?tab=orders" className="text-[11px] font-bold py-1.5 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center gap-1">
                    <Package size={12} /> Orders
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu (Flipkart Style Grouping) */}
        <nav className="bg-white rounded-2xl shadow-xs border border-slate-200/80 divide-y divide-slate-100 text-xs overflow-hidden">
          
          {/* Dashboard Home Link */}
          <div className="p-2">
            <button
              onClick={() => navigateToView('dashboard')}
              className={`w-full px-3 py-2.5 rounded-xl font-bold flex items-center justify-between transition-colors cursor-pointer ${
                isDashboard 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard size={16} className={isDashboard ? 'text-blue-600' : 'text-slate-400'} />
                Account Overview
              </span>
              <ChevronRight size={13} className={isDashboard ? 'text-blue-600' : 'text-slate-300'} />
            </button>
          </div>

          {/* 1. PRIMARY SECTIONS */}
          <div className="p-2 space-y-0.5">
            <button
              onClick={() => navigateToView('orders', 'all')}
              className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeView === 'orders' 
                  ? 'bg-blue-50 text-blue-700 font-bold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package size={15} className={activeView === 'orders' ? 'text-blue-600' : 'text-slate-400'} />
                <span>My Orders</span>
              </div>
              {orderCounts.all > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {orderCounts.all}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateToView('wishlist')}
              className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeView === 'wishlist' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart size={15} className={activeView === 'wishlist' ? 'text-rose-500' : 'text-slate-400'} />
                <span>Wishlist</span>
              </div>
              {wishlistCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateToView('reviews')}
              className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeView === 'reviews' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star size={15} className={activeView === 'reviews' ? 'text-amber-500' : 'text-slate-400'} />
                <span>Reviews & Ratings</span>
              </div>
              {reviewsCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  {reviewsCount}
                </span>
              ) : (
                <ChevronRight size={12} className="text-slate-300" />
              )}
            </button>

            <button
              onClick={() => navigateToView('notifications')}
              className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeView === 'notifications' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell size={15} className={activeView === 'notifications' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Notifications</span>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          {/* 2. ACCOUNT SETTINGS */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User size={12} /> Account Settings
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateToView('profile')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'profile' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Profile Information</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>

              <button
                onClick={() => navigateToView('addresses')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'addresses' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Manage Addresses</span>
                {addressesCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {addressesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToView('gst')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'gst' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>GST & Business Details</span>
                {gstin && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Saved
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToView('preferences')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'preferences' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Account Preferences</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>
            </div>
          </div>

          {/* 3. PAYMENTS & WALLETS */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard size={12} /> Payments & Wallets
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateToView('payments')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'payments' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Saved Payment Methods</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>
            </div>
          </div>

          {/* 4. PRIVACY & SECURITY */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Privacy & Security
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateToView('security')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'security' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Login & Security</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>

              <Link
                to="/privacy"
                className="w-full px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between transition-colors"
              >
                <span>Privacy & Policy</span>
                <ChevronRight size={12} className="text-slate-300" />
              </Link>
            </div>
          </div>

          {/* 5. PARTNER PROGRAM */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 size={12} /> Partner Program
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateToView('partner')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'partner' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Partner Network & Benefits</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>

              <Link
                to="/partner/login"
                className="w-full px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between transition-colors"
              >
                <span>Partner Portal Login</span>
                <ExternalLink size={11} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* 6. HELP & SUPPORT */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Headphones size={12} /> Help & Support
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateToView('help')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'help' || activeView === 'support' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Help Center & FAQs</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>

              <button
                onClick={() => navigateToView('tickets')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'tickets' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>Support Tickets</span>
                {activeTicketsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {activeTicketsCount} active
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToView('returns')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'returns' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>My Returns</span>
                {activeReturnsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {activeReturnsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateToView('refunds')}
                className={`w-full px-3 py-2 rounded-xl font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeView === 'refunds' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <span>My Refunds</span>
                <ChevronRight size={12} className="text-slate-300" />
              </button>

              <Link
                to="/contact"
                className="w-full px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between transition-colors"
              >
                <span>Contact Us</span>
                <ExternalLink size={11} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* 7. OTHER & LEGAL */}
          <div className="p-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCheck size={12} /> Other
            </div>
            <div className="space-y-0.5">
              <Link
                to="/about"
                className="w-full px-3 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between transition-colors"
              >
                <span>About Store</span>
                <ChevronRight size={12} className="text-slate-300" />
              </Link>
              <Link
                to="/terms"
                className="w-full px-3 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between transition-colors"
              >
                <span>Terms of Service</span>
                <ChevronRight size={12} className="text-slate-300" />
              </Link>
              <Link
                to="/privacy"
                className="w-full px-3 py-1.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between transition-colors"
              >
                <span>Privacy Policy</span>
                <ChevronRight size={12} className="text-slate-300" />
              </Link>
            </div>
          </div>

          {/* 8. SIGN OUT */}
          <div className="p-2">
            <button
              onClick={() => logout()}
              className="w-full px-3 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut size={14} /> Sign Out
              </span>
              <ChevronRight size={13} className="text-red-300" />
            </button>
          </div>

        </nav>
      </aside>
    );
  };

  // ORDERS SUBVIEW COMPONENT (Clean e-commerce ordered product list)
  const renderOrdersSubview = () => (
    <OrdersSubView
      orders={orders}
      loading={loadingOrders}
      onOpenInvoice={setSelectedInvoiceOrder}
      onOpenHelp={setSelectedHelpOrder}
    />
  );

  // DESKTOP DASHBOARD OVERVIEW (Right column when activeView === 'dashboard')
  // UNIFIED ACCOUNT DASHBOARD OVERVIEW (Renders identical sections on mobile & desktop)
  const renderStandardAccountDashboard = (showProfileHeader: boolean) => (
    <div className="space-y-4">
      {/* Mobile Profile Header Card */}
      {showProfileHeader && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-lg font-black shadow-2xs shrink-0 ring-2 ring-blue-50 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <User size={22} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">
                    {user.displayName || 'Customer'}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {user.phoneNumber ? (user.phoneNumber.startsWith('+') ? user.phoneNumber : `+91 ${user.phoneNumber}`) : (user.email || 'Customer')}
                </p>
                <button 
                  onClick={() => navigateToView('profile')}
                  className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-1 cursor-pointer"
                >
                  View & Edit Profile <ChevronRight size={12} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {staffRole.canAccessAdmin && (
                <Link 
                  to="/admin" 
                  className={`px-2.5 py-1.5 ${staffRole.badgeColor} rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors`}
                  title="Open Admin Panel"
                >
                  <ShieldCheck size={14} /> {staffRole.badge}
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="p-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {staffRole.canAccessAdmin && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Link
                to="/admin"
                className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200 rounded-xl flex items-center justify-between transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${staffRole.badgeColor} flex items-center justify-center shrink-0 shadow-2xs`}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                        {staffRole.title}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {staffRole.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-600 font-medium">{staffRole.subtitle}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. 4 QUICK OPTIONS 2x2 GRID: My Orders, Wishlist, Reviews & Ratings, Notifications */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {/* My Orders */}
        <button
          onClick={() => navigateToView('orders', 'all')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs active:bg-blue-50/40 hover:border-blue-300 transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[125px] relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package size={18} />
            </div>
            {orderCounts.all > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {orderCounts.all}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between w-full mt-2">
            <div className="min-w-0 pr-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                My Orders
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {orderCounts.all > 0 ? `${orderCounts.all} ${orderCounts.all === 1 ? 'order' : 'orders'}` : 'View your orders'}
              </p>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0">
              <ChevronRight size={14} />
            </div>
          </div>
        </button>

        {/* Wishlist */}
        <button
          onClick={() => navigateToView('wishlist')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs active:bg-rose-50/40 hover:border-rose-300 transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[125px] relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Heart size={18} />
            </div>
            {wishlistCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                {wishlistCount}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between w-full mt-2">
            <div className="min-w-0 pr-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                Wishlist
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {wishlistCount} {wishlistCount === 1 ? 'item saved' : 'saved'}
              </p>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-rose-50 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0">
              <ChevronRight size={14} />
            </div>
          </div>
        </button>

        {/* Reviews & Ratings */}
        <button
          onClick={() => navigateToView('reviews')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs active:bg-amber-50/40 hover:border-amber-300 transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[125px] relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Star size={18} />
            </div>
            {reviewsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                {reviewsCount}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between w-full mt-2">
            <div className="min-w-0 pr-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                Reviews & Ratings
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0">
              <ChevronRight size={14} />
            </div>
          </div>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigateToView('notifications')}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs active:bg-indigo-50/40 hover:border-indigo-300 transition-all text-left group cursor-pointer flex flex-col justify-between min-h-[110px] sm:min-h-[125px] relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Bell size={18} />
            </div>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between w-full mt-2">
            <div className="min-w-0 pr-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                Notifications
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread` : 'No alerts'}
              </p>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0">
              <ChevronRight size={14} />
            </div>
          </div>
        </button>
      </div>

      <DashboardWidgets orders={orders} onNavigateView={navigateToView} />

      {/* Account Settings Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Account Settings</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <button
            onClick={() => navigateToView('profile')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <User size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Personal Information</p>
                <p className="text-slate-400 text-[11px]">{user.displayName || 'Customer'}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>

          <button
            onClick={() => navigateToView('addresses')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <MapPin size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">My Addresses</p>
                <p className="text-slate-400 text-[11px]">{addressesCount} saved destinations</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>

          <button
            onClick={() => navigateToView('gst')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <Building2 size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">GST / Business Details</p>
                <p className="text-slate-400 text-[11px]">{gstin ? `GSTIN: ${gstin}` : 'Save tax ID'}</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>

          <button
            onClick={() => navigateToView('preferences')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <Sliders size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Account Preferences</p>
                <p className="text-slate-400 text-[11px]">Notifications & language</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>
        </div>
      </div>

      {/* Payments & Wallets Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Payments & Wallets</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <button
            onClick={() => navigateToView('payments')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <CreditCard size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Saved Payment Methods</p>
                <p className="text-slate-400 text-[11px]">Saved cards & payment options</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>
        </div>
      </div>

      {/* Privacy & Security Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Privacy & Security</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <button
            onClick={() => navigateToView('security')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <Lock size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Login & Security</p>
                <p className="text-slate-400 text-[11px]">Credentials & password reset</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>

          <Link
            to="/privacy"
            className="w-full py-3 flex items-center justify-between text-slate-800 min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <ShieldCheck size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Privacy Policy</p>
                <p className="text-slate-400 text-[11px]">Data rights & privacy protection</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </Link>
        </div>
      </div>

      {/* Partner Program Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Partner Program</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <button
            onClick={() => navigateToView('partner')}
            className="w-full py-3 flex items-center justify-between text-left active:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <Building2 size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Partner Network & Benefits</p>
                <p className="text-slate-400 text-[11px]">Explore retail franchise program</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>

          <Link
            to="/partner/login"
            className="w-full py-3 flex items-center justify-between text-slate-800 min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <Store size={15} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Partner Portal Login</p>
                <p className="text-slate-400 text-[11px]">Access inventory & orders</p>
              </div>
            </div>
            <ExternalLink size={13} className="text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Help & Support Card */}
      <HelpAndSupportSection
        userId={user.uid}
        userEmail={user.email || ''}
        userName={user.displayName || ''}
        isStandaloneView={false}
        onNavigateView={navigateToView}
        userOrders={orders}
      />

      {/* Other & Legal */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileCheck size={16} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Other</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <Link
            to="/about"
            className="py-3 flex items-center justify-between text-slate-800 min-h-[44px]"
          >
            <span className="font-semibold">About Store</span>
            <ChevronRight size={14} className="text-slate-300" />
          </Link>

          <Link
            to="/terms"
            className="py-3 flex items-center justify-between text-slate-800 min-h-[44px]"
          >
            <span className="font-semibold">Terms of Service</span>
            <ChevronRight size={14} className="text-slate-300" />
          </Link>

          <Link
            to="/privacy"
            className="py-3 flex items-center justify-between text-slate-800 min-h-[44px]"
          >
            <span className="font-semibold">Privacy Policy</span>
            <ChevronRight size={14} className="text-slate-300" />
          </Link>

          <button
            onClick={() => logout()}
            className="w-full py-3 flex items-center justify-between text-left text-red-600 font-bold min-h-[44px] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <LogOut size={14} /> Sign Out
            </span>
            <ChevronRight size={14} className="text-red-300" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboardOverview = () => renderStandardAccountDashboard(false);
  const renderMobileDashboard = () => renderStandardAccountDashboard(true);

  // ACTIVE SUBVIEW RENDERER
  const renderActiveSubview = () => {
    switch (activeView) {
      case 'orders':
        return renderOrdersSubview();

      case 'profile':
        return <ProfileDetailsManager />;

      case 'addresses':
        return <AddressManager userId={user.uid} selectable={false} />;

      case 'gst':
        return (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6">
            <div className="pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">GST / Business Details</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Save your registered business name and GSTIN to receive automatic GST tax invoices for commercial input tax credit.
              </p>
            </div>

            {gstSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} /> {gstSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveGst} className="space-y-4 max-w-md text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Registered Business / Company Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter registered business name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  GSTIN (15-Digit Goods & Services Tax Number)
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="Enter GSTIN"
                  maxLength={15}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono uppercase outline-none focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: 2 digits state code + 10 chars PAN + 1 entity code + Z + 1 checksum digit.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingGst}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {savingGst ? 'Saving...' : 'Save GST Details'}
                </button>
              </div>
            </form>
          </div>
        );

      case 'security':
        return <AccountSecurityManager />;

      case 'preferences':
        return <AccountPreferencesManager />;

      case 'payments':
        return <CustomerPaymentMethodsSubView />;

      case 'partner':
        return <PartnerProgramSubView />;

      case 'wishlist':
        return <WishlistSubView />;

      case 'recently-viewed':
        return <RecentlyViewedSubView userId={user.uid} />;

      case 'reviews':
        return <ReviewsSubView userId={user.uid} onNavigateView={navigateToView} />;

      case 'notifications':
        return <NotificationsSubView userId={user.uid} onNavigateView={navigateToView} />;

      case 'help':
      case 'support':
      case 'tickets':
      case 'returns':
      case 'refunds':
        return (
          <HelpAndSupportSection
            userId={user.uid}
            userEmail={user.email || ''}
            userName={user.displayName || ''}
            isStandaloneView={true}
            activeSubTab={
              activeView === 'tickets' ? 'tickets' :
              activeView === 'returns' ? 'returns' :
              activeView === 'refunds' ? 'refunds' : 'help'
            }
            onNavigateView={navigateToView}
            userOrders={orders}
          />
        );

      default:
        return renderDashboardOverview();
    }
  };

  return (
    <AccountLayout activeView={activeView}>
      {activeView === 'dashboard' ? (
        <>
          <div className="block lg:hidden">{renderMobileDashboard()}</div>
          <div className="hidden lg:block">{renderDashboardOverview()}</div>
        </>
      ) : (
        renderActiveSubview()
      )}

      {/* GST INVOICE MODAL */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* ORDER HELP MODAL */}
      {selectedHelpOrder && (
        <OrderHelpModal
          order={selectedHelpOrder}
          userId={user.uid}
          userEmail={user.email || ''}
          userName={user.displayName || ''}
          onClose={() => setSelectedHelpOrder(null)}
          onTicketCreated={() => {
            navigateToView('tickets');
          }}
          onReturnInitiated={() => {
            navigateToView('returns');
          }}
        />
      )}
    </AccountLayout>
  );
}

export default Account;
