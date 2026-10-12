import React, { useState } from 'react';
import {
  SiteSettings,
  HeroSlideItem,
  HeroConfig,
  defaultHeroConfig,
  QuickCategoryItem,
  PopularCategoryItem,
  TrustBenefitItem,
  TestimonialItem,
  defaultHeroSlides,
  defaultQuickCategories,
  defaultPopularCategories,
  defaultTrustBenefits,
  defaultTestimonials,
  defaultDealsConfig,
  defaultFlashSaleConfig,
  defaultNewsletterConfig,
  defaultCustomContent,
  defaultBrandsConfig,
  defaultFeaturedProductsConfig,
  defaultBestSellersConfig,
  defaultNewArrivalsConfig,
  defaultRecentlyViewedConfig,
} from '../../context/SiteSettingsContext';
import {
  Layers, ArrowUp, ArrowDown, Plus, Trash2, ShieldCheck,
  Smartphone, Tag, Star, Sparkles, Image as ImageIcon, Flame,
  CheckCircle2, Eye, FileText, Mail, Award, Check, ChevronDown,
  ChevronUp, ExternalLink, Zap
} from 'lucide-react';

interface HomepageCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

const SECTION_METADATA: Record<string, { label: string; icon: any; description: string }> = {
  hero: { label: '1. Hero Carousel Slider', icon: ImageIcon, description: 'High-impact top banners with CTA buttons & imagery' },
  trust_section: { label: '2. Trust & Benefits', icon: ShieldCheck, description: 'Confidence badges (Free Shipping, Warranty, Returns, etc.)' },
  quick_categories: { label: '3. Quick Categories', icon: Smartphone, description: 'Icon category navigation pills' },
  deals: { label: '4. Deals & Promotions', icon: Tag, description: 'Dual promo highlight cards with deep discounts' },
  featured: { label: '5. Featured Products', icon: Star, description: 'Curated flagship products showcase' },
  best_sellers: { label: '6. Best Sellers', icon: Flame, description: 'Top volume sales and trending devices' },
  new_arrivals: { label: '7. New Arrivals', icon: Sparkles, description: 'Latest launched electronics and gadgets' },
  popular_categories: { label: '8. Popular Categories', icon: Layers, description: 'High-resolution image tiles for top categories' },
  flash_sale: { label: '9. Promotional Flash Sale', icon: Zap, description: 'Urgent countdown promotional banner' },
  brands: { label: '10. Featured Brands', icon: Award, description: 'Official partner and brand logo list' },
  testimonials: { label: '11. Testimonials & Reviews', icon: Star, description: 'Customer feedback and 5-star review cards' },
  recently_viewed: { label: '12. Recently Viewed', icon: Eye, description: 'Products the shopper recently browsed' },
  custom_content: { label: '13. Custom Content & Story', icon: FileText, description: 'Brand warranty, quality promise, or custom HTML/banner' },
  newsletter: { label: '14. Newsletter Signup', icon: Mail, description: 'Email capture card with welcome offer' },
};

const TRUST_ICONS_LIST = [
  'Truck', 'ShieldCheck', 'RotateCcw', 'Headphones', 'Star', 'Zap',
  'Award', 'CreditCard', 'Lock', 'Package', 'Clock', 'Phone',
  'Heart', 'CheckCircle2', 'HelpCircle', 'Sparkles', 'ThumbsUp',
  'BadgePercent', 'Gift', 'RefreshCw'
];

const CATEGORY_ICONS_LIST = [
  'Smartphone', 'Laptop', 'Headphones', 'Watch', 'Cpu', 'Gamepad2',
  'Sparkles', 'Zap', 'Star', 'Tag', 'Award', 'Package'
];

