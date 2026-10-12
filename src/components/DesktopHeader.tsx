import React, { useState, FormEvent, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, User, Search, X, MapPin, Grid, LogOut,
  ShoppingBag, Package, Award, ShieldCheck, LogIn, Phone,
  ChevronDown, Mic, QrCode, Flame, Sparkles
} from 'lucide-react';
import { useAuth, isOwnerUser, isAdminEmail, isAdminOrOwner } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCart, useCartCount, useWishlistCount } from '../context/ShopContext';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { isUserAdminOrOwner, canAccessAdminTab } from '../utils/staffPermissions';
import { useLocation as useHyperlocalLocation } from '../context/LocationContext';
import { NotificationCenter } from './NotificationCenter';
import './DesktopHeader.css';

const PLACEHOLDER_QUERIES = [
  'smartphones, laptops & accessories...',
  'noise cancelling wireless earbuds...',
  '4K smart TVs & soundbars...',
  'fast chargers & gaming gear...',
  'smartwatches & fitness bands...',
];

export function DesktopHeader() {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { categories } = useCategories();
  const { products } = useProducts();
  const { cartTotal } = useCart();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const location = useLocation();
  const navigate = useNavigate();
  const { location: deliveryLocation, openLocationModal } = useHyperlocalLocation();

  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isHomePage = location.pathname === '/' || location.pathname === '';

  // Desktop Scroll Behavior:
  // On downward scroll on homepage, the top utility row collapses smoothly
  // while the Search and Category navigation bars remain pinned and sticky.
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 25) {
        setIsScrolledDown(false);
        prevScrollY.current = currentY;
        return;
      }

      const diff = currentY - prevScrollY.current;
      if (Math.abs(diff) < 5) return;

      if (diff > 0 && currentY > 60) {
        setIsScrolledDown(true);
      } else if (diff < 0) {
        setIsScrolledDown(false);
      }
      prevScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route navigation
  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  // Keyboard shortcut to close popups
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccountMenuOpen(false);
        setIsVoiceSearchOpen(false);
        setIsQrScannerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Rotating placeholder query
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_QUERIES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Real categories extracted strictly from catalog
  const dynamicCategories = useMemo(() => {
    const list: { id: string; name: string; url: string; isAllDeals?: boolean; isForYou?: boolean }[] = [
      { id: 'for-you', name: 'For You', url: '/', isForYou: true },
    ];

    const dbActive = (categories || []).filter(c => c.active !== false);
    if (dbActive.length > 0) {
      dbActive.forEach(c => {
        list.push({
          id: c.id,
          name: c.name,
          url: `/shop?category=${encodeURIComponent(c.name)}`,
        });
      });
    } else if (settings?.homepage?.quickCategories && settings.homepage.quickCategories.length > 0) {
      settings.homepage.quickCategories.filter(c => c.enabled !== false).forEach(c => {
        list.push({
          id: c.id,
          name: c.title,
          url: c.link || `/shop?category=${encodeURIComponent(c.title)}`,
        });
      });
    } else {
      const seen = new Set<string>();
      products.forEach(p => {
        if (p.category && !seen.has(p.category.trim())) {
          seen.add(p.category.trim());
          list.push({
            id: p.category.toLowerCase().replace(/\s+/g, '-'),
            name: p.category.trim(),
            url: `/shop?category=${encodeURIComponent(p.category.trim())}`,
          });
        }
      });
    }

    list.push({ 
      id: 'deals', 
      name: 'Top Deals', 
      url: '/shop?sale=true',
      isAllDeals: true 
    });

    return list;
  }, [categories, settings?.homepage?.quickCategories, products]);

  // Search submission
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const queryToUse = searchQuery.trim() || PLACEHOLDER_QUERIES[placeholderIndex].replace('...', '');
    if (queryToUse) {
      navigate(`/shop?q=${encodeURIComponent(queryToUse)}`);
    }
  };

  // Voice Search Web Speech API
  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsVoiceSearchOpen(true);
        recognition.start();

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          setSearchQuery(speechResult);
          setIsVoiceSearchOpen(false);
          navigate(`/shop?q=${encodeURIComponent(speechResult)}`);
        };

        recognition.onerror = () => setIsVoiceSearchOpen(false);
        recognition.onend = () => setIsVoiceSearchOpen(false);
      } catch {
        setIsVoiceSearchOpen(true);
      }
    } else {
      setIsVoiceSearchOpen(true);
    }
  };

  const isAuthorizedForAdmin = useMemo(() => {
    if (!user) return false;
    return isUserAdminOrOwner(user) || isAdminOrOwner(user) || isOwnerUser(user) || canAccessAdminTab(user, 'dashboard') || user.role === 'staff' || user.role === 'manager';
  }, [user]);

  const storeName = settings.general?.storeName || 'ELECTRO STORE';
  const shortStoreName = settings.general?.shortStoreName || (storeName ? storeName.split(' ')[0] : 'ELECTRO');
  const logoUrl = (settings.branding?.primaryLogo || settings.general?.storeLogoUrl || '/assets/logo.svg').trim();

  const { logoPart1, logoPart2 } = useMemo(() => {
    let p1 = shortStoreName || storeName || 'Store';
    let p2 = '';
    if (storeName && shortStoreName && storeName.toLowerCase().startsWith(shortStoreName.toLowerCase())) {
      p1 = storeName.slice(0, shortStoreName.length);
      p2 = storeName.slice(shortStoreName.length).trim();
    } else if (storeName) {
      const parts = storeName.split(' ');
      p1 = parts[0];
      p2 = parts.slice(1).join(' ');
    }
    return { logoPart1: p1, logoPart2: p2 };
  }, [storeName, shortStoreName]);

  return (
    <>
      {/* Voice Search Modal */}
      {isVoiceSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/50 animate-pulse">
              <Mic size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Listening...</h3>
            <p className="text-xs text-slate-500">Speak the product or brand you are searching for</p>
            <button
              onClick={() => setIsVoiceSearchOpen(false)}
              className="mt-2 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* QR Code / Barcode Scanner Modal */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <QrCode size={36} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Product Scanner</h3>
            <p className="text-xs text-slate-500">Scan barcodes or QR codes for instant product details</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 font-medium">
              Camera scanning active
            </div>
            <button
              onClick={() => setIsQrScannerOpen(false)}
              className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          DESKTOP HEADER CONTAINER
          Using the store's exact signature blue gradient & design system
          ========================================================================= */}
      <header className="desktop-header-container w-full bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white sticky top-0 z-40 shadow-md select-none transition-all">
        
        {/* =========================================================================
            ROW 1: TOP BRAND & UTILITY ROW
            [ ELECTRO STORE ]  [ Deliver to / Location ]       [ Wishlist ] [ Cart ] [ Account ]
            ========================================================================= */}
        <div 
          className={`transition-all duration-300 ease-in-out ${
            isHomePage && isScrolledDown 
              ? 'max-h-0 opacity-0 py-0 pointer-events-none overflow-hidden' 
              : 'max-h-16 opacity-100 py-2.5 overflow-visible'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 flex items-center justify-between gap-6">
            
            {/* Left: Brand Logo & Delivery Location */}
            <div className="flex items-center gap-6 lg:gap-8 shrink-0">
              {/* Brand Logo */}
              <Link to="/" className="flex items-center group shrink-0 pl-0" title={storeName}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className="object-contain object-left shrink-0 transition-opacity group-hover:opacity-95" 
                    style={{
                      width: 'auto',
                      maxWidth: `${settings.branding?.logoSizes?.desktopHeaderWidth || 180}px`,
                      height: 'auto',
                      maxHeight: '44px',
                      objectFit: 'contain',
                      objectPosition: 'left center'
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/assets/logo.svg')) {
                        target.src = '/assets/logo.svg';
                      }
                    }}
                  />
                ) : (
                  <>
                    <span className="text-xl lg:text-2xl font-black text-white tracking-tight leading-none italic group-hover:opacity-95 transition-opacity">
                      {logoPart1}
                    </span>
                    {logoPart2 && (
                      <span className="ml-1 text-amber-300 not-italic font-bold text-lg lg:text-xl">
                        {logoPart2}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Deliver to / Location Pill (matching mobile visual language) */}
              <button
                type="button"
                onClick={openLocationModal}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-all cursor-pointer truncate max-w-[220px] lg:max-w-[280px]"
                title="Change Delivery Location"
              >
                <MapPin size={13} className="text-amber-300 shrink-0" />
                <span className="truncate">
                  <span className="opacity-75 font-normal mr-1">Deliver to</span>
                  <span className="font-bold">{deliveryLocation.addressName ? `${deliveryLocation.addressName} (${deliveryLocation.city})` : (deliveryLocation.city || 'Select Area')}</span>{' '}
                  <span className="font-mono text-[11px] opacity-80">({deliveryLocation.pincode || 'Set PIN'})</span>
                </span>
                <ChevronDown size={12} className="opacity-70 shrink-0 ml-0.5" />
              </button>
            </div>

            {/* Right: Cart, Account Dropdown */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              
              {/* Shopping Cart Link */}
              <Link
                to="/cart"
                className="flex items-center gap-2.5 h-9 px-3.5 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-xl border border-white/15 transition-all group shrink-0 select-none cursor-pointer"
                title="Shopping Cart"
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} className="text-white group-hover:scale-105 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-blue-800 leading-none shadow-xs">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-center text-left leading-none">
                  <span className="text-[10px] text-white/70 font-semibold tracking-tight uppercase">Cart</span>
                  <span className="text-xs font-bold text-amber-300 mt-0.5 whitespace-nowrap">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </Link>

              {/* Account Dropdown or Login Button */}
              <div className="relative" ref={accountMenuRef}>
                {user ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAccountMenuOpen((prev) => !prev);
                    }}
                    className="flex items-center gap-2 h-9 px-3 bg-transparent hover:bg-white/10 rounded-xl transition-all cursor-pointer select-none"
                    aria-expanded={isAccountMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white/15 flex items-center justify-center shrink-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={15} className="text-white" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-white max-w-[110px] lg:max-w-[130px] truncate">
                      {user.displayName ? user.displayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Account')}
                    </span>
                    <ChevronDown size={13} className={`opacity-80 shrink-0 transition-transform duration-150 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-900 rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <LogIn size={14} />
                    <span>Login</span>
                  </Link>
                )}

                {/* Account Menu Popup Card */}
                {isAccountMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                      <p className="text-[11px] text-slate-400 font-medium">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{user.displayName || user.email || 'Account User'}</p>
                      {user.email && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <User size={15} className="text-slate-400" />
                        <span>Your Account</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <Package size={15} className="text-slate-400" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/account?tab=addresses"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <MapPin size={15} className="text-slate-400" />
                        <span>Addresses</span>
                      </Link>

                      <Link
                        to="/account?tab=wishlist"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <Heart size={15} className="text-slate-400" />
                        <span>Wishlist ({wishlistCount})</span>
                      </Link>

                      <Link
                        to="/rewards"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <Award size={15} className="text-slate-400" />
                        <span>Rewards</span>
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            ROW 2: MAIN SEARCH BAR ROW
            [              Search products...              ]  🔍
            (Only rendered on homepage as required, seamlessly on same blue gradient)
            ========================================================================= */}
        {isHomePage && (
          <div className="w-full py-2.5 px-4 lg:px-6 xl:px-8">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              {/* Large prominent search box */}
              <form
                onSubmit={handleSearchSubmit}
                className="w-full flex items-center bg-white rounded-xl shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-transparent transition-all h-[42px]"
              >
                <Search size={18} className="text-slate-400 shrink-0 ml-3.5 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search for ${PLACEHOLDER_QUERIES[placeholderIndex]}`}
                  className="flex-1 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium truncate"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}

                <div className="flex items-center gap-1.5 pr-2 pl-2 border-l border-slate-200/80 shrink-0">
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Voice Search"
                  >
                    <Mic size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Scan Barcode / QR"
                  >
                    <QrCode size={17} />
                  </button>
                </div>

                {/* 🔍 Search Submit Button */}
                <button
                  type="submit"
                  className="h-full px-5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Search"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROW 3: CATEGORY NAVIGATION ROW
            All Categories   For You   Smartphones   Laptops   Audio   Top Deals
            (Only rendered on homepage as required, seamless gradient)
            ========================================================================= */}
        {isHomePage && (
          <div className="w-full">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-2 flex items-center gap-6 lg:gap-7 overflow-x-auto no-scrollbar whitespace-nowrap text-xs font-semibold">
              
              {/* "All Categories" emphasized link */}
              <Link
                to="/categories"
                className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors shrink-0 font-bold"
              >
                <Grid size={14} />
                <span>All Categories</span>
              </Link>

              {/* Horizontal List of Categories */}
              {dynamicCategories.map((cat) => {
                const isCurrentActive = 
                  (cat.url === '/' && (location.pathname === '/' || location.pathname === '')) ||
                  (cat.url !== '/' && (location.pathname + location.search) === cat.url);

                return (
                  <Link
                    key={cat.id}
                    to={cat.url}
                    className={`py-1 transition-colors relative flex items-center gap-1.5 shrink-0 ${
                      isCurrentActive 
                        ? 'text-white font-bold' 
                        : 'text-white/80 hover:text-white font-medium'
                    }`}
                  >
                    {cat.isAllDeals && <Flame size={14} className="text-amber-300 fill-current" />}
                    {cat.isForYou && <Sparkles size={14} className="text-amber-300" />}
                    <span>{cat.name}</span>
                    {isCurrentActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-300 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default DesktopHeader;

