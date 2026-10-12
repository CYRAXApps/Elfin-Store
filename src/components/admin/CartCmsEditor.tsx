import React from 'react';
import { ShoppingCart, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck, Plus, Minus, Trash2, Heart, Sparkles, Percent } from 'lucide-react';
import { SiteSettings } from '../../context/SiteSettingsContext';

interface CartCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function CartCmsEditor({ formState, setFormState }: CartCmsEditorProps) {
  const cart = formState.cartSettings || {
    cartTitle: 'Shopping Cart',
    cartSubtitle: 'Review items in your cart, apply coupons, and proceed to secure checkout.',
    emptyCartTitle: 'Your cart is empty',
    emptyCartMessage: "Looks like you haven't added anything to your cart yet.",
    continueShoppingText: 'Continue Shopping',
    continueShoppingUrl: '/shop',
    checkoutButtonText: 'PROCEED TO CHECKOUT',
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
    showCrossSells: true,
    crossSellsTitle: 'You May Also Like',
  };

  const updateCart = (updates: Partial<typeof cart>) => {
    setFormState(prev => ({
      ...prev,
      cartSettings: {
        ...prev.cartSettings,
        ...updates
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cart Page CMS & Flow Configuration</h2>
            <p className="text-xs text-slate-500">Customize cart layout, messaging, empty state, quantity limits, free shipping progress, and cross-sell rules.</p>
          </div>
        </div>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 1: Page Text & Labels */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShoppingBag size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Page Headlines & CTA Labels</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cart Page Title</label>
              <input
                type="text"
                value={cart.cartTitle ?? 'Shopping Cart'}
                onChange={(e) => updateCart({ cartTitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Shopping Cart"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cart Page Subtitle / Instructions</label>
              <input
                type="text"
                value={cart.cartSubtitle ?? ''}
                onChange={(e) => updateCart({ cartSubtitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Review items, apply coupons, and proceed to checkout."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Proceed to Checkout Button Text</label>
              <input
                type="text"
                value={cart.checkoutButtonText ?? 'PROCEED TO CHECKOUT'}
                onChange={(e) => updateCart({ checkoutButtonText: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-600 uppercase"
                placeholder="PROCEED TO CHECKOUT"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Continue Shopping Text</label>
                <input
                  type="text"
                  value={cart.continueShoppingText ?? 'Continue Shopping'}
                  onChange={(e) => updateCart({ continueShoppingText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  placeholder="Continue Shopping"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Continue Shopping Link</label>
                <input
                  type="text"
                  value={cart.continueShoppingUrl ?? '/shop'}
                  onChange={(e) => updateCart({ continueShoppingUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  placeholder="/shop"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Empty Cart State Configuration */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShoppingBag size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Empty Cart State Appearance</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Empty Cart Title</label>
              <input
                type="text"
                value={cart.emptyCartTitle ?? 'Your cart is empty'}
                onChange={(e) => updateCart({ emptyCartTitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Your cart is empty"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Empty Cart Descriptive Message</label>
              <textarea
                rows={3}
                value={cart.emptyCartMessage ?? "Looks like you haven't added anything to your cart yet."}
                onChange={(e) => updateCart({ emptyCartMessage: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Looks like you haven't added anything to your cart yet."
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
              <ShoppingBag size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800">
                <span className="font-bold">Live Preview Hint:</span> When a shopper's bag contains zero items, this title and description are rendered alongside the prominent Start Shopping CTA button.
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Item Interaction & Controls */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Plus size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Cart Item Interaction Controls</h3>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'enableQuantityControls',
                title: 'Quantity Stepper (+ / - Buttons)',
                desc: 'Allows shoppers to increment and decrement item quantities directly inside the cart table.',
                checked: cart.enableQuantityControls !== false,
                icon: Plus
              },
              {
                id: 'enableRemoveItem',
                title: 'Remove Item Button (Trash Icon)',
                desc: 'Enables quick one-click deletion of individual items with recalculation of totals.',
                checked: cart.enableRemoveItem !== false,
                icon: Trash2
              },
              {
                id: 'enableWishlistLink',
                title: 'Move to Wishlist Action',
                desc: 'Allows saving cart items directly to the customer wishlist for later purchasing.',
                checked: cart.enableWishlistLink !== false,
                icon: Heart
              },
              {
                id: 'showStockWarning',
                title: 'Stock Warning & Availability Alerts',
                desc: 'Displays low-stock alerts or inventory warnings if cart quantity exceeds current stock.',
                checked: cart.showStockWarning !== false,
                icon: ShieldCheck
              }
            ].map(item => (
              <label key={item.id} className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-start gap-2.5 pr-2">
                  <item.icon size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{item.title}</span>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => updateCart({ [item.id]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-1 shrink-0"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Section 4: Summary & Promotional Blocks */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Percent size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Summary, Coupons & Cross-Sells</h3>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: 'showCartSummary',
                title: 'Cart Order Summary Card',
                desc: 'Show sticky subtotal, discounts, shipping charges, and total box.',
                checked: cart.showCartSummary !== false,
                icon: ShoppingCart
              },
              {
                id: 'enableCouponField',
                title: 'Coupon / Voucher Input Field',
                desc: 'Allow shoppers to input discount codes and calculate savings before checkout.',
                checked: cart.enableCouponField !== false,
                icon: Tag
              },
              {
                id: 'showSavings',
                title: 'Total Savings & Discount Pill',
                desc: 'Highlight money saved through active discounts or promotional vouchers.',
                checked: cart.showSavings !== false,
                icon: Percent
              },
              {
                id: 'showEstimatedShipping',
                title: 'Estimated Delivery & Shipping Charge',
                desc: 'Display standard delivery charge calculations based on order total.',
                checked: cart.showEstimatedShipping !== false,
                icon: Truck
              },
              {
                id: 'showCrossSells',
                title: 'Recommended Products / Cross-Sells Strip',
                desc: 'Show recommended gadget accessories or popular products below the cart items.',
                checked: cart.showCrossSells !== false,
                icon: Sparkles
              }
            ].map(item => (
              <label key={item.id} className="flex items-start justify-between p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-start gap-2.5 pr-2">
                  <item.icon size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{item.title}</span>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => updateCart({ [item.id]: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded mt-1 shrink-0"
                />
              </label>
            ))}

            {cart.showCrossSells !== false && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Cross-Sell Section Heading</label>
                <input
                  type="text"
                  value={cart.crossSellsTitle ?? 'You May Also Like'}
                  onChange={(e) => updateCart({ crossSellsTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  placeholder="You May Also Like"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Thresholds & Free Shipping Progress Bar */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Truck size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Free Shipping Progress & Minimum Order Restrictions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Free Shipping Progress Bar</span>
                <input
                  type="checkbox"
                  checked={cart.freeShippingProgress !== false}
                  onChange={(e) => updateCart({ freeShippingProgress: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              <p className="text-[11px] text-slate-500">Displays dynamic progress meter (e.g., "Add ₹150 more for FREE Delivery").</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={cart.freeShippingThreshold ?? 500}
                onChange={(e) => updateCart({ freeShippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500">Orders equal to or above this value get ₹0 delivery fee.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">Minimum Order Amount (₹)</label>
              <input
                type="number"
                value={cart.minOrderAmount ?? 0}
                onChange={(e) => updateCart({ minOrderAmount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-500">Set to 0 to allow checkouts of any amount without restrictions.</p>
            </div>
          </div>

          {cart.minOrderAmount > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Order Alert Message</label>
              <input
                type="text"
                value={cart.minOrderMessage ?? `Minimum order amount of ₹${cart.minOrderAmount} is required to checkout.`}
                onChange={(e) => updateCart({ minOrderMessage: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Minimum order amount required to checkout."
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
