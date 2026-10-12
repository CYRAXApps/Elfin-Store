import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import {
  FileText, Truck, RotateCcw, DollarSign, XCircle, ShieldCheck,
  CheckCircle2, ExternalLink, Calendar, Search, Sparkles, RefreshCw, Eye
} from 'lucide-react';

interface StorePoliciesCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function StorePoliciesCmsEditor({ formState, setFormState }: StorePoliciesCmsEditorProps) {
  const [selectedKey, setSelectedKey] = useState<string>('shipping');
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'seo' | 'preview'>('content');

  const standardPolicies = [
    {
      key: 'shipping',
      name: 'Shipping Policy',
      icon: Truck,
      url: '/shipping-policy',
      defaultTitle: 'Shipping & Delivery Policy',
      defaultDesc: 'Information on dispatch timelines, courier partners, and free delivery thresholds.'
    },
    {
      key: 'return',
      name: 'Return Policy',
      icon: RotateCcw,
      url: '/returns-refunds',
      defaultTitle: 'Return & Replacement Policy',
      defaultDesc: 'Hassle-free 7-day replacement guarantee for damaged or defective items.'
    },
    {
      key: 'refund',
      name: 'Refund Policy',
      icon: DollarSign,
      url: '/returns-refunds',
      defaultTitle: 'Refund & Settlement Policy',
      defaultDesc: 'Details regarding refund turnaround time and payment source credits.'
    },
    {
      key: 'cancellation',
      name: 'Cancellation Policy',
      icon: XCircle,
      url: '/returns-refunds',
      defaultTitle: 'Order Cancellation Guidelines',
      defaultDesc: 'How and when customers can cancel unfulfilled or dispatched orders.'
    },
    {
      key: 'privacy',
      name: 'Privacy Policy',
      icon: ShieldCheck,
      url: '/privacy',
      defaultTitle: 'Privacy Policy & Data Protection',
      defaultDesc: 'How customer information is protected and compliance maintained.'
    },
    {
      key: 'terms',
      name: 'Terms & Conditions',
      icon: FileText,
      url: '/terms',
      defaultTitle: 'Terms of Service & Customer Agreement',
      defaultDesc: 'Terms of use, GST invoicing regulations, and user account responsibilities.'
    },
    {
      key: 'warranty',
      name: 'Warranty Policy',
      icon: ShieldCheck,
      url: '/support?tab=warranty',
      defaultTitle: 'Brand Warranty & RMA Guidelines',
      defaultDesc: 'Official manufacturer warranty verification and service center network.'
    }
  ];

  const policies = formState.policies || {};

  const currentPolicy = policies[selectedKey] || {
    title: standardPolicies.find(p => p.key === selectedKey)?.defaultTitle || '',
    content: '',
    published: true,
    lastUpdated: new Date().toISOString().split('T')[0],
    seoTitle: '',
    seoDescription: ''
  };

  const handlePolicyChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      policies: {
        ...(prev.policies || {}),
        [selectedKey]: {
          ...((prev.policies || {})[selectedKey] || {
            title: '',
            content: '',
            published: true,
            lastUpdated: new Date().toISOString().split('T')[0]
          }),
          [field]: value
        }
      }
    }));
  };

  const selectedMeta = standardPolicies.find(p => p.key === selectedKey) || standardPolicies[0];
  const Icon = selectedMeta.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Store Policies CMS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage legal store policies, compliance clauses, return timelines, GST terms, and warranty coverage rules.
          </p>
        </div>

        {/* View on Storefront Button */}
        <a
          href={selectedMeta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <ExternalLink size={13} />
          <span>View '{selectedMeta.name}' Live</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Policy Selector */}
        <div className="lg:col-span-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Select Policy to Edit</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-1">
            {standardPolicies.map((policy) => {
              const PolicyIcon = policy.icon;
              const isSelected = selectedKey === policy.key;
              const isPublished = (policies[policy.key]?.published !== false);

              return (
                <button
                  key={policy.key}
                  type="button"
                  onClick={() => setSelectedKey(policy.key)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PolicyIcon size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    <span>{policy.name}</span>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Policy Content Editor */}
        <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedMeta.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">Route: {selectedMeta.url}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Published switch */}
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-slate-300 rounded-xl">
                <input
                  type="checkbox"
                  checked={currentPolicy.published !== false}
                  onChange={(e) => handlePolicyChange('published', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">
                  {currentPolicy.published !== false ? 'Live (Published)' : 'Draft (Hidden)'}
                </span>
              </label>

              {/* Sub-tab switcher */}
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('content')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeSubTab === 'content' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('seo')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeSubTab === 'seo' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  SEO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeSubTab === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* 1. CONTENT EDITOR TAB */}
          {activeSubTab === 'content' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentPolicy.title || ''}
                    onChange={(e) => handlePolicyChange('title', e.target.value)}
                    placeholder={selectedMeta.defaultTitle}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Updated Date</label>
                  <input
                    type="date"
                    value={currentPolicy.lastUpdated || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handlePolicyChange('lastUpdated', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Policy Body (Markdown & HTML Supported)</label>
                  <span className="text-[11px] text-slate-400 font-mono">{(currentPolicy.content || '').length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={currentPolicy.content || ''}
                  onChange={(e) => handlePolicyChange('content', e.target.value)}
                  placeholder="Enter policy terms, bullet points, headers with ###, etc."
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* 2. SEO TAB */}
          {activeSubTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Policy SEO Meta Title</label>
                <input
                  type="text"
                  value={currentPolicy.seoTitle || ''}
                  onChange={(e) => handlePolicyChange('seoTitle', e.target.value)}
                  placeholder={`${selectedMeta.name} | ELECTRO STORE`}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Policy Meta Description</label>
                <textarea
                  rows={3}
                  value={currentPolicy.seoDescription || ''}
                  onChange={(e) => handlePolicyChange('seoDescription', e.target.value)}
                  placeholder={selectedMeta.defaultDesc}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* 3. LIVE PREVIEW TAB */}
          {activeSubTab === 'preview' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{currentPolicy.title || selectedMeta.defaultTitle}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last updated: {currentPolicy.lastUpdated || 'Recently'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  currentPolicy.published !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {currentPolicy.published !== false ? 'Live on Store' : 'Draft'}
                </span>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {currentPolicy.content || 'No content drafted yet. Enter your policy text in the Editor tab.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
