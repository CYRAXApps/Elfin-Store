import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Home, 
  Package, 
  ShoppingCart, 
  Boxes, 
  Users, 
  DollarSign, 
  Settings, 
  LogOut, 
  Store, 
  Menu, 
  X, 
  ShieldCheck, 
  UserCheck, 
  ChevronRight,
  ChevronDown,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  RotateCcw,
  Truck,
  FileText,
  CreditCard,
  MessageSquare,
  ArrowRight,
  Headphones,
  ExternalLink,
  Zap,
  Warehouse,
  Wrench
} from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface PartnerNavSubItem {
  id: string;
  label: string;
  path: string;
  subParam?: string;
}

interface PartnerNavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  badge?: string;
  badgeColor?: string;
  ownerOnly?: boolean;
  subItems?: PartnerNavSubItem[];
}

export function PartnerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partnerUser, partnerStore, loading, logoutPartner } = usePartnerAuth();
  const { settings } = useSiteSettings();
  const partnerLogoUrl = (settings.branding?.adminLogo || settings.branding?.primaryLogo || settings.general?.storeLogoUrl || '/assets/logo.svg').trim();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    orders: false,
    products: false
  });

  // Store Selector Modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; subtitle: string; type: string; link: string }>>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Nav Items Schema with clean, real partner functionality
  const navSections = useMemo(() => [
    {
      title: null,
      items: [
        { 
          id: 'home', 
          label: 'Home', 
          icon: Home, 
          path: '/partner/dashboard' 
        }
      ]
    },
    {
      title: 'MANAGE BUSINESS',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingCart,
          path: '/partner/orders',
          badge: 'NEW',
          badgeColor: 'bg-blue-600 text-white',
          subItems: [
            { id: 'all_orders', label: 'All Orders', path: '/partner/orders', subParam: 'all_orders' },
            { id: 'orders_returns', label: 'Returns & Replacements', path: '/partner/orders?sub=orders_returns', subParam: 'orders_returns' },
            { id: 'orders_shipping', label: 'Shipping & Logistics', path: '/partner/orders?sub=orders_shipping', subParam: 'orders_shipping' },
            { id: 'orders_invoices', label: 'GST Invoices', path: '/partner/orders?sub=orders_invoices', subParam: 'orders_invoices' },
            { id: 'orders_payments', label: 'Payments', path: '/partner/orders?sub=orders_payments', subParam: 'orders_payments' }
          ]
        },
        {
          id: 'products',
          label: 'Catalog & Products',
          icon: Package,
          path: '/partner/products',
          subItems: [
            { id: 'products_list', label: 'Products Catalog', path: '/partner/products', subParam: 'products_list' },
            { id: 'categories', label: 'Categories', path: '/partner/products?sub=categories', subParam: 'categories' },
            { id: 'brands', label: 'Brands', path: '/partner/products?sub=brands', subParam: 'brands' }
          ]
        },
        {
          id: 'inventory',
          label: 'Stock & Inventory',
          icon: Boxes,
          path: '/partner/inventory'
        },
        {
          id: 'pos',
          label: 'POS Billing',
          icon: Store,
          path: '/partner/pos'
        },
        {
          id: 'customers',
          label: 'Customers & Inquiries',
          icon: Users,
          path: '/partner/customers'
        },
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: BarChart3,
          path: '/partner/reports'
        },
        {
          id: 'staff',
          label: 'Staff & Team',
          icon: UserCheck,
          path: '/partner/staff',
          ownerOnly: true
        }
      ]
    },
    {
      title: 'SUPPORT & SETTINGS',
      items: [
        {
          id: 'support',
          label: 'Support & Helpdesk',
          icon: Headphones,
          path: '/partner/support'
        },
        {
          id: 'settings',
          label: 'Store Settings',
          icon: Settings,
          path: '/partner/settings'
        }
      ]
    }
  ], []);

  // Global search implementation
  useEffect(() => {
    if (!searchQuery.trim() || !partnerStore?.storeId) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryLower = searchQuery.toLowerCase().trim();
        const results: Array<{ id: string; title: string; subtitle: string; type: string; link: string }> = [];

        // Search products via API
        const prodRes = await fetch(`/api/partner/products?storeId=${partnerStore.storeId}`);
        if (prodRes.ok) {
          const prods = await prodRes.json();
          if (Array.isArray(prods)) {
            prods
              .filter((p: any) => p.name?.toLowerCase().includes(queryLower) || p.sku?.toLowerCase().includes(queryLower))
              .slice(0, 4)
              .forEach((p: any) => {
                results.push({
                  id: p.id,
                  title: p.name,
                  subtitle: `SKU: ${p.sku || 'N/A'} • ₹${p.price}`,
                  type: 'Product',
                  link: `/partner/products`
                });
              });
          }
        }

        // Search orders via API
        const ordRes = await fetch(`/api/partner/orders?storeId=${partnerStore.storeId}`);
        if (ordRes.ok) {
          const ords = await ordRes.json();
          if (Array.isArray(ords)) {
            ords
              .filter((o: any) => (o.id?.toLowerCase().includes(queryLower) || o.shippingAddress?.fullName?.toLowerCase().includes(queryLower) || o.customerEmail?.toLowerCase().includes(queryLower)))
              .slice(0, 4)
              .forEach((o: any) => {
                results.push({
                  id: o.id,
                  title: `Order #${o.id.substring(0, 8)}`,
                  subtitle: `${o.shippingAddress?.fullName || o.customerEmail || 'Customer'} • ₹${o.totalAmount || o.grandTotal || 0}`,
                  type: 'Order',
                  link: `/partner/orders`
                });
              });
          }
        }

        setSearchResults(results);
      } catch (e) {
        console.error("Partner search error:", e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, partnerStore?.storeId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f2128] flex flex-col items-center justify-center p-4 font-sans text-white">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-300">Loading Partner Portal...</p>
      </div>
    );
  }

  // Access Denied screen
  if (!partnerUser || !partnerStore || partnerUser.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-[#1f2128] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-[#24262d] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-700 text-white">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Building2 size={28} />
          </div>
          <h2 className="text-xl font-black text-white mb-1">Partner Access Required</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            You are not registered as an active partner store user. Please authenticate with an authorized partner account.
          </p>
          <div className="space-y-2">
            <Link
              to="/partner/login"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <UserCheck size={16} />
              <span>Go to Partner Login</span>
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all block border border-slate-600"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentActive = (itemPath: string) => {
    const current = location.pathname;
    const cleanItem = itemPath.split('?')[0];
    if (cleanItem === '/partner/dashboard') {
      return current === '/partner/dashboard' || current === '/partner' || current === '/partner/';
    }
    return current.startsWith(cleanItem);
  };

  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden font-sans">
      
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-35 md:hidden transition-opacity"
        />
      )}

      {/* Meesho-Style Clean Partner Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1f2128] text-slate-300 flex flex-col h-full shrink-0 shadow-2xl md:shadow-none transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Top Store Identifier Header */}
        <div className="p-3.5 border-b border-slate-800/80 bg-[#191a20]">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => setIsStoreModalOpen(true)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity flex-1"
            >
              {/* Brand Logo Avatar */}
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200 overflow-hidden p-1">
                <img 
                  src={partnerLogoUrl || '/assets/logo.svg'} 
                  alt="Partner Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/assets/logo.svg')) {
                      target.src = '/assets/logo.svg';
                    }
                  }}
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white tracking-wider uppercase truncate">
                    {partnerStore.storeName || 'PARTNER STORE'}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  ElectroStore Partner Hub
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Support & Dashboard Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
            <Link
              to="/partner/support"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#282a33] hover:bg-[#323540] text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-700/60 cursor-pointer"
            >
              <Headphones size={13} className="text-blue-400" />
              <span>Support</span>
            </Link>

            <Link
              to="/partner/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#282a33] hover:bg-[#323540] text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-slate-700/60 cursor-pointer"
            >
              <ShoppingCart size={13} className="text-emerald-400" />
              <span>Orders</span>
            </Link>
          </div>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs select-none">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {sec.title && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  {sec.title}
                </div>
              )}

              {sec.items.map((item) => {
                if (item.ownerOnly && partnerUser.role !== 'PARTNER_OWNER' && partnerUser.role !== 'PARTNER_MANAGER') {
                  return null;
                }

                const isActive = isCurrentActive(item.path);
                const hasSub = Array.isArray(item.subItems) && item.subItems.length > 0;
                const isExpanded = expandedSections[item.id] || false;
                const IconComponent = item.icon;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <Link
                      to={item.path}
                      onClick={(e) => {
                        if (hasSub) {
                          toggleSection(item.id, e);
                        } else {
                          setMobileMenuOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-[#2b2e3a] text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:bg-[#282a33] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent 
                          size={16} 
                          className={`shrink-0 transition-colors ${
                            isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`} 
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider ${item.badgeColor || 'bg-blue-600 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {hasSub && (
                        <ChevronDown 
                          size={14} 
                          className={`text-slate-500 transition-transform duration-150 ${isExpanded ? 'rotate-180 text-slate-300' : ''}`} 
                        />
                      )}
                    </Link>

                    {/* Submenu links */}
                    {hasSub && isExpanded && (
                      <div className="pl-8 pr-1 py-1 space-y-1 bg-[#1a1b22]/70 rounded-xl my-0.5">
                        {item.subItems?.map((sub) => {
                          const isSubActive = location.search.includes(sub.subParam || '') || location.pathname === sub.path;
                          return (
                            <Link
                              key={sub.id}
                              to={sub.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block py-1.5 px-2 rounded-lg text-[11px] transition-colors ${
                                isSubActive
                                  ? 'text-blue-400 font-bold bg-blue-500/10'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#191a20] space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
                {(partnerUser.displayName || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{partnerUser.displayName || 'Partner Store'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{partnerUser.role}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={logoutPartner}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Logout Partner Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs z-10">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-700 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/partner/dashboard" className="hover:text-blue-600 transition-colors">
                Partner Portal
              </Link>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="font-bold text-slate-900">
                {partnerStore.storeName}
              </span>
            </div>
          </div>

          {/* Search Input in Topbar */}
          <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, SKU, customer or catalog..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 transition-all"
              />
            </div>

            {/* Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Search Results</p>
                <div className="space-y-1">
                  {searchResults.map((res) => (
                    <Link
                      key={res.id}
                      to={res.link}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="block p-2 rounded-xl hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{res.title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {res.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{res.subtitle}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Live Operational Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Catalog Active</span>
            </div>

            {/* Support Link */}
            <Link
              to="/partner/support"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors relative flex items-center gap-1.5 text-xs font-bold"
              title="Partner Support Center"
            >
              <Headphones size={16} className="text-blue-600" />
              <span className="hidden sm:inline">Support</span>
            </Link>

            {/* Storefront Preview link */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Open storefront"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">Storefront</span>
            </Link>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Store Info Switcher Modal */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Store Information</h3>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Store Name:</span>
                <span className="font-bold text-slate-900">{partnerStore.storeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Store ID:</span>
                <span className="font-mono font-bold text-indigo-600">{partnerStore.storeId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">City / State:</span>
                <span className="font-medium text-slate-900">{partnerStore.city}, {partnerStore.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">GSTIN:</span>
                <span className="font-mono font-medium text-slate-900">{partnerStore.gstin || 'Not registered'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600">Active Partner</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 mt-4">
              <Link
                to="/partner/settings"
                onClick={() => setIsStoreModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-center font-bold text-xs"
              >
                Store Settings
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
