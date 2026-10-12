import React, { useState } from 'react';
import { 
  Bell, Mail, MessageSquare, Truck, CheckCircle2, 
  PackageCheck, ShoppingBag, ExternalLink, Sliders, AtSign 
} from 'lucide-react';
import { SettingToggleCard } from '../SettingToggleCard';
import { SettingItemCard } from '../SettingItemCard';
import { AdvancedOptionsSection } from '../AdvancedOptionsSection';
import { SiteSettings } from '../../../context/SiteSettingsContext';

interface NotificationSettingsSectionProps {
  settings: SiteSettings;
  onUpdateField: (category: keyof SiteSettings, field: string, value: any) => Promise<void>;
  onBatchUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
  onOpenLogs?: () => void;
}

export function NotificationSettingsSection({ 
  settings, 
  onUpdateField, 
  onBatchUpdate,
  onOpenLogs 
}: NotificationSettingsSectionProps) {
  const notifs = settings.notifications || {
    enabled: true,
    outOfStockMsg: 'This item is currently out of stock.',
    lowStockMsg: 'Hurry! Only a few items left in stock.',
    freeShippingMsg: 'Add more items to unlock Free Shipping!',
    deliveryEstimateMsg: 'Expected delivery in 3-5 business days.',
    orderConfirmMsg: 'Thank you for your order! Your payment was verified successfully.',
    paymentSuccessMsg: 'Payment verified! Your invoice has been generated.',
    paymentFailureMsg: 'Payment was unsuccessful. Please retry with another payment method.',
    maintenanceMsg: 'We are currently upgrading our store to serve you better.',
    storeClosedMsg: 'Our store is temporarily closed for orders. Please check back soon.',
    status: 'active' as const,
    orderConfirmation: true,
    statusUpdates: true,
    shippingUpdates: true,
    deliveryUpdates: true,
    customerAlerts: true,
    senderEmail: settings.general?.storeEmail || '',
  };

  // Local notification toggles
  const [orderConfirm, setOrderConfirm] = useState(notifs.orderConfirmation !== false);
  const [statusUpdates, setStatusUpdates] = useState(notifs.statusUpdates !== false);
  const [shippingUpdates, setShippingUpdates] = useState(notifs.shippingUpdates !== false);
  const [deliveryUpdates, setDeliveryUpdates] = useState(notifs.deliveryUpdates !== false);
  const [customerAlerts, setCustomerAlerts] = useState(notifs.customerAlerts !== false);

  // Template messages
  const [confirmMsg, setConfirmMsg] = useState(notifs.orderConfirmMsg || 'Thank you for your order! Your payment was verified successfully.');
  const [shippingMsg, setShippingMsg] = useState(notifs.deliveryEstimateMsg || 'Expected delivery in 3-5 business days.');

  // Advanced technical settings
  const [senderEmail, setSenderEmail] = useState(notifs.senderEmail || settings.general?.storeEmail || '');

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Store Notifications & Alerts</h2>
            <p className="text-xs text-slate-500">
              Control automated customer alerts for new orders, tracking updates, and delivery confirmations.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Order Confirmation */}
      <SettingToggleCard
        id="notif-order-confirm"
        name="Order Confirmation Alerts"
        explanation="Instantly sends an automated receipt and tax invoice email to the customer upon successful checkout."
        enabled={orderConfirm}
        enabledLabel="Auto-Send Active"
        disabledLabel="Disabled"
        icon={ShoppingBag}
        onToggle={async (newVal) => {
          setOrderConfirm(newVal);
          await onBatchUpdate({
            notifications: {
              ...notifs,
              orderConfirmation: newVal,
              orderConfirmMsg: confirmMsg,
            },
          });
        }}
        hasCustomConfig={true}
        onSaveConfig={async () => {
          await onBatchUpdate({
            notifications: {
              ...notifs,
              orderConfirmation: orderConfirm,
              orderConfirmMsg: confirmMsg,
            },
          });
        }}
        onCancelConfig={() => setConfirmMsg(notifs.orderConfirmMsg || 'Thank you for your order!')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Confirmation Message Summary</label>
          <textarea
            rows={2}
            value={confirmMsg}
            onChange={(e) => setConfirmMsg(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-500"
            placeholder="Enter confirmation message summary"
          />
        </div>
      </SettingToggleCard>

      {/* 2. Order Status Updates */}
      <SettingToggleCard
        id="notif-status-updates"
        name="Order Status Updates"
        explanation="Notifies customers whenever an admin moves their order to 'Confirmed', 'Processing', or 'Packaging'."
        enabled={statusUpdates}
        enabledLabel="Status Alerts Active"
        disabledLabel="Disabled"
        icon={CheckCircle2}
        onToggle={async (newVal) => {
          setStatusUpdates(newVal);
          await onBatchUpdate({
            notifications: {
              ...notifs,
              statusUpdates: newVal,
            },
          });
        }}
      />

      {/* 3. Shipping Updates */}
      <SettingToggleCard
        id="notif-shipping-updates"
        name="Shipping & Tracking Updates"
        explanation="Dispatches courier carrier name, tracking number, and live tracking URL as soon as an order is marked Shipped."
        enabled={shippingUpdates}
        enabledLabel="Tracking Alerts Active"
        disabledLabel="Disabled"
        icon={Truck}
        onToggle={async (newVal) => {
          setShippingUpdates(newVal);
          await onBatchUpdate({
            notifications: {
              ...notifs,
              shippingUpdates: newVal,
              deliveryEstimateMsg: shippingMsg,
            },
          });
        }}
        hasCustomConfig={true}
        onSaveConfig={async () => {
          await onBatchUpdate({
            notifications: {
              ...notifs,
              shippingUpdates: shippingUpdates,
              deliveryEstimateMsg: shippingMsg,
            },
          });
        }}
        onCancelConfig={() => setShippingMsg(notifs.deliveryEstimateMsg || 'Expected delivery in 3-5 business days.')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Estimated Delivery Note in Shipping Alerts</label>
          <input
            type="text"
            value={shippingMsg}
            onChange={(e) => setShippingMsg(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-500"
            placeholder="Enter estimated delivery note"
          />
        </div>
      </SettingToggleCard>

      {/* 4. Delivery Updates */}
      <SettingToggleCard
        id="notif-delivery-updates"
        name="Delivery Completion Updates"
        explanation="Sends a confirmation message when courier marks the parcel 'Out for Delivery' and 'Delivered'."
        enabled={deliveryUpdates}
        enabledLabel="Delivery Alerts Active"
        disabledLabel="Disabled"
        icon={PackageCheck}
        onToggle={async (newVal) => {
          setDeliveryUpdates(newVal);
          await onBatchUpdate({
            notifications: {
              ...notifs,
              deliveryUpdates: newVal,
            },
          });
        }}
      />

      {/* 5. Customer Notifications */}
      <SettingToggleCard
        id="notif-customer-alerts"
        name="Customer In-App & Stock Notifications"
        explanation="Enables back-in-stock alerts, promotional announcements, and cart abandonment reminders."
        enabled={customerAlerts}
        enabledLabel="Customer Alerts Active"
        disabledLabel="Disabled"
        icon={Bell}
        onToggle={async (newVal) => {
          setCustomerAlerts(newVal);
          await onBatchUpdate({
            notifications: {
              ...notifs,
              customerAlerts: newVal,
            },
          });
        }}
      />

      {/* Advanced Technical Options */}
      <AdvancedOptionsSection
        id="advanced-notification-options"
        title="Advanced Notification & API Settings"
        description="Technical sender credentials, webhook handlers, and message delivery audit logs."
      >
        <div className="space-y-4">
          <SettingItemCard
            id="sender-email"
            name="Outgoing Sender Email Address"
            explanation="The authorized sender address displayed in customer inboxes as the 'From' address."
            icon={AtSign}
            currentDisplay={notifs.senderEmail || settings.general?.storeEmail || 'Not configured'}
            onSave={async () => {
              if (!senderEmail.trim() || !senderEmail.includes('@')) throw new Error('Please enter a valid email address.');
              await onBatchUpdate({
                notifications: {
                  ...notifs,
                  senderEmail: senderEmail.trim(),
                },
              });
            }}
            onCancel={() => setSenderEmail(notifs.senderEmail || settings.general?.storeEmail || '')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Sender Email Address</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter sender email address"
              />
              <p className="text-[11px] text-slate-400">
                Ensure this domain has verified SPF and DKIM DNS records configured.
              </p>
            </div>
          </SettingItemCard>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block">SMS & WhatsApp Gateway Route</span>
              <span className="text-[11px] text-slate-500">Provider: Transactional High-Priority Delivery Route</span>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">Active</span>
          </div>

          {onOpenLogs && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Detailed Delivery Logs & Metrics</span>
                <span className="text-[11px] text-slate-500">View sent message history, retry failed notifications, and delivery stats.</span>
              </div>
              <button
                type="button"
                onClick={onOpenLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <span>Open Logs Console</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>
      </AdvancedOptionsSection>
    </div>
  );
}
