import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, User, Search, Menu, X, MapPin, Grid, LogOut,
  ShoppingBag, Package, Award, ShieldCheck, LogIn, Phone,
  ChevronRight, Mic, QrCode, Flame, ChevronDown, Check, Zap, Sparkles,
  Smartphone, Laptop, Headphones, Watch, Tv, Gamepad2, Camera
} from 'lucide-react';
import { useAuth, isOwnerUser, isAdminEmail, isAdminOrOwner } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCart, useCartCount, useWishlistCount } from '../context/ShopContext';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { useState, FormEvent, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { isUserAdminOrOwner, canAccessAdminTab } from '../utils/staffPermissions';
import { useLocation as useHyperlocalLocation } from '../context/LocationContext';
import { NotificationCenter } from './NotificationCenter';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const PLACEHOLDER_QUERIES = [
  'watches',
  'smartphones',
  'noise cancelling headphones',
  'gaming laptops',
  'fast chargers',
  '4k smart tv',
  'wireless earbuds',
];

function getCategoryIcon(name: string) {
  const n = (name || '').toLowerCase();
  if (n.includes('phone') || n.includes('mobile')) return Smartphone;
  if (n.includes('laptop') || n.includes('computer') || n.includes('pc')) return Laptop;
  if (n.includes('audio') || n.includes('headphone') || n.includes('earbud') || n.includes('sound')) return Headphones;
  if (n.includes('watch') || n.includes('wearable')) return Watch;
  if (n.includes('tv') || n.includes('television') || n.includes('screen')) return Tv;
  if (n.includes('game') || n.includes('gaming') || n.includes('console')) return Gamepad2;
  if (n.includes('camera') || n.includes('photo')) return Camera;
  if (n.includes('charge') || n.includes('power') || n.includes('cable') || n.includes('gan')) return Zap;
  return Grid;
}

export function MobileHeader() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Dynamic measurement of the outer header and top row rendered heights
  const [headerHeight, setHeaderHeight] = useState<number>(() => (location.pathname === '/' || location.pathname === '' ? 172 : 56));
  const [topRowHeight, setTopRowHeight] = useState<number>(56);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const prevScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const isHomePage = location.pathname === '/' || location.pathname === '';

  // Measure actual rendered heights dynamically using ResizeObserver
  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    const topRowEl = topRowRef.current;

    const measureHeights = () => {
      if (headerEl) {
        const h = headerEl.offsetHeight || Math.round(headerEl.getBoundingClientRect().height);
        if (h > 0) {
          setHeaderHeight(h);
        }
      }
      if (topRowEl) {
        const trh = topRowEl.offsetHeight || Math.round(topRowEl.getBoundingClientRect().height);
        if (trh > 0) {
          setTopRowHeight(trh);
        }
      }
    };

    measureHeights();

    const resizeObserver = new ResizeObserver(() => {
      measureHeights();
    });

    if (headerEl) resizeObserver.observe(headerEl);
    if (topRowEl) resizeObserver.observe(topRowEl);

    return () => resizeObserver.disconnect();
  }, [location.pathname, isHomePage]);

  // Dynamic offset to translate header:
  // - On homepage: Only hide the top main header row (logo, menu, location, actions), leaving search box sticky at top and categories row below it.
  // - On other pages: Hide the complete outer header.
  const hideOffset = useMemo(() => {
    if (!isHeaderHidden) return 0;
    if (isHomePage) {
      return topRowHeight;
    }
    return headerHeight + 2;
  }, [isHeaderHidden, isHomePage, topRowHeight, headerHeight]);

  // Unified scroll hide/show detection:
  // - Near top (scrollY <= 15): Full header is always visible in place.
  // - Scrolling DOWN: Main header moves out cleanly (search + categories stay sticky on homepage).
  // - Scrolling UP: Full header returns smoothly.
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show full header near the top of the page
      if (currentScrollY <= 15) {
        setIsHeaderHidden(false);
        prevScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - prevScrollY.current;

      // Ignore micro-jitters
      if (Math.abs(diff) < 5) {
        return;
      }

      if (diff > 0 && currentScrollY > 60) {
        // Scrolling DOWN -> Hide the entire outer header
        setIsHeaderHidden(true);
      } else if (diff < 0) {
        // Scrolling UP -> Reveal the full outer header
        setIsHeaderHidden(false);
      }

      prevScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // When route changes, immediately ensure header is visible and reset scroll state
  useEffect(() => {
    setIsHeaderHidden(false);
    prevScrollY.current = 0;
  }, [location.pathname]);

  // Rotating placeholder like Flipkart / Tata Neu
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_QUERIES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Real categories extracted strictly from Firestore database / Catalog & CMS settings
  const dynamicCategories = useMemo(() => {
    const list: { id: string; name: string; url: string; image?: string; isAllDeals?: boolean; isForYou?: boolean }[] = [
      { id: 'for-you', name: 'For You', url: '/', isForYou: true },
    ];

    const dbActive = (categories || []).filter(c => c.active !== false);
    if (dbActive.length > 0) {
      dbActive.forEach(c => {
        list.push({
          id: c.id,
          name: c.name,
          url: `/shop?category=${encodeURIComponent(c.name)}`,
          image: c.image || '',
        });
      });
    } else if (settings?.homepage?.quickCategories && settings.homepage.quickCategories.length > 0) {
      settings.homepage.quickCategories.filter(c => c.enabled !== false).forEach(c => {
        list.push({
          id: c.id,
          name: c.title,
          url: c.link || `/shop?category=${encodeURIComponent(c.title)}`,
          image: c.image || '',
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
            image: p.thumbnail || p.image || '',
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

  // Handle Search Submission
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const queryToUse = searchQuery.trim() || PLACEHOLDER_QUERIES[placeholderIndex];
    if (queryToUse) {
      navigate(`/shop?q=${encodeURIComponent(queryToUse)}`);
    }
  };
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVoiceSearchOpen(false);
        setIsQrScannerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAuthorizedForAdmin = useMemo(() => {
    if (!user) return false;
    return isUserAdminOrOwner(user) || isAdminOrOwner(user) || isOwnerUser(user) || canAccessAdminTab(user, 'dashboard') || user.role === 'staff' || user.role === 'manager';
  }, [user]);

  const userRoleBadge = useMemo(() => {
    if (!user) {
      return {
        label: 'Customer',
        className: 'bg-blue-100 text-blue-800 border border-blue-200/80',
      };
    }

    if (isOwnerUser(user) || user.role === 'owner' || user.isPrimaryOwner) {
      return {
        label: 'Owner',
        className: 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-2xs',
      };
    }

    if (user.role === 'admin' || isAdminEmail(user.email)) {
      return {
        label: 'Admin',
        className: 'bg-purple-100 text-purple-900 border border-purple-200 font-bold',
      };
    }

    if (user.role === 'manager') {
      return {
        label: 'Manager',
        className: 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold',
      };
    }

    const roleName = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Staff';
    return {
      label: roleName,
      className: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold',
    };
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

        recognition.onerror = () => {
          setIsVoiceSearchOpen(false);
        };

        recognition.onend = () => {
          setIsVoiceSearchOpen(false);
        };
      } catch {
        setIsVoiceSearchOpen(true);
      }
    } else {
      setIsVoiceSearchOpen(true);
    }
  };

  return (
    <>
      {/* Voice Search Modal */}
      {isVoiceSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/50 animate-pulse">
              <Mic size={32} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Listening...</h3>
            <p className="text-xs text-slate-500">Say what you're looking for (e.g. "Smartwatches", "iPhone 16 Pro")</p>
            <button
              onClick={() => setIsVoiceSearchOpen(false)}
              className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* QR/Barcode Scanner Modal */}
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <QrCode size={36} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Product Scanner</h3>
            <p className="text-xs text-slate-500">Scan product barcodes or QR codes to view instant specs & prices</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400 font-medium">
              Camera scanning active
            </div>
            <button
              onClick={() => setIsQrScannerOpen(false)}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MAIN HEADER - Professional E-Commerce Gradient Header */}
      <header
        ref={headerRef}
        className={`w-full bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
          !isHomePage && isHeaderHidden
            ? 'pointer-events-none shadow-none'
            : 'shadow-md'
        }`}
        style={{
          transform: hideOffset > 0 ? `translateY(-${hideOffset}px)` : 'translateY(0px)',
          boxShadow: (!isHomePage && isHeaderHidden) ? 'none' : undefined,
        }}
      >
        
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          
          {/* 1. TOP MAIN HEADER ROW:
              Contains Logo, Location Pill, Wishlist, Notifications, Cart, User Login.
              Keeps exact layout and requested 4px extra bottom padding (pb-[10px]). */}
          <div
            ref={topRowRef}
            className="flex items-center justify-between gap-2.5 sm:gap-3 pt-2.5 pb-[10px]"
          >
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* Logo */}
              <Link to="/" className="flex items-center group shrink-0 pl-0" title={storeName}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className="object-contain object-left shrink-0" 
                    style={{
                      width: 'auto',
                      maxWidth: `${settings.branding?.logoSizes?.mobileHeaderWidth || 150}px`,
                      height: 'auto',
                      maxHeight: '36px',
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
                  <span className="text-lg sm:text-2xl font-black text-white tracking-tight leading-none italic">
                    {logoPart1}
                    {logoPart2 && <span className="ml-1 text-amber-300 not-italic font-bold text-sm sm:text-lg">{logoPart2}</span>}
                  </span>
                )}
              </Link>
            </div>

            {/* Delivery Location Pill */}
            <button
              type="button"
              onClick={openLocationModal}
              className="flex-1 ml-auto max-w-[360px] sm:max-w-md flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-all cursor-pointer truncate min-w-0"
              title="Change Delivery Location"
            >
              <MapPin size={13} className="text-amber-300 shrink-0" />
              <span className="truncate text-left flex-1">
                <span className="opacity-80 font-normal mr-1">Deliver to</span>
                <span className="font-semibold">{deliveryLocation.addressName ? `${deliveryLocation.addressName} (${deliveryLocation.city})` : (deliveryLocation.city || 'Select Area')}</span>{' '}
                <span className="font-mono text-[11px] opacity-80">({deliveryLocation.pincode || 'Set PIN'})</span>
              </span>
              <ChevronDown size={12} className="opacity-70 shrink-0 ml-auto" />
            </button>

            {/* Right Action Icons */}
            <div className={`items-center gap-1 sm:gap-2 shrink-0 ${user ? 'hidden' : 'flex'}`}>
              <Link
                to="/account?tab=wishlist"
                className="hidden relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors items-center justify-center"
                title="Wishlist"
              >
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white font-bold text-[9px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center ring-2 ring-blue-800">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {user && (
                <div className="hidden items-center">
                  <NotificationCenter />
                </div>
              )}

              <Link
                to="/cart"
                className="hidden relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors items-center justify-center"
                title="Shopping Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-amber-400 text-slate-950 font-black text-[9px] min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center ring-2 ring-blue-800">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <Link
                  to="/account"
                  className="hidden w-8 h-8 rounded-full overflow-hidden border border-white/40 bg-white/10 items-center justify-center hover:ring-2 hover:ring-white/40 transition-all shrink-0 ml-1"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-bold text-xs text-white">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-2.5 py-1 bg-white text-blue-900 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs ml-1"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* 2. SEARCH BAR:
              Always visible and seamlessly positioned on Homepage. */}
          {isHomePage && (
            <div className="transition-all duration-300 pt-[10px] pl-0 pb-[4px]">
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center w-full bg-white rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden px-3.5 py-1.5 sm:py-2"
              >
                <Search size={18} className="text-slate-400 shrink-0 mr-2.5" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={PLACEHOLDER_QUERIES[placeholderIndex]}
                  className="w-full py-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium truncate"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}

                <div className="flex items-center gap-2 sm:gap-3 pl-1 border-l border-slate-200/80 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className="p-1 text-slate-500 hover:text-blue-600 rounded-full transition-colors cursor-pointer"
                    title="Voice Search"
                  >
                    <Mic size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="p-1 text-slate-500 hover:text-blue-600 rounded-full transition-colors cursor-pointer"
                    title="Scan Barcode / QR"
                  >
                    <QrCode size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 3. CATEGORIES BAR:
            - When at TOP of homepage: Shows the category icons and labels!
            - When SWIPED / SCROLLED DOWN on homepage: Icons collapse, only text labels/underline bar show.
            - When NOT on homepage: This entire section is hidden. */}
        {isHomePage && (
          <div className="w-full overflow-x-auto no-scrollbar pt-1 pb-0 select-none mt-0.5">
            <div className="container mx-auto px-3 sm:px-4 max-w-7xl flex items-center gap-4 sm:gap-7 whitespace-nowrap min-w-max">
              {dynamicCategories.map((cat) => {
                const isCurrentActive = 
                  (cat.url === '/' && (location.pathname === '/' || location.pathname === '')) ||
                  (cat.url !== '/' && (location.pathname + location.search) === cat.url);

                const CategoryIconComponent = getCategoryIcon(cat.name);
                const optimizedCatImage = cat.image ? getOptimizedImageUrl(cat.image, { width: 100, quality: 80 }) : null;

                return (
                  <Link
                    key={cat.id}
                    to={cat.url}
                    className="flex flex-col items-center group/tab transition-all duration-300 py-1"
                  >
                    {/* Category Icon Container */}
                    <div className="max-h-14 max-w-14 opacity-100 scale-100 mb-1.5">
                      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover/tab:scale-105 group-hover/tab:bg-white/25 shadow-2xs ${
                        isCurrentActive ? 'ring-2 ring-white/60 bg-white/25 scale-105' : ''
                      }`}>
                        {cat.isAllDeals ? (
                          <Flame size={20} className="text-amber-300 fill-current" />
                        ) : cat.isForYou ? (
                          <Sparkles size={20} className="text-white" />
                        ) : optimizedCatImage ? (
                          <img src={optimizedCatImage} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <CategoryIconComponent size={20} className="text-white/90" />
                        )}
                      </div>
                    </div>

                    {/* Clean Text Label */}
                    <span
                      className={`text-xs sm:text-sm tracking-tight transition-colors ${
                        isCurrentActive
                          ? 'text-white font-bold'
                          : 'text-white/80 hover:text-white font-medium'
                      }`}
                    >
                      {cat.name}
                    </span>

                    {/* Exact White Rounded Underline Indicator */}
                    <div
                      className={`h-1 rounded-full transition-all duration-300 mt-1 ${
                        isCurrentActive
                          ? 'w-full bg-white shadow-xs'
                          : 'w-0 bg-transparent group-hover/tab:w-1/2 group-hover/tab:bg-white/50'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </header>

      {/* Invisible layout spacer to preserve document flow seamlessly for fixed header */}
      <div
        style={{ height: `${headerHeight}px` }}
        className="w-full bg-transparent pointer-events-none"
        aria-hidden="true"
      />

    </>
  );
}

export default MobileHeader;