export function HomepageCmsEditor({ formState, setFormState }: HomepageCmsEditorProps) {
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('hero');

  const homepage = formState.homepage || {
    sectionsOrder: [],
    sections: {},
  };

  const sectionsOrder = homepage.sectionsOrder || [];
  const sections = homepage.sections || {};

  const updateHomepage = (updater: (prevHomepage: any) => any) => {
    setFormState(prev => ({
      ...prev,
      homepage: updater(prev.homepage || {})
    }));
  };

  const toggleSectionExpand = (sectionKey: string) => {
    setExpandedSection(prev => prev === sectionKey ? null : sectionKey);
  };

  return (
    <div className="space-y-8">
      {/* Master Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600" /> Homepage CMS Controller
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Configure every storefront homepage section dynamically. Enable/disable, reorder, edit content, and publish live.
          </p>
        </div>

        {/* Quick section filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSectionFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSectionFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sections ({sectionsOrder.length})
          </button>
          {sectionsOrder.map((key) => {
            const meta = SECTION_METADATA[key];
            const sec = sections[key];
            const isEnabled = sec?.enabled !== false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveSectionFilter(key);
                  setExpandedSection(key);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  activeSectionFilter === key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : isEnabled
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-100/60 text-slate-400 line-through'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {meta?.label.split('. ')[1] || key}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION ORDER & MASTER TOGGLES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Section Hierarchy & Visibility Order
            </h3>
            <p className="text-xs text-slate-500">
              Drag or use arrows to change the vertical display order on the storefront homepage.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {sectionsOrder.map((sectionKey, index) => {
            const meta = SECTION_METADATA[sectionKey] || { label: sectionKey, icon: Layers, description: '' };
            const IconComp = meta.icon;
            const sec = sections[sectionKey] || { id: sectionKey, title: meta.label.split('. ')[1] || sectionKey, enabled: true, order: index + 1 };
            const isSelected = activeSectionFilter === 'all' || activeSectionFilter === sectionKey;

            if (!isSelected) return null;

            return (
              <div
                key={sectionKey}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                  sec.enabled
                    ? 'bg-slate-50 border-slate-200 hover:border-blue-300'
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 bg-white text-slate-700 border border-slate-200 text-xs font-black rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                    {index + 1}
                  </span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <IconComp size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        {meta.label}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                        id: {sectionKey}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={sec.title || ''}
                      onChange={(e) => {
                        const updatedSecs = { ...sections, [sectionKey]: { ...sec, title: e.target.value } };
                        updateHomepage(hp => ({ ...hp, sections: updatedSecs }));
                      }}
                      className="mt-1 w-full max-w-sm px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Display Title on Storefront"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 sm:mt-0 self-end sm:self-center">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={sec.enabled !== false}
                      onChange={(e) => {
                        const updatedSecs = { ...sections, [sectionKey]: { ...sec, enabled: e.target.checked } };
                        updateHomepage(hp => ({ ...hp, sections: updatedSecs }));
                      }}
                      className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      {sec.enabled !== false ? 'Active' : 'Hidden'}
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => {
                      const copy = [...sectionsOrder];
                      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
                      updateHomepage(hp => ({ ...hp, sectionsOrder: copy }));
                    }}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    title="Move Section Up"
                  >
                    <ArrowUp size={15} />
                  </button>

                  <button
                    type="button"
                    disabled={index === sectionsOrder.length - 1}
                    onClick={() => {
                      const copy = [...sectionsOrder];
                      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
                      updateHomepage(hp => ({ ...hp, sectionsOrder: copy }));
                    }}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    title="Move Section Down"
                  >
                    <ArrowDown size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSectionExpand(sectionKey)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {expandedSection === sectionKey ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedSection === sectionKey ? 'Collapse' : 'Edit Section'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* DETAILED SECTION EDITORS                                     */}
      {/* ============================================================ */}

      {/* 1. HERO CAROUSEL SLIDER EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'hero') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'hero' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <ImageIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">1. Hero Carousel Slider Editor</h3>
                <p className="text-xs text-slate-500">Manage high-converting top slides, badges, background imagery, buttons and links.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const slides = homepage.heroSlides || defaultHeroSlides;
                const newSlide: HeroSlideItem = {
                  id: `hero-${Date.now()}`,
                  badge: 'NEW PROMOTION',
                  title: 'Special Tech Deal',
                  highlight: 'Experience Excellence.',
                  description: 'Discover extraordinary craftsmanship with certified manufacturer warranty.',
                  desktopImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&q=80',
                  mobileImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
                  buttonText: 'SHOP NOW',
                  buttonUrl: '/shop',
                  secondaryButtonText: 'VIEW DEALS',
                  secondaryButtonUrl: '/shop?sale=true',
                  active: true,
                  order: slides.length + 1,
                };
                updateHomepage(hp => ({ ...hp, heroSlides: [...slides, newSlide] }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add New Slide
            </button>
          </div>

          <div className="space-y-4">
            {(homepage.heroSlides || defaultHeroSlides).map((slide: HeroSlideItem, sIdx: number) => {
              const slidesList = homepage.heroSlides || defaultHeroSlides;
              return (
                <div key={slide.id || sIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {sIdx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-900 uppercase">
                        {slide.title || `Slide #${sIdx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded border border-slate-200">
                        <input
                          type="checkbox"
                          checked={slide.active !== false}
                          onChange={(e) => {
                            const list = [...slidesList];
                            list[sIdx] = { ...list[sIdx], active: e.target.checked };
                            updateHomepage(hp => ({ ...hp, heroSlides: list }));
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {slide.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </label>

                      <button
                        type="button"
                        disabled={sIdx === 0}
                        onClick={() => {
                          const list = [...slidesList];
                          [list[sIdx - 1], list[sIdx]] = [list[sIdx], list[sIdx - 1]];
                          list.forEach((s, i) => s.order = i + 1);
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        type="button"
                        disabled={sIdx === slidesList.length - 1}
                        onClick={() => {
                          const list = [...slidesList];
                          [list[sIdx], list[sIdx + 1]] = [list[sIdx + 1], list[sIdx]];
                          list.forEach((s, i) => s.order = i + 1);
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>

                      <button
                        type="button"
                        disabled={slidesList.length <= 1}
                        onClick={() => {
                          const list = slidesList.filter((_, i) => i !== sIdx);
                          list.forEach((s, i) => s.order = i + 1);
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded ml-1 disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Badge</label>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], badge: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter badge text"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], title: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter slide title"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Highlight Subtitle</label>
                      <input
                        type="text"
                        value={slide.highlight}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], highlight: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter highlight subtitle"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={slide.description}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], description: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter description"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Desktop Image URL</label>
                      <div className="flex items-center gap-2">
                        {slide.desktopImage ? (
                          <img
                            src={slide.desktopImage}
                            alt="Slide Preview"
                            className="w-12 h-8 object-cover rounded border border-slate-200 shrink-0 shadow-xs"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <input
                          type="text"
                          value={slide.desktopImage}
                          onChange={(e) => {
                            const list = [...slidesList];
                            list[sIdx] = { ...list[sIdx], desktopImage: e.target.value };
                            updateHomepage(hp => ({ ...hp, heroSlides: list }));
                          }}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mobile Image URL (Optional)</label>
                      <div className="flex items-center gap-2">
                        {slide.mobileImage ? (
                          <img
                            src={slide.mobileImage}
                            alt="Slide Mobile"
                            className="w-8 h-8 object-cover rounded border border-slate-200 shrink-0 shadow-xs"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <input
                          type="text"
                          value={slide.mobileImage || ''}
                          onChange={(e) => {
                            const list = [...slidesList];
                            list[sIdx] = { ...list[sIdx], mobileImage: e.target.value };
                            updateHomepage(hp => ({ ...hp, heroSlides: list }));
                          }}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Primary Button Text</label>
                      <input
                        type="text"
                        value={slide.buttonText}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], buttonText: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter button text"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Primary Button Link</label>
                      <input
                        type="text"
                        value={slide.buttonUrl}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], buttonUrl: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter button URL"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Secondary Button Text</label>
                      <input
                        type="text"
                        value={slide.secondaryButtonText || ''}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], secondaryButtonText: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter button text"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Secondary Button Link</label>
                      <input
                        type="text"
                        value={slide.secondaryButtonUrl || ''}
                        onChange={(e) => {
                          const list = [...slidesList];
                          list[sIdx] = { ...list[sIdx], secondaryButtonUrl: e.target.value };
                          updateHomepage(hp => ({ ...hp, heroSlides: list }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                        placeholder="Enter button URL"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TRUST & BENEFITS EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'trust_section') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'trust_section' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">2. Trust & Benefits Badges</h3>
                <p className="text-xs text-slate-500">Configure Free Shipping, Secure Payment, Easy Returns, 24/7 Support and custom warranty badges.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const list = homepage.trustBenefits || defaultTrustBenefits;
                const newItem: TrustBenefitItem = {
                  id: `tb-${Date.now()}`,
                  title: 'Brand Warranty',
                  description: '100% Genuine Coverage',
                  icon: 'ShieldCheck',
                  link: '/support',
                  enabled: true,
                  order: list.length + 1,
                };
                updateHomepage(hp => ({ ...hp, trustBenefits: [...list, newItem] }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Benefit Badge
            </button>
          </div>

          <div className="space-y-3">
            {(homepage.trustBenefits || defaultTrustBenefits).map((item: TrustBenefitItem, idx: number) => {
              const list = homepage.trustBenefits || defaultTrustBenefits;
              return (
                <div key={item.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-slate-800">#{idx + 1} {item.title}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(e) => {
                            const copy = [...list];
                            copy[idx] = { ...copy[idx], enabled: e.target.checked };
                            updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          {item.enabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const copy = [...list];
                          [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                          copy.forEach((it, i) => it.order = i + 1);
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        type="button"
                        disabled={idx === list.length - 1}
                        onClick={() => {
                          const copy = [...list];
                          [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
                          copy.forEach((it, i) => it.order = i + 1);
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const copy = list.filter((_, i) => i !== idx);
                          copy.forEach((it, i) => it.order = i + 1);
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], title: e.target.value };
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        placeholder="Enter title"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], description: e.target.value };
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Icon</label>
                      <select
                        value={item.icon || 'Truck'}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], icon: e.target.value };
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                      >
                        {TRUST_ICONS_LIST.map((ic) => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Link (Optional)</label>
                      <input
                        type="text"
                        value={item.link || ''}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], link: e.target.value };
                          updateHomepage(hp => ({ ...hp, trustBenefits: copy }));
                        }}
                        className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                        placeholder="Enter URL"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. QUICK CATEGORIES EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'quick_categories') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'quick_categories' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">3. Quick Category Icons Bar</h3>
                <p className="text-xs text-slate-500">Pills displayed for rapid device category browsing.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const list = homepage.quickCategories || defaultQuickCategories;
                const newItem: QuickCategoryItem = {
                  id: `qc-${Date.now()}`,
                  title: 'New Category',
                  icon: 'Sparkles',
                  image: '',
                  link: '/shop',
                  enabled: true,
                  order: list.length + 1,
                };
                updateHomepage(hp => ({ ...hp, quickCategories: [...list, newItem] }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Category Pill
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(homepage.quickCategories || defaultQuickCategories).map((qc: QuickCategoryItem, idx: number) => {
              const list = homepage.quickCategories || defaultQuickCategories;
              return (
                <div key={qc.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">#{idx + 1} {qc.title}</span>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                        <input
                          type="checkbox"
                          checked={qc.enabled !== false}
                          onChange={(e) => {
                            const copy = [...list];
                            copy[idx] = { ...copy[idx], enabled: e.target.checked };
                            updateHomepage(hp => ({ ...hp, quickCategories: copy }));
                          }}
                          className="w-3 h-3 text-blue-600 rounded"
                        />
                        {qc.enabled !== false ? 'Active' : 'Off'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = list.filter((_, i) => i !== idx);
                          updateHomepage(hp => ({ ...hp, quickCategories: copy }));
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={qc.title}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], title: e.target.value };
                        updateHomepage(hp => ({ ...hp, quickCategories: copy }));
                      }}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                      placeholder="Category Title"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={qc.icon || 'Smartphone'}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], icon: e.target.value };
                          updateHomepage(hp => ({ ...hp, quickCategories: copy }));
                        }}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                      >
                        {CATEGORY_ICONS_LIST.map(ic => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={qc.link}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], link: e.target.value };
                          updateHomepage(hp => ({ ...hp, quickCategories: copy }));
                        }}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                        placeholder="Enter category URL"
                      />
                    </div>
                    <input
                      type="text"
                      value={qc.image || ''}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], image: e.target.value };
                        updateHomepage(hp => ({ ...hp, quickCategories: copy }));
                      }}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                      placeholder="Optional Image URL"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DEALS & PROMOTIONS (2 CARDS) EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'deals') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'deals' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">4. Deals & Promotions (Dual Cards)</h3>
              <p className="text-xs text-slate-500">Configure the two side-by-side promotional cards on the homepage.</p>
            </div>
          </div>

          {(() => {
            const deals = homepage.dealsConfig || defaultDealsConfig;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1 */}
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-blue-400 tracking-wider">Card 1 (Dark Theme)</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Badge</label>
                      <input
                        type="text"
                        value={deals.card1Badge || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card1Badge: e.target.value } }))}
                        className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Title</label>
                      <input
                        type="text"
                        value={deals.card1Title || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card1Title: e.target.value } }))}
                        className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Subtitle</label>
                      <input
                        type="text"
                        value={deals.card1Subtitle || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card1Subtitle: e.target.value } }))}
                        className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Button Text</label>
                        <input
                          type="text"
                          value={deals.card1ButtonText || ''}
                          onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card1ButtonText: e.target.value } }))}
                          className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Button Link</label>
                        <input
                          type="text"
                          value={deals.card1ButtonUrl || ''}
                          onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card1ButtonUrl: e.target.value } }))}
                          className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Image URL</label>
                      <input
                        type="text"
                        value={deals.card1Image || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card1Image: e.target.value } }))}
                        className="w-full text-xs p-2 bg-slate-800 border border-slate-700 rounded text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-black uppercase text-blue-700 tracking-wider">Card 2 (Light Theme)</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Badge</label>
                      <input
                        type="text"
                        value={deals.card2Badge || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card2Badge: e.target.value } }))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Title</label>
                      <input
                        type="text"
                        value={deals.card2Title || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card2Title: e.target.value } }))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Subtitle</label>
                      <input
                        type="text"
                        value={deals.card2Subtitle || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card2Subtitle: e.target.value } }))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Button Text</label>
                        <input
                          type="text"
                          value={deals.card2ButtonText || ''}
                          onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card2ButtonText: e.target.value } }))}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Button Link</label>
                        <input
                          type="text"
                          value={deals.card2ButtonUrl || ''}
                          onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card2ButtonUrl: e.target.value } }))}
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-0.5">Image URL</label>
                      <input
                        type="text"
                        value={deals.card2Image || ''}
                        onChange={(e) => updateHomepage(hp => ({ ...hp, dealsConfig: { ...deals, card2Image: e.target.value } }))}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5, 6, 7, 12: PRODUCT SHOWCASE SECTIONS (FEATURED, BEST SELLERS, NEW ARRIVALS, RECENTLY VIEWED) */}
      {(activeSectionFilter === 'all' || ['featured', 'best_sellers', 'new_arrivals', 'recently_viewed'].includes(activeSectionFilter)) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Product Showcase Grids Configuration</h3>
            <p className="text-xs text-slate-500">Configure titles, subtitles, and display limits for Featured, Best Sellers, New Arrivals, and Recently Viewed.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Featured */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-black text-blue-600 uppercase">5. Featured Products</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={homepage.featuredProductsConfig?.title || 'Top Rated Products'}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, featuredProductsConfig: { ...hp.featuredProductsConfig, title: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Title"
                />
                <input
                  type="text"
                  value={homepage.featuredProductsConfig?.subtitle || ''}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, featuredProductsConfig: { ...hp.featuredProductsConfig, subtitle: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Subtitle"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Product Selection</label>
                    <select
                      value={homepage.featuredProductsConfig?.mode || 'popular'}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, featuredProductsConfig: { ...hp.featuredProductsConfig, mode: e.target.value as any } }))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-semibold"
                    >
                      <option value="popular">Most Popular (Reviews & Rating)</option>
                      <option value="newest">Newest Arrivals</option>
                      <option value="category">Category-Based</option>
                      <option value="manual">Manual Selection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Display Limit</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={homepage.featuredProductsConfig?.limit || 4}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, featuredProductsConfig: { ...hp.featuredProductsConfig, limit: Number(e.target.value) } }))}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white text-center font-bold"
                    />
                  </div>
                </div>

                {homepage.featuredProductsConfig?.mode === 'category' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Filter by Category</label>
                    <select
                      value={homepage.featuredProductsConfig?.selectedCategory || 'Laptops'}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, featuredProductsConfig: { ...hp.featuredProductsConfig, selectedCategory: e.target.value } }))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="Laptops">Laptops & Computers</option>
                      <option value="Smartphones">Smartphones & 5G</option>
                      <option value="Audio">Audio & Headphones</option>
                      <option value="Wearables">Wearables & Smartwatches</option>
                      <option value="Accessories">Accessories & Power</option>
                      <option value="Gaming">Gaming & Consoles</option>
                    </select>
                  </div>
                )}

                {homepage.featuredProductsConfig?.mode === 'manual' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Selected Product IDs (comma-separated)</label>
                    <input
                      type="text"
                      value={homepage.featuredProductsConfig?.selectedProductIds?.join(', ') || ''}
                      onChange={(e) => {
                        const ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        updateHomepage(hp => ({ ...hp, featuredProductsConfig: { ...hp.featuredProductsConfig, selectedProductIds: ids } }));
                      }}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-mono"
                      placeholder="Enter product IDs (comma-separated)"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Best Sellers */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-black text-amber-600 uppercase">6. Best Sellers</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={homepage.bestSellersConfig?.title || 'Trending Now'}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, bestSellersConfig: { ...hp.bestSellersConfig, title: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Title"
                />
                <input
                  type="text"
                  value={homepage.bestSellersConfig?.subtitle || ''}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, bestSellersConfig: { ...hp.bestSellersConfig, subtitle: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Subtitle"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Product Selection</label>
                    <select
                      value={homepage.bestSellersConfig?.mode || 'popular'}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, bestSellersConfig: { ...hp.bestSellersConfig, mode: e.target.value as any } }))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-semibold"
                    >
                      <option value="popular">Top Sales Volume (Trending)</option>
                      <option value="newest">New Releases</option>
                      <option value="category">Category-Based</option>
                      <option value="manual">Manual Selection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Display Limit</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={homepage.bestSellersConfig?.limit || 4}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, bestSellersConfig: { ...hp.bestSellersConfig, limit: Number(e.target.value) } }))}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white text-center font-bold"
                    />
                  </div>
                </div>

                {homepage.bestSellersConfig?.mode === 'category' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Filter by Category</label>
                    <select
                      value={homepage.bestSellersConfig?.selectedCategory || 'Smartphones'}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, bestSellersConfig: { ...hp.bestSellersConfig, selectedCategory: e.target.value } }))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="Laptops">Laptops & Computers</option>
                      <option value="Smartphones">Smartphones & 5G</option>
                      <option value="Audio">Audio & Headphones</option>
                      <option value="Wearables">Wearables & Smartwatches</option>
                      <option value="Accessories">Accessories & Power</option>
                      <option value="Gaming">Gaming & Consoles</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* New Arrivals */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-black text-emerald-600 uppercase">7. New Arrivals</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={homepage.newArrivalsConfig?.title || 'New Arrivals'}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, newArrivalsConfig: { ...hp.newArrivalsConfig, title: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Title"
                />
                <input
                  type="text"
                  value={homepage.newArrivalsConfig?.subtitle || ''}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, newArrivalsConfig: { ...hp.newArrivalsConfig, subtitle: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Subtitle"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Product Selection</label>
                    <select
                      value={homepage.newArrivalsConfig?.mode || 'newest'}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, newArrivalsConfig: { ...hp.newArrivalsConfig, mode: e.target.value as any } }))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-semibold"
                    >
                      <option value="newest">Latest Added / New Flag</option>
                      <option value="popular">Top Rated</option>
                      <option value="category">Category-Based</option>
                      <option value="manual">Manual Selection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Display Limit</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={homepage.newArrivalsConfig?.limit || 4}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, newArrivalsConfig: { ...hp.newArrivalsConfig, limit: Number(e.target.value) } }))}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white text-center font-bold"
                    />
                  </div>
                </div>

                {homepage.newArrivalsConfig?.mode === 'category' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Filter by Category</label>
                    <select
                      value={homepage.newArrivalsConfig?.selectedCategory || 'Audio'}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, newArrivalsConfig: { ...hp.newArrivalsConfig, selectedCategory: e.target.value } }))}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="Laptops">Laptops & Computers</option>
                      <option value="Smartphones">Smartphones & 5G</option>
                      <option value="Audio">Audio & Headphones</option>
                      <option value="Wearables">Wearables & Smartwatches</option>
                      <option value="Accessories">Accessories & Power</option>
                      <option value="Gaming">Gaming & Consoles</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Viewed */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-black text-purple-600 uppercase">12. Recently Viewed</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={homepage.recentlyViewedConfig?.title || 'Recently Viewed'}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, recentlyViewedConfig: { ...hp.recentlyViewedConfig, title: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Title"
                />
                <input
                  type="text"
                  value={homepage.recentlyViewedConfig?.subtitle || ''}
                  onChange={(e) => updateHomepage(hp => ({ ...hp, recentlyViewedConfig: { ...hp.recentlyViewedConfig, subtitle: e.target.value } }))}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  placeholder="Section Subtitle"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Max Products Displayed:</span>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={homepage.recentlyViewedConfig?.limit || 4}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, recentlyViewedConfig: { ...hp.recentlyViewedConfig, limit: Number(e.target.value) } }))}
                    className="w-16 p-1 text-xs border rounded text-center bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. POPULAR CATEGORIES GRID */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'popular_categories') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'popular_categories' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">8. Popular Categories Grid (Image Tiles)</h3>
                <p className="text-xs text-slate-500">Curated high-res imagery category blocks.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const list = homepage.popularCategories || defaultPopularCategories;
                const newItem: PopularCategoryItem = {
                  id: `pop-${Date.now()}`,
                  title: 'New Collection',
                  subtitle: 'Explore latest devices',
                  image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
                  link: '/shop',
                  count: '10+ Items',
                  enabled: true,
                };
                updateHomepage(hp => ({ ...hp, popularCategories: [...list, newItem] }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Category Tile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(homepage.popularCategories || defaultPopularCategories).map((cat: PopularCategoryItem, idx: number) => {
              const list = homepage.popularCategories || defaultPopularCategories;
              return (
                <div key={cat.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-slate-800">#{idx + 1} {cat.title}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                        <input
                          type="checkbox"
                          checked={cat.enabled !== false}
                          onChange={(e) => {
                            const copy = [...list];
                            copy[idx] = { ...copy[idx], enabled: e.target.checked };
                            updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                          }}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        {cat.enabled !== false ? 'Active' : 'Disabled'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = list.filter((_, i) => i !== idx);
                          updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cat.title}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], title: e.target.value };
                        updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                      }}
                      className="text-xs p-2 border rounded bg-white"
                      placeholder="Title"
                    />
                    <input
                      type="text"
                      value={cat.count || ''}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], count: e.target.value };
                        updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                      }}
                      className="text-xs p-2 border rounded bg-white"
                      placeholder="Enter count"
                    />
                    <input
                      type="text"
                      value={cat.subtitle || ''}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], subtitle: e.target.value };
                        updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                      }}
                      className="text-xs p-2 border rounded bg-white col-span-2"
                      placeholder="Subtitle"
                    />
                    <input
                      type="text"
                      value={cat.link}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], link: e.target.value };
                        updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                      }}
                      className="text-xs p-2 border rounded bg-white"
                      placeholder="Link"
                    />
                    <input
                      type="text"
                      value={cat.image || ''}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], image: e.target.value };
                        updateHomepage(hp => ({ ...hp, popularCategories: copy }));
                      }}
                      className="text-xs p-2 border rounded bg-white"
                      placeholder="Image URL"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. PROMOTIONAL FLASH SALE BANNER */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'flash_sale') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'flash_sale' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">9. Promotional Flash Sale Banner</h3>
              <p className="text-xs text-slate-500">Urgent high-conversion flash deal banner with countdown badge.</p>
            </div>
          </div>

          {(() => {
            const fs = homepage.flashSaleConfig || defaultFlashSaleConfig;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={fs.badgeText || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, badgeText: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="Enter badge text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Main Heading</label>
                  <input
                    type="text"
                    value={fs.title || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, title: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="Enter main heading"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Discount % Badge</label>
                  <input
                    type="text"
                    value={fs.discountPercent || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, discountPercent: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="Enter discount percentage"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={fs.description || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, description: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Button Text</label>
                  <input
                    type="text"
                    value={fs.buttonText || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, buttonText: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Button Link</label>
                  <input
                    type="text"
                    value={fs.buttonUrl || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, buttonUrl: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Product Image URL</label>
                  <input
                    type="text"
                    value={fs.image || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, flashSaleConfig: { ...fs, image: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 10. BRANDS SECTION EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'brands') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'brands' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">10. Featured Brand Logos</h3>
                <p className="text-xs text-slate-500">Manage official brand partner badges displayed on the homepage.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const brandsConfig = homepage.brandsConfig || defaultBrandsConfig;
                const list = brandsConfig.customBrands || [];
                const newItem = {
                  id: `b-${Date.now()}`,
                  name: 'New Brand',
                  enabled: true,
                };
                updateHomepage(hp => ({
                  ...hp,
                  brandsConfig: { ...brandsConfig, customBrands: [...list, newItem] }
                }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Brand
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {((homepage.brandsConfig || defaultBrandsConfig).customBrands || []).map((b, idx: number) => {
              const brandsConfig = homepage.brandsConfig || defaultBrandsConfig;
              const list = brandsConfig.customBrands || [];
              return (
                <div key={b.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={b.name}
                    onChange={(e) => {
                      const copy = [...list];
                      copy[idx] = { ...copy[idx], name: e.target.value };
                      updateHomepage(hp => ({ ...hp, brandsConfig: { ...brandsConfig, customBrands: copy } }));
                    }}
                    className="text-xs font-bold p-1.5 border rounded bg-white flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const copy = list.filter((_, i) => i !== idx);
                      updateHomepage(hp => ({ ...hp, brandsConfig: { ...brandsConfig, customBrands: copy } }));
                    }}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 11. TESTIMONIALS EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'testimonials') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'testimonials' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Star size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">11. Customer Reviews & Testimonials</h3>
                <p className="text-xs text-slate-500">Showcase verified buyer quotes and 5-star ratings.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const list = homepage.testimonials || defaultTestimonials;
                const newItem: TestimonialItem = {
                  id: `test-${Date.now()}`,
                  name: 'Verified Customer',
                  role: 'Verified Buyer, India',
                  rating: 5,
                  comment: 'Exceptional service and quick delivery with valid brand warranty.',
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
                  enabled: true,
                  order: list.length + 1,
                };
                updateHomepage(hp => ({ ...hp, testimonials: [...list, newItem] }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Testimonial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(homepage.testimonials || defaultTestimonials).map((t: TestimonialItem, idx: number) => {
              const list = homepage.testimonials || defaultTestimonials;
              return (
                <div key={t.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-slate-800">#{idx + 1} {t.name}</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={t.rating || 5}
                        onChange={(e) => {
                          const copy = [...list];
                          copy[idx] = { ...copy[idx], rating: Number(e.target.value) };
                          updateHomepage(hp => ({ ...hp, testimonials: copy }));
                        }}
                        className="text-xs p-1 border rounded bg-white"
                      >
                        {[5, 4, 3, 2, 1].map(r => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = list.filter((_, i) => i !== idx);
                          updateHomepage(hp => ({ ...hp, testimonials: copy }));
                        }}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], name: e.target.value };
                        updateHomepage(hp => ({ ...hp, testimonials: copy }));
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white font-bold"
                      placeholder="Enter customer name"
                    />
                    <input
                      type="text"
                      value={t.role}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], role: e.target.value };
                        updateHomepage(hp => ({ ...hp, testimonials: copy }));
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                      placeholder="Enter role or location"
                    />
                    <textarea
                      rows={3}
                      value={t.comment}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], comment: e.target.value };
                        updateHomepage(hp => ({ ...hp, testimonials: copy }));
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                      placeholder="Enter review comment"
                    />
                    <input
                      type="text"
                      value={t.avatar || ''}
                      onChange={(e) => {
                        const copy = [...list];
                        copy[idx] = { ...copy[idx], avatar: e.target.value };
                        updateHomepage(hp => ({ ...hp, testimonials: copy }));
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                      placeholder="Enter avatar image URL"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 13. CUSTOM CONTENT / WARRANTY STORY EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'custom_content') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'custom_content' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">13. Custom Content & Brand Story</h3>
              <p className="text-xs text-slate-500">Rich brand story or authorized warranty assurance card.</p>
            </div>
          </div>

          {(() => {
            const cc = homepage.customContent || defaultCustomContent;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Headline</label>
                    <input
                      type="text"
                      value={cc.title || ''}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, customContent: { ...cc, title: e.target.value } }))}
                      className="w-full text-xs p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={cc.subtitle || ''}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, customContent: { ...cc, subtitle: e.target.value } }))}
                      className="w-full text-xs p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Body Text Content</label>
                    <textarea
                      rows={4}
                      value={cc.content || ''}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, customContent: { ...cc, content: e.target.value } }))}
                      className="w-full text-xs p-2 border rounded bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Action Button Text</label>
                    <input
                      type="text"
                      value={cc.buttonText || ''}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, customContent: { ...cc, buttonText: e.target.value } }))}
                      className="w-full text-xs p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Action Button URL</label>
                    <input
                      type="text"
                      value={cc.buttonUrl || ''}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, customContent: { ...cc, buttonUrl: e.target.value } }))}
                      className="w-full text-xs p-2 border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Showcase Image URL</label>
                    <input
                      type="text"
                      value={cc.image || ''}
                      onChange={(e) => updateHomepage(hp => ({ ...hp, customContent: { ...cc, image: e.target.value } }))}
                      className="w-full text-xs p-2 border rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 14. NEWSLETTER SIGNUP EDITOR */}
      {(activeSectionFilter === 'all' || activeSectionFilter === 'newsletter') && (
        <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${expandedSection === 'newsletter' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">14. Newsletter & Promo Signup</h3>
              <p className="text-xs text-slate-500">Capture leads with customer coupon incentives.</p>
            </div>
          </div>

          {(() => {
            const nl = homepage.newsletterConfig || defaultNewsletterConfig;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Headline</label>
                  <input
                    type="text"
                    value={nl.title || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, newsletterConfig: { ...nl, title: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Button Text</label>
                  <input
                    type="text"
                    value={nl.buttonText || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, newsletterConfig: { ...nl, buttonText: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Subtitle / Incentives</label>
                  <input
                    type="text"
                    value={nl.subtitle || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, newsletterConfig: { ...nl, subtitle: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Disclaimer Text</label>
                  <input
                    type="text"
                    value={nl.disclaimerText || ''}
                    onChange={(e) => updateHomepage(hp => ({ ...hp, newsletterConfig: { ...nl, disclaimerText: e.target.value } }))}
                    className="w-full text-xs p-2 border rounded bg-white"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
