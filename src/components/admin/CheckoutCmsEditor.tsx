import React from 'react';
import { CreditCard, ShieldCheck, UserCheck, FileText, Truck, Tag, Lock, CheckCircle2, MapPin, Building, Sparkles } from 'lucide-react';
import { SiteSettings } from '../../context/SiteSettingsContext';

interface CheckoutCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function CheckoutCmsEditor({ formState, setFormState }: CheckoutCmsEditorProps) {
  const checkout = formState.checkoutSettings || {
    checkoutTitle: 'Secure Checkout',
    checkoutSubtitle: 'Review shipping destination, delivery method, and payment summary.',
    guestCheckoutEnabled: true,
    loginRequired: false,
    couponFieldEnabled: true,
    couponPlaceholder: 'Enter coupon code',
    shippingAddressFields: {
      landmarkRequired: false,
      phoneRequired: true,
      stateRequired: true,
      cityRequired: true,
    },
    showBillingAddress: true,
    sameAsShippingOption: true,
    showOrderNotes: true,
    termsAcceptanceRequired: true,
    termsText: "I agree to the Terms of Service and Privacy Policy.",
    termsUrl: '/terms',
    showInvoiceInfo: true,
    showGstinField: true,
    showOrderSummary: true,
    showItemImages: true,
    showShippingOptions: true,
    shippingSectionTitle: 'Delivery & Shipping Speed',
    showPaymentMethods: true,
    razorpayTitle: 'Razorpay Secure Gateway',
    razorpayDescription: 'Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets',
    placeOrderButtonText: 'PAY VIA RAZORPAY',
    successTitle: 'Thank You for Your Order!',
    successSubtitle: 'Order Confirmed & Payment Verified',
    successMessage: "Your payment was successfully processed. We've dispatched your order confirmation and official GST tax invoice.",
    successButtonText: 'Track Order Status',
  };

  const updateCheckout = (updates: Partial<typeof checkout>) => {
    setFormState(prev => ({
      ...prev,
      checkoutSettings: {
        ...prev.checkoutSettings,
        ...updates
      }
    }));
  };

