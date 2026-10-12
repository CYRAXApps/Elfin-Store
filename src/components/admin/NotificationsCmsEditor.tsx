import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Sliders, ShieldCheck, Eye } from 'lucide-react';

interface NotificationsCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function NotificationsCmsEditor({ formState, setFormState }: NotificationsCmsEditorProps) {
  const [selectedPreview, setSelectedPreview] = useState<string>('freeShippingMsg');

  const notifs = formState.notifications || {
    enabled: true,
    outOfStockMsg: 'This item is currently out of stock. Subscribe for restock alerts.',
    lowStockMsg: 'Hurry! Only a few units left in stock.',
    freeShippingMsg: 'Add ₹{remaining} more to unlock FREE Express Shipping!',
    deliveryEstimateMsg: 'Estimated delivery within 3-5 business days.',
    orderConfirmMsg: 'Thank you for your order! Your invoice and tracking details have been generated.',
    paymentSuccessMsg: 'Payment captured successfully via Razorpay.',
    paymentFailureMsg: 'Payment was not completed. Please try again or choose an alternate payment method.',
    maintenanceMsg: 'We are performing scheduled store upgrades. We will be back shortly!',
    storeClosedMsg: 'The store is currently closed for new orders. Please check back during business hours.',
    showCloseButton: true,
    displayTiming: '8s',
    targetPages: {
      header: true,
      productPage: true,
      cart: true,
      checkout: true,
    },
    status: 'active',
  };

  const handleUpdateField = (field: string, value: any) => {
    setFormState({
      ...formState,
      notifications: {
        ...notifs,
        [field]: value,
      },
    });
  };

  const handleUpdateTargetPage = (page: string, value: boolean) => {
    setFormState({
      ...formState,
      notifications: {
        ...notifs,
        targetPages: {
          ...(notifs.targetPages || { header: true, productPage: true, cart: true, checkout: true }),
          [page]: value,
        },
      },
    });
  };

