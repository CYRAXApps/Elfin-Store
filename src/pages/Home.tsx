import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Truck, RotateCcw, CreditCard, ArrowRight, Zap, Star,
  Headphones, Award, Lock, Package, Clock, Phone, Heart, CheckCircle2,
  HelpCircle, Sparkles, ThumbsUp, BadgePercent, Gift, RefreshCw,
  Smartphone, Laptop, Watch, Cpu, Gamepad2, Quote, Check, Eye
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { CategoryCard } from '../components/CategoryCard';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useBrands } from '../hooks/useBrands';
import { subscribeBanners, getCachedBanners } from '../services/catalogCache';
import {
  useSiteSettings,
  defaultTrustBenefits,
  defaultHeroSlides,
  defaultHeroConfig,
  defaultQuickCategories,
  defaultPopularCategories,
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
  defaultSiteSettings,
} from '../context/SiteSettingsContext';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const ICON_MAP: Record<string, any> = {
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Headphones,
  Zap,
  Award,
  CreditCard,
  Lock,
  Package,
  Clock,
  Phone,
  Heart,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ThumbsUp,
  BadgePercent,
  Gift,
  RefreshCw,
  Smartphone,
  Laptop,
  Watch,
  Cpu,
  Gamepad2,
};

function renderDynamicIcon(iconName?: string, className = "w-5 h-5 sm:w-7 sm:h-7") {
  if (!iconName) return <Truck className={className} />;
  const IconComponent = ICON_MAP[iconName] || Truck;
  return <IconComponent className={className} />;
}

