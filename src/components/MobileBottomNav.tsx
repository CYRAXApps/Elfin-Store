import React, { useMemo, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCartCount } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

function MobileNavCartBadge() {
  const cartItemCount = useCartCount();
  if (cartItemCount <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center shadow-sm">
      {cartItemCount > 99 ? '99+' : cartItemCount}
    </span>
  );
}

function MobileBottomNavComponent() {
  const { settings } = useSiteSettings();
  const location = useLocation();
  const { user } = useAuth();

  const config = settings.header?.mobileBottomNav;

  const items = useMemo(() => {
    if (!config || config.enabled === false) {
      return [];
    }

    // Filter out search and wishlist from navigation
    const rawItems = (config.items || []).filter(item => {
      if (!item.enabled) return false;
      const id = (item.id || '').toLowerCase();
      const icon = (item.icon || '').toLowerCase();
      const url = (item.url || '').toLowerCase();
      const label = (item.label || '').toLowerCase();
      if (id.includes('search') || icon === 'search' || url.includes('/search') || label.includes('search')) return false;
      if (id.includes('wishlist') || icon === 'heart' || url.includes('/wishlist') || label.includes('wishlist')) return false;
      return true;
    });

    // Guarantee Categories is in navigation
    const hasCategories = rawItems.some(i => (i.url || '').includes('/categories') || (i.id || '') === 'categories' || (i.icon || '') === 'Grid');
    if (!hasCategories) {
      rawItems.push({
        id: 'categories',
        label: 'Categories',
        icon: 'Grid',
        url: '/categories',
        enabled: true,
        order: 2
      });
    }

    // Guarantee User Account is in navigation
    const hasAccount = rawItems.some(i => (i.url || '').includes('/account') || (i.id || '') === 'account' || (i.icon || '') === 'User');
    if (!hasAccount) {
      rawItems.push({
        id: 'account',
        label: 'Account',
        icon: 'User',
        url: '/account',
        enabled: true,
        order: 99
      });
    }

    return rawItems.sort((a, b) => a.order - b.order);
  }, [config]);

  if (!config || config.enabled === false || items.length === 0) {
    return null;
  }

  const renderIcon = (iconName: string, isActive: boolean) => {
    const props = {
      size: 20,
      className: `transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`
    };

    switch (iconName) {
      case 'Home': return <Home {...props} />;
      case 'Grid': return <Grid {...props} />;
      case 'ShoppingCart': return <ShoppingCart {...props} />;
      case 'User': 
        if (user?.photoURL) {
          return (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'Account'} 
              className={`w-5 h-5 rounded-full object-cover border ${isActive ? 'border-blue-600 scale-110' : 'border-slate-300'}`}
              referrerPolicy="no-referrer"
            />
          );
        }
        return <User {...props} />;
      default: return <Home {...props} />;
    }
  };

  return (
    <>
      {/* Spacer so content doesn't get hidden behind the fixed nav */}
      <div className="h-16 md:hidden"></div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            const isAccount = item.url === '/account' || item.icon === 'User';
            const isActive = isAccount 
              ? (location.pathname === '/account' || location.pathname === '/login' || location.pathname.startsWith('/account') || location.pathname.startsWith('/orders'))
              : (location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url)));

            return (
              <Link
                key={item.id}
                to={item.url}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  {renderIcon(item.icon, isActive)}
                  {item.icon === 'ShoppingCart' && <MobileNavCartBadge />}
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export const MobileBottomNav = memo(MobileBottomNavComponent);

