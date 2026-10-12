import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Truck, 
  Building2, 
  CreditCard, 
  Bell, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  UploadCloud, 
  RotateCcw, 
  Save, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useSiteSettings, SiteSettings } from '../../context/SiteSettingsContext';
import { StoreInfoSettings } from '../../components/admin/settings/StoreInfoSettings';
import { ShippingSettingsSection } from '../../components/admin/settings/ShippingSettingsSection';
import { TaxSettingsSection } from '../../components/admin/settings/TaxSettingsSection';
import { PaymentSettingsSection } from '../../components/admin/settings/PaymentSettingsSection';
import { NotificationSettingsSection } from '../../components/admin/settings/NotificationSettingsSection';
import { StoreStatusSection } from '../../components/admin/settings/StoreStatusSection';
import { AdminNotifications } from './AdminNotifications';
import { AdminPosSettings } from './pos/AdminPosSettings';
import { useAuth } from '../../context/AuthContext';

export type StoreSettingsTab = 'store' | 'shipping' | 'tax' | 'payments' | 'pos' | 'notifications' | 'status' | 'notification-logs';

export interface AdminStoreSettingsProps {
  initialSubTab?: 'store' | 'business' | 'shipping' | 'payments' | 'pos' | 'notifications' | 'status' | 'tax';
}

