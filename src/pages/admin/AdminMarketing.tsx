import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, FileText, Mail, CheckCircle2, AlertCircle, Save, Globe } from 'lucide-react';
import { AdminPromotions } from './AdminPromotions';
import { AdminCoupons } from './AdminCoupons';
import { WebsiteContentCmsEditor } from '../../components/admin/WebsiteContentCmsEditor';
import { AdminSubscribers } from './AdminSubscribers';
import { useSiteSettings, SiteSettings } from '../../context/SiteSettingsContext';

export interface AdminMarketingProps {
  initialSubTab?: 'promotions' | 'coupons' | 'content' | 'subscribers' | 'banners' | 'faqs';
}

export function AdminMarketing({ initialSubTab }: AdminMarketingProps = {}) {
  // Normalize initialSubTab for backward compatibility
  const normalizedInitialTab = (): 'promotions' | 'coupons' | 'content' | 'subscribers' => {
    if (initialSubTab === 'subscribers') return 'subscribers';
    if (initialSubTab === 'banners') return 'promotions';
    if (initialSubTab === 'faqs') return 'content';
    if (initialSubTab === 'coupons') return 'coupons';
    if (initialSubTab === 'content') return 'content';
    return 'promotions';
  };

  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons' | 'content' | 'subscribers'>(normalizedInitialTab());
  const { settings, saveDraft, publishSettings } = useSiteSettings();
  const [formState, setFormState] = useState<SiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      if (initialSubTab === 'subscribers') setActiveTab('subscribers');
      else if (initialSubTab === 'banners' || initialSubTab === 'promotions') setActiveTab('promotions');
      else if (initialSubTab === 'coupons') setActiveTab('coupons');
      else if (initialSubTab === 'faqs' || initialSubTab === 'content') setActiveTab('content');
    }
  }, [initialSubTab]);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft(formState);
      setActionNotice({ type: 'success', text: 'Content draft saved successfully.' });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (e) {
      setActionNotice({ type: 'error', text: 'Failed to save draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await saveDraft(formState);
      await publishSettings();
      setActionNotice({ type: 'success', text: 'Content changes published live to storefront!' });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (e) {
      setActionNotice({ type: 'error', text: 'Failed to publish changes.' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6" id="admin-marketing-hub">
      {/* Header with clear 3-tab navigation */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Marketing
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage promotional campaigns, discount coupon codes, and customer-facing marketing content.
            </p>
          </div>

          {/* If Content tab is active, show draft/publish bar */}
          {activeTab === 'content' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save size={14} /> Save Draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Globe size={14} /> {isPublishing ? 'Publishing...' : 'Publish Live'}
              </button>
            </div>
          )}
        </div>

        {/* Notice Message */}
        {actionNotice && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            actionNotice.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {actionNotice.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* 3 Main Tabs: Promotions, Coupons, Content */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            id="tab-marketing-promotions"
            onClick={() => setActiveTab('promotions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'promotions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles size={15} />
            <span>Promotions</span>
          </button>

          <button
            id="tab-marketing-coupons"
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'coupons'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Tag size={15} />
            <span>Coupons</span>
          </button>

          <button
            id="tab-marketing-content"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'content'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText size={15} />
            <span>Content</span>
          </button>

          <button
            id="tab-marketing-subscribers"
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'subscribers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Mail size={15} />
            <span>Subscribers</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'promotions' && <AdminPromotions />}
        {activeTab === 'coupons' && <AdminCoupons />}
        {activeTab === 'content' && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            <WebsiteContentCmsEditor formState={formState} setFormState={setFormState} />
          </div>
        )}
        {activeTab === 'subscribers' && <AdminSubscribers />}
      </div>
    </div>
  );
}
export default AdminMarketing;
