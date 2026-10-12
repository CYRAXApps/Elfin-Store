import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import {
  FileText, Plus, Trash2, ExternalLink, CheckCircle2,
  Eye, Edit3, Calendar, Sparkles, RefreshCw, AlertTriangle
} from 'lucide-react';

interface LegalPagesCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function LegalPagesCmsEditor({ formState, setFormState }: LegalPagesCmsEditorProps) {
  const customPages = formState.customPages || [];
  const [selectedPageId, setSelectedPageId] = useState<string>(customPages[0]?.id || 'about-us');
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content');

  const currentPage = customPages.find(p => p.id === selectedPageId) || customPages[0] || {
    id: 'sample-page',
    slug: 'sample',
    title: 'New Legal / Informational Page',
    content: '',
    published: true,
    seoTitle: '',
    seoDescription: '',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  const handleUpdateCurrentPage = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      customPages: (prev.customPages || []).map(page => {
        if (page.id === selectedPageId) {
          return {
            ...page,
            [field]: value,
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return page;
      })
    }));
  };

  const handleAddNewPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage = {
      id: newId,
      slug: `custom-page-${(customPages.length + 1)}`,
      title: `Custom Legal Page ${(customPages.length + 1)}`,
      content: '### New Legal / Informational Page\n\nEnter the legal terms, compliance text, disclosures, or customer guidelines here.',
      published: true,
      seoTitle: `Custom Page | ELECTRO STORE`,
      seoDescription: 'Informational guidelines and compliance terms.',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setFormState(prev => ({
      ...prev,
      customPages: [...(prev.customPages || []), newPage]
    }));
    setSelectedPageId(newId);
  };

  const handleDeletePage = (pageId: string) => {
    if (customPages.length <= 1) {
      alert('You must keep at least one custom legal / informational page.');
      return;
    }
    if (!confirm('Are you sure you want to delete this legal page?')) return;

    setFormState(prev => {
      const filtered = (prev.customPages || []).filter(p => p.id !== pageId);
      return {
        ...prev,
        customPages: filtered
      };
    });

    const remaining = customPages.filter(p => p.id !== pageId);
    if (remaining.length > 0) {
      setSelectedPageId(remaining[0].id);
    }
  };

  const templates = [
    {
      name: 'Cookie Policy',
      slug: 'cookie-policy',
      title: 'Cookie & Tracking Policy',
      content: `### 1. What Are Cookies?\nCookies are small data files placed on your device to remember user sessions, shopping cart state, and analytics preferences.\n\n### 2. How We Use Cookies\n- **Essential Cookies:** Maintain authentication and cart sessions.\n- **Performance Cookies:** Anonymous telemetry for site speed improvement.\n- **Marketing Cookies:** Relevant product recommendations.\n\n### 3. Managing Your Preferences\nYou can disable non-essential cookies at any time via your browser settings.`
    },
    {
      name: 'Disclaimer & Compliance',
      slug: 'disclaimer',
      title: 'Disclaimer & Product Authorization',
      content: `### 1. Authorized Brand Products\nELECTRO STORE sells only 100% brand-new, factory-sealed electronics sourced from authorized Indian distributors with official brand warranties.\n\n### 2. Specification Accuracy\nWhile we strive for absolute accuracy in technical specifications, actual manufacturer product packaging and colors may vary slightly.`
    },
    {
      name: 'Buyer Protection Guarantee',
      slug: 'buyer-protection',
      title: '100% Genuine Buyer Protection Guarantee',
      content: `### 1. Genuine Product Guarantee\nEvery product is guaranteed authentic and certified. In the rare event of a defective item, our 7-day replacement guarantee covers full replacement.\n\n### 2. Safe & Escrowed Payments\nAll payments are protected through 256-bit SSL encrypted PCI-DSS compliant payment gateways.`
    }
  ];

  const applyTemplate = (tmpl: typeof templates[0]) => {
    handleUpdateCurrentPage('title', tmpl.title);
    handleUpdateCurrentPage('slug', tmpl.slug);
    handleUpdateCurrentPage('content', tmpl.content);
    const storeName = formState.general?.storeName || 'Store';
    handleUpdateCurrentPage('seoTitle', `${tmpl.title} | ${storeName}`);
    handleUpdateCurrentPage('seoDescription', `Read the official ${tmpl.title} for ${storeName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Legal & Custom Informational Pages CMS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create custom informational pages, cookie notices, disclaimers, affiliate guidelines, and custom brand landing pages.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNewPage}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>Create New Page</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pages List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Pages ({customPages.length})</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-1 max-h-[500px] overflow-y-auto">
            {customPages.map((page) => {
              const isSelected = selectedPageId === page.id;
              const isPublished = page.published !== false;

              return (
                <div
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex flex-col overflow-hidden pr-2">
                    <span className="truncate">{page.title || 'Untitled Page'}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      /{page.slug || 'page'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPublished ? 'Live' : 'Draft'}
                    </span>

                    {customPages.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isSelected ? 'hover:bg-blue-700 text-blue-100' : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                        }`}
                        title="Delete Page"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Insert Boilerplate Templates */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2.5">
            <span className="text-[11px] font-bold text-blue-900 uppercase flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" /> Insert Prebuilt Boilerplate
            </span>
            <div className="flex flex-col gap-1.5">
              {templates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="w-full text-left p-2 bg-white hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold border border-blue-200 flex items-center justify-between transition-colors"
                >
                  <span>{tmpl.name}</span>
                  <span className="text-[10px] text-blue-600 font-bold">Apply &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Page Editor */}
        <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{currentPage.title || 'Untitled Page'}</h3>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>URL: /{currentPage.slug || 'page'}</span>
                <a
                  href={`/${currentPage.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  <ExternalLink size={10} /> Test Live Link
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-slate-300 rounded-xl">
                <input
                  type="checkbox"
                  checked={currentPage.published !== false}
                  onChange={(e) => handleUpdateCurrentPage('published', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">
                  {currentPage.published !== false ? 'Live (Published)' : 'Draft (Hidden)'}
                </span>
              </label>

              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'content' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'seo' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  SEO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* 1. CONTENT TAB */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Page Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentPage.title || ''}
                    onChange={(e) => handleUpdateCurrentPage('title', e.target.value)}
                    placeholder="Enter page title"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono text-slate-500 flex items-center">
                      /
                    </span>
                    <input
                      type="text"
                      value={currentPage.slug || ''}
                      onChange={(e) => handleUpdateCurrentPage('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                      placeholder="Enter URL slug"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-r-xl text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Page Content (Markdown & HTML Supported)</label>
                  <span className="text-[11px] text-slate-400 font-mono">{(currentPage.content || '').length} chars</span>
                </div>
                <textarea
                  rows={14}
                  value={currentPage.content || ''}
                  onChange={(e) => handleUpdateCurrentPage('content', e.target.value)}
                  placeholder="Enter page content"
                  className="w-full p-4 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* 2. SEO TAB */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Page SEO Meta Title</label>
                <input
                  type="text"
                  value={currentPage.seoTitle || ''}
                  onChange={(e) => handleUpdateCurrentPage('seoTitle', e.target.value)}
                  placeholder="Enter SEO meta title"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Page Meta Description</label>
                <textarea
                  rows={3}
                  value={currentPage.seoDescription || ''}
                  onChange={(e) => handleUpdateCurrentPage('seoDescription', e.target.value)}
                  placeholder="Enter meta description"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* 3. PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-h-[500px] overflow-y-auto">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{currentPage.title || 'Untitled Page'}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last updated: {currentPage.updatedAt || 'Recently'}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  currentPage.published !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {currentPage.published !== false ? 'Live on Store' : 'Draft'}
                </span>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {currentPage.content || 'No content drafted yet. Enter your page text in the Editor tab.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