export function AdminStoreSettings({ initialSubTab = 'store' }: AdminStoreSettingsProps) {
  const { user } = useAuth();
  const adminActor = user?.email || 'admin';
  const { 
    settings, 
    draftSettings, 
    hasUnpublishedDraft, 
    saveDraft, 
    publishSettings, 
    revertDraft, 
    resetStoreSettingsToDefaults,
    loading: contextLoading 
  } = useSiteSettings();

  // Normalize initialSubTab
  const normalizedInitialTab = (): StoreSettingsTab => {
    if (initialSubTab === 'pos') return 'pos';
    if (initialSubTab === 'business' || initialSubTab === 'tax') return 'tax';
    if (initialSubTab === 'shipping') return 'shipping';
    if (initialSubTab === 'payments') return 'payments';
    if (initialSubTab === 'notifications') return 'notifications';
    if (initialSubTab === 'status') return 'status';
    return 'store';
  };

  const [activeTab, setActiveTab] = useState<StoreSettingsTab>(normalizedInitialTab());
  const [localSettings, setLocalSettings] = useState<SiteSettings>(draftSettings || settings);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      if (initialSubTab === 'business' || initialSubTab === 'tax') setActiveTab('tax');
      else if (initialSubTab === 'shipping') setActiveTab('shipping');
      else if (initialSubTab === 'payments') setActiveTab('payments');
      else if (initialSubTab === 'notifications') setActiveTab('notifications');
      else if (initialSubTab === 'status') setActiveTab('status');
      else setActiveTab('store');
    }
  }, [initialSubTab]);

  useEffect(() => {
    setLocalSettings(draftSettings || settings);
  }, [settings, draftSettings]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Immediate field or batch updater with real outcome feedback
  const handleUpdateField = async (category: keyof SiteSettings, field: string, value: any) => {
    const updated: SiteSettings = {
      ...localSettings,
      [category]: {
        ...(localSettings[category] as any),
        [field]: value,
      },
    };
    try {
      await publishSettings(updated, adminActor);
      setLocalSettings(updated);
      showFeedback('success', `Saved ${String(field)} successfully.`);
    } catch (err: any) {
      showFeedback('error', err?.message || `Failed to save ${String(field)} to database.`);
    }
  };

  const handleBatchUpdate = async (updates: Partial<SiteSettings>) => {
    const updated: SiteSettings = {
      ...localSettings,
      ...updates,
    };
    try {
      await publishSettings(updated, adminActor);
      setLocalSettings(updated);
      showFeedback('success', 'Store settings updated successfully.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to save settings to database.');
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await saveDraft(localSettings, adminActor);
      showFeedback('success', 'Changes saved as draft. Preview the storefront to verify.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishLive = async () => {
    setPublishing(true);
    try {
      await publishSettings(localSettings, adminActor);
      showFeedback('success', 'Store settings published live to your online store!');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to publish settings.');
    } finally {
      setPublishing(false);
    }
  };

  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resettingStore, setResettingStore] = useState(false);

  const handleResetToDefaults = async () => {
    setResettingStore(true);
    try {
      await resetStoreSettingsToDefaults(adminActor);
      setConfirmResetOpen(false);
      showFeedback('success', 'Store Settings (Store Info, Shipping, Tax, Payments, POS) successfully reset to defaults!');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to reset store settings.');
    } finally {
      setResettingStore(false);
    }
  };

  const handleRevertDraft = async () => {
    setReverting(true);
    try {
      await revertDraft(adminActor);
      setLocalSettings(settings);
      setConfirmRevertOpen(false);
      showFeedback('success', 'Draft changes reverted back to live store configuration.');
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to revert draft.');
    } finally {
      setReverting(false);
    }
  };

  const currentStoreStatus = localSettings.general?.storeStatus || (localSettings.maintenance?.enabled ? 'maintenance' : 'active');

  const tabs: Array<{ id: StoreSettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'store', label: 'Store Information', icon: Store },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'tax', label: 'GST & Tax', icon: Building2 },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'pos', label: 'POS Settings', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'status', label: 'Store Status', icon: Power },
  ];

  if (contextLoading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 size={30} className="animate-spin text-blue-600" />
        <span className="text-sm font-semibold">Loading Store Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Management Overview */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Store Settings</h1>
              
              {/* Store Status Indicator */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  currentStoreStatus === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentStoreStatus === 'closed'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentStoreStatus === 'active'
                      ? 'bg-emerald-500'
                      : currentStoreStatus === 'closed'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                {currentStoreStatus === 'active'
                  ? 'Store Open'
                  : currentStoreStatus === 'closed'
                  ? 'Store Closed'
                  : 'Maintenance Mode'}
              </span>

              {/* Draft Status Indicator */}
              {hasUnpublishedDraft && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                  Unpublished Draft
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Simplify your store operations: manage contact info, courier rates, GST taxes, payments, and store status without technical complexity.
            </p>
          </div>

          {/* Action Bar (Draft -> Preview -> Publish) */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Open storefront preview in new tab"
            >
              <Eye size={14} />
              <span>Preview Store</span>
            </a>

            {hasUnpublishedDraft && (
              confirmRevertOpen ? (
                <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                  <span className="text-[11px] font-bold text-rose-800">Discard draft?</span>
                  <button
                    type="button"
                    onClick={handleRevertDraft}
                    disabled={reverting}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    {reverting ? 'Reverting...' : 'Yes, Discard'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRevertOpen(false)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRevertOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Discard unpublished changes"
                >
                  <RotateCcw size={13} />
                  <span>Revert Draft</span>
                </button>
              )
            )}

            {confirmResetOpen ? (
              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl">
                <span className="text-[11px] font-bold text-amber-900">Reset store settings to defaults?</span>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  disabled={resettingStore}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  {resettingStore ? 'Resetting...' : 'Yes, Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Reset Store Settings to application defaults"
              >
                <RotateCcw size={13} />
                <span>Reset Defaults</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePublishLive}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              title="Publish all settings directly to the live store"
            >
              {publishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Publish Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs (Mobile-responsive scrollable) */}
        <div className="flex items-center gap-1.5 mt-5 border-t border-slate-100 pt-3 overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-bold animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
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

      {/* TAB CONTENT SECTIONS */}

      {/* 1. Store Information */}
      {activeTab === 'store' && (
        <StoreInfoSettings
          settings={localSettings}
          onUpdateField={handleUpdateField}
          onBatchUpdate={handleBatchUpdate}
        />
      )}

      {/* 2. Shipping & Delivery */}
      {activeTab === 'shipping' && (
        <ShippingSettingsSection
          settings={localSettings}
          onUpdateField={handleUpdateField}
          onBatchUpdate={handleBatchUpdate}
        />
      )}

      {/* 3. GST & Tax */}
      {activeTab === 'tax' && (
        <TaxSettingsSection
          settings={localSettings}
          onUpdateField={handleUpdateField}
          onBatchUpdate={handleBatchUpdate}
        />
      )}

      {/* 4. Payments */}
      {activeTab === 'payments' && (
        <PaymentSettingsSection
          settings={localSettings}
          onUpdateField={handleUpdateField}
          onBatchUpdate={handleBatchUpdate}
        />
      )}

      {/* 5. POS Settings */}
      {activeTab === 'pos' && (
        <AdminPosSettings
          onBackToStoreSettings={() => setActiveTab('store')}
          isEmbedded={true}
        />
      )}

      {/* 6. Notifications */}
      {activeTab === 'notifications' && (
        <NotificationSettingsSection
          settings={localSettings}
          onUpdateField={handleUpdateField}
          onBatchUpdate={handleBatchUpdate}
          onOpenLogs={() => setActiveTab('notification-logs')}
        />
      )}

      {/* Notification Logs Console */}
      {activeTab === 'notification-logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Notification Delivery Audit Logs</span>
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="text-xs text-blue-600 hover:underline font-bold"
            >
              ← Back to Simple Notification Settings
            </button>
          </div>
          <AdminNotifications />
        </div>
      )}

      {/* 6. Store Status */}
      {activeTab === 'status' && (
        <StoreStatusSection
          settings={localSettings}
          onUpdateField={handleUpdateField}
          onBatchUpdate={handleBatchUpdate}
        />
      )}
    </div>
  );
}
