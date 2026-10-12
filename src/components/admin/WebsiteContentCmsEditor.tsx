import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { FAQItem } from '../../types';
import {
  FileText, CheckCircle2, Eye, Edit3, Globe, Sparkles,
  RotateCcw, ExternalLink, Bold, Italic, Heading2, Heading3,
  List, Link2, Quote, ShieldCheck, HelpCircle, Phone, Info,
  AlertTriangle, Lock, ArrowUpRight, Plus, Trash2, Edit, Save,
  ChevronDown, ChevronUp, Search, X, Check
} from 'lucide-react';

interface WebsiteContentCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

interface StandardPageConfig {
  id: string;
  title: string;
  slug: string;
  group: 'pages' | 'policies';
  description: string;
  icon: any;
  defaultContent: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
}

const CORE_PAGES: StandardPageConfig[] = [
  {
    id: 'about',
    title: 'About Us',
    slug: 'about',
    group: 'pages',
    description: 'Brand origin story, verified distributor sourcing, and customer commitment',
    icon: Info,
    defaultContent: '',
    defaultSeoTitle: 'About Us',
    defaultSeoDescription: 'Learn more about our store, warranty coverage, and customer support.'
  },
  {
    id: 'contact',
    title: 'Contact Us',
    slug: 'contact',
    group: 'pages',
    description: 'Corporate address, support emails, hotline numbers, and desk hours',
    icon: Phone,
    defaultContent: `## Contact Customer Support\n\nWe are here to assist you with order inquiries, technical specifications, warranty claims, and corporate bulk orders.\n\n### Customer Support Channels\nReach us directly via our customer support channels and verified business details configured in Store Settings.`,
    defaultSeoTitle: 'Contact Us & Customer Support | ELECTRO STORE',
    defaultSeoDescription: 'Get in touch with Electro Store customer care for order assistance, warranty claims, and corporate inquiries.'
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions (FAQs)',
    slug: 'faq',
    group: 'pages',
    description: 'Customer help desk questions organized by ordering, deliveries, warranties, and returns',
    icon: HelpCircle,
    defaultContent: `## Frequently Asked Questions\n\nFind quick answers to common questions about ordering, deliveries, warranties, and returns on Electro Store.`,
    defaultSeoTitle: 'Frequently Asked Questions (FAQs) | ELECTRO STORE',
    defaultSeoDescription: 'Find quick answers to common questions regarding delivery timelines, warranty claims, returns, and payments.'
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    slug: 'terms',
    group: 'policies',
    description: 'User agreement, pricing accuracy, intellectual property, and acceptable usage',
    icon: FileText,
    defaultContent: `## Terms of Service & User Agreement\n\n### 1. Acceptance of Terms\nBy accessing and placing orders on Electro Store, you agree to be bound by these Terms and Conditions and our Privacy Policy.\n\n### 2. Pricing & GST Billing\nAll prices displayed on the website include applicable GST (Goods and Services Tax). Invoices will show complete GST breakdowns.\n\n### 3. Order Acceptance\nReceipt of an electronic order confirmation does not signify our final acceptance of your order. Electro Store reserves the right to cancel or limit order quantities.\n\n### 4. Warranty & Service\nProduct warranties are provided directly by respective original equipment manufacturers (OEMs).`,
    defaultSeoTitle: 'Terms & Conditions | ELECTRO STORE',
    defaultSeoDescription: 'Read the official terms and conditions for purchasing electronics on Electro Store.'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    slug: 'privacy',
    group: 'policies',
    description: 'Data collection, 256-bit encryption, cookie management, and user privacy',
    icon: Lock,
    defaultContent: `## Privacy & Data Protection Policy\n\n### 1. Data Collection\nWe collect personal details necessary to fulfill your orders, including your name, shipping address, contact phone number, and email.\n\n### 2. Payment Security\nWe do not store your credit/debit card numbers or UPI PINs. All financial transactions are processed through 256-bit encrypted payment gateways (Razorpay).\n\n### 3. Non-Disclosure\nWe never sell or rent your personal information to third-party marketing companies.\n\n### 4. Your Rights\nYou may review, update, or request deletion of your account information at any time.`,
    defaultSeoTitle: 'Privacy Policy & Data Security | ELECTRO STORE',
    defaultSeoDescription: 'Learn how Electro Store safeguards your personal data, transaction security, and privacy.'
  },
  {
    id: 'returns',
    title: 'Return & Refund Policy',
    slug: 'returns-refunds',
    group: 'policies',
    description: '7-day replacement guarantee, return conditions, and refund timelines',
    icon: ShieldCheck,
    defaultContent: `## Returns, Replacements & Refund Policy\n\n### 7-Day Replacement Guarantee\nWe offer a hassle-free **7-Day Replacement Guarantee** for items that arrive damaged, defective, or significantly different from description.\n\n### Return Conditions\n- Items must be in original, unblemished condition with retail box, serial numbers, manuals, and accessories intact.\n- Return requests can be initiated from your Account > Support & Returns dashboard.\n\n### Refund Timelines\n- Once inspected and verified at our fulfillment center, refunds are processed within **3 to 5 business days** to your original payment method.\n- COD orders can receive refunds via direct NEFT bank transfer or instant store credit.`,
    defaultSeoTitle: 'Return & Refund Policy | ELECTRO STORE',
    defaultSeoDescription: 'Our 7-day replacement guarantee and transparent refund process for electronics purchases.'
  },
  {
    id: 'shipping',
    title: 'Shipping Policy',
    slug: 'shipping-policy',
    group: 'policies',
    description: 'Delivery timelines, free shipping eligibility, courier partners, and tracking',
    icon: Globe,
    defaultContent: `## Shipping & Express Delivery Policy\n\n### Free Shipping\nAll orders over **₹500** qualify for 100% **FREE Express Delivery** across major Indian cities.\n\n### Delivery Timelines\n- **Metro Cities (Delhi, Mumbai, Bengaluru, etc.):** 1 to 2 business days.\n- **Tier 2 & 3 Cities:** 3 to 5 business days.\n- **Remote & Special Regions:** 5 to 7 business days.\n\n### Tracking Your Shipment\nOnce dispatched, an SMS and email notification with your live tracking number (BlueDart / Delhivery) will be sent immediately.`,
    defaultSeoTitle: 'Shipping & Delivery Policy | ELECTRO STORE',
    defaultSeoDescription: 'Check shipping rates, courier delivery timelines, and free delivery thresholds on Electro Store.'
  }
];

