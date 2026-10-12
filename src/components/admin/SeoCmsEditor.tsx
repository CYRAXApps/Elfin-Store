import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import {
  Globe, Search, Share2, FileCode, CheckCircle2, AlertCircle, Eye,
  ExternalLink, Sparkles, RefreshCw, Copy, Check, Sliders, Shield
} from 'lucide-react';

interface SeoCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function SeoCmsEditor({ formState, setFormState }: SeoCmsEditorProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'pages' | 'og' | 'robotsSitemap'>('global');
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [copiedLink, setCopiedLink] = useState(false);

  const seo = formState.seo || {
    globalTitle: 'ELECTRO STORE — Laptops, Smartphones & Electronics',
    metaDescription: 'Shop genuine laptops, smartphones, headphones and electronics with official brand warranty, GST invoice, and express delivery.',
    defaultKeywords: 'electronics, laptops, smartphones, gadgets',
    canonicalBaseUrl: '',
    defaultOgImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    robotsConfig: 'index, follow',
    pageSeo: {},
  };

  const handleGlobalChange = (field: keyof typeof seo, value: any) => {
    setFormState(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: value
      }
    }));
  };

  const handlePageSeoChange = (pageKey: string, field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        pageSeo: {
          ...(prev.seo?.pageSeo || {}),
          [pageKey]: {
            ...((prev.seo?.pageSeo || {})[pageKey] || {
              seoTitle: '',
              metaDescription: '',
            }),
            [field]: value
          }
        }
      }
    }));
  };

  const pagePresets = [
    { key: 'home', label: 'Homepage (/)', defaultTitle: 'ELECTRO STORE — Premium Electronics & Smart Tech', defaultDesc: 'Discover the latest laptops, smartphones, headphones, and home gadgets at Electro Store.' },
    { key: 'shop', label: 'Shop Catalog (/shop)', defaultTitle: 'Shop Laptops, Phones & Tech Catalog | ELECTRO STORE', defaultDesc: 'Browse our full catalog of certified laptops, smartphones, gaming gear, and accessories.' },
    { key: 'productDetails', label: 'Product Details (/product/:id)', defaultTitle: '{Product Name} - Specs, Price & Reviews | ELECTRO STORE', defaultDesc: 'Buy {Product Name} online in India with official manufacturer warranty and GST invoice.' },
    { key: 'cart', label: 'Cart (/cart)', defaultTitle: 'Shopping Cart & Checkout | ELECTRO STORE', defaultDesc: 'Review your items and proceed to secure checkout with express shipping.' },
    { key: 'checkout', label: 'Checkout (/checkout)', defaultTitle: 'Secure Checkout & Payment | ELECTRO STORE', defaultDesc: 'Fast and secure checkout with Razorpay, UPI, Credit Cards and GST billing.' },
    { key: 'contact', label: 'Contact Us (/contact)', defaultTitle: 'Contact Customer Support & Corporate Office | ELECTRO STORE', defaultDesc: 'Get in touch with our customer care team for warranty inquiries, bulk orders, and tracking.' },
    { key: 'about', label: 'About Us (/about)', defaultTitle: 'About Electro Store — Genuine Tech & Authorized Retailer', defaultDesc: 'Learn about our mission to deliver genuine computing, smartphone, and audio technology.' },
    { key: 'support', label: 'Support & Help Center (/support)', defaultTitle: 'Customer Care, Warranty & Returns Center | ELECTRO STORE', defaultDesc: 'Submit warranty claims, track repairs, and read FAQs for your gadgets.' },
    { key: 'privacy', label: 'Privacy Policy (/privacy)', defaultTitle: 'Privacy Policy & Data Security | ELECTRO STORE', defaultDesc: 'How Electro Store protects user data and ensures PCI-DSS compliant transactions.' },
    { key: 'terms', label: 'Terms & Conditions (/terms)', defaultTitle: 'Terms of Service & Sales Agreement | ELECTRO STORE', defaultDesc: 'Terms of use, GST invoicing policies, and warranty claim conditions.' },
    { key: 'shipping', label: 'Shipping Policy (/shipping-policy)', defaultTitle: 'Shipping & Express Delivery Policy | ELECTRO STORE', defaultDesc: 'Information on courier partners, delivery timelines, and free shipping thresholds.' },
    { key: 'returns', label: 'Returns & Refunds Policy (/returns-refunds)', defaultTitle: '7-Day Replacement & Refund Policy | ELECTRO STORE', defaultDesc: 'Hassle-free 7-day replacement guarantee for damaged or defective items.' },
  ];

  const currentPageConfig = seo.pageSeo?.[selectedPage] || {
    seoTitle: pagePresets.find(p => p.key === selectedPage)?.defaultTitle || '',
    metaDescription: pagePresets.find(p => p.key === selectedPage)?.defaultDesc || '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    keywords: '',
    canonicalUrl: '',
    noIndex: false
  };

  const titleLength = (seo.globalTitle || '').length;
  const descLength = (seo.metaDescription || '').length;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="text-blue-600" size={22} />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Search Engine Optimization (SEO) CMS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure global metadata, search snippets, Open Graph cards, canonical URLs, robots.txt directives, and page-specific SEO.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'global' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Global SEO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pages' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Page-Level SEO
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('og')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'og' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Social Sharing (OG)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('robotsSitemap')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'robotsSitemap' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Robots & Sitemap
          </button>
        </div>
      </div>

      {/* 1. GLOBAL SEO TAB */}
      {activeTab === 'global' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Global Title */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800">
                  Site Title Template <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] font-mono font-bold ${
                  titleLength > 65 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {titleLength} / 60 characters
                </span>
              </div>
              <input
                type="text"
                value={seo.globalTitle || ''}
                onChange={(e) => handleGlobalChange('globalTitle', e.target.value)}
                placeholder="Enter global meta title"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">
                Recommended: 50-60 characters. Appears on browser tabs and Google Search result headlines.
              </p>
            </div>

            {/* Meta Description */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800">
                  Global Meta Description <span className="text-red-500">*</span>
                </label>
                <span className={`text-[11px] font-mono font-bold ${
                  descLength > 160 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {descLength} / 155 characters
                </span>
              </div>
              <textarea
                rows={3}
                value={seo.metaDescription || ''}
                onChange={(e) => handleGlobalChange('metaDescription', e.target.value)}
                placeholder="Enter global meta description"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 shadow-2xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-500">
                Recommended: 120-160 characters. Succinctly summarize the store's value proposition for search engines.
              </p>
            </div>

            {/* Default Meta Keywords */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Default Meta Keywords</label>
              <input
                type="text"
                value={seo.defaultKeywords || ''}
                onChange={(e) => handleGlobalChange('defaultKeywords', e.target.value)}
                placeholder="Enter meta keywords"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">Comma-separated keywords for internal taggers and search engines.</p>
            </div>

            {/* Canonical Base URL & Favicon URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Canonical Base URL</label>
                <input
                  type="text"
                  value={seo.canonicalBaseUrl || ''}
                  onChange={(e) => handleGlobalChange('canonicalBaseUrl', e.target.value)}
                  placeholder="Enter canonical base URL"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                />
                <p className="text-[10px] text-slate-500">Prevents duplicate content penalties by standardizing primary URLs.</p>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Favicon / Browser Icon URL</label>
                <input
                  type="text"
                  value={formState.branding?.favicon || formState.general?.faviconUrl || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormState(prev => ({
                      ...prev,
                      branding: { ...prev.branding, favicon: val },
                      general: { ...prev.general, faviconUrl: val }
                    }));
                  }}
                  placeholder="Enter favicon URL"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                />
                <p className="text-[10px] text-slate-500">SVG, PNG, or ICO URL rendered in the browser tab.</p>
              </div>
            </div>
          </div>

          {/* Live Google SERP Snippet Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Search size={14} className="text-blue-600" /> Google Search SERP Preview
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">Desktop & Mobile</span>
              </div>

              {/* Google Search Card Mockup */}
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                    E
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-slate-900 leading-none">
                      {formState.general?.storeName || 'ELECTRO STORE'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {seo.canonicalBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'Not configured')}
                    </span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-medium text-blue-800 hover:underline cursor-pointer leading-snug pt-1">
                  {seo.globalTitle || 'ELECTRO STORE — Laptops, Smartphones & Electronics'}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {seo.metaDescription || 'Shop genuine laptops, smartphones, headphones and electronics with official brand warranty, GST invoice, and express delivery.'}
                </p>
              </div>

              {/* SEO Health Checks */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  {titleLength >= 30 && titleLength <= 65 ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                  )}
                  <span>Title Length: {titleLength} chars ({titleLength >= 30 && titleLength <= 65 ? 'Optimal' : 'Needs tuning'})</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  {descLength >= 70 && descLength <= 160 ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                  )}
                  <span>Description Length: {descLength} chars ({descLength >= 70 && descLength <= 160 ? 'Optimal' : 'Needs tuning'})</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  {seo.canonicalBaseUrl ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-amber-500 shrink-0" />
                  )}
                  <span>Canonical URL: {seo.canonicalBaseUrl ? 'Configured' : 'Missing'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAGE-LEVEL SEO TAB */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Page Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Select Page to Optimize</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-1 max-h-[500px] overflow-y-auto">
              {pagePresets.map((preset) => {
                const isSelected = selectedPage === preset.key;
                const hasCustomSeo = Boolean(seo.pageSeo?.[preset.key]?.seoTitle);
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setSelectedPage(preset.key)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="truncate">{preset.label}</span>
                    {hasCustomSeo && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Custom
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Details Editor */}
          <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Optimizing: {pagePresets.find(p => p.key === selectedPage)?.label}
                </h3>
                <p className="text-[11px] text-slate-500">Override default site title and meta description for this specific route.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const preset = pagePresets.find(p => p.key === selectedPage);
                  if (preset) {
                    handlePageSeoChange(selectedPage, 'seoTitle', preset.defaultTitle);
                    handlePageSeoChange(selectedPage, 'metaDescription', preset.defaultDesc);
                  }
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} /> Reset to Defaults
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Page SEO Title</label>
                <input
                  type="text"
                  value={currentPageConfig.seoTitle || ''}
                  onChange={(e) => handlePageSeoChange(selectedPage, 'seoTitle', e.target.value)}
                  placeholder="Enter page SEO title"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Page Meta Description</label>
                <textarea
                  rows={3}
                  value={currentPageConfig.metaDescription || ''}
                  onChange={(e) => handlePageSeoChange(selectedPage, 'metaDescription', e.target.value)}
                  placeholder="Enter page meta description"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Keywords</label>
                  <input
                    type="text"
                    value={currentPageConfig.keywords || ''}
                    onChange={(e) => handlePageSeoChange(selectedPage, 'keywords', e.target.value)}
                    placeholder="Enter page keywords"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Canonical URL</label>
                  <input
                    type="text"
                    value={currentPageConfig.canonicalUrl || ''}
                    onChange={(e) => handlePageSeoChange(selectedPage, 'canonicalUrl', e.target.value)}
                    placeholder="Enter canonical URL"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentPageConfig.noIndex || false}
                  onChange={(e) => handlePageSeoChange(selectedPage, 'noIndex', e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Noindex this page (Hide from Google Search)</span>
                  <span className="text-[11px] text-slate-500">Adds &lt;meta name="robots" content="noindex, nofollow"&gt; to keep this page private.</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 3. SOCIAL SHARING (OPEN GRAPH / TWITTER CARDS) */}
      {activeTab === 'og' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase">Default Open Graph / Social Sharing Image</h3>
              <p className="text-xs text-slate-500">
                This banner image is automatically displayed when customers share your links on WhatsApp, Facebook, LinkedIn, X, and iMessage.
              </p>
              <input
                type="text"
                value={seo.defaultOgImage || ''}
                onChange={(e) => handleGlobalChange('defaultOgImage', e.target.value)}
                placeholder="Enter Open Graph image URL"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400">Dimensions: 1200 x 630 pixels. Formats: JPG, PNG, WebP.</p>
            </div>

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase">Default Social Sharing Title & Description</h3>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">OG Title (Leave blank to use Global Title)</label>
                <input
                  type="text"
                  value={seo.defaultOgTitle || ''}
                  onChange={(e) => handleGlobalChange('defaultOgTitle', e.target.value)}
                  placeholder="Enter social sharing title"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">OG Description</label>
                <textarea
                  rows={2}
                  value={seo.defaultOgDescription || ''}
                  onChange={(e) => handleGlobalChange('defaultOgDescription', e.target.value)}
                  placeholder="Enter social sharing description"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Social Card Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Share2 size={14} className="text-blue-600" /> WhatsApp / Facebook Card Preview
                </span>
              </div>

              {/* Social Card */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={seo.defaultOgImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80'}
                    alt="Social Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                </div>
                <div className="p-3.5 space-y-1 bg-slate-50 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">
                    {seo.canonicalBaseUrl ? new URL(seo.canonicalBaseUrl).hostname : (typeof window !== 'undefined' ? window.location.hostname : 'Not configured')}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                    {seo.defaultOgTitle || seo.globalTitle || 'ELECTRO STORE — Laptops, Smartphones & Electronics'}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {seo.defaultOgDescription || seo.metaDescription || 'Shop genuine laptops, smartphones, headphones and electronics with official brand warranty, GST invoice, and express delivery.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ROBOTS.TXT & SITEMAP DIRECTIVES */}
      {activeTab === 'robotsSitemap' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-600" size={18} />
              <h3 className="text-sm font-bold text-slate-900">Robots & Web Crawler Directives</h3>
            </div>
            <p className="text-xs text-slate-500">
              Control which search engines (Googlebot, Bingbot, DuckDuckBot) are allowed to crawl your storefront pages.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Robots Meta Tag Value</label>
              <select
                value={seo.robotsConfig || 'index, follow'}
                onChange={(e) => handleGlobalChange('robotsConfig', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
              >
                <option value="index, follow">index, follow (Standard — Allow full Google indexing)</option>
                <option value="noindex, follow">noindex, follow (Hide site from search, follow links)</option>
                <option value="index, nofollow">index, nofollow (Index site, do not follow external links)</option>
                <option value="noindex, nofollow">noindex, nofollow (Private — Block all search engines)</option>
              </select>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[9px]">Generated Meta Directive:</p>
              <p className="text-blue-700">&lt;meta name="robots" content="{seo.robotsConfig || 'index, follow'}" /&gt;</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <FileCode className="text-blue-600" size={18} />
              <h3 className="text-sm font-bold text-slate-900">Automated XML Sitemap Settings</h3>
            </div>
            <p className="text-xs text-slate-500">
              Your XML sitemap automatically indexes all published products, categories, legal pages, and policies.
            </p>

            <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={seo.sitemapEnabled !== false}
                onChange={(e) => handleGlobalChange('sitemapEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Enable Automated XML Sitemap Indexing</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Public Sitemap URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${seo.canonicalBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/sitemap.xml`}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${seo.canonicalBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/sitemap.xml`);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />} {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
