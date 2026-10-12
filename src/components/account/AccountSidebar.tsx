import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStaffRoleInfo } from '../../utils/staffPermissions';
import { useWishlistCount } from '../../context/ShopContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  User, 
  ShieldCheck, 
  LogOut, 
  CreditCard,
  ChevronRight,
  Heart,
  Star,
  Bell,
  Building2,
  Lock,
  FileCheck,
  Headphones,
  FileQuestion,
  RotateCcw,
  Receipt,
  LayoutDashboard,
  MapPin,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { Order } from '../../types';

// Module-level caches for instant badge rendering
const cachedCounts: Record<string, {
  unreadNotifications: number;
  reviews: number;
  tickets: number;
  returns: number;
  addresses: number;
  orders: number;
  gstin?: string;
  fetchedAt: number;
}> = {};

interface AccountSidebarProps {
  activeView?: string;
}

export function AccountSidebar({ activeView: propsActiveView }: AccountSidebarProps) {
  const { user, logout } = useAuth();
  const staffRole = useMemo(() => getStaffRoleInfo(user), [user]);
  const wishlistCount = useWishlistCount();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active view from props or URL
  const activeView = useMemo(() => {
    if (propsActiveView) return propsActiveView;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    
    if (location.pathname === '/orders') return 'orders';
    if (location.pathname === '/wishlist') return 'wishlist';
    if (location.pathname === '/notifications') return 'notifications';
    if (location.pathname === '/help' || location.pathname === '/support') return 'help';
    
    if (viewParam) return viewParam;
    return 'dashboard';
  }, [propsActiveView, location.pathname, location.search]);

  // Live Firestore Counts & Badges State
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.unreadNotifications : 0) || 0);
  const [reviewsCount, setReviewsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.reviews : 0) || 0);
  const [activeTicketsCount, setActiveTicketsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.tickets : 0) || 0);
  const [activeReturnsCount, setActiveReturnsCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.returns : 0) || 0);
  const [addressesCount, setAddressesCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.addresses : 0) || 0);
  const [ordersCount, setOrdersCount] = useState<number>(() => (user ? cachedCounts[user.uid]?.orders : 0) || 0);
  const [gstin, setGstin] = useState<string>(() => (user ? cachedCounts[user.uid]?.gstin : '') || '');

  // Subscribe to real-time order count
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrdersCount(snapshot.size);
      if (cachedCounts[user.uid]) {
        cachedCounts[user.uid].orders = snapshot.size;
      }
    }, (err) => {
      console.warn("Sidebar orders count subscription note:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Consolidated background fetch for customer badge counts & profile info
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
      getDoc(doc(db, 'users', user.uid)).catch(() => null),
    ]).then(([notifsSnap, reviewsSnap, ticketsSnap, returnsSnap, addressesSnap, userDoc]) => {
      const activeTickets = (ticketsSnap?.docs || []).filter((d: any) => {
        const s = d.data?.()?.status;
        return s !== 'closed' && s !== 'resolved';
      }).length;
      const activeReturns = (returnsSnap?.docs || []).filter((d: any) => {
        const s = d.data?.()?.status;
        return s !== 'refunded' && s !== 'rejected';
      }).length;

      const userGstin = userDoc && userDoc.exists() ? (userDoc.data()?.gstin || '') : '';

      const countsObj = {
        unreadNotifications: notifsSnap?.size || 0,
        reviews: reviewsSnap?.size || 0,
        tickets: activeTickets,
        returns: activeReturns,
        addresses: addressesSnap?.size || 0,
        orders: ordersCount,
        gstin: userGstin,
        fetchedAt: Date.now()
      };

      cachedCounts[user.uid] = countsObj;
      setUnreadNotificationsCount(countsObj.unreadNotifications);
      setReviewsCount(countsObj.reviews);
      setActiveTicketsCount(countsObj.tickets);
      setActiveReturnsCount(countsObj.returns);
      setAddressesCount(countsObj.addresses);
      if (userGstin) setGstin(userGstin);
    }).catch(e => {
      console.warn("Sidebar badge counts fetch notice:", e?.message || e);
    });
  }, [user, ordersCount]);

  const navigateToView = (view: string, status?: string) => {
    if (view === 'dashboard') {
      navigate('/account');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'orders') {
      const url = status ? `/account?view=orders&status=${status}` : '/account?view=orders';
      navigate(url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'wishlist') {
      navigate('/account?view=wishlist');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (view === 'notifications') {
      navigate('/account?view=notifications');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigate(`/account?view=${view}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) return null;

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

      {/* Navigation Menu (Grouped Navigation) */}
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
            {ordersCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                {ordersCount}
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
}