export function WebsiteContentCmsEditor({ formState, setFormState }: WebsiteContentCmsEditorProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>('about');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview' | 'seo'>('edit');
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // FAQs State
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqSuccessNotice, setFaqSuccessNotice] = useState<string | null>(null);

  // Custom page creation modal
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Fetch FAQs from API
  const fetchFaqs = async () => {
    try {
      setLoadingFaqs(true);
      const res = await fetch('/api/support/faqs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaqs(data);
      }
    } catch (e) {
      console.error('Failed to load FAQs:', e);
    } finally {
      setLoadingFaqs(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const selectedCoreConfig = CORE_PAGES.find(p => p.id === selectedPageId) || {
    id: selectedPageId,
    title: (formState.customPages || []).find(p => p.id === selectedPageId)?.title || 'Custom Page',
    slug: (formState.customPages || []).find(p => p.id === selectedPageId)?.slug || selectedPageId,
    group: 'pages' as const,
    description: 'Custom informational storefront page',
    icon: FileText,
    defaultContent: '## New Page\n\nEnter your custom page content here...',
    defaultSeoTitle: 'Custom Page | ELECTRO STORE',
    defaultSeoDescription: 'Storefront custom page.'
  };

  // Helper to get current page state from formState
  const getPageState = (pageId: string) => {
    const policyKey = pageId === 'returns' ? 'return' : pageId;
    const policy = formState.policies?.[policyKey];
    const customPage = (formState.customPages || []).find(p => p.id === pageId || p.slug === selectedCoreConfig.slug);

    const title = policy?.title || customPage?.title || selectedCoreConfig.title;
    const content = policy?.content || customPage?.content || selectedCoreConfig.defaultContent;
    const published = policy ? policy.published !== false : customPage ? customPage.published !== false : true;
    const seoTitle = policy?.seoTitle || customPage?.seoTitle || selectedCoreConfig.defaultSeoTitle;
    const seoDescription = policy?.seoDescription || customPage?.seoDescription || selectedCoreConfig.defaultSeoDescription;
    const lastUpdated = policy?.lastUpdated || customPage?.updatedAt || new Date().toISOString().split('T')[0];

    return { title, content, published, seoTitle, seoDescription, lastUpdated };
  };

  const pageState = getPageState(selectedPageId);

  // Update page data in formState (both policies & customPages)
  const updatePage = (updates: Partial<ReturnType<typeof getPageState>>) => {
    const today = new Date().toISOString().split('T')[0];
    const policyKey = selectedPageId === 'returns' ? 'return' : selectedPageId;

    setFormState(prev => {
      const existingPolicy = prev.policies?.[policyKey] || {
        title: selectedCoreConfig.title,
        content: selectedCoreConfig.defaultContent,
        published: true,
        lastUpdated: today,
        seoTitle: selectedCoreConfig.defaultSeoTitle,
        seoDescription: selectedCoreConfig.defaultSeoDescription,
      };

      const updatedPolicies = {
        ...prev.policies,
        [policyKey]: {
          ...existingPolicy,
          ...updates,
          lastUpdated: today
        }
      };

      if (selectedPageId === 'returns' && updates.content) {
        updatedPolicies['refund'] = {
          title: 'Refund Policy',
          content: updates.content,
          published: updates.published ?? true,
          lastUpdated: today,
          seoTitle: updates.seoTitle || selectedCoreConfig.defaultSeoTitle,
          seoDescription: updates.seoDescription || selectedCoreConfig.defaultSeoDescription,
        };
      }

      const existingCustomPages = prev.customPages || [];
      const pageIndex = existingCustomPages.findIndex(
        p => p.id === selectedPageId || p.slug === selectedCoreConfig.slug
      );

      let updatedCustomPages = [...existingCustomPages];
      if (pageIndex >= 0) {
        updatedCustomPages[pageIndex] = {
          ...updatedCustomPages[pageIndex],
          title: updates.title ?? updatedCustomPages[pageIndex].title,
          content: updates.content ?? updatedCustomPages[pageIndex].content,
          published: updates.published ?? updatedCustomPages[pageIndex].published,
          seoTitle: updates.seoTitle ?? updatedCustomPages[pageIndex].seoTitle,
          seoDescription: updates.seoDescription ?? updatedCustomPages[pageIndex].seoDescription,
          updatedAt: today
        };
      } else {
        updatedCustomPages.push({
          id: selectedPageId,
          slug: selectedCoreConfig.slug,
          title: updates.title || selectedCoreConfig.title,
          content: updates.content || selectedCoreConfig.defaultContent,
          published: updates.published !== undefined ? updates.published : true,
          seoTitle: updates.seoTitle || selectedCoreConfig.defaultSeoTitle,
          seoDescription: updates.seoDescription || selectedCoreConfig.defaultSeoDescription,
          updatedAt: today
        });
      }

      return {
        ...prev,
        policies: updatedPolicies,
        customPages: updatedCustomPages
      };
    });
  };

  const handleCreateCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;

    const slug = newPageSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPageId = `page-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const newPageObj = {
      id: newPageId,
      slug,
      title: newPageTitle.trim(),
      content: `## ${newPageTitle.trim()}\n\nWelcome to ${newPageTitle.trim()}. Edit this content in the CMS editor.`,
      published: true,
      seoTitle: `${newPageTitle.trim()} | ELECTRO STORE`,
      seoDescription: `${newPageTitle.trim()} page.`,
      updatedAt: today
    };

    setFormState(prev => ({
      ...prev,
      customPages: [...(prev.customPages || []), newPageObj]
    }));

    setSelectedPageId(newPageId);
    setNewPageTitle('');
    setNewPageSlug('');
    setIsNewPageModalOpen(false);
  };

  const handleDeleteCustomPage = (id: string) => {
    if (confirm('Are you sure you want to delete this custom page?')) {
      setFormState(prev => ({
        ...prev,
        customPages: (prev.customPages || []).filter(p => p.id !== id)
      }));
      setSelectedPageId('about');
    }
  };

  // Markdown Formatting Shortcut Helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end);
    const replacement = `${prefix}${selected || 'Sample Text'}${suffix}`;
    const newContent = el.value.substring(0, start) + replacement + el.value.substring(end);
    
    updatePage({ content: newContent });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 11));
    }, 50);
  };

  // FAQ Management Functions
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question?.trim() || !editingFaq?.answer?.trim()) return;

    try {
      const res = await fetch('/api/admin/support/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFaq)
      });
      const saved = await res.json();
      if (!saved.error) {
        setFaqs(prev => {
          const index = prev.findIndex(f => f.id === saved.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setFaqSuccessNotice(`FAQ question saved successfully.`);
        setTimeout(() => setFaqSuccessNotice(null), 3000);
        setIsFaqModalOpen(false);
        setEditingFaq(null);
      }
    } catch (err) {
      console.error('Failed to save FAQ:', err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to remove this FAQ question?')) return;
    try {
      await fetch(`/api/admin/support/faqs/${id}`, { method: 'DELETE' });
      setFaqs(prev => prev.filter(f => f.id !== id));
      setFaqSuccessNotice('FAQ question deleted.');
      setTimeout(() => setFaqSuccessNotice(null), 3000);
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    }
  };

  const handleToggleFaqActive = async (faq: FAQItem) => {
    try {
      const updated = { ...faq, isActive: !faq.isActive };
      await fetch('/api/admin/support/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setFaqs(prev => prev.map(f => f.id === faq.id ? updated : f));
    } catch (err) {
      console.error('Failed to toggle FAQ status:', err);
    }
  };

  // Filtered FAQs
  const filteredFaqs = faqs.filter(faq => {
    if (faqCategoryFilter !== 'all' && faq.category !== faqCategoryFilter) return false;
    if (faqSearchQuery.trim()) {
      const q = faqSearchQuery.toLowerCase();
      const questionMatch = faq.question.toLowerCase().includes(q);
      const answerMatch = faq.answer.toLowerCase().includes(q);
      if (!questionMatch && !answerMatch) return false;
    }
    return true;
  });

  const customPages = formState.customPages || [];

  return (
    <div className="space-y-6" id="website-content-cms-editor">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={20} /> Content & Pages Manager
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage store info pages, FAQs, warranty & return policies, legal agreements, and custom pages from one location.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={selectedPageId === 'faq' ? '/support' : `/${selectedCoreConfig.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink size={13} /> View Live Page
          </a>
        </div>
      </div>

      {/* Main 2-Column Interface: Page List on Left, Page Editor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Categorized Pages List */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Section 1: Standard Pages & FAQ */}
          <div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
              Storefront & Help Pages
            </span>
            <div className="space-y-1.5">
              {CORE_PAGES.filter(p => p.group === 'pages').map((page) => {
                const Icon = page.icon;
                const isSelected = selectedPageId === page.id;
                const curState = getPageState(page.id);

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{page.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          /{page.slug}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {page.id === 'faq' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {faqs.length} Qs
                        </span>
                      ) : curState.published ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Draft
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Policies & Compliance */}
          <div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2 px-1">
              Store Policies & Compliance
            </span>
            <div className="space-y-1.5">
              {CORE_PAGES.filter(p => p.group === 'policies').map((page) => {
                const Icon = page.icon;
                const isSelected = selectedPageId === page.id;
                const curState = getPageState(page.id);

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{page.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          /{page.slug}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {curState.published ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Draft
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Custom Created Pages */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Custom Pages ({customPages.length})
              </span>
              <button
                type="button"
                onClick={() => setIsNewPageModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Page
              </button>
            </div>

            {customPages.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400">
                No custom pages created yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {customPages.map((page) => {
                  const isSelected = selectedPageId === page.id;
                  return (
                    <div
                      key={page.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPageId(page.id)}
                        className="text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-900 block truncate">{page.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">/{page.slug}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPage(page.id)}
                        className="p-1 text-slate-300 hover:text-red-600 cursor-pointer transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Area: Active Editor */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          
          {/* Active Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{pageState.title}</h3>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  /{selectedCoreConfig.slug}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selectedCoreConfig.description}</p>
            </div>

            {selectedPageId !== 'faq' && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={pageState.published}
                    onChange={(e) => updatePage({ published: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${pageState.published ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {pageState.published ? 'Published' : 'Draft'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* If FAQ is selected: Render Interactive FAQ Manager */}
          {selectedPageId === 'faq' ? (
            <div className="space-y-4">
              {/* Notice */}
              {faqSuccessNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={15} /> {faqSuccessNotice}
                </div>
              )}

              {/* FAQ Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Search & Category Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search questions or answers..."
                      value={faqSearchQuery}
                      onChange={e => setFaqSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={faqCategoryFilter}
                    onChange={e => setFaqCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="Orders & Shipping">Orders & Shipping</option>
                    <option value="Payments & Billing">Payments & Billing</option>
                    <option value="Returns & Replacements">Returns & Replacements</option>
                    <option value="Product Warranty">Product Warranty</option>
                    <option value="Account & Security">Account & Security</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingFaq({
                      question: '',
                      answer: '',
                      category: 'Orders & Shipping',
                      displayOrder: faqs.length + 1,
                      isActive: true
                    });
                    setIsFaqModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>

              {/* FAQ List */}
              {loadingFaqs ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading FAQ questions...</div>
              ) : filteredFaqs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No FAQs found. Click "Add Question" to create one.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                            {faq.category}
                          </span>
                          {!faq.isActive && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {faq.question}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleFaqActive(faq)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            faq.isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                          }`}
                          title={faq.isActive ? 'Hide on storefront' : 'Show on storefront'}
                        >
                          {faq.isActive ? <Eye size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaq(faq);
                            setIsFaqModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Standard or Policy Page Editor */
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setEditorTab('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    editorTab === 'edit'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Edit3 size={13} /> Edit Content
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    editorTab === 'preview'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Eye size={13} /> Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('seo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    editorTab === 'seo'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Globe size={13} /> SEO & Meta
                </button>
              </div>

              {/* TAB 1: EDIT CONTENT */}
              {editorTab === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Page Display Heading
                    </label>
                    <input
                      type="text"
                      value={pageState.title}
                      onChange={(e) => updatePage({ title: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Page Heading"
                    />
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Bold"
                    >
                      <Bold size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Italic"
                    >
                      <Italic size={13} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('## ', '\n')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Heading 2"
                    >
                      <Heading2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('### ', '\n')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Heading 3"
                    >
                      <Heading3 size={13} />
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => insertFormatting('- ', '\n')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Bullet List Item"
                    >
                      <List size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('[Link Text](', 'https://yourdomain.com/url)')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Hyperlink"
                    >
                      <Link2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ', '\n')}
                      className="p-1.5 hover:bg-white hover:shadow-xs rounded text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Blockquote"
                    >
                      <Quote size={13} />
                    </button>
                  </div>

                  {/* Textarea */}
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={pageState.content}
                      onChange={(e) => updatePage({ content: e.target.value })}
                      rows={12}
                      className="w-full p-4 border border-slate-300 rounded-xl text-xs font-mono leading-relaxed text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      placeholder="Write page content in clean Markdown or plain text..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PREVIEW */}
              {editorTab === 'preview' && (
                <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                    <h1 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-3">
                      {pageState.title}
                    </h1>
                    <div className="text-xs text-slate-400">
                      Last Updated: {pageState.lastUpdated}
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                      {pageState.content}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEO */}
              {editorTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meta Search Title
                    </label>
                    <input
                      type="text"
                      value={pageState.seoTitle}
                      onChange={(e) => updatePage({ seoTitle: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Meta Title"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Recommended length: 50-60 characters</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={pageState.seoDescription}
                      onChange={(e) => updatePage({ seoDescription: e.target.value })}
                      rows={3}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      placeholder="Meta Description snippet for search results..."
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Recommended length: 120-160 characters</p>
                  </div>

                  {/* Google Search Snippet Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Google Search Result Snippet
                    </span>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs max-w-lg space-y-1 font-sans">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="text-slate-800 font-semibold">{typeof window !== 'undefined' ? window.location.origin : 'https://yourstore.com'}</span>
                        <span>›</span>
                        <span className="text-slate-500">{selectedCoreConfig.slug}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-blue-700 hover:underline truncate">
                        {pageState.seoTitle || selectedCoreConfig.defaultSeoTitle}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {pageState.seoDescription || selectedCoreConfig.defaultSeoDescription}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal: Add/Edit FAQ Question */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="text-blue-600" size={18} />
                {editingFaq?.id ? 'Edit FAQ Question' : 'Add FAQ Question'}
              </h3>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={editingFaq?.category || 'Orders & Shipping'}
                  onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white"
                >
                  <option value="Orders & Shipping">Orders & Shipping</option>
                  <option value="Payments & Billing">Payments & Billing</option>
                  <option value="Returns & Replacements">Returns & Replacements</option>
                  <option value="Product Warranty">Product Warranty</option>
                  <option value="Account & Security">Account & Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={editingFaq?.question || ''}
                  onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. How do I track my order delivery?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Answer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingFaq?.answer || ''}
                  onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Clear and concise answer explaining policies or steps..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFaq?.isActive !== false}
                    onChange={e => setEditingFaq({ ...editingFaq, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Visible on Storefront</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFaqModalOpen(false)}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Save Question
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Page */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="text-blue-600" size={18} /> Add Custom Page
              </h3>
              <button
                onClick={() => setIsNewPageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPage} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Page Title *
                </label>
                <input
                  type="text"
                  required
                  value={newPageTitle}
                  onChange={e => setNewPageTitle(e.target.value)}
                  placeholder="e.g. Careers, Bulk Corporate Orders"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-100 text-slate-500 px-3 py-2 rounded-l-xl text-xs border border-r-0 border-slate-200">
                    /
                  </span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={e => setNewPageSlug(e.target.value)}
                    placeholder={newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'page-slug'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-xl text-xs font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewPageModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
