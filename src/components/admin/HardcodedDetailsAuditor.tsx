import React, { useState } from 'react';
import {
  Code, Search, RefreshCw, CheckCircle2, AlertTriangle, FileCode,
  Check, Eye, Trash2, ArrowRight, ShieldCheck, Play, Layers, Sparkles
} from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export interface HardcodedEntry {
  id: string;
  category: 'Store Identity' | 'Contact & Phone' | 'Email & Support' | 'Legal & CMS Content' | 'Logos & Assets' | 'SEO & Titles' | 'Email Templates';
  label: string;
  sourceFile: string;
  currentValue: string;
  replacementValue: string;
  isCleared: boolean;
  contextNote: string;
}

export const INITIAL_DISCOVERED_ENTRIES: HardcodedEntry[] = [
  {
    id: 'store_name_default',
    category: 'Store Identity',
    label: 'Primary Store / Brand Name',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: 'ELECTRO STORE',
    replacementValue: 'ELECTRO STORE',
    isCleared: false,
    contextNote: 'Default fallback store name in SiteSettingsContext and theme defaults.'
  },
  {
    id: 'short_store_name',
    category: 'Store Identity',
    label: 'Short Store Name / Badge',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: 'ELECTRO',
    replacementValue: 'ELECTRO',
    isCleared: false,
    contextNote: 'Fallback short brand name for compact mobile headers and badges.'
  },
  {
    id: 'store_tagline',
    category: 'Store Identity',
    label: 'Store Tagline / Subtitle',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: 'Your trusted destination for genuine electronics & gadgets',
    replacementValue: 'Your trusted destination for genuine electronics & gadgets',
    isCleared: false,
    contextNote: 'Default brand tagline displayed in site headers, footers, and SEO metadata.'
  },
  {
    id: 'store_description',
    category: 'Store Identity',
    label: 'Store Description',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: 'Shop laptops, smartphones, headphones, and smart home tech at Electro Store with certified brand warranty, GST invoice & express delivery across India.',
    replacementValue: 'Shop laptops, smartphones, headphones, and smart home tech at Electro Store with certified brand warranty, GST invoice & express delivery across India.',
    isCleared: false,
    contextNote: 'Default meta description and store overview text.'
  },
  {
    id: 'meta_name',
    category: 'Store Identity',
    label: 'Metadata App Name',
    sourceFile: 'metadata.json',
    currentValue: 'ELECTRO STORE',
    replacementValue: 'ELECTRO STORE',
    isCleared: false,
    contextNote: 'Name property stored in workspace metadata configuration file.'
  },
  {
    id: 'index_html_title',
    category: 'SEO & Titles',
    label: 'HTML Title Tag',
    sourceFile: 'index.html',
    currentValue: 'ELECTRO STORE - SMART TECH. BETTER LIFE.',
    replacementValue: 'ELECTRO STORE - SMART TECH. BETTER LIFE.',
    isCleared: false,
    contextNote: 'Root document title tag in index.html entrypoint.'
  },
  {
    id: 'store_info_settings_name',
    category: 'Store Identity',
    label: 'Admin Store Info Default Name',
    sourceFile: 'src/components/admin/settings/StoreInfoSettings.tsx',
    currentValue: 'ELECTRO STORE',
    replacementValue: 'ELECTRO STORE',
    isCleared: false,
    contextNote: 'Default initial value in Store Info setting inputs.'
  },
  {
    id: 'store_info_settings_tagline',
    category: 'Store Identity',
    label: 'Admin Store Info Default Tagline',
    sourceFile: 'src/components/admin/settings/StoreInfoSettings.tsx',
    currentValue: "India's Premium Electronics Destination",
    replacementValue: "India's Premium Electronics Destination",
    isCleared: false,
    contextNote: 'Default tagline setting input in StoreInfoSettings.'
  },
  {
    id: 'announcement_bar_text',
    category: 'Store Identity',
    label: 'Header Announcement Bar Text',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: 'Free Express Delivery on orders over ₹500! Use code WELCOME10 for 10% Off.',
    replacementValue: 'Free Express Delivery on orders over ₹500! Use code WELCOME10 for 10% Off.',
    isCleared: false,
    contextNote: 'Top announcement bar offer message displayed across site header.'
  },
  {
    id: 'ibp_owner_phone',
    category: 'Contact & Phone',
    label: 'IBP Partner Owner Phone Number',
    sourceFile: 'src/pages/admin/AdminIBPStores.tsx',
    currentValue: '+91 62977 47957',
    replacementValue: '+91 62977 47957',
    isCleared: false,
    contextNote: 'Hardcoded owner contact phone for store partner assignments.'
  },
  {
    id: 'partner_login_phone',
    category: 'Contact & Phone',
    label: 'Partner Login Sample Phone',
    sourceFile: 'src/pages/partner/PartnerLogin.tsx',
    currentValue: '+91 91234 56789',
    replacementValue: '+91 91234 56789',
    isCleared: false,
    contextNote: 'Sample partner login placeholder phone number.'
  },
  {
    id: 'support_admin_email',
    category: 'Email & Support',
    label: 'Help & Support Admin Email',
    sourceFile: 'src/components/account/HelpAndSupportSection.tsx',
    currentValue: 'support@electrostore.com',
    replacementValue: 'support@electrostore.com',
    isCleared: false,
    contextNote: 'Default target admin email for customer support queries.'
  },
  {
    id: 'partner_placeholder_email',
    category: 'Email & Support',
    label: 'Partner Stores Placeholder Email',
    sourceFile: 'src/pages/admin/AdminIBPStores.tsx',
    currentValue: 'partner@electrostore.com',
    replacementValue: 'partner@electrostore.com',
    isCleared: false,
    contextNote: 'Default fallback email address for partner store profiles.'
  },
  {
    id: 'partner_login_email',
    category: 'Email & Support',
    label: 'Partner Login Sample Email',
    sourceFile: 'src/pages/partner/PartnerLogin.tsx',
    currentValue: 'partner-a@electrostore-ibp.com',
    replacementValue: 'partner-a@electrostore-ibp.com',
    isCleared: false,
    contextNote: 'Hardcoded demo partner email on login form.'
  },
  {
    id: 'notification_from_email',
    category: 'Email & Support',
    label: 'Server Notification From Email',
    sourceFile: 'src/lib/serverNotificationService.ts',
    currentValue: 'no-reply@electrostore.com',
    replacementValue: 'no-reply@electrostore.com',
    isCleared: false,
    contextNote: 'Default fallback sender email address for system emails.'
  },
  {
    id: 'email_templates_url',
    category: 'Email Templates',
    label: 'Transactional Email Order URL',
    sourceFile: 'src/lib/emailTemplates.ts',
    currentValue: 'https://electrostore.com/orders',
    replacementValue: 'https://electrostore.com/orders',
    isCleared: false,
    contextNote: 'Base URL embedded in automated customer email templates.'
  },
  {
    id: 'about_us_default_content',
    category: 'Legal & CMS Content',
    label: 'About Us Default Content',
    sourceFile: 'src/components/admin/WebsiteContentCmsEditor.tsx',
    currentValue: "## Welcome to ELECTRO STORE\n\nElectro Store is India's premier destination for genuine consumer electronics...",
    replacementValue: "## Welcome to ELECTRO STORE\n\nElectro Store is India's premier destination for genuine consumer electronics...",
    isCleared: false,
    contextNote: 'Default Markdown text for the About Us page.'
  },
  {
    id: 'about_us_seo_title',
    category: 'SEO & Titles',
    label: 'About Us Page SEO Title',
    sourceFile: 'src/components/admin/WebsiteContentCmsEditor.tsx',
    currentValue: 'About Us | ELECTRO STORE — Certified Electronics & Gadgets',
    replacementValue: 'About Us | ELECTRO STORE — Certified Electronics & Gadgets',
    isCleared: false,
    contextNote: 'Default SEO document title for About Us page.'
  },
  {
    id: 'primary_logo_path',
    category: 'Logos & Assets',
    label: 'Primary Logo Vector Path',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: '/assets/logo.svg',
    replacementValue: '/assets/logo.svg',
    isCleared: false,
    contextNote: 'Default SVG asset path for primary store brand logo.'
  },
  {
    id: 'favicon_path',
    category: 'Logos & Assets',
    label: 'Favicon Asset Path',
    sourceFile: 'src/context/SiteSettingsContext.tsx',
    currentValue: '/assets/favicon.svg',
    replacementValue: '/assets/favicon.svg',
    isCleared: false,
    contextNote: 'Default favicon icon SVG path.'
  },
  {
    id: 'loyalty_club_title',
    category: 'Store Identity',
    label: 'Loyalty Club Brand Name',
    sourceFile: 'src/components/admin/AdvancedCmsEditor.tsx',
    currentValue: 'Electro Loyalty Rewards & Points Club',
    replacementValue: 'Electro Loyalty Rewards & Points Club',
    isCleared: false,
    contextNote: 'Default label for loyalty program.'
  }
];