  const updateAddressFields = (field: string, val: boolean) => {
    setFormState(prev => ({
      ...prev,
      checkoutSettings: {
        ...prev.checkoutSettings,
        shippingAddressFields: {
          ...(prev.checkoutSettings?.shippingAddressFields || {
            landmarkRequired: false,
            phoneRequired: true,
            stateRequired: true,
            cityRequired: true,
          }),
          [field]: val
        }
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CreditCard size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Checkout Flow & Confirmation CMS</h2>
            <p className="text-xs text-slate-500">Configure authentication gates, address validation, GST tax invoice disclosures, payment gateways, terms acceptance, and post-order success screens.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 1: Authentication & Access Gates */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserCheck size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Authentication & Access Policies</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Checkout Page Heading</label>
              <input
                type="text"
                value={checkout.checkoutTitle ?? 'Secure Checkout'}
                onChange={(e) => updateCheckout({ checkoutTitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Secure Checkout"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Checkout Subtitle / Trust Text</label>
              <input
                type="text"
                value={checkout.checkoutSubtitle ?? ''}
                onChange={(e) => updateCheckout({ checkoutSubtitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Review shipping destination, delivery method, and payment summary."
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <label className="flex items-start justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Allow Guest Checkout</span>
                  <span className="text-[11px] text-slate-500">Shoppers can place orders with just their email/phone without creating a permanent account password.</span>
                </div>
                <input
                  type="checkbox"
                  checked={checkout.guestCheckoutEnabled !== false}
                  onChange={(e) => updateCheckout({ guestCheckoutEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-1 shrink-0"
                />
              </label>

              <label className="flex items-start justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Require Login Before Checkout</span>
                  <span className="text-[11px] text-slate-500">Redirect unauthenticated visitors to the login/registration screen before they can reach the checkout page.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(checkout.loginRequired)}
                  onChange={(e) => updateCheckout({ loginRequired: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-1 shrink-0"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Address Validation & Billing Fields */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MapPin size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Address Fields & Billing Controls</h3>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Require Verified Mobile Phone Number</span>
              <input
                type="checkbox"
                checked={checkout.shippingAddressFields?.phoneRequired !== false}
                onChange={(e) => updateAddressFields('phoneRequired', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Require Landmark / Apartment Details</span>
              <input
                type="checkbox"
                checked={Boolean(checkout.shippingAddressFields?.landmarkRequired)}
                onChange={(e) => updateAddressFields('landmarkRequired', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Separate Billing Address Section</span>
              <input
                type="checkbox"
                checked={checkout.showBillingAddress !== false}
                onChange={(e) => updateCheckout({ showBillingAddress: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Provide "Billing Same as Shipping" Option</span>
              <input
                type="checkbox"
                checked={checkout.sameAsShippingOption !== false}
                onChange={(e) => updateCheckout({ sameAsShippingOption: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Taxes, Coupons & Order Summary */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Taxes & Coupon Discounts</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Show Tax Invoice Breakdown (18% GST)</span>
                  <span className="text-[11px] text-slate-500">Displays calculated tax line item and standard compliance notice.</span>
                </div>
                <input
                  type="checkbox"
                  checked={checkout.showInvoiceInfo !== false}
                  onChange={(e) => updateCheckout({ showInvoiceInfo: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Enable Coupon Voucher Field</span>
                  <span className="text-[11px] text-slate-500">Allow customers to apply promo codes at checkout.</span>
                </div>
                <input
                  type="checkbox"
                  checked={checkout.couponFieldEnabled !== false}
                  onChange={(e) => updateCheckout({ couponFieldEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded shrink-0"
                />
              </label>
            </div>

            {checkout.couponFieldEnabled !== false && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Input Placeholder</label>
                <input
                  type="text"
                  value={checkout.couponPlaceholder ?? 'Enter coupon code'}
                  onChange={(e) => updateCheckout({ couponPlaceholder: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  placeholder="Enter coupon code"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Payment Gateways & Place Order CTA */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Payment Gateway Disclosures & CTA</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method Display Title</label>
              <input
                type="text"
                value={checkout.razorpayTitle ?? 'Razorpay Secure Gateway'}
                onChange={(e) => updateCheckout({ razorpayTitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Razorpay Secure Gateway"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method Subtitle / Badges</label>
              <input
                type="text"
                value={checkout.razorpayDescription ?? 'Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets'}
                onChange={(e) => updateCheckout({ razorpayDescription: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Place Order / Pay CTA Button Text</label>
              <input
                type="text"
                value={checkout.placeOrderButtonText ?? 'PAY VIA RAZORPAY'}
                onChange={(e) => updateCheckout({ placeOrderButtonText: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-600 uppercase"
                placeholder="PAY VIA RAZORPAY"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Terms & Conditions Agreement */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock size={18} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Terms of Service & Compliance Acceptance</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Require Explicit Terms & Conditions Checkbox</span>
              <input
                type="checkbox"
                checked={checkout.termsAcceptanceRequired !== false}
                onChange={(e) => updateCheckout({ termsAcceptanceRequired: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terms Acceptance Text</label>
              <textarea
                rows={2}
                value={checkout.termsText ?? "I agree to the Terms of Service and Privacy Policy."}
                onChange={(e) => updateCheckout({ termsText: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="I agree to the Terms of Service and Privacy Policy."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terms Page URL</label>
              <input
                type="text"
                value={checkout.termsUrl ?? '/terms'}
                onChange={(e) => updateCheckout({ termsUrl: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="/terms"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Order Confirmation & Success Screen */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Order Success & Confirmation Screen</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Success Screen Title</label>
              <input
                type="text"
                value={checkout.successTitle ?? 'Thank You for Your Order!'}
                onChange={(e) => updateCheckout({ successTitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Thank You for Your Order!"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Success Pill / Subtitle</label>
              <input
                type="text"
                value={checkout.successSubtitle ?? 'Order Confirmed & Payment Verified'}
                onChange={(e) => updateCheckout({ successSubtitle: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Order Confirmed & Payment Verified"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Success Message Paragraph</label>
              <textarea
                rows={2}
                value={checkout.successMessage ?? "Your payment was successfully processed. We've dispatched your order confirmation and official GST tax invoice."}
                onChange={(e) => updateCheckout({ successMessage: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Your payment was successfully processed. We've dispatched your order confirmation and official GST tax invoice."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Track Order Button Label</label>
              <input
                type="text"
                value={checkout.successButtonText ?? 'Track Order Status'}
                onChange={(e) => updateCheckout({ successButtonText: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                placeholder="Track Order Status"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
