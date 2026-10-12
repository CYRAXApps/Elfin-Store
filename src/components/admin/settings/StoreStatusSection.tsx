import React, { useState, useEffect } from 'react';
import { 
  Power, CheckCircle2, AlertTriangle, Wrench, 
  Clock, ShieldAlert, Image, Shield 
} from 'lucide-react';
import { SettingItemCard } from '../SettingItemCard';
import { AdvancedOptionsSection } from '../AdvancedOptionsSection';
import { SiteSettings } from '../../../context/SiteSettingsContext';

interface StoreStatusSectionProps {
  settings: SiteSettings;
  onUpdateField: (category: keyof SiteSettings, field: string, value: any) => Promise<void>;
  onBatchUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
}

export function StoreStatusSection({ settings, onUpdateField, onBatchUpdate }: StoreStatusSectionProps) {
  const currentStatus = settings.general?.storeStatus || (settings.maintenance?.enabled ? 'maintenance' : 'active');
  const maintenance = settings.maintenance || {
    enabled: false,
    title: 'Store Under Scheduled Maintenance',
    message: 'We are performing essential system updates. Our store will be back shortly with exciting new products!',
    estimatedReturn: 'Today by 6:00 PM IST',
    contactInfo: settings.general?.storeEmail || '',
    maintenanceImage: '',
    allowAdminBypass: true,
  };

  // Local draft states
  const [status, setStatus] = useState<'active' | 'closed' | 'maintenance'>(
    currentStatus === 'maintenance' ? 'maintenance' : currentStatus === 'closed' ? 'closed' : 'active'
  );
  const [closedNotice, setClosedNotice] = useState(
    settings.notifications?.storeClosedMsg ||
    'Our online store is currently closed for new orders. Please check back during business hours.'
  );

  // Advanced maintenance options
  const [maintTitle, setMaintTitle] = useState(maintenance.title);
  const [maintMessage, setMaintMessage] = useState(maintenance.message);
  const [estimatedReturn, setEstimatedReturn] = useState(maintenance.estimatedReturn);
  const [allowBypass, setAllowBypass] = useState(maintenance.allowAdminBypass !== false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Synchronize local states when settings update
  useEffect(() => {
    const updatedStatus = settings.general?.storeStatus || (settings.maintenance?.enabled ? 'maintenance' : 'active');
    setStatus(updatedStatus === 'maintenance' ? 'maintenance' : updatedStatus === 'closed' ? 'closed' : 'active');
    setClosedNotice(settings.notifications?.storeClosedMsg || 'Our online store is currently closed for new orders. Please check back during business hours.');
    if (settings.maintenance) {
      setMaintTitle(settings.maintenance.title);
      setMaintMessage(settings.maintenance.message);
      setEstimatedReturn(settings.maintenance.estimatedReturn);
      setAllowBypass(settings.maintenance.allowAdminBypass !== false);
    }
  }, [settings.general?.storeStatus, settings.maintenance, settings.notifications?.storeClosedMsg]);

  const statusDescriptions = {
    active: {
      title: 'Store Open (Normal Operations)',
      desc: 'Customers can browse products, add items to cart, and place orders smoothly.',
      badge: '🟢 Store Open',
      badgeColor: 'emerald' as const,
    },
    closed: {
      title: 'Store Closed (Browsing Only)',
      desc: 'Product catalog is visible for browsing, but checkout and ordering are paused with a friendly store notice.',
      badge: '🟡 Store Closed',
      badgeColor: 'amber' as const,
    },
    maintenance: {
      title: 'Maintenance Mode (Full Upgrade)',
      desc: 'Visitors see a full-screen maintenance notice while you upgrade inventory or perform system maintenance.',
      badge: '🔴 Maintenance Mode',
      badgeColor: 'rose' as const,
    },
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Power size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Store Operational Status</h2>
            <p className="text-xs text-slate-500">
              Control whether your store is open for business, temporarily closed for orders, or in maintenance mode.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Main Store Operational State */}
      <SettingItemCard
        id="store-status"
        name="Store Operational State"
        explanation="Choose whether your store is actively taking orders, paused for the day, or undergoing maintenance."
        icon={Power}
        badge={statusDescriptions[currentStatus === 'maintenance' ? 'maintenance' : currentStatus === 'closed' ? 'closed' : 'active'].badge}
        badgeColor={statusDescriptions[currentStatus === 'maintenance' ? 'maintenance' : currentStatus === 'closed' ? 'closed' : 'active'].badgeColor}
        currentDisplay={
          statusDescriptions[currentStatus === 'maintenance' ? 'maintenance' : currentStatus === 'closed' ? 'closed' : 'active'].title
        }
        onSave={async () => {
          await onBatchUpdate({
            general: {
              ...settings.general,
              storeStatus: status,
            },
            maintenance: {
              ...maintenance,
              enabled: status === 'maintenance',
            },
            notifications: {
              ...settings.notifications,
              storeClosedMsg: closedNotice,
            },
          });
        }}
        onCancel={() => {
          setStatus(currentStatus === 'maintenance' ? 'maintenance' : currentStatus === 'closed' ? 'closed' : 'active');
          setClosedNotice(settings.notifications?.storeClosedMsg || 'Our store is temporarily closed for orders.');
        }}
      >
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">Select Operating State</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: Store Open */}
            <div
              onClick={() => setStatus('active')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                status === 'active'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-slate-900">Store Open</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Full e-commerce capabilities. Customers can browse and purchase freely.
              </p>
            </div>

            {/* Option 2: Store Closed */}
            <div
              onClick={() => setStatus('closed')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                status === 'closed'
                  ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-bold text-slate-900">Store Closed</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Catalog visible for browsing. New checkouts paused with a friendly banner.
              </p>
            </div>

            {/* Option 3: Maintenance Mode */}
            <div
              onClick={() => setStatus('maintenance')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                status === 'maintenance'
                  ? 'border-rose-500 bg-rose-50/50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-xs font-bold text-slate-900">Maintenance</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Full-screen maintenance screen. Perfect for upgrades and catalog refreshes.
              </p>
            </div>
          </div>

          {/* Conditional store closed notice */}
          {status === 'closed' && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Store Closed Customer Notice</label>
              <textarea
                rows={2}
                value={closedNotice}
                onChange={(e) => setClosedNotice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter closed store message"
              />
              <p className="text-[11px] text-slate-400">
                This notice appears prominently in the shopping cart and checkout screen.
              </p>
            </div>
          )}
        </div>
      </SettingItemCard>

      {/* 2. Advanced Options: Maintenance Mode Configuration */}
      <AdvancedOptionsSection
        id="advanced-maintenance-options"
        title="Advanced Maintenance Mode Settings"
        description="Configure the full-screen maintenance headline, detailed explanation, return time, and admin bypass."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Page Headline</label>
            <input
              type="text"
              value={maintTitle}
              onChange={(e) => setMaintTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
              placeholder="Enter maintenance headline"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Explanation Message</label>
            <textarea
              rows={2}
              value={maintMessage}
              onChange={(e) => setMaintMessage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-500"
              placeholder="Enter explanation message"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Re-opening Time</label>
              <input
                type="text"
                value={estimatedReturn}
                onChange={(e) => setEstimatedReturn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter estimated re-opening time"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Access Bypass</label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBypass}
                  onChange={(e) => setAllowBypass(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700">
                  Allow logged-in Store Admins to bypass maintenance screen
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {isSaved && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved successfully!
              </span>
            )}
            {!isSaved && <div></div>}
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  await onBatchUpdate({
                    maintenance: {
                      ...maintenance,
                      title: maintTitle,
                      message: maintMessage,
                      estimatedReturn,
                      allowAdminBypass: allowBypass,
                    },
                  });
                  setIsSaved(true);
                  setTimeout(() => setIsSaved(false), 3000);
                } finally {
                  setIsSaving(false);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Maintenance Details'}
            </button>
          </div>
        </div>
      </AdvancedOptionsSection>
    </div>
  );
}