export function HardcodedDetailsAuditor() {
  const { saveDraft, publishSettings, settings } = useSiteSettings();
  const [entries, setEntries] = useState<HardcodedEntry[]>(INITIAL_DISCOVERED_ENTRIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isapplying, setIsApplying] = useState(false);
  const [auditReport, setAuditReport] = useState<{
    appliedCount: number;
    results: Array<{ filePath: string; targetString: string; replacementString: string; success: boolean; error?: string }>;
  } | null>(null);

  const categories = ['All', 'Store Identity', 'Contact & Phone', 'Email & Support', 'Legal & CMS Content', 'Logos & Assets', 'SEO & Titles', 'Email Templates'];

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch =
      e.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.currentValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.sourceFile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.replacementValue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingChanges = entries.filter((e) => e.isCleared || e.replacementValue !== e.currentValue);

  const handleUpdateReplacement = (id: string, val: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, replacementValue: val, isCleared: false } : e
      )
    );
  };

  const handleClearValue = (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, replacementValue: '', isCleared: true } : e
      )
    );
  };

  const handleResetValue = (id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, replacementValue: e.currentValue, isCleared: false } : e
      )
    );
  };

  const handleApplyAllChanges = async () => {
    if (pendingChanges.length === 0) return;
    setIsApplying(true);

    try {
      const replacementsPayload = pendingChanges.map((item) => ({
        filePath: item.sourceFile,
        targetString: item.currentValue,
        replacementString: item.isCleared ? '' : item.replacementValue,
      }));

      // 1. Send direct file replace request to server API
      const res = await fetch('/api/admin/codebase-auditor/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replacements: replacementsPayload }),
      });

      const data = await res.json();

      // 2. Also update live site settings where applicable
      const updatedGeneral = { ...settings.general };
      const updatedBranding = { ...settings.branding };

      pendingChanges.forEach((item) => {
        if (item.id === 'store_name_default' || item.id === 'store_info_settings_name') {
          updatedGeneral.storeName = item.replacementValue || 'MY STORE';
          updatedBranding.brandName = item.replacementValue || 'MY STORE';
        }
        if (item.id === 'short_store_name') {
          updatedGeneral.shortStoreName = item.replacementValue;
        }
        if (item.id === 'store_tagline') {
          updatedGeneral.tagline = item.replacementValue;
        }
        if (item.id === 'store_description') {
          updatedGeneral.storeDescription = item.replacementValue;
        }
      });

      const nextSettings = {
        ...settings,
        general: updatedGeneral,
        branding: updatedBranding,
      };

      await saveDraft(nextSettings);
      await publishSettings(nextSettings);

      setAuditReport({
        appliedCount: pendingChanges.length,
        results: data.results || [],
      });

      // Update current values in state to reflect applied changes
      setEntries((prev) =>
        prev.map((e) => {
          const match = pendingChanges.find((p) => p.id === e.id);
          if (match) {
            return {
              ...e,
              currentValue: e.isCleared ? '' : e.replacementValue,
              isCleared: false,
            };
          }
          return e;
        })
      );

      setShowReviewModal(false);
    } catch (err: any) {
      console.error('Failed to apply codebase replacements:', err);
      alert(`Error applying changes: ${err?.message || 'Server connection failed'}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Code size={13} /> Codebase Details Auditor & Direct Replacer
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Hardcoded Codebase Details Auditor
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Scan, review, edit, clear, and apply direct source modifications for hardcoded default store names, contact details, emails, titles, and fake business text across source files.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              disabled={pendingChanges.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                pendingChanges.length > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Eye size={15} />
              <span>Review Proposed Changes ({pendingChanges.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-semibold block">Total Hardcoded Entries</span>
            <span className="text-lg font-black text-white">{entries.length}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-semibold block">Pending Edits</span>
            <span className="text-lg font-black text-amber-400">{pendingChanges.length}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-semibold block">Source Files Targeted</span>
            <span className="text-lg font-black text-blue-300">
              {new Set(entries.map((e) => e.sourceFile)).size}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-semibold block">Auditor Status</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 size={13} /> Active & Synced
            </span>
          </div>
        </div>
      </div>

      {/* Audit Report Banner if changes applied */}
      {auditReport && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Successfully applied {auditReport.appliedCount} direct codebase replacements across source files!</span>
            </div>
            <button
              type="button"
              onClick={() => setAuditReport(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
            >
              Dismiss Report
            </button>
          </div>
          <p className="text-xs text-emerald-700">
            Source files were modified directly on disk and site context settings were updated live.
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by label, source file, or hardcoded value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          {/* Reset All button */}
          <button
            type="button"
            onClick={() => setEntries(INITIAL_DISCOVERED_ENTRIES)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Reset Discovered Values
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          {categories.map((cat) => {
            const count = cat === 'All' ? entries.length : entries.filter((e) => e.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List of Hardcoded Discovered Entries */}
      <div className="space-y-4">
        {filteredEntries.map((item) => {
          const isModified = item.replacementValue !== item.currentValue || item.isCleared;

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 text-left ${
                isModified
                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 flex items-center gap-1">
                      <FileCode size={12} /> {item.sourceFile}
                    </span>
                    {isModified && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle size={11} /> {item.isCleared ? 'Cleared' : 'Modified'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-900 pt-0.5">{item.label}</h4>
                  <p className="text-xs text-slate-500">{item.contextNote}</p>
                </div>

                {/* Quick actions for this item */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleClearValue(item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Clear value (remove from codebase)"
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                  {isModified && (
                    <button
                      type="button"
                      onClick={() => handleResetValue(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Reset to discovered default"
                    >
                      <RefreshCw size={12} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Discovery & Replacement Input Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Discovered Hardcoded Current Value */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Discovered Codebase Value
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-800 break-words whitespace-pre-wrap">
                    {item.currentValue || <span className="text-slate-400 italic">[ Empty String ]</span>}
                  </div>
                </div>

                {/* Editable Replacement Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    Replacement Value
                  </label>
                  {item.currentValue.includes('\n') ? (
                    <textarea
                      rows={3}
                      value={item.isCleared ? '' : item.replacementValue}
                      onChange={(e) => handleUpdateReplacement(item.id, e.target.value)}
                      placeholder="Enter replacement content..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={item.isCleared ? '' : item.replacementValue}
                      onChange={(e) => handleUpdateReplacement(item.id, e.target.value)}
                      placeholder="Enter replacement value..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                    />
                  )}
                  {item.isCleared && (
                    <p className="text-[11px] text-rose-600 font-bold italic pt-0.5">
                      Marked to be cleared (will be replaced with empty string).
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review & Apply Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Eye size={20} className="text-blue-600" />
                  Review Proposed Code Replacements
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm the target source files and exact string replacements before executing physical changes on disk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Changes Table */}
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
              {pendingChanges.map((change) => (
                <div key={change.id} className="p-3.5 space-y-2 bg-slate-50/50 text-left">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                      {change.sourceFile}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{change.label}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-rose-700 uppercase block">Current Code Value</span>
                      <p className="font-mono text-rose-900 break-words font-semibold">
                        {change.currentValue || '[ Empty ]'}
                      </p>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Proposed Replacement</span>
                      <p className="font-mono text-emerald-900 break-words font-semibold">
                        {change.isCleared ? <span className="italic text-rose-600">[ CLEARED / EMPTY ]</span> : change.replacementValue}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel & Return
              </button>

              <button
                type="button"
                onClick={handleApplyAllChanges}
                disabled={isapplying}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isapplying ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Executing Replacements on Disk...</span>
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    <span>Confirm & Apply Direct Code Changes ({pendingChanges.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
