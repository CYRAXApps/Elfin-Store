import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { Sliders, ShieldCheck, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2, Zap, Server } from 'lucide-react';

interface AdvancedCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function AdvancedCmsEditor({ formState, setFormState }: AdvancedCmsEditorProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const adv = formState.advanced || {
    storeEnabled: true,
    customerRegistrationEnabled: true,
    guestCheckoutEnabled: true,
    reviewsEnabled: true,
    wishlistEnabled: true,
    searchEnabled: true,
    maintenanceMode: false,
    cacheTtlSeconds: 300,
    maxItemsPerOrder: 50,
    orderAutoCancelMinutes: 60,
    rateLimitEnabled: true,
    enableDebugLogs: false,
    featureFlags: {
      loyaltyProgram: true,
      giftCards: true,
      instantStoreCredit: true,
      gstInvoicing: true,
      fastCheckout: true,
      abandonedCartRecovery: true,
    },
  };

  const handleUpdate = (field: string, value: any) => {
    // Validate numeric values
    if (field === 'cacheTtlSeconds' && (value < 0 || value > 86400)) {
      setValidationError('Cache TTL must be between 0 and 86400 seconds.');
      return;
    }
    if (field === 'maxItemsPerOrder' && (value < 1 || value > 500)) {
      setValidationError('Max items per order must be between 1 and 500.');
      return;
    }
    if (field === 'orderAutoCancelMinutes' && (value < 5 || value > 1440)) {
      setValidationError('Order auto-cancel window must be between 5 and 1440 minutes.');
      return;
    }
    setValidationError(null);

    setFormState({
      ...formState,
      advanced: {
        ...adv,
        [field]: value,
      },
    });
  };

  const handleToggleFeatureFlag = (key: string, value: boolean) => {
    setFormState({
      ...formState,
      advanced: {
        ...adv,
        featureFlags: {
          ...(adv.featureFlags || {}),
          [key]: value,
        },
      },
    });
  };

  const featureFlagList = [
    {
      key: 'loyaltyProgram',
      label: `${formState.general?.storeName || 'Store'} Loyalty Rewards & Points Club`,
      desc: 'Allows customers to earn and redeem reward points at checkout on verified orders.',
    },
    {
      key: 'giftCards',
      label: 'Digital Gift Cards & E-Vouchers',
      desc: 'Enables purchasing and redeeming gift card voucher codes at checkout.',
    },
    {
      key: 'instantStoreCredit',
      label: 'Instant Wallet & Store Credit System',
      desc: 'Provides automated refund wallet and credit balance applied directly to cart.',
    },
    {
      key: 'gstInvoicing',
      label: 'B2B GST Compliant Tax Invoicing',
      desc: 'Generates GST invoice with Company GSTIN, HSN codes, and CGST/SGST/IGST breakdown.',
    },
    {
      key: 'fastCheckout',
      label: 'Fast One-Click Express Checkout',
      desc: 'Streamlined checkout mode for returning customers with saved shipping addresses.',
    },
    {
      key: 'abandonedCartRecovery',
      label: 'Abandoned Cart Automated Reminder Sync',
      desc: 'Logs abandoned checkouts to send automated recovery discounts.',
    },
  ];

  const storefrontToggleList = [
    {
      key: 'storeEnabled',
      label: 'Storefront Online Status',
      desc: 'Master toggle to accept purchases online.',
    },
    {
      key: 'customerRegistrationEnabled',
      label: 'New Customer Sign-ups',
      desc: 'Allow new buyers to register accounts.',
    },
    {
      key: 'guestCheckoutEnabled',
      label: 'Guest Checkout Mode',
      desc: 'Allow checkout without mandatory password creation.',
    },
    {
      key: 'reviewsEnabled',
      label: 'Product Reviews & Ratings',
      desc: 'Allow verified purchasers to leave star reviews and photos.',
    },
    {
      key: 'wishlistEnabled',
      label: 'Customer Saved Wishlist',
      desc: 'Enable heart icon and wishlist bookmarking.',
    },
    {
      key: 'searchEnabled',
      label: 'Realtime Search Bar & Catalog Index',
      desc: 'Enables instant search query dropdown across products.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sliders className="text-blue-600" size={20} />
            <span>Advanced Storefront Settings & Feature Flags</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Toggle high-level e-commerce capabilities, storefront features, and server safety limits.
          </p>
        </div>
      </div>

      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Feature Flags Module */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" /> Core E-Commerce Feature Flags
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featureFlagList.map((flag) => {
            const isEnabled = Boolean((adv.featureFlags as any)?.[flag.key]);
            return (
              <div
                key={flag.key}
                className={`p-4 bg-white border rounded-2xl transition-all shadow-xs flex items-start justify-between gap-4 ${
                  isEnabled ? 'border-slate-300' : 'border-slate-200 opacity-75 bg-slate-50/50'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900">{flag.label}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{flag.desc}</p>
                </div>

                <label className="flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToggleFeatureFlag(flag.key, e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                      isEnabled ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Storefront Feature Toggles */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-blue-600" /> Storefront Capabilities & Customer Access
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {storefrontToggleList.map((toggle) => {
            const isEnabled = Boolean((adv as any)[toggle.key]);
            return (
              <div
                key={toggle.key}
                className={`p-4 bg-white border rounded-2xl transition-all shadow-xs flex flex-col justify-between gap-3 ${
                  isEnabled ? 'border-slate-300' : 'border-slate-200 opacity-75 bg-slate-50/50'
                }`}
              >
                <div>
                  <h4 className="text-xs font-black text-slate-900">{toggle.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{toggle.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className={`text-[11px] font-bold ${isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleUpdate(toggle.key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safe Performance & Limit Controls */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Server size={14} /> Safe System Limits & Cache Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cache TTL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Client Cache TTL (Seconds)</label>
            <input
              type="number"
              min={0}
              max={86400}
              value={adv.cacheTtlSeconds || 300}
              onChange={(e) => handleUpdate('cacheTtlSeconds', Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Default: 300s (5 minutes)</span>
          </div>

          {/* Max items per order */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Max Items per Single Order</label>
            <input
              type="number"
              min={1}
              max={500}
              value={adv.maxItemsPerOrder || 50}
              onChange={(e) => handleUpdate('maxItemsPerOrder', Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Prevents cart hoarding abuse</span>
          </div>

          {/* Auto Cancel Minutes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unpaid Order Timeout (Minutes)</label>
            <input
              type="number"
              min={5}
              max={1440}
              value={adv.orderAutoCancelMinutes || 60}
              onChange={(e) => handleUpdate('orderAutoCancelMinutes', Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Releases inventory back if unpaid</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={adv.rateLimitEnabled !== false}
              onChange={(e) => handleUpdate('rateLimitEnabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">API Rate Limit & Bot Protection</span>
              <span className="text-[11px] text-slate-500">Safeguards search and checkout endpoints</span>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(adv.enableDebugLogs)}
              onChange={(e) => handleUpdate('enableDebugLogs', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Debug Logging & Telemetry</span>
              <span className="text-[11px] text-slate-500">Outputs diagnostics to dev console</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
