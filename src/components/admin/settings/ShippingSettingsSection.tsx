import React, { useState, useEffect } from 'react';
import { 
  Truck, DollarSign, Gift, Map, Clock, PackageCheck, 
  Plus, Trash2, CheckCircle2, ShieldAlert, ArrowRight,
  Layers, Navigation, MapPin
} from 'lucide-react';
import { SettingItemCard } from '../SettingItemCard';
import { SettingToggleCard } from '../SettingToggleCard';
import { AdvancedOptionsSection } from '../AdvancedOptionsSection';
import { SiteSettings } from '../../../context/SiteSettingsContext';
import { DeliveryCoverageManager } from './DeliveryCoverageManager';
import type { DeliveryCoverageConfig } from '../../../services/indiaGeographicData';

interface ShippingSettingsSectionProps {
  settings: SiteSettings;
  onUpdateField: (category: keyof SiteSettings, field: string, value: any) => Promise<void>;
  onBatchUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
}

export function ShippingSettingsSection({ settings, onUpdateField, onBatchUpdate }: ShippingSettingsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'coverage' | 'rates'>('coverage');
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);

  const shipping = settings.shipping || {
    shippingEnabled: true,
    defaultShippingCharge: 50,
    freeShippingEnabled: true,
    freeShippingThreshold: 500,
    deliveryAreas: 'All Serviceable PIN Codes across India (20,000+ PINs)',
    estimatedDeliveryDays: '3 - 5 Business Days',
    minDeliveryDays: 3,
    maxDeliveryDays: 5,
    shippingMethods: [
      { id: 'standard', name: 'Standard Express Delivery', charge: 50, estimatedDays: '3 - 5 Business Days', enabled: true },
      { id: 'free', name: 'Free Standard Delivery', charge: 0, estimatedDays: '3 - 5 Business Days', enabled: true },
    ],
  };

  // Local draft states
  const [shippingCharge, setShippingCharge] = useState<number>(shipping.defaultShippingCharge ?? 50);
  const [freeThreshold, setFreeThreshold] = useState<number>(shipping.freeShippingThreshold ?? 500);
  const [freeEnabled, setFreeEnabled] = useState<boolean>(shipping.freeShippingEnabled !== false);
  const [deliveryAreas, setDeliveryAreas] = useState<string>(shipping.deliveryAreas || 'All Serviceable PIN Codes across India');
  const [minDays, setMinDays] = useState<number>(shipping.minDeliveryDays ?? 3);
  const [maxDays, setMaxDays] = useState<number>(shipping.maxDeliveryDays ?? 5);

  // Shipping methods state
  const [methods, setMethods] = useState(
    shipping.shippingMethods && shipping.shippingMethods.length > 0
      ? shipping.shippingMethods
      : [
          { id: 'standard', name: 'Standard Express Delivery', charge: 50, estimatedDays: '3 - 5 Business Days', enabled: true },
          { id: 'express', name: 'Priority Next-Day Air', charge: 150, estimatedDays: '1 - 2 Business Days', enabled: true },
        ]
  );

  // Synchronize local states when settings update
  useEffect(() => {
    if (settings.shipping) {
      setShippingCharge(settings.shipping.defaultShippingCharge ?? 50);
      setFreeThreshold(settings.shipping.freeShippingThreshold ?? 500);
      setFreeEnabled(settings.shipping.freeShippingEnabled !== false);
      setDeliveryAreas(settings.shipping.deliveryAreas || 'All Serviceable PIN Codes across India');
      setMinDays(settings.shipping.minDeliveryDays ?? 3);
      setMaxDays(settings.shipping.maxDeliveryDays ?? 5);
      if (settings.shipping.shippingMethods && settings.shipping.shippingMethods.length > 0) {
        setMethods(settings.shipping.shippingMethods);
      }
    }
  }, [settings.shipping]);

  const handleSaveCoverage = async (coverageConfig: DeliveryCoverageConfig, summaryText: string) => {
    setIsSavingCoverage(true);
    try {
      await onBatchUpdate({
        shipping: {
          ...shipping,
          deliveryCoverage: coverageConfig,
          deliveryAreas: summaryText,
        },
      });
      setDeliveryAreas(summaryText);
    } finally {
      setIsSavingCoverage(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Shipping & Delivery Management</h2>
              <p className="text-xs text-slate-500">
                Configure coverage areas by State → District → Sub-divisions, courier delivery rates, and speeds.
              </p>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('coverage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'coverage'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation size={14} />
              Coverage Area (State → District → Divisions)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('rates')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'rates'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign size={14} />
              Rates & Thresholds
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab 1: State -> District -> Sub-divisions Coverage Manager */}
      {activeSubTab === 'coverage' && (
        <DeliveryCoverageManager
          coverageConfig={shipping.deliveryCoverage}
          onSaveCoverage={handleSaveCoverage}
          isSaving={isSavingCoverage}
        />
      )}

      {/* Sub-tab 2: Rates & Shipping Methods */}
      {activeSubTab === 'rates' && (
        <>
          {/* Quick link to live shipping operations */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Truck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">Daily Shipment Dispatch & Tracking Operations</h4>
                <p className="text-[11px] text-blue-700">
                  Assign courier AWB codes, print dispatch slips, record delivery attempts, and update tracking stages.
                </p>
              </div>
            </div>
            <a
              href="/admin?tab=shipping"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
            >
              <span>Open Shipping Dashboard</span>
              <ArrowRight size={13} />
            </a>
          </div>

      {/* 1. Enable/Disable Shipping */}
      <SettingToggleCard
        id="enable-shipping"
        name="Enable Physical Shipping"
        explanation="Allow customers to place orders for physical courier delivery to their doorstep."
        enabled={shipping.shippingEnabled !== false}
        enabledLabel="Shipping Active"
        disabledLabel="Shipping Disabled"
        icon={Truck}
        onToggle={async (newVal) => {
          await onBatchUpdate({
            shipping: {
              ...shipping,
              shippingEnabled: newVal,
            },
          });
        }}
      />

      {/* 2. Standard Shipping Charges */}
      <SettingItemCard
        id="shipping-charges"
        name="Standard Shipping Charge"
        explanation="The flat delivery fee applied to customer carts that do not qualify for free shipping."
        icon={DollarSign}
        currentDisplay={
          <span className="text-blue-700 font-bold">
            {shipping.defaultShippingCharge === 0 ? 'FREE' : `₹${shipping.defaultShippingCharge || 50}`}
          </span>
        }
        onSave={async () => {
          const val = Number(shippingCharge);
          if (isNaN(val) || val < 0) throw new Error('Please enter a valid shipping charge.');
          await onBatchUpdate({
            shipping: {
              ...shipping,
              defaultShippingCharge: val,
            },
          });
        }}
        onCancel={() => setShippingCharge(shipping.defaultShippingCharge ?? 50)}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Delivery Fee Amount (INR ₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min={0}
              step={5}
              value={shippingCharge}
              onChange={(e) => setShippingCharge(Number(e.target.value))}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
              placeholder="50"
            />
          </div>
          <p className="text-[11px] text-slate-400">Set to 0 to offer free standard delivery on all orders by default.</p>
        </div>
      </SettingItemCard>

      {/* 3. Free Shipping Threshold */}
      <SettingItemCard
        id="free-shipping-threshold"
        name="Free Shipping Threshold"
        explanation="Customers automatically receive 100% free delivery when their cart total equals or exceeds this amount."
        icon={Gift}
        currentDisplay={
          shipping.freeShippingEnabled !== false ? (
            <span className="text-emerald-700 font-bold">
              Orders ₹{(shipping.freeShippingThreshold ?? 500).toLocaleString()}+
            </span>
          ) : (
            <span className="text-slate-400 font-medium">Disabled</span>
          )
        }
        onSave={async () => {
          const val = Number(freeThreshold);
          if (isNaN(val) || val < 0) throw new Error('Please enter a valid threshold amount.');
          await onBatchUpdate({
            shipping: {
              ...shipping,
              freeShippingEnabled: freeEnabled,
              freeShippingThreshold: val,
            },
            cartSettings: {
              ...settings.cartSettings,
              freeShippingThreshold: val,
            },
          });
        }}
        onCancel={() => {
          setFreeThreshold(shipping.freeShippingThreshold ?? 500);
          setFreeEnabled(shipping.freeShippingEnabled !== false);
        }}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Offer Free Delivery Tier</span>
            <input
              type="checkbox"
              checked={freeEnabled}
              onChange={(e) => setFreeEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
            />
          </div>

          {freeEnabled && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Minimum Order Value for Free Delivery</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                  placeholder="500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                A progress meter will be displayed inside the cart showing shoppers how much more to add to unlock free delivery.
              </p>
            </div>
          )}
        </div>
      </SettingItemCard>

      {/* 4. Estimated Delivery Time */}
      <SettingItemCard
        id="delivery-time"
        name="Estimated Delivery Time"
        explanation="Expected delivery timeframe displayed on product pages and at checkout."
        icon={Clock}
        currentDisplay={`${shipping.minDeliveryDays || 3} to ${shipping.maxDeliveryDays || 5} Business Days`}
        onSave={async () => {
          if (minDays < 1 || maxDays < minDays) {
            throw new Error('Maximum days must be greater than or equal to minimum days.');
          }
          await onBatchUpdate({
            shipping: {
              ...shipping,
              minDeliveryDays: minDays,
              maxDeliveryDays: maxDays,
              estimatedDeliveryDays: `${minDays} - ${maxDays} Business Days`,
            },
          });
        }}
        onCancel={() => {
          setMinDays(shipping.minDeliveryDays ?? 3);
          setMaxDays(shipping.maxDeliveryDays ?? 5);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Minimum Delivery Days</label>
            <input
              type="number"
              min={1}
              max={30}
              value={minDays}
              onChange={(e) => setMinDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Maximum Delivery Days</label>
            <input
              type="number"
              min={minDays}
              max={60}
              value={maxDays}
              onChange={(e) => setMaxDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </SettingItemCard>

      {/* Advanced Delivery Areas & Custom Shipping Methods */}
      <AdvancedOptionsSection
        id="advanced-shipping-options"
        title="Delivery Zones & Custom Shipping Methods"
        description="Configure geographical delivery zone coverage notes and custom multi-tier courier shipping speeds."
      >
        <div className="space-y-4">
          {/* 5. Delivery Areas */}
          <SettingItemCard
            id="delivery-areas"
            name="Delivery Coverage Areas"
            explanation="Geographical regions or postal zones where your fulfillment partners deliver."
            icon={Map}
            currentDisplay={shipping.deliveryAreas || 'All Serviceable PIN Codes across India'}
            onSave={async () => {
              if (!deliveryAreas.trim()) throw new Error('Delivery areas cannot be empty.');
              await onBatchUpdate({
                shipping: {
                  ...shipping,
                  deliveryAreas: deliveryAreas.trim(),
                },
              });
            }}
            onCancel={() => setDeliveryAreas(shipping.deliveryAreas || 'All Serviceable PIN Codes across India')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Delivery Coverage Description</label>
              <input
                type="text"
                value={deliveryAreas}
                onChange={(e) => setDeliveryAreas(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter delivery coverage areas"
              />
              <div className="flex gap-2 flex-wrap pt-1">
                {['All Serviceable PIN Codes across India', 'Metro Cities (Delhi, Mumbai, Bengaluru, Chennai, Kolkata)', 'South India Serviceable Zones'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDeliveryAreas(preset)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('coverage')}
                  className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Navigation size={14} />
                  Open State → District → Sub-divisions Coverage Selector
                </button>
              </div>
            </div>
          </SettingItemCard>

          {/* 6. Shipping Methods */}
          <SettingItemCard
            id="shipping-methods"
            name="Shipping Delivery Methods"
            explanation="Available delivery speeds presented to shoppers during checkout."
            icon={PackageCheck}
            currentDisplay={`${methods.filter((m) => m.enabled).length} Active Methods`}
            onSave={async () => {
              await onBatchUpdate({
                shipping: {
                  ...shipping,
                  shippingMethods: methods,
                },
              });
            }}
            onCancel={() => setMethods(shipping.shippingMethods || [])}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Configure or toggle customer-facing delivery tiers:</p>

              <div className="space-y-2">
                {methods.map((method, index) => (
                  <div
                    key={method.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(e) => {
                          const updated = [...methods];
                          updated[index].enabled = e.target.checked;
                          setMethods(updated);
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                      />
                      <div>
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => {
                            const updated = [...methods];
                            updated[index].name = e.target.value;
                            setMethods(updated);
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                        />
                        <div className="text-[11px] text-slate-500 mt-1">
                          Time: {method.estimatedDays}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Charge: ₹</span>
                      <input
                        type="number"
                        min={0}
                        value={method.charge}
                        onChange={(e) => {
                          const updated = [...methods];
                          updated[index].charge = Number(e.target.value);
                          setMethods(updated);
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SettingItemCard>
        </div>
      </AdvancedOptionsSection>
        </>
      )}
    </div>
  );
}
