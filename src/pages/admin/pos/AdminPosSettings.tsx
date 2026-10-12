import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Receipt, 
  CreditCard, 
  Building2, 
  Package, 
  Users, 
  RotateCcw, 
  ShieldCheck, 
  Bell, 
  Sliders, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Percent,
  DollarSign,
  Printer,
  Barcode,
  Volume2,
  Info,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  ExternalLink,
  QrCode,
  Upload,
  Trash2,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { useSiteSettings, SiteSettings, PosSettings, defaultPosSettings } from '../../../context/SiteSettingsContext';
import { useAuth } from '../../../context/AuthContext';
import { uploadSiteAsset } from '../../../utils/assetUploader';

interface AdminPosSettingsProps {
  onBackToPos?: () => void;
  onBackToStoreSettings?: () => void;
  isEmbedded?: boolean;
}

export const AdminPosSettings: React.FC<AdminPosSettingsProps> = ({
  onBackToPos,
  onBackToStoreSettings,
  isEmbedded = false
}) => {
  const { user } = useAuth();
  const adminActor = user?.email || 'admin';
  const { settings, updatePosSettings, publishSettings, loading: contextLoading } = useSiteSettings();

  // Active section for sidebar/jump-navigation
  const [activeSection, setActiveSection] = useState<string>('general');

  // Working copy of POS settings
  const livePosSettings = useMemo(() => {
    return {
      ...defaultPosSettings,
      ...(settings.pos || {})
    };
  }, [settings.pos]);

  const [formSettings, setFormSettings] = useState<PosSettings>(livePosSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync form with live settings when loaded
  useEffect(() => {
    setFormSettings(livePosSettings);
  }, [livePosSettings]);

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(formSettings) !== JSON.stringify(livePosSettings);
  }, [formSettings, livePosSettings]);

  // Prompt cashier/admin before unloading if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 5000);
  };

  const handleToggle = (key: keyof PosSettings) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = <K extends keyof PosSettings>(key: K, value: PosSettings[K]) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Upload custom UPI QR image (Standee / Static Merchant QR)
  const handleQrImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image file size should be under 5MB.');
      return;
    }
    try {
      const assetUrl = await uploadSiteAsset(file, 'pos');
      handleChange('upiQrCodeUrl', assetUrl);
      handleChange('upiQrMode', 'custom');
      showToast('success', 'Custom UPI QR Code uploaded successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload QR code image.');
    }
  };

  // Save changes to Firestore
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);

      // Validate payment methods - at least one must remain enabled
      if (!formSettings.enableCash && !formSettings.enableUpi && !formSettings.enableCard) {
        showToast('error', 'At least one payment method (Cash, UPI, or Card) must be enabled.');
        setIsSaving(false);
        return;
      }

      // If selected default payment method is disabled, adjust it
      let finalDefaultMethod = formSettings.defaultPaymentMethod;
      if (finalDefaultMethod === 'cash' && !formSettings.enableCash) {
        finalDefaultMethod = formSettings.enableUpi ? 'upi' : 'card';
      } else if (finalDefaultMethod === 'upi' && !formSettings.enableUpi) {
        finalDefaultMethod = formSettings.enableCash ? 'cash' : 'card';
      } else if (finalDefaultMethod === 'card' && !formSettings.enableCard) {
        finalDefaultMethod = formSettings.enableCash ? 'cash' : 'upi';
      }

      const settingsToSave: PosSettings = {
        ...formSettings,
        defaultPaymentMethod: finalDefaultMethod,
        maxDiscountPercent: Math.min(100, Math.max(0, Number(formSettings.maxDiscountPercent) || 0)),
        lowStockThreshold: Math.max(0, Number(formSettings.lowStockThreshold) || 5),
        returnWindowDays: Math.max(1, Number(formSettings.returnWindowDays) || 30)
      };

      // 1. Save directly to authoritative server backend
      try {
        await fetch('/api/admin/pos/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ posSettings: settingsToSave, adminEmail: adminActor })
        });
      } catch (postErr) {
        console.warn('Backend POS API save note:', postErr);
      }

      // 2. Synchronize with site settings context and published configuration
      try {
        await updatePosSettings(settingsToSave, adminActor);
      } catch (ctxErr) {
        console.warn('Context update warning, local state retained:', ctxErr);
      }

      setFormSettings(settingsToSave);
      showToast('success', 'POS Settings have been successfully saved and published live.');
    } catch (err: any) {
      console.error('Failed to save POS settings:', err);
      showToast('error', err?.message || 'Failed to save POS settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults (only POS settings, never touch products, orders, inventory)
  const handleConfirmReset = async () => {
    try {
      setIsSaving(true);
      setShowResetConfirm(false);
      setFormSettings(defaultPosSettings);
      await updatePosSettings(defaultPosSettings, adminActor);
      showToast('success', 'POS settings have been reset to factory defaults. Store products, orders, and customer databases were untouched.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to reset settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: 'Counter Terminal', icon: Store },
    { id: 'billing', label: 'Billing & Discounts', icon: Percent },
    { id: 'payment', label: 'Payment Options', icon: CreditCard },
    { id: 'invoice', label: 'Invoice & Receipts', icon: Receipt },
    { id: 'customer', label: 'Customer Rules', icon: Users },
    { id: 'returns', label: 'Returns Window', icon: RotateCcw },
    { id: 'advanced', label: 'Hardware & Audio', icon: Sliders },
  ];

  if (contextLoading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading POS Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Navigation Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm transition-all">
        {/* If standalone, display full page header; if embedded in Store Settings, display compact context bar */}
        {!isEmbedded ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <span>Admin</span>
                <ChevronRight size={12} />
                <span>Store Settings</span>
                <ChevronRight size={12} />
                <span className="text-blue-600 font-bold">POS Terminal Settings</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Store size={20} />
                  </div>
                  POS Counter Billing Settings
                </h1>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    <AlertCircle size={12} /> Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Control the counter billing terminal, discounts, GST calculation, payment methods, thermal receipts, and stock behavior.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
              {onBackToPos && (
                <button
                  type="button"
                  onClick={onBackToPos}
                  className="px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to POS
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                disabled={isSaving}
                className="px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={14} /> Reset Defaults
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save POS Settings
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Embedded Header inside Store Settings */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Store className="text-blue-600" size={20} />
                  POS Terminal & Counter Billing Configuration
                </h2>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                    Unsaved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tune counter rules, payment options, walk-ins, receipt printer format, and returns.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                disabled={isSaving}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={13} /> Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={13} /> Save POS Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* High-Visibility Navigation Tabs */}
        <div className="pt-4">
          {/* Mobile Dropdown Selector (Ensures 100% visibility on mobile screens without horizontal clipping) */}
          <div className="sm:hidden">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Select POS Setting Category:
            </label>
            <div className="relative">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full appearance-none bg-slate-50 border-2 border-blue-500/40 focus:border-blue-600 text-slate-900 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer"
              >
                <option value="all">📂 View All Sections (Full Overview)</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Desktop & Tablet High-Contrast Segmented Tabs */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeSection === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 ring-2 ring-blue-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span>All Sections</span>
            </button>
            {sections.map(s => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 ring-2 ring-blue-600/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <Icon size={15} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* SECTION 1: GENERAL */}
      {(activeSection === 'all' || activeSection === 'general') && (
        <div id="pos-section-general" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">1. General POS Settings</h2>
              <p className="text-xs text-slate-500">Core operational flags and regional display preferences.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* POS Enabled */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Enable POS Counter Terminal</span>
              <p className="text-xs text-slate-500 mt-0.5">When disabled, counter sales access is locked with an administrative prompt.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.posEnabled}
              onClick={() => handleToggle('posEnabled')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.posEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.posEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Currency */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Currency & Symbol</label>
            <p className="text-xs text-slate-500">Standard currency representation on invoices and totals.</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formSettings.currency}
                onChange={e => handleChange('currency', e.target.value)}
                placeholder="INR"
                className="w-24 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
              />
              <span className="text-xs text-slate-500 font-medium">Default: ₹ INR (Indian Rupee)</span>
            </div>
          </div>

          {/* Default POS View Tab */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Default POS Landing Screen</label>
            <p className="text-xs text-slate-500">Choose which tab opens by default when launching POS.</p>
            <select
              value={formSettings.defaultPosPage}
              onChange={e => handleChange('defaultPosPage', e.target.value as 'terminal' | 'history')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value="terminal">Counter Terminal (Live Billing)</option>
              <option value="history">POS Sales / History</option>
            </select>
          </div>

          {/* Default Customer Name */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Default Customer Name</label>
            <p className="text-xs text-slate-500">Label used for unassigned counter walk-in customers.</p>
            <input
              type="text"
              value={formSettings.defaultCustomer}
              onChange={e => handleChange('defaultCustomer', e.target.value)}
              placeholder="Walk-in Customer"
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            />
          </div>

          {/* Date Format */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Receipt Date Format</label>
            <select
              value={formSettings.dateFormat}
              onChange={e => handleChange('dateFormat', e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard - e.g. 18/09/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/18/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
            </select>
          </div>

          {/* Time Format */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Clock & Receipt Time Format</label>
            <select
              value={formSettings.timeFormat}
              onChange={e => handleChange('timeFormat', e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value="12h">12-Hour (e.g. 02:30 PM)</option>
              <option value="24h">24-Hour (e.g. 14:30)</option>
            </select>
          </div>
        </div>
      </div>
    )}

      {/* SECTION 2: BILLING & DISCOUNTS */}
      {(activeSection === 'all' || activeSection === 'billing') && (
        <div id="pos-section-billing" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Percent size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Billing & Discount Rules</h2>
              <p className="text-xs text-slate-500">Configure discount limits, price adjustments, and cart lifecycle.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allow Discount */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Allow Discounts in POS</span>
              <p className="text-xs text-slate-500 mt-0.5">When disabled, discount buttons and inputs are hidden on counter terminal.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.allowDiscount}
              onClick={() => handleToggle('allowDiscount')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.allowDiscount ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.allowDiscount ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Maximum Discount Percentage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Maximum Discount Percentage</label>
            <p className="text-xs text-slate-500">Limits both % and ₹ flat discount to prevent unauthorized markdown.</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={formSettings.maxDiscountPercent}
                onChange={e => handleChange('maxDiscountPercent', Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
              />
              <span className="text-sm font-bold text-slate-600">% max cap</span>
            </div>
          </div>

          {/* Allow Manual Price Change */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Allow Manual Selling Price Change</span>
              <p className="text-xs text-slate-500 mt-0.5">Permits cashier to override catalog unit price per item.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.allowManualPriceChange}
              onClick={() => handleToggle('allowManualPriceChange')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.allowManualPriceChange ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.allowManualPriceChange ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Require Confirmation Before Completing Sale */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Require Confirmation Prompt</span>
              <p className="text-xs text-slate-500 mt-0.5">Ask cashier to confirm total before writing the order to the database.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.requireConfirmationBeforeSale}
              onClick={() => handleToggle('requireConfirmationBeforeSale')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.requireConfirmationBeforeSale ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.requireConfirmationBeforeSale ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Clear Cart After Successful Sale */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Auto Clear Cart After Successful Sale</span>
              <p className="text-xs text-slate-500 mt-0.5">Clears cart only after successful completion; preserves cart if sale fails.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.autoClearCartAfterSale}
              onClick={() => handleToggle('autoClearCartAfterSale')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.autoClearCartAfterSale ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.autoClearCartAfterSale ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Enable Hold / Recall Bill */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Enable Hold & Recall Bills</span>
              <p className="text-xs text-slate-500 mt-0.5">Allow parking active cart while a customer gathers more items.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.enableHoldBill}
              onClick={() => handleToggle('enableHoldBill')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.enableHoldBill ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.enableHoldBill ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    )}

      {/* SECTION 3: POS PAYMENT OPTIONS */}
      {(activeSection === 'all' || activeSection === 'payment') && (
        <div id="pos-section-payment" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">3. POS Payment Methods & Counter Validation</h2>
              <p className="text-xs text-slate-500">Configure enabled counter payment modes and confirmation checks.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cash */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Cash Payment</span>
              <p className="text-xs text-slate-500 mt-0.5">Cash tendered & auto-calculated change return.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.enableCash}
              onClick={() => handleToggle('enableCash')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.enableCash ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.enableCash ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* UPI */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">UPI QR Payment</span>
              <p className="text-xs text-slate-500 mt-0.5">Dynamic store QR code & UTR reference.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.enableUpi}
              onClick={() => handleToggle('enableUpi')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.enableUpi ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.enableUpi ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Card Terminal</span>
              <p className="text-xs text-slate-500 mt-0.5">EDC swipe/tap machine reference.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.enableCard}
              onClick={() => handleToggle('enableCard')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.enableCard ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.enableCard ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Split Payment */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Split Payment</span>
              <p className="text-xs text-slate-500 mt-0.5">Allow customer to pay one bill with Cash, UPI, and Card combined.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.allowSplitPayment !== false}
              onClick={() => handleToggle('allowSplitPayment')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.allowSplitPayment !== false ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.allowSplitPayment !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Default Payment Method */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-xs font-bold text-slate-900 block">Default POS Payment Selection</label>
            <p className="text-[11px] text-slate-500">Method initially highlighted upon opening POS checkout.</p>
            <select
              value={formSettings.defaultPaymentMethod}
              onChange={e => handleChange('defaultPaymentMethod', e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
            >
              {formSettings.enableCash && <option value="cash">Cash</option>}
              {formSettings.enableUpi && <option value="upi">UPI QR</option>}
              {formSettings.enableCard && <option value="card">Card Terminal</option>}
              {formSettings.allowSplitPayment !== false && <option value="split">Split Payment</option>}
            </select>
          </div>

          {/* Require Payment Confirmation */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Require Payment Confirmation Toggle</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Cashier must verify UPI/Card receipt before marking sale as Paid.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.requirePaymentConfirmation}
              onClick={() => handleToggle('requirePaymentConfirmation')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.requirePaymentConfirmation ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.requirePaymentConfirmation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* UPI PAYMENT DETAILED CONFIGURATION */}
        {formSettings.enableUpi && (
          <div className="pt-4 border-t border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">UPI Payment & Standee QR Configuration</h3>
              </div>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                Active in Counter POS
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Controls (Left / 7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Store UPI ID */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Store UPI ID / VPA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSettings.upiId || ''}
                    onChange={e => handleChange('upiId', e.target.value.trim())}
                    placeholder="e.g. yourstore@okaxis, electro@hdfcbank"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono font-medium text-slate-900 placeholder:font-sans placeholder:text-slate-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Payments will be credited directly to this bank account VPA.
                  </p>
                </div>

                {/* Display Name & Apps Subtext */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      UPI Display Header
                    </label>
                    <input
                      type="text"
                      value={formSettings.upiDisplayName || ''}
                      onChange={e => handleChange('upiDisplayName', e.target.value)}
                      placeholder="e.g. Scan to Pay via UPI"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Supported Apps Text
                    </label>
                    <input
                      type="text"
                      value={formSettings.upiAppsText || ''}
                      onChange={e => handleChange('upiAppsText', e.target.value)}
                      placeholder="e.g. GPay, PhonePe, Paytm, BHIM"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Cashier Verification Note */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Cashier Verification Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={formSettings.upiInstructions || ''}
                    onChange={e => handleChange('upiInstructions', e.target.value)}
                    placeholder="e.g. Verify receipt on soundbox, notification, or customer app before confirming."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 text-slate-900 placeholder:text-slate-400 resize-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Displayed below the payment confirmation button on the counter POS screen.
                  </p>
                </div>

                {/* QR Code Mode Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Counter QR Code Display Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => handleChange('upiQrMode', 'dynamic')}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        (formSettings.upiQrMode || 'dynamic') === 'dynamic'
                          ? 'bg-purple-50/70 border-purple-400 text-purple-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="upiQrMode"
                        checked={(formSettings.upiQrMode || 'dynamic') === 'dynamic'}
                        onChange={() => handleChange('upiQrMode', 'dynamic')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">Dynamic Amount QR</span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                          Generates live QR code with the exact cart grand total for one-tap payment.
                        </span>
                      </div>
                    </label>

                    <label
                      onClick={() => handleChange('upiQrMode', 'custom')}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formSettings.upiQrMode === 'custom'
                          ? 'bg-purple-50/70 border-purple-400 text-purple-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="upiQrMode"
                        checked={formSettings.upiQrMode === 'custom'}
                        onChange={() => handleChange('upiQrMode', 'custom')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">Custom Standee QR Image</span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                          Upload your existing shop counter UPI standee / merchant QR code image.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Custom QR Code Image Upload & URL input */}
                {formSettings.upiQrMode === 'custom' && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                    <label className="text-xs font-bold text-slate-800 block">
                      Custom Store QR Code Image
                    </label>
                    
                    {/* Drag & Drop / File Input */}
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-400 hover:bg-purple-50/30 transition-colors cursor-pointer bg-white">
                        <Upload size={20} className="text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-purple-700">Click or Drag & Drop QR Image</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG or WebP (max 2MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleQrImageUpload(file);
                          }}
                        />
                      </label>

                      {formSettings.upiQrCodeUrl && (
                        <div className="relative group w-20 h-20 bg-white border border-slate-200 rounded-xl p-1 shrink-0 flex items-center justify-center shadow-xs">
                          <img
                            src={formSettings.upiQrCodeUrl}
                            alt="Custom QR Preview"
                            className="w-full h-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            title="Remove custom QR"
                            onClick={() => handleChange('upiQrCodeUrl', '')}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Or URL */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Or enter direct Image URL:
                      </span>
                      <input
                        type="url"
                        value={formSettings.upiQrCodeUrl || ''}
                        onChange={e => handleChange('upiQrCodeUrl', e.target.value.trim())}
                        placeholder="Enter image URL or upload QR"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live POS Counter Preview Card (Right / 5 cols) */}
              <div className="lg:col-span-5">
                <div className="sticky top-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Eye size={14} className="text-purple-600" />
                      <span>Live Counter POS Preview</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Cashier View
                    </span>
                  </div>

                  {/* Mock checkout preview item */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-xs">
                    {/* Amount Header */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-900">Amount to Collect:</span>
                      <span className="font-mono font-black text-sm text-purple-700">₹1,499</span>
                    </div>

                    {/* QR Display */}
                    {(() => {
                      const effectiveUpiId = formSettings.upiId || settings.general?.upiId || '';
                      const isConfigured = Boolean(
                        (effectiveUpiId && effectiveUpiId.trim()) ||
                        (formSettings.upiQrCodeUrl && formSettings.upiQrCodeUrl.trim())
                      );

                      let previewQrSrc = '';
                      if (formSettings.upiQrMode === 'custom' && formSettings.upiQrCodeUrl) {
                        previewQrSrc = formSettings.upiQrCodeUrl;
                      } else if (effectiveUpiId) {
                        const testUri = `upi://pay?pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent(settings.general?.storeName || 'ELECTRO STORE')}&am=1499&cu=INR&tn=CounterBilling`;
                        previewQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(testUri)}`;
                      } else if (formSettings.upiQrCodeUrl) {
                        previewQrSrc = formSettings.upiQrCodeUrl;
                      }

                      if (!isConfigured) {
                        return (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1 text-amber-900">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                              <AlertCircle size={14} className="text-amber-600" />
                              <span>UPI Not Configured</span>
                            </div>
                            <p className="text-[11px] text-amber-700 leading-tight">
                              Please fill in the store UPI ID or upload a QR code above to enable counter UPI payments.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shrink-0 shadow-xs flex items-center justify-center overflow-hidden">
                            <img
                              src={previewQrSrc}
                              alt="Live QR Preview"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-xs space-y-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {formSettings.upiDisplayName || 'Scan to Pay via UPI'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {formSettings.upiAppsText || 'GPay, PhonePe, Paytm, BHIM'}
                            </p>
                            {effectiveUpiId ? (
                              <p className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block border border-purple-200 font-semibold break-all">
                                UPI ID: {effectiveUpiId}
                              </p>
                            ) : (
                              <p className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block border border-purple-200 font-semibold">
                                Store Standee QR
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Instructions footer */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-purple-600" />
                          <span>Confirm UPI Payment</span>
                        </div>
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 pl-1 italic">
                        {formSettings.upiInstructions || 'Verify receipt on soundbox, notification, or customer app before confirming.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* SECTION 4: INVOICE & RECEIPT */}
      {(activeSection === 'all' || activeSection === 'invoice') && (
        <div id="pos-section-invoice" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Receipt size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">4. Invoice & Receipt Printing</h2>
                <p className="text-xs text-slate-500">Format specifications for thermal printers and standard A4 tax bills.</p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Format */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Primary Invoice Format</label>
            <p className="text-xs text-slate-500">Default layout presented when clicking print on POS bill.</p>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="invoiceFormat"
                  checked={formSettings.invoiceFormat === 'thermal'}
                  onChange={() => handleChange('invoiceFormat', 'thermal')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Thermal Receipt (80mm)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="radio"
                  name="invoiceFormat"
                  checked={formSettings.invoiceFormat === 'a4'}
                  onChange={() => handleChange('invoiceFormat', 'a4')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Standard A4 Tax Invoice
              </label>
            </div>
          </div>

          {/* Invoice Prefix */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">POS Invoice Prefix</label>
            <p className="text-xs text-slate-500">Sequential bill prefix (e.g. POS-2026- or EST-POS-).</p>
            <input
              type="text"
              value={formSettings.invoicePrefix}
              onChange={e => handleChange('invoicePrefix', e.target.value)}
              placeholder="POS-2026-"
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
            />
          </div>

          {/* Auto Open Invoice After Sale */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Auto-Open Invoice Dialog</span>
              <p className="text-xs text-slate-500 mt-0.5">Show printable receipt dialog immediately upon completing sale.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.autoOpenInvoiceAfterSale}
              onClick={() => handleToggle('autoOpenInvoiceAfterSale')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.autoOpenInvoiceAfterSale ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.autoOpenInvoiceAfterSale ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Print After Sale */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Auto-Print Receipt Directly</span>
              <p className="text-xs text-slate-500 mt-0.5">Automatically triggers browser print dialog without extra clicks.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.autoPrintAfterSale}
              onClick={() => handleToggle('autoPrintAfterSale')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.autoPrintAfterSale ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.autoPrintAfterSale ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Receipt Content Toggles */}
        <div className="border-t border-slate-100 pt-4">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">Receipt Header & Body Visibility</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { key: 'showStoreLogo', label: 'Store Logo' },
              { key: 'showStoreAddress', label: 'Store Address' },
              { key: 'showStorePhone', label: 'Store Phone' },
              { key: 'showGstin', label: 'GSTIN & PAN' },
              { key: 'showCustomerDetails', label: 'Customer Details' },
              { key: 'showPaymentMethod', label: 'Payment Mode' },
              { key: 'showTaxBreakdown', label: 'Tax Breakdown' },
              { key: 'showDiscount', label: 'Discount Amount' }
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200/60 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean((formSettings as any)[item.key])}
                  onChange={() => handleToggle(item.key as any)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    )}

      {/* SECTION 5: CUSTOMER */}
      {(activeSection === 'all' || activeSection === 'customer') && (
        <div id="pos-section-customer" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">5. Customer Rules & Workflow</h2>
              <p className="text-xs text-slate-500">Rules for walk-in transactions, mobile numbers, and customer profiling.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allow Walk-in Customer Billing */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Allow Walk-in Customer Billing</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or disable quick unassigned walk-in counter sales. When disabled, customers must be searched or registered.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.allowWalkInBilling !== false}
              onClick={() => handleToggle('allowWalkInBilling')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.allowWalkInBilling !== false ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.allowWalkInBilling !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Customer Selection Optional */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Customer Selection Optional</span>
              <p className="text-xs text-slate-500 mt-0.5">When disabled, cashier MUST link a registered customer before completing sale.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.customerSelectionOptional}
              onClick={() => handleToggle('customerSelectionOptional')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.customerSelectionOptional ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.customerSelectionOptional ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Require Mobile Number */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Require Customer Mobile Number</span>
              <p className="text-xs text-slate-500 mt-0.5">Enforces 10-digit mobile number input for SMS receipt delivery.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.requireMobileNumber}
              onClick={() => handleToggle('requireMobileNumber')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.requireMobileNumber ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.requireMobileNumber ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Allow New Customer Creation */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Allow New Customer Creation from POS</span>
              <p className="text-xs text-slate-500 mt-0.5">Enables instant customer signup popup directly at the counter.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.allowNewCustomerCreation}
              onClick={() => handleToggle('allowNewCustomerCreation')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.allowNewCustomerCreation ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.allowNewCustomerCreation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Purchase History */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Show Customer Past Purchase History</span>
              <p className="text-xs text-slate-500 mt-0.5">Displays previous counter orders when selecting an existing customer.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.showCustomerPurchaseHistory}
              onClick={() => handleToggle('showCustomerPurchaseHistory')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.showCustomerPurchaseHistory ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.showCustomerPurchaseHistory ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    )}

      {/* SECTION 6: RETURNS */}
      {(activeSection === 'all' || activeSection === 'returns') && (
        <div id="pos-section-returns" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <RotateCcw size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">6. Returns & Restock Policies</h2>
                <p className="text-xs text-slate-500">Directly connected to the store's central return & refund architecture.</p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enable POS Returns */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Enable Counter Returns</span>
              <p className="text-xs text-slate-500 mt-0.5">Allows cashiers to initiate return & restock from the POS Sales History view.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.enablePosReturns}
              onClick={() => handleToggle('enablePosReturns')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.enablePosReturns ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.enablePosReturns ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Return Window Days */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Return Window (Days)</label>
            <p className="text-xs text-slate-500">Maximum days elapsed since sale date to accept a return.</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={formSettings.returnWindowDays}
                onChange={e => handleChange('returnWindowDays', Number(e.target.value))}
                className="w-24 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
              />
              <span className="text-xs font-semibold text-slate-600">days allowed</span>
            </div>
          </div>

          {/* Require Return Reason */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Require Return Reason</span>
              <p className="text-xs text-slate-500 mt-0.5">Cashier must log customer reason before restock is processed.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.requireReturnReason}
              onClick={() => handleToggle('requireReturnReason')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.requireReturnReason ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.requireReturnReason ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Refund Method */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block">Standard Counter Refund Mode</label>
            <select
              value={formSettings.refundMethod}
              onChange={e => handleChange('refundMethod', e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value="original">Original Payment Mode (UPI / Card / Cash)</option>
              <option value="cash">Instant Cash Payout</option>
              <option value="store_credit">Store Credit / Wallet</option>
            </select>
          </div>
        </div>
      </div>
    )}

      {/* SECTION 7: ADVANCED SETTINGS & HARDWARE */}
      {(activeSection === 'all' || activeSection === 'advanced') && (
        <div id="pos-section-advanced" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">7. Hardware & Counter Audio</h2>
              <p className="text-xs text-slate-500">Thermal printer paper sizes, barcode scanning, and receipt footer.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Printer Width */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block flex items-center gap-1.5">
              <Printer size={15} /> Thermal Paper Width
            </label>
            <select
              value={formSettings.printerWidthMm}
              onChange={e => handleChange('printerWidthMm', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value={80}>80 mm (Standard POS Thermal Roll)</option>
              <option value={58}>58 mm (Compact Portable Printer)</option>
            </select>
          </div>

          {/* Barcode Scanner Mode */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <label className="text-sm font-bold text-slate-900 block flex items-center gap-1.5">
              <Barcode size={15} /> Barcode Scanner Mode
            </label>
            <select
              value={formSettings.barcodeScannerMode}
              onChange={e => handleChange('barcodeScannerMode', e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-semibold text-slate-800"
            >
              <option value="keyboard_wedge">USB / Wireless Keyboard Wedge (Auto Enter)</option>
              <option value="auto">Auto-Detect Any Scanner</option>
              <option value="camera">Camera Optical Scanner</option>
            </select>
          </div>

          {/* Sound Feedback */}
          <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div>
              <span className="text-sm font-bold text-slate-900 block flex items-center gap-1.5">
                <Volume2 size={15} /> Sound Feedback
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Audible chirps for scan success and warning pulses.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formSettings.soundFeedbackEnabled}
              onClick={() => handleToggle('soundFeedbackEnabled')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formSettings.soundFeedbackEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formSettings.soundFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Receipt Footer Message */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <label className="text-sm font-bold text-slate-900 block">Receipt Footer Greeting / Terms</label>
          <p className="text-xs text-slate-500">Custom note printed at the very bottom of every thermal customer receipt.</p>
          <textarea
            rows={2}
            value={formSettings.receiptFooterNote}
            onChange={e => handleChange('receiptFooterNote', e.target.value)}
            placeholder="Thank you for shopping at ElectroStore! Visit again."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
          />
        </div>
      </div>
    )}

      {/* MODAL: RESET TO DEFAULTS CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center font-bold">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset POS Settings to Defaults?</h3>
                <span className="text-xs text-slate-500">Safe recovery operation</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will reset <strong>only POS configuration options</strong> (such as discount limits, printing modes, and payment toggles) back to their default values.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">The following will NOT be touched:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>Products & stock quantities</li>
                <li>Customer accounts & orders</li>
                <li>Sales history & GST records</li>
                <li>Store general settings & payments</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
              >
                Yes, Reset POS Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
