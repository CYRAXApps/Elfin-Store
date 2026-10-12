import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag, 
  Heart, 
  Tag, 
  Truck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  ArrowLeft,
  ShieldCheck,
  Zap,
  Info,
  MapPin
} from 'lucide-react';
import { useCart, useShopActions } from '../context/ShopContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLocation as useHyperlocalLocation } from '../context/LocationContext';
import { isPincodeServiceable } from '../services/indiaGeographicData';
import { isProductInStock, getProductAvailableStock, validateCartStock } from '../utils/stockUtils';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCachedCoupon, setCachedCoupon } from '../services/catalogCache';

export function Cart() {
  const { cart, cartTotal } = useCart();
  const { removeFromCart, updateQuantity, addToWishlist, removeOutOfStockItems } = useShopActions();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const stockValidation = validateCartStock(cart);
  const hasOutOfStockItems = !stockValidation.isValid;

  const { location: deliveryLocation, openLocationModal } = useHyperlocalLocation();
  const cartPinCoverage = useMemo(() => {
    const pin = (deliveryLocation?.pincode || '').trim();
    if (!pin || pin.length !== 6) return null;
    return isPincodeServiceable(pin, settings.shipping?.deliveryCoverage);
  }, [deliveryLocation?.pincode, settings.shipping?.deliveryCoverage]);

  const cartSettings = settings.cartSettings || {
    cartTitle: 'Shopping Cart',
    cartSubtitle: 'Review your items, apply coupons, and proceed to secure checkout.',
    emptyCartTitle: 'Your cart is empty',
    emptyCartMessage: "Looks like you haven't added anything to your cart yet.",
    continueShoppingText: 'Continue Shopping',
    continueShoppingUrl: '/shop',
    checkoutButtonText: 'Proceed to Checkout',
    enableQuantityControls: true,
    enableRemoveItem: true,
    enableCouponField: true,
    enableWishlistLink: true,
    showSavings: true,
    showEstimatedShipping: true,
    showStockWarning: true,
    showCartSummary: true,
    minOrderAmount: 0,
    minOrderMessage: 'Minimum order total is ₹0.',
    freeShippingProgress: true,
    freeShippingThreshold: 500,
  };

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
    minPurchase?: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const isStoreClosed = settings.general?.storeStatus === 'closed';
  const storeClosedMsg = settings.notifications?.storeClosedMsg || 'Our store is temporarily closed for new orders. Please check back soon.';

  const shippingSettings = settings.shipping || {
    shippingEnabled: true,
    freeShippingEnabled: true,
    freeShippingThreshold: 500,
    defaultShippingCharge: 50,
  };

  const freeThreshold = shippingSettings.freeShippingThreshold ?? cartSettings.freeShippingThreshold ?? 500;
  const isFreeShipping = (shippingSettings.freeShippingEnabled !== false) && cartTotal >= freeThreshold;
  const freeShippingDifference = Math.max(0, freeThreshold - cartTotal);
  const freeShippingProgress = Math.min(100, Math.round((cartTotal / (freeThreshold || 1)) * 100));

  const deliveryCharge = isFreeShipping || !shippingSettings.shippingEnabled || cart.length === 0 
    ? 0 
    : (shippingSettings.defaultShippingCharge ?? 50);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((cartTotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount && appliedCoupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(cartTotal, appliedCoupon.discountValue);
    }
  }

  const grandTotal = Math.max(0, cartTotal - discountAmount + (cartSettings.showEstimatedShipping ? deliveryCharge : 0));
  const isBelowMinOrder = (cartSettings.minOrderAmount || 0) > 0 && cartTotal < (cartSettings.minOrderAmount || 0);
  const totalItemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    try {
      setCouponLoading(true);
      // 1. First check in-memory coupon cache or Firestore coupons collection
      let cData = getCachedCoupon(code);
      if (!cData) {
        const couponDoc = await getDoc(doc(db, 'coupons', code));
        if (couponDoc.exists()) {
          cData = couponDoc.data();
          setCachedCoupon(code, cData);
        }
      }

      if (cData) {
        if (cData.isActive === false) {
          setCouponError('This coupon is currently inactive.');
          return;
        }
        if (cData.expiresAt) {
          const exp = new Date(cData.expiresAt);
          if (new Date() > exp) {
            setCouponError(`This coupon expired on ${cData.expiresAt}.`);
            return;
          }
        }
        if (cData.minPurchase && cartTotal < cData.minPurchase) {
          setCouponError(`Minimum order value of ₹${Number(cData.minPurchase || 0).toLocaleString('en-IN')} required to use ${code}.`);
          return;
        }

        setAppliedCoupon({
          code: cData.code || code,
          discountType: cData.discountType || 'percentage',
          discountValue: cData.discountValue || 10,
          maxDiscount: cData.maxDiscount,
          minPurchase: cData.minPurchase
        });

        const desc = cData.discountType === 'percentage'
          ? `${cData.discountValue}% discount applied!`
          : `Flat ₹${cData.discountValue} discount applied!`;
        setCouponSuccess(desc);
        return;
      }

      // 2. Fallback check for standard coupons
      if (code === 'WELCOME10' || code === 'ELECTRO10') {
        setAppliedCoupon({ code, discountType: 'percentage', discountValue: 10 });
        setCouponSuccess('10% discount applied successfully!');
      } else if (code === 'SUPER20' || code === 'SAVE20') {
        if (cartTotal < 2000) {
          setCouponError('Minimum order value of ₹2,000 required for SAVE20.');
        } else {
          setAppliedCoupon({ code, discountType: 'percentage', discountValue: 20, minPurchase: 2000, maxDiscount: 2000 });
          setCouponSuccess('20% discount applied successfully!');
        }
      } else if (code === 'FESTIVE5') {
        setAppliedCoupon({ code, discountType: 'percentage', discountValue: 5 });
        setCouponSuccess('5% festive discount applied!');
      } else if (code === 'FESTIVE500') {
        if (cartTotal < 3000) {
          setCouponError('Minimum order value of ₹3,000 required for FESTIVE500.');
        } else {
          setAppliedCoupon({ code, discountType: 'fixed', discountValue: 500, minPurchase: 3000 });
          setCouponSuccess('Flat ₹500 discount applied!');
        }
      } else {
        setCouponError('Invalid or expired coupon code. Try WELCOME10 or ELECTRO10');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      setCouponError('Could not apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  const handleMoveToWishlist = (productId: string) => {
    const item = cart.find(c => c.product.id === productId);
    if (item) {
      addToWishlist(item.product);
      removeFromCart(productId);
    }
  };

  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems) {
      return;
    }
    if (isStoreClosed || isBelowMinOrder) {
      return;
    }
    if (cartPinCoverage && !cartPinCoverage.serviceable) {
      openLocationModal();
      return;
    }
    navigate(appliedCoupon ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}` : '/checkout');
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100/80">
            <ShoppingBag size={36} strokeWidth={1.75} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            {cartSettings.emptyCartTitle || 'Your cart is empty'}
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {cartSettings.emptyCartMessage || "Looks like you haven't added anything to your cart yet."}
          </p>
          <Link
            to={cartSettings.continueShoppingUrl || '/shop'}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.99]"
          >
            {cartSettings.continueShoppingText || 'Continue Shopping'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/40 min-h-screen pb-28 lg:pb-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl pt-6 sm:pt-8">
        
        {/* 1. Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-4 mb-5 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {cartSettings.cartTitle || 'Shopping Cart'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {cartSettings.cartSubtitle || 'Review your items, apply coupons, and proceed to secure checkout.'}
            </p>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-600 self-start sm:self-auto mt-1 sm:mt-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>
        </div>

        {/* 2. Free Delivery Banner (Compact Benefit Bar) */}
        {cartSettings.freeShippingProgress && shippingSettings.freeShippingEnabled !== false && (
          <div className={`p-3 sm:p-3.5 rounded-xl border mb-5 transition-all text-xs ${
            isFreeShipping 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-blue-50/70 border-blue-200/80 text-blue-950'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1.5 font-medium">
              <div className="flex items-center gap-2">
                <Truck size={16} className={`shrink-0 ${isFreeShipping ? 'text-emerald-600' : 'text-blue-600'}`} />
                {isFreeShipping ? (
                  <span className="font-semibold text-emerald-800">
                    🚚 FREE delivery unlocked! Your order qualifies for free delivery.
                  </span>
                ) : (
                  <span>
                    Add <strong className="font-bold text-blue-700">₹{Number(freeShippingDifference || 0).toLocaleString('en-IN')}</strong> more to unlock <strong className="font-bold">FREE Delivery</strong>
                  </span>
                )}
              </div>
              <span className={`font-semibold shrink-0 ${isFreeShipping ? 'text-emerald-700' : 'text-blue-700'}`}>
                {freeShippingProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFreeShipping ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Minimum Order Warning Alert */}
        {isBelowMinOrder && (
          <div className="mb-5 p-3 sm:p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs font-medium">
            <ShieldAlert size={16} className="text-amber-600 shrink-0" />
            <span>{cartSettings.minOrderMessage || `Minimum order total of ₹${cartSettings.minOrderAmount} is required to checkout.`}</span>
          </div>
        )}

        {/* Out of Stock Top Warning Banner */}
        {hasOutOfStockItems && (
          <div className="mb-5 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle size={17} className="text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold block text-rose-950">Some items in your cart are currently out of stock</span>
                <span className="text-rose-700 text-[11px] sm:text-xs">Please remove unavailable items to continue to checkout.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeOutOfStockItems()}
              className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              <Trash2 size={13} /> Remove Out of Stock Items
            </button>
          </div>
        )}

        {/* Main Grid: Left Items + Right Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: Cart Items */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3">
            
            {/* Desktop Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[11px] font-bold text-slate-500 uppercase tracking-wider shadow-2xs">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Item Total</div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map((item) => {
                const itemInStock = isProductInStock(item.product);
                const availableStock = getProductAvailableStock(item.product);
                const isOutOfStock = !itemInStock || availableStock <= 0;
                const isOverStock = !isOutOfStock && availableStock !== Infinity && item.quantity > availableStock;
                const unitPrice = Number(item.product?.price || 0);
                const itemTotal = unitPrice * Number(item.quantity || 1);

                return (
                  <div 
                    key={item.product.id}
                    className={`bg-white rounded-xl border p-3.5 sm:p-4 transition-all shadow-2xs ${
                      isOutOfStock 
                        ? 'border-rose-200 bg-rose-50/20' 
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* DESKTOP ROW (sm and up) */}
                    <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                      
                      {/* Product details (Image + Brand + Name + Stock + Actions) */}
                      <div className="col-span-6 flex items-start gap-3.5 min-w-0">
                        {/* Image */}
                        <Link 
                          to={`/product/${item.product.id}`}
                          className="w-18 h-18 shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden relative group"
                        >
                          {(() => {
                            const optImg = getOptimizedImageUrl(item.product.image, { width: 160, quality: 80 });
                            if (optImg) {
                              return (
                                <img
                                  src={optImg}
                                  alt={item.product.name}
                                  loading="lazy"
                                  width={72}
                                  height={72}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                  className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105 ${
                                    isOutOfStock ? 'opacity-40 grayscale' : ''
                                  }`}
                                />
                              );
                            }
                            return null;
                          })()}
                          <div className={getOptimizedImageUrl(item.product.image, { width: 160, quality: 80 }) ? "hidden text-slate-300" : "text-slate-300"}>
                            <ShoppingBag size={20} />
                          </div>
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-0.5">
                              <span className="text-[8px] font-extrabold text-white uppercase text-center leading-none">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* Title & Actions */}
                        <div className="flex-1 min-w-0">
                          {item.product.brand && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1 mb-0.5">
                              {item.product.brand}
                            </p>
                          )}
                          <Link
                            to={`/product/${item.product.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-xs leading-snug line-clamp-2"
                            title={item.product.name}
                          >
                            {item.product.name}
                          </Link>

                          {/* Variant Attributes if available */}
                          {item.selectedVariant && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.selectedVariant.name || Object.entries(item.selectedVariant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </div>
                          )}

                          {/* Inventory / Stock badges */}
                          <div className="mt-1">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                <AlertCircle size={11} /> Out of Stock
                              </span>
                            ) : isOverStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                <AlertCircle size={11} /> Only {availableStock} left (requested {item.quantity})
                              </span>
                            ) : availableStock !== Infinity && availableStock <= 5 ? (
                              <span className="text-[11px] font-medium text-amber-600">
                                Only {availableStock} left in stock
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                                <Check size={11} className="stroke-[3]" /> In Stock
                              </span>
                            )}
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center gap-3 mt-2 text-[11px]">
                            {cartSettings.enableRemoveItem !== false && (
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                            {cartSettings.enableWishlistLink !== false && (
                              <>
                                <span className="text-slate-300">·</span>
                                <button
                                  type="button"
                                  onClick={() => handleMoveToWishlist(item.product.id)}
                                  className="text-slate-400 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Heart size={12} /> Save for later
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2 text-center text-xs font-semibold text-slate-700">
                        ₹{unitPrice.toLocaleString('en-IN')}
                      </div>

                      {/* Quantity Selector */}
                      <div className="col-span-2 flex justify-center">
                        {cartSettings.enableQuantityControls !== false ? (
                          <div className={`inline-flex items-center border rounded-lg h-8 bg-slate-50 ${
                            isOutOfStock ? 'opacity-40 border-slate-200' : 'border-slate-300/80 hover:border-slate-400'
                          }`}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              disabled={isOutOfStock || item.quantity <= 1}
                              aria-label="Decrease quantity"
                              className="w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-900 select-none">
                              {isOutOfStock ? 0 : item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={isOutOfStock || (availableStock !== Infinity && item.quantity >= availableStock)}
                              aria-label="Increase quantity"
                              className="w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-700">Qty: {item.quantity}</span>
                        )}
                      </div>

                      {/* Item Total */}
                      <div className="col-span-2 text-right font-extrabold text-slate-900 text-sm">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* MOBILE LAYOUT (Compact touch-friendly card) */}
                    <div className="sm:hidden flex flex-col gap-3">
                      <div className="flex gap-3 items-start">
                        {/* Mobile Image */}
                        <Link 
                          to={`/product/${item.product.id}`}
                          className="w-20 h-20 shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden relative group"
                        >
                          {(() => {
                            const optImg = getOptimizedImageUrl(item.product.image, { width: 160, quality: 80 });
                            if (optImg) {
                              return (
                                <img
                                  src={optImg}
                                  alt={item.product.name}
                                  loading="lazy"
                                  width={76}
                                  height={76}
                                  referrerPolicy="no-referrer"
                                  className={`w-full h-full object-contain mix-blend-multiply ${
                                    isOutOfStock ? 'opacity-40 grayscale' : ''
                                  }`}
                                />
                              );
                            }
                            return <ShoppingBag size={20} className="text-slate-300" />;
                          })()}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-0.5">
                              <span className="text-[8px] font-extrabold text-white uppercase text-center leading-none">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* Title, Brand, Price */}
                        <div className="flex-1 min-w-0">
                          {item.product.brand && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                              {item.product.brand}
                            </p>
                          )}
                          <Link
                            to={`/product/${item.product.id}`}
                            className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 mt-0.5"
                          >
                            {item.product.name}
                          </Link>

                          {/* Unit Price */}
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              ₹{unitPrice.toLocaleString('en-IN')}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-slate-500">
                                (Total: ₹{itemTotal.toLocaleString('en-IN')})
                              </span>
                            )}
                          </div>

                          {/* Stock note */}
                          <div className="mt-1">
                            {isOutOfStock ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded">
                                Out of Stock
                              </span>
                            ) : availableStock !== Infinity && availableStock <= 5 ? (
                              <span className="text-[10px] font-medium text-amber-600">
                                Only {availableStock} left
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-600">
                                ✓ In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Bottom Row: Quantity + Action links */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {/* Quantity Selector */}
                        <div className={`inline-flex items-center border rounded-lg h-7 bg-slate-50 ${
                          isOutOfStock ? 'opacity-40 border-slate-200' : 'border-slate-300'
                        }`}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            disabled={isOutOfStock || item.quantity <= 1}
                            className="w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-900">
                            {isOutOfStock ? 0 : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={isOutOfStock || (availableStock !== Infinity && item.quantity >= availableStock)}
                            className="w-7 h-full flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 text-xs">
                          {cartSettings.enableRemoveItem !== false && (
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                          {cartSettings.enableWishlistLink !== false && (
                            <button
                              type="button"
                              onClick={() => handleMoveToWishlist(item.product.id)}
                              className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1"
                            >
                              <Heart size={13} /> Save
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping Secondary Text on Desktop */}
            <div className="pt-2 hidden sm:block">
              <Link
                to={cartSettings.continueShoppingUrl || '/shop'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={14} />
                {cartSettings.continueShoppingText || 'Continue Shopping'}
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          {cartSettings.showCartSummary !== false && (
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 sticky top-24 space-y-4">
                
                {/* Summary Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {/* Global Active Delivery Location Row (Step 4) */}
                <div 
                  onClick={openLocationModal}
                  className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MapPin size={15} className="text-blue-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      {deliveryLocation?.pincode ? (
                        <>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-500 font-medium">Deliver to:</span>
                            <strong className="text-slate-900 truncate">
                              {deliveryLocation?.addressName ? `${deliveryLocation.addressName} (${deliveryLocation.city})` : deliveryLocation?.city}
                            </strong>
                            <span className="font-mono text-slate-600 font-bold">({deliveryLocation?.pincode})</span>
                          </div>
                          {cartPinCoverage?.serviceable ? (
                            <span className="text-emerald-700 font-bold block text-[11px] mt-0.5">
                              ⚡ {cartPinCoverage.deliveryType} Delivery ({cartPinCoverage.transitDays}d)
                            </span>
                          ) : cartPinCoverage ? (
                            <span className="text-rose-600 font-bold block text-[11px] mt-0.5">
                              ✕ Delivery Unavailable to {deliveryLocation?.pincode}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold block text-[11px] mt-0.5">
                              ⚠️ Invalid PIN code
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-bold text-slate-900">Choose Delivery Location</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-bold text-blue-600 group-hover:text-blue-700 px-2.5 py-1 bg-white border border-blue-200 rounded-lg shadow-2xs shrink-0 cursor-pointer ml-2"
                  >
                    Change
                  </button>
                </div>

                {/* 10. Coupon Section */}
                {cartSettings.enableCouponField !== false && (
                  <div className="space-y-2 pt-0.5">
                    <label htmlFor="cart-coupon-input" className="text-xs font-semibold text-slate-700 block">
                      Have a coupon?
                    </label>
                    
                    {!appliedCoupon ? (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          id="cart-coupon-input"
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase tracking-wider outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!couponCode.trim() || couponLoading}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          {couponLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </form>
                    ) : (
                      <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>
                            <strong className="font-bold">{appliedCoupon.code}</strong> applied
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {couponSuccess && !appliedCoupon && (
                      <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <Check size={12} /> {couponSuccess}
                      </p>
                    )}

                    {couponError && (
                      <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" /> {couponError}
                      </p>
                    )}
                  </div>
                )}

                {/* 11. Cost Breakdown */}
                <div className="space-y-2.5 pt-2 text-xs border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Cart Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>

                  {cartSettings.showSavings !== false && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> Coupon discount
                      </span>
                      <span className="font-semibold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {cartSettings.showEstimatedShipping !== false && (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      {deliveryCharge === 0 ? (
                        <span className="font-bold text-emerald-600">FREE</span>
                      ) : (
                        <span className="font-semibold text-slate-900">₹{deliveryCharge.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  )}

                  {/* Total Payable */}
                  <div className="border-t border-slate-200 pt-3 mt-1 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">Total Payable</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Store Closed Warning in Summary */}
                {isStoreClosed && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Store Temporarily Closed</strong>
                      <span className="text-[11px] text-amber-800">{storeClosedMsg}</span>
                    </div>
                  </div>
                )}

                {/* 13. Checkout Button */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={isBelowMinOrder || isStoreClosed || hasOutOfStockItems || Boolean(cartPinCoverage && !cartPinCoverage.serviceable)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow active:scale-[0.99] cursor-pointer"
                >
                  {hasOutOfStockItems
                    ? 'Remove Out of Stock Items to Checkout'
                    : isStoreClosed
                    ? 'Store Currently Closed'
                    : isBelowMinOrder
                    ? 'Minimum Order Amount Not Met'
                    : (cartPinCoverage && !cartPinCoverage.serviceable)
                    ? 'Delivery Unavailable for Selected PIN'
                    : (cartSettings.checkoutButtonText || 'Proceed to Checkout')}
                  {!isStoreClosed && !hasOutOfStockItems && !isBelowMinOrder && (!cartPinCoverage || cartPinCoverage.serviceable) && (
                    <ArrowRight size={16} />
                  )}
                </button>

                {/* Secondary Link: Continue Shopping */}
                <div className="text-center pt-1">
                  <Link
                    to={cartSettings.continueShoppingUrl || '/shop'}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                  >
                    {cartSettings.continueShoppingText || 'Continue Shopping'}
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={13} className="text-slate-500" /> Secure Checkout
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Zap size={13} className="text-slate-500" /> Fast Delivery
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 17. Mobile Sticky Bottom Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 p-3 px-4 shadow-lg z-30 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Payable
          </span>
          <span className="text-base font-black text-blue-600">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleProceedToCheckout}
          disabled={isBelowMinOrder || isStoreClosed || hasOutOfStockItems || Boolean(cartPinCoverage && !cartPinCoverage.serviceable)}
          className="flex-1 max-w-[220px] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99]"
        >
          {hasOutOfStockItems 
            ? 'Unavailable Items' 
            : (cartPinCoverage && !cartPinCoverage.serviceable)
            ? 'PIN Unserviceable'
            : 'Proceed to Checkout'}
          {!isStoreClosed && !hasOutOfStockItems && !isBelowMinOrder && (!cartPinCoverage || cartPinCoverage.serviceable) && <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
}
