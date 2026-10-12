import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Zap, Clock } from 'lucide-react';
import { useCart, useCartTotal, useCartCount } from '../context/ShopContext';
import { useLocation as useHyperlocalLocation } from '../context/LocationContext';

export function HyperlocalFloatingCart() {
  const { cart } = useCart();
  const cartTotal = useCartTotal();
  const cartCount = useCartCount();
  const { location } = useHyperlocalLocation();
  const routeLocation = useLocation();

  // Hide on cart, checkout, admin, and partner routes
  const isExcludedRoute = 
    routeLocation.pathname === '/cart' || 
    routeLocation.pathname === '/checkout' || 
    routeLocation.pathname.startsWith('/admin') ||
    routeLocation.pathname.startsWith('/partner');

  if (cartCount === 0 || isExcludedRoute) return null;

  return (
    <div className="fixed bottom-18 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <Link
        to="/cart"
        className="pointer-events-auto bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 flex items-center justify-between gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30 shrink-0 relative">
            <ShoppingBag size={18} />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                • {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <Clock size={11} />
              <span>⚡ {location.deliveryTime} Delivery to {location.addressName ? `${location.addressName} (${location.city})` : (location.area || location.city)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-colors shrink-0">
          <span>View Cart</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