  const notificationDefinitions = [
    {
      key: 'freeShippingMsg',
      label: 'Free Shipping Threshold Banner',
      hint: 'Supports {remaining} token to automatically display the dynamic remaining cart balance to qualify.',
      icon: Info,
      type: 'banner',
    },
    {
      key: 'lowStockMsg',
      label: 'Low Stock Urgency Alert',
      hint: 'Displayed on product details page when remaining inventory drops below threshold.',
      icon: AlertTriangle,
      type: 'toast',
    },
    {
      key: 'outOfStockMsg',
      label: 'Out of Stock Notification',
      hint: 'Shown on product page and cart if product units are zero.',
      icon: AlertTriangle,
      type: 'toast',
    },
    {
      key: 'deliveryEstimateMsg',
      label: 'Delivery Timeline Estimate',
      hint: 'Shown in cart summary and checkout shipping selection steps.',
      icon: Clock,
      type: 'banner',
    },
    {
      key: 'orderConfirmMsg',
      label: 'Order Placement Confirmation',
      hint: 'Shown on order completion page and sent via customer notification channel.',
      icon: CheckCircle2,
      type: 'toast',
    },
    {
      key: 'paymentSuccessMsg',
      label: 'Payment Captured Success',
      hint: 'Displayed immediately upon successful Razorpay / Gateway authorization.',
      icon: CheckCircle2,
      type: 'toast',
    },
    {
      key: 'paymentFailureMsg',
      label: 'Payment Incomplete Notice',
      hint: 'Displayed if card or UPI transaction is declined or cancelled.',
      icon: AlertTriangle,
      type: 'toast',
    },
    {
      key: 'maintenanceMsg',
      label: 'Store Maintenance Notification',
      hint: 'Displayed across storefront during system maintenance window.',
      icon: Info,
      type: 'banner',
    },
    {
      key: 'storeClosedMsg',
      label: 'Store Closed Notice',
      hint: 'Displayed when store status is set to catalog-only or closed.',
      icon: Info,
      type: 'banner',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Bell className="text-blue-600" size={20} />
            <span>Storefront Customer Notifications & System Messages</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Configure dynamic messages, display placements, timing duration, and dismissal behavior.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={notifs.enabled !== false}
              onChange={(e) => handleUpdateField('enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs font-bold text-slate-800">
              {notifs.enabled !== false ? 'Notifications Active' : 'Notifications Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Global Notification Configuration Bar */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sliders size={14} /> Display Timing, Placements & Behavior
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">System Notification Status</label>
            <select
              value={notifs.status || 'active'}
              onChange={(e) => handleUpdateField('status', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
            >
              <option value="active">Active (Display on Triggers)</option>
              <option value="paused">Paused (Mute All Notifications)</option>
            </select>
          </div>

          {/* Display Timing Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Auto-Dismiss Duration (Toasts)</label>
            <select
              value={notifs.displayTiming || '8s'}
              onChange={(e) => handleUpdateField('displayTiming', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
            >
              <option value="5s">5 Seconds</option>
              <option value="8s">8 Seconds (Default Recommended)</option>
              <option value="12s">12 Seconds (Extended Reading)</option>
              <option value="sticky">Sticky (Require Manual Close)</option>
            </select>
          </div>

          {/* Close Button Toggle */}
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifs.showCloseButton !== false}
                onChange={(e) => handleUpdateField('showCloseButton', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700">Allow Customer to Close / Dismiss</span>
            </label>
          </div>
        </div>

        {/* Target Pages Checkboxes */}
        <div className="pt-3 border-t border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-2">Enabled Target Pages / Placements:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'header', label: 'Header Announcement Bar' },
              { key: 'productPage', label: 'Product Details Pages' },
              { key: 'cart', label: 'Shopping Cart Page' },
              { key: 'checkout', label: 'Checkout & Payment Pages' },
            ].map((tgt) => (
              <label key={tgt.key} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean((notifs.targetPages as any)?.[tgt.key])}
                  onChange={(e) => handleUpdateTargetPage(tgt.key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-medium text-slate-800">{tgt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Message Text Editors */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Message Copy & Notification Templates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notificationDefinitions.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedPreview === item.key;
            return (
              <div
                key={item.key}
                className={`p-4 bg-white border rounded-2xl transition-all ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Icon size={14} className="text-blue-600" />
                    <span>{item.label}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedPreview(item.key)}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> Preview
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{item.hint}</p>
                <textarea
                  rows={2}
                  value={(notifs as any)[item.key] || ''}
                  onChange={(e) => handleUpdateField(item.key, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  placeholder="Enter message text..."
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Interactive Notification Simulation Preview */}
      <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Eye size={14} className="text-amber-400" /> Live Customer Notification Simulation
          </span>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
            Selected: {notificationDefinitions.find((d) => d.key === selectedPreview)?.label}
          </span>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
          {selectedPreview === 'freeShippingMsg' ? (
            <div className="bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-200 shrink-0" />
                <span>{(notifs.freeShippingMsg || '').replace('{remaining}', '150')}</span>
              </div>
              {notifs.showCloseButton !== false && (
                <span className="text-emerald-200 text-xs cursor-pointer hover:text-white">✕</span>
              )}
            </div>
          ) : selectedPreview === 'lowStockMsg' || selectedPreview === 'outOfStockMsg' ? (
            <div className="bg-amber-500 text-slate-950 p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-slate-900 shrink-0" />
                <span>{(notifs as any)[selectedPreview]}</span>
              </div>
              {notifs.showCloseButton !== false && (
                <span className="text-slate-900 text-xs cursor-pointer hover:text-black">✕</span>
              )}
            </div>
          ) : (
            <div className="bg-blue-600 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-md">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-blue-200 shrink-0" />
                <span>{(notifs as any)[selectedPreview]}</span>
              </div>
              {notifs.showCloseButton !== false && (
                <span className="text-blue-200 text-xs cursor-pointer hover:text-white">✕</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