export function Home() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { products } = useProducts();
  const { categories } = useCategories();
  const { brands } = useBrands();

  // Real-time Firestore Banners Collection support (using global catalogCache)
  const [collectionBanners, setCollectionBanners] = useState<any[]>(() => getCachedBanners());

  useEffect(() => {
    return subscribeBanners((list) => {
      setCollectionBanners(list);
    });
  }, []);

  // Dynamic homepage section data from settings
  const homepage = settings?.homepage;

  const slides = useMemo(() => {
    const rawHeroSlides = Array.isArray(homepage?.heroSlides) && homepage.heroSlides.length > 0
      ? homepage.heroSlides
      : defaultHeroSlides;
    
    const activeHeroSlides = rawHeroSlides.filter(s => s.active !== false);

    // Active banners from the marketing banners collection (if any)
    const activeCollectionHeroBanners = collectionBanners
      .filter(b => b.isActive !== false && (b.position === 'hero' || b.position === 'top'))
      .map(b => ({
        id: b.id,
        desktopImage: b.imageUrl || b.desktopImage || undefined,
        mobileImage: b.mobileImageUrl || b.imageUrl || b.desktopImage || undefined,
        badge: b.tag || b.badge || 'EXCLUSIVE DEAL',
        title: b.title || '',
        highlight: b.highlight || '',
        description: b.description || b.subtitle || '',
        buttonText: b.buttonText || 'Shop Now',
        buttonUrl: b.buttonLink || b.buttonUrl || b.link || '/shop',
        secondaryButtonText: b.secondaryButtonText,
        secondaryButtonUrl: b.secondaryButtonUrl,
        active: true,
        order: b.displayOrder ?? b.order ?? 99
      }));

    const combinedSlides = activeHeroSlides.length > 0
      ? (activeCollectionHeroBanners.length > 0 ? [...activeHeroSlides, ...activeCollectionHeroBanners] : activeHeroSlides)
      : (activeCollectionHeroBanners.length > 0 ? activeCollectionHeroBanners : defaultHeroSlides);

    return combinedSlides.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [homepage?.heroSlides, collectionBanners]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Handle smooth swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diffX = touchStartX - touchEndX;
    const diffY = (touchStartY !== null && touchEndY !== null) ? Math.abs(touchStartY - touchEndY) : 0;

    // Trigger swipe if horizontal movement is dominant and > 35px
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
    setTouchStartY(null);
    setTouchEndY(null);
  };

  // If current slide is out of bounds after slide edits
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const trustBenefits = useMemo(() => {
    const raw = homepage?.trustBenefits || defaultTrustBenefits;
    return (raw || [])
      .filter(item => item.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [homepage?.trustBenefits]);

  const quickCategories = useMemo(() => {
    return (homepage?.quickCategories || defaultQuickCategories)
      .filter(item => item.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [homepage?.quickCategories]);

  const popularCategories = useMemo(() => {
    return (homepage?.popularCategories || defaultPopularCategories)
      .filter(item => item.enabled !== false)
      .sort((a, b) => ((a as any).order || 0) - ((b as any).order || 0));
  }, [homepage?.popularCategories]);

  const testimonials = useMemo(() => {
    return (homepage?.testimonials || defaultTestimonials)
      .filter(item => item.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [homepage?.testimonials]);

  const dealsConfig = homepage?.dealsConfig || defaultDealsConfig;
  const flashSaleConfig = homepage?.flashSaleConfig || defaultFlashSaleConfig;
  const newsletterConfig = homepage?.newsletterConfig || defaultNewsletterConfig;
  const customContent = homepage?.customContent || defaultCustomContent;
  const brandsConfig = homepage?.brandsConfig || defaultBrandsConfig;
  const featuredConfig = homepage?.featuredProductsConfig || defaultFeaturedProductsConfig;
  const bestSellersConfig = homepage?.bestSellersConfig || defaultBestSellersConfig;
  const newArrivalsConfig = homepage?.newArrivalsConfig || defaultNewArrivalsConfig;
  const recentlyViewedConfig = homepage?.recentlyViewedConfig || defaultRecentlyViewedConfig;

  // Products filtering with support for automatic & manual modes (manual, popular, newest, category-based)
  const publishedProducts = useMemo(() => {
    return products.filter(p => p.isPublished !== false);
  }, [products]);

  const { bestSellers, newArrivals, featured, recentlyViewed } = useMemo(() => {
    const getFilteredProducts = (
      config: typeof featuredConfig,
      defaultFallback: (list: typeof publishedProducts) => typeof publishedProducts
    ) => {
      let result = [...publishedProducts];
      const mode = config?.mode || 'default';

      if (mode === 'manual' && config?.selectedProductIds && config.selectedProductIds.length > 0) {
        const idMap = new Map(publishedProducts.map(p => [p.id, p]));
        result = config.selectedProductIds
          .map(id => idMap.get(id))
          .filter((p): p is typeof publishedProducts[0] => Boolean(p));
      } else if (mode === 'popular') {
        result = result.sort((a, b) => (b.reviewsCount || 0) * (b.rating || 1) - (a.reviewsCount || 0) * (a.rating || 1));
      } else if (mode === 'newest') {
        result = result.filter(p => p.isNewArrival).length > 0
          ? [...result.filter(p => p.isNewArrival), ...result.filter(p => !p.isNewArrival)]
          : result;
      } else if (mode === 'category' && config?.selectedCategory) {
        result = result.filter(p => p.category?.toLowerCase() === config.selectedCategory?.toLowerCase());
      } else {
        result = defaultFallback(result);
      }

      return result.slice(0, config?.limit || 4);
    };

    return {
      bestSellers: getFilteredProducts(bestSellersConfig, list => list.filter(p => p.isBestSeller)),
      newArrivals: getFilteredProducts(newArrivalsConfig, list => list.filter(p => p.isNewArrival)),
      featured: getFilteredProducts(featuredConfig, list => list),
      recentlyViewed: publishedProducts.slice(0, recentlyViewedConfig.limit || 4),
    };
  }, [publishedProducts, bestSellersConfig, newArrivalsConfig, featuredConfig, recentlyViewedConfig]);

  const homepageSections = homepage?.sections || defaultSiteSettings.homepage.sections;
  const sectionsOrder = (homepage?.sectionsOrder && homepage.sectionsOrder.length > 0)
    ? homepage.sectionsOrder
    : defaultSiteSettings.homepage.sectionsOrder;

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  const renderSectionByKey = (key: string) => {
    const secConfig = homepageSections[key] || { id: key, title: key, enabled: true, order: 0 };
    if (secConfig.enabled === false) return null;

    switch (key) {
      // 1. HERO SECTION
      case 'hero': {
        if (!slides || slides.length === 0) return null;

        return (
          <section key="hero" id="home-hero-section" className="container mx-auto px-3 sm:px-4 max-w-7xl pt-4 sm:pt-6 mb-4 sm:mb-6">
            <div 
              className="bg-slate-900 rounded-2xl sm:rounded-[2rem] overflow-hidden relative min-h-[300px] md:min-h-[460px] lg:min-h-[560px] flex items-center shadow-2xl group/hero"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="absolute inset-0 z-0">
                {slides.map((s, idx) => {
                  const rawImg = s.desktopImage || s.mobileImage;
                  if (!rawImg) return null;
                  const isFirst = idx === 0;
                  const optUrl = getOptimizedImageUrl(rawImg, { width: isFirst ? 1440 : 1200, quality: 85 });
                  if (!optUrl) return null;
                  return (
                    <img
                      key={s.id || idx}
                      src={optUrl}
                      alt={s.title || "Hero banner"}
                      loading={isFirst ? "eager" : "lazy"}
                      fetchPriority={isFirst ? "high" : "auto"}
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                        idx === currentSlide 
                          ? 'opacity-40 mix-blend-overlay scale-100 translate-x-0' 
                          : idx < currentSlide 
                            ? 'opacity-0 -translate-x-full scale-105 pointer-events-none' 
                            : 'opacity-0 translate-x-full scale-105 pointer-events-none'
                      }`}
                    />
                  );
                })}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
              </div>

              <div className="relative z-10 w-full max-w-2xl pt-6 pl-6 pr-6 pb-6 sm:px-8 sm:pb-8 sm:pt-4 md:px-12 md:pb-12 md:pt-8 grid">
                {slides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={`col-start-1 row-start-1 transition-all duration-700 ease-in-out ${
                      idx === currentSlide 
                        ? 'opacity-100 translate-x-0 pointer-events-auto z-10' 
                        : idx < currentSlide
                          ? 'opacity-0 -translate-x-8 pointer-events-none z-0'
                          : 'opacity-0 translate-x-8 pointer-events-none z-0'
                    }`}
                  >
                    <div>
                      {slide.badge && (
                        <div className="mb-3 sm:mb-4">
                          <span className="inline-block bg-blue-600 text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                            {slide.badge}
                          </span>
                        </div>
                      )}
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-3 sm:mb-6 tracking-tight">
                        {slide.title} <br/>
                        {slide.highlight && (
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            {slide.highlight}
                          </span>
                        )}
                      </h1>
                      {slide.description && (
                        <p className="text-slate-300 text-xs sm:text-sm md:text-xl mb-5 sm:mb-10 max-w-[280px] sm:max-w-lg leading-relaxed font-medium">
                          {slide.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 sm:gap-4">
                        {slide.buttonText && (
                          <Link
                            to={slide.buttonUrl || '/shop'}
                            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50 text-slate-900 px-5 sm:px-8 py-2.5 sm:py-4 rounded-full font-black text-xs sm:text-base transition-colors hover:scale-105 active:scale-95 duration-200"
                          >
                            {slide.buttonText} <ArrowRight size={16} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                          </Link>
                        )}
                        {slide.secondaryButtonText && (
                          <Link
                            to={slide.secondaryButtonUrl || '/shop?sale=true'}
                            className="inline-flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 backdrop-blur-sm text-white px-5 sm:px-8 py-2.5 sm:py-4 rounded-full font-bold text-xs sm:text-base border border-slate-700 transition-colors"
                          >
                            {slide.secondaryButtonText}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Slide Wipe Navigation Buttons */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                    className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all z-20 cursor-pointer opacity-0 group-hover/hero:opacity-100 hover:scale-110"
                    aria-label="Previous Slide"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                    className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all z-20 cursor-pointer opacity-0 group-hover/hero:opacity-100 hover:scale-110"
                    aria-label="Next Slide"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Carousel dots with active wipe progress indicator */}
              {slides.length > 1 && (
                <div className="absolute bottom-4 sm:bottom-8 left-6 sm:left-8 md:left-16 flex gap-2 sm:gap-3 z-20 items-center">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 relative overflow-hidden ${
                        idx === currentSlide 
                          ? 'w-10 bg-white shadow-xs' 
                          : 'w-2 bg-slate-500/60 hover:bg-slate-400'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      }

      // 2. TRUST & BENEFITS SECTION
      case 'trust_section': {
        if (settingsLoading) {
          return (
            <section key="trust_section" id="home-trust-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-100 animate-pulse">
                    <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-200 rounded w-2/3" />
                      <div className="h-2 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (trustBenefits.length === 0) return null;

        return (
          <section key="trust_section" id="home-trust-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className={`grid grid-cols-2 ${trustBenefits.length >= 4 ? 'lg:grid-cols-4' : trustBenefits.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3 sm:gap-6`}>
              {trustBenefits.map((item) => {
                const cardContent = (
                  <div className="flex items-center gap-2 sm:gap-4 bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all h-full">
                    <div className="bg-blue-50 p-2 sm:p-4 rounded-full text-blue-600 shrink-0">
                      {renderDynamicIcon(item.icon)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[11px] sm:text-sm text-slate-900 truncate">{item.title}</h4>
                      {item.description && (
                        <p className="text-[9px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );

                if (item.link && item.link.trim() !== '') {
                  const isExternal = item.link.startsWith('http://') || item.link.startsWith('https://');
                  if (isExternal) {
                    return (
                      <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                        {cardContent}
                      </a>
                    );
                  }
                  return (
                    <Link key={item.id} to={item.link} className="block h-full">
                      {cardContent}
                    </Link>
                  );
                }

                return <div key={item.id} className="h-full">{cardContent}</div>;
              })}
            </div>
          </section>
        );
      }

      // 3. QUICK CATEGORIES
      case 'quick_categories': {
        return (
          <section key="quick_categories" id="home-quick-categories-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {secConfig.title || 'Shop by Category'}
              </h2>
              <Link to="/shop?category=all" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                All Categories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {quickCategories.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
                {quickCategories.map((qc) => (
                  <Link
                    key={qc.id}
                    to={qc.link || '/shop'}
                    className="group bg-white p-2 sm:p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center text-center gap-2 sm:gap-3"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all overflow-hidden">
                      {(() => {
                        const optQc = getOptimizedImageUrl(qc.image, { width: 140, quality: 80 });
                        if (optQc) {
                          return (
                            <img 
                              src={optQc} 
                              alt={qc.title} 
                              loading="lazy"
                              decoding="async"
                              width={56}
                              height={56}
                              className="w-full h-full object-cover" 
                            />
                          );
                        }
                        return renderDynamicIcon(qc.icon || 'Smartphone', "w-5 h-5 sm:w-6 sm:h-6");
                      })()}
                    </div>
                    <span className="text-[10px] sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {qc.title}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-4 gap-4 sm:gap-6 snap-x hide-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="snap-start shrink-0">
                    <CategoryCard category={cat} />
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      // 4. DEALS / PROMOTIONS (2 CARDS)
      case 'deals': {
        return (
          <section key="deals" id="home-deals-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Card 1 */}
              <div className="bg-slate-900 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-12 relative overflow-hidden group min-h-[260px] sm:min-h-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-30 -mr-20 -mt-20 mix-blend-screen transition-opacity group-hover:opacity-50 duration-700"></div>
                <div className="relative z-10 w-full sm:w-2/3">
                  <span className="text-[10px] sm:text-xs font-black text-blue-400 tracking-widest uppercase mb-2 sm:mb-4 block">
                    {dealsConfig.card1Badge || 'Limited Time Offer'}
                  </span>
                  <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-2 sm:mb-4 tracking-tight">
                    {dealsConfig.card1Title || secConfig.title || 'Upgrade Your Workspace.'}
                  </h3>
                  <p className="text-slate-300 font-medium mb-4 sm:mb-8 text-xs sm:text-lg max-w-[200px] sm:max-w-none">
                    {dealsConfig.card1Subtitle || 'Up to 20% off on premium laptops and professional accessories.'}
                  </p>
                  <Link
                    to={dealsConfig.card1ButtonUrl || '/shop?category=Laptops'}
                    className="inline-flex items-center justify-center bg-white text-slate-900 px-5 sm:px-8 py-2.5 sm:py-4 rounded-full text-xs sm:text-sm font-black shadow-lg hover:bg-slate-100 hover:scale-105 transition-all"
                  >
                    {dealsConfig.card1ButtonText || 'Shop Laptops'}
                  </Link>
                </div>
                {(() => {
                  const card1Img = getOptimizedImageUrl(dealsConfig.card1Image, { width: 640, quality: 80 });
                  if (!card1Img) return null;
                  return (
                    <img
                      src={card1Img}
                      alt="Deals Card 1"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={300}
                      className="absolute -right-5 sm:-right-10 -bottom-5 sm:-bottom-10 w-48 sm:w-2/3 max-w-[400px] object-cover group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out opacity-90 sm:opacity-100"
                    />
                  );
                })()}
              </div>

              {/* Card 2 */}
              <div className="bg-blue-50 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 md:p-12 relative overflow-hidden group min-h-[260px] sm:min-h-0">
                <div className="relative z-10 w-full sm:w-2/3">
                  <span className="text-[10px] sm:text-xs font-black text-blue-600 tracking-widest uppercase mb-2 sm:mb-4 block">
                    {dealsConfig.card2Badge || 'New Generation'}
                  </span>
                  <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-2 sm:mb-4 tracking-tight">
                    {dealsConfig.card2Title || 'Smart Living Starts Here.'}
                  </h3>
                  <p className="text-slate-600 font-medium mb-4 sm:mb-8 text-xs sm:text-lg max-w-[200px] sm:max-w-none">
                    {dealsConfig.card2Subtitle || 'Make your home smarter with the latest connected devices.'}
                  </p>
                  <Link
                    to={dealsConfig.card2ButtonUrl || '/shop?category=Smartphones'}
                    className="inline-flex items-center justify-center bg-slate-900 text-white px-5 sm:px-8 py-2.5 sm:py-4 rounded-full text-xs sm:text-sm font-black shadow-lg hover:bg-blue-600 hover:scale-105 transition-all"
                  >
                    {dealsConfig.card2ButtonText || 'Shop Smart Devices'}
                  </Link>
                </div>
                {(() => {
                  const card2Img = getOptimizedImageUrl(dealsConfig.card2Image, { width: 640, quality: 80 });
                  if (!card2Img) return null;
                  return (
                    <img
                      src={card2Img}
                      alt="Deals Card 2"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={300}
                      className="absolute -right-5 sm:-right-10 -bottom-5 sm:-bottom-10 w-48 sm:w-2/3 max-w-[400px] object-cover group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700 ease-out opacity-90 sm:opacity-100"
                    />
                  );
                })()}
              </div>
            </div>
          </section>
        );
      }

      // 5. FEATURED PRODUCTS
      case 'featured': {
        if (!featured || featured.length === 0) return null;
        return (
          <section key="featured" id="home-featured-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {secConfig.title || featuredConfig.title || 'Top Rated Products'}
                </h2>
                {featuredConfig.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {featuredConfig.subtitle}
                  </p>
                )}
              </div>
              {featuredConfig.showViewAll !== false && (
                <Link to="/shop" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group hidden sm:flex">
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 min-[480px]:gap-3 sm:gap-4 lg:gap-5">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      }

      // 6. BEST SELLERS
      case 'best_sellers': {
        if (!bestSellers || bestSellers.length === 0) return null;
        return (
          <section key="best_sellers" id="home-bestsellers-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {secConfig.title || bestSellersConfig.title || 'Trending Now'}
                </h2>
                {bestSellersConfig.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {bestSellersConfig.subtitle}
                  </p>
                )}
              </div>
              {bestSellersConfig.showViewAll !== false && (
                <Link to="/shop?sort=bestselling" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group hidden sm:flex">
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 min-[480px]:gap-3 sm:gap-4 lg:gap-5">
              {bestSellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      }

      // 7. NEW ARRIVALS
      case 'new_arrivals': {
        if (!newArrivals || newArrivals.length === 0) return null;
        return (
          <section key="new_arrivals" id="home-newarrivals-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {secConfig.title || newArrivalsConfig.title || 'New Arrivals'}
                </h2>
                {newArrivalsConfig.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {newArrivalsConfig.subtitle}
                  </p>
                )}
              </div>
              {newArrivalsConfig.showViewAll !== false && (
                <Link to="/shop?new=true" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group hidden sm:flex">
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 min-[480px]:gap-3 sm:gap-4 lg:gap-5">
              {newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      }

      // 8. POPULAR CATEGORIES (TILES GRID)
      case 'popular_categories': {
        return (
          <section key="popular_categories" id="home-popularcategories-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {secConfig.title || 'Popular Categories'}
              </h2>
              <Link to="/shop?category=all" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                Browse All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {popularCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={cat.link || '/shop'}
                  className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 aspect-[4/3] bg-slate-900 block"
                >
                  <img
                    src={getOptimizedImageUrl(cat.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', { width: 500, quality: 80 })}
                    alt={cat.title}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover opacity-75 group-hover:scale-110 group-hover:opacity-60 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col justify-end">
                    <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                      {cat.title}
                    </h3>
                    {cat.subtitle && (
                      <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                        {cat.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      }

      // 9. PROMOTIONAL SECTIONS / FLASH SALE
      case 'flash_sale': {
        return (
          <section key="flash_sale" id="home-flashsale-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl sm:rounded-3xl p-1 md:p-1.5 shadow-xl">
              <div className="bg-white rounded-xl sm:rounded-[1.35rem] p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-16">
                <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                  {flashSaleConfig.badgeText && (
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-[10px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full uppercase tracking-wider mb-4 sm:mb-6">
                      <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500"></span>
                      </span>
                      {flashSaleConfig.badgeText}
                    </div>
                  )}
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-3 sm:mb-4 tracking-tight">
                    {flashSaleConfig.title || secConfig.title || 'Massive Discounts on Audio.'}
                  </h2>
                  <p className="text-slate-600 mb-6 sm:mb-8 max-w-md text-sm sm:text-lg font-medium">
                    {flashSaleConfig.description || "Don't miss out on these exclusive limited-time offers on top tier headphones and earbuds."}
                  </p>
                  <Link
                    to={flashSaleConfig.buttonUrl || '/shop?sale=true'}
                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black transition-colors shadow-lg shadow-red-500/30 hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    {flashSaleConfig.buttonText || 'VIEW ALL DEALS'} <ArrowRight size={20} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </div>

                <div className="md:w-1/2 flex justify-center items-center relative w-full h-[240px] sm:h-[300px] md:h-auto mt-4 sm:mt-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-50 to-transparent"></div>
                  {(() => {
                    const promoImg = getOptimizedImageUrl(flashSaleConfig.image || products[3]?.image || products[0]?.image, { width: 600, quality: 85 });
                    if (!promoImg) return null;
                    return (
                      <img
                        src={promoImg}
                        alt="Promo Product"
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={320}
                        className="max-w-full h-48 sm:h-64 md:h-80 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 relative z-10"
                      />
                    );
                  })()}
                  {flashSaleConfig.discountPercent && (
                    <div className="absolute top-2 sm:top-10 right-2 sm:right-10 bg-white rounded-full h-16 w-16 sm:h-24 sm:w-24 flex flex-col items-center justify-center shadow-2xl z-20 animate-bounce">
                      <span className="text-red-500 font-black text-lg sm:text-2xl leading-none">
                        {flashSaleConfig.discountPercent}
                      </span>
                      <span className="text-slate-500 font-bold text-[8px] sm:text-xs uppercase">
                        {flashSaleConfig.discountLabel || 'OFF'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      }

      // 10. BRANDS SECTION
      case 'brands': {
        const displayBrands = brandsConfig?.customBrands && brandsConfig.customBrands.length > 0
          ? brandsConfig.customBrands.filter(b => b.enabled !== false)
          : brands;

        return (
          <section key="brands" id="home-brands-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <h2 className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              {secConfig.title || brandsConfig.title || 'Trusted by Top Global Brands'}
            </h2>
            {brandsConfig.subtitle && (
              <p className="text-center text-xs text-slate-500 mb-8">
                {brandsConfig.subtitle}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-10">
              {displayBrands.map(brand => (
                <div
                  key={brand.id}
                  className="bg-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 font-black text-slate-400 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer text-lg sm:text-2xl grayscale hover:grayscale-0"
                >
                  {brand.name}
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 11. TESTIMONIALS
      case 'testimonials': {
        if (testimonials.length === 0) return null;
        return (
          <section key="testimonials" id="home-testimonials-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {secConfig.title || 'Customer Reviews & Feedback'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Real feedback from verified tech buyers nationwide
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm italic font-medium mb-6">
                      "{t.comment}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    {t.avatar ? (
                      <img src={t.avatar || undefined} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      // 12. RECENTLY VIEWED
      case 'recently_viewed': {
        return (
          <section key="recently_viewed" id="home-recentlyviewed-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {secConfig.title || recentlyViewedConfig.title || 'Recently Viewed'}
                </h2>
                {recentlyViewedConfig.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {recentlyViewedConfig.subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 min-[480px]:gap-3 sm:gap-4 lg:gap-5">
              {recentlyViewed.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      }

      // 13. CUSTOM CONTENT / WARRANTY BRAND STORY
      case 'custom_content': {
        return (
          <section key="custom_content" id="home-customcontent-section" className="container mx-auto px-3 sm:px-4 max-w-7xl">
            <div className={`${customContent.bgStyle || 'bg-slate-900 text-white'} rounded-2xl sm:rounded-[2rem] p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-xl`}>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
                    {customContent.title || secConfig.title || 'Certified Authenticity & Warranty Protection'}
                  </h2>
                  {customContent.subtitle && (
                    <p className="text-blue-400 font-semibold text-sm sm:text-base mb-4">
                      {customContent.subtitle}
                    </p>
                  )}
                  {customContent.content && (
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                      {customContent.content}
                    </p>
                  )}
                  {customContent.buttonText && (
                    <Link
                      to={customContent.buttonUrl || '/about'}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 sm:px-8 py-3 rounded-full font-bold text-sm transition-all"
                    >
                      {customContent.buttonText} <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
                {customContent.image && (
                  <div className="flex justify-center">
                    <img
                      src={customContent.image || undefined}
                      alt="Brand warranty showcase"
                      className="rounded-xl shadow-2xl max-h-80 object-cover w-full border border-slate-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      // 14. NEWSLETTER
      case 'newsletter': {
        return null;
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-10 sm:gap-12 md:gap-16 bg-slate-50 pt-0 pb-10" style={{ paddingTop: '0px', paddingBottom: '40px' }}>
      {sectionsOrder.map((sectionKey) => renderSectionByKey(sectionKey))}
    </div>
  );
}
