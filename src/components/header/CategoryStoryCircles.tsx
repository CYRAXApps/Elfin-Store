import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Grid, Flame } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export function CategoryStoryCircles() {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { categories, loading: categoriesLoading } = useCategories();
  const { products } = useProducts();
  const { settings } = useSiteSettings();

  // Scroll wipe state: detects when page is scrolled down to collapse logos and show text-only
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 35) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extract REAL categories strictly from database / products / CMS settings (NO fake categories)
  const displayCategories = useMemo(() => {
    // 1. Primary source: Active categories from Firestore database
    const dbCategories = (categories || []).filter((c) => c.active !== false);

    if (dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        id: c.id,
        name: c.name,
        link: `/shop?category=${encodeURIComponent(c.name)}`,
        image: c.image || '',
      }));
    }

    // 2. Secondary source: Categories configured in CMS Homepage Quick Categories
    const cmsCategories = settings?.homepage?.quickCategories;
    if (Array.isArray(cmsCategories) && cmsCategories.length > 0) {
      const activeCms = cmsCategories.filter((c) => c.enabled !== false);
      if (activeCms.length > 0) {
        return activeCms.map((c) => ({
          id: c.id,
          name: c.title,
          link: c.link || `/shop?category=${encodeURIComponent(c.title)}`,
          image: c.image || '',
        }));
      }
    }

    // 3. Fallback to unique categories present in published products
    const productCatSet = new Set<string>();
    const extracted: { id: string; name: string; link: string; image: string }[] = [];

    products.forEach((p) => {
      if (p.category && !productCatSet.has(p.category.trim())) {
        const catName = p.category.trim();
        productCatSet.add(catName);
        extracted.push({
          id: catName.toLowerCase().replace(/\s+/g, '-'),
          name: catName,
          link: `/shop?category=${encodeURIComponent(catName)}`,
          image: p.thumbnail || p.image || '',
        });
      }
    });

    return extracted;
  }, [categories, settings?.homepage?.quickCategories, products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // If there are no categories in the store, don't show empty bar
  if (displayCategories.length === 0 && !categoriesLoading) {
    return null;
  }

  return (
    <div
      className={`w-full bg-white/95 backdrop-blur-md border-b border-slate-100 relative group/stories select-none transition-all duration-300 ${
        isScrolled ? 'py-1.5 shadow-xs' : 'py-2.5 sm:py-3.5'
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl relative">
        {/* Left Scroll Button (Desktop) */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-blue-600 hover:scale-105 transition-all z-10 cursor-pointer opacity-0 group-hover/stories:opacity-100 ${
            isScrolled ? 'w-6 h-6' : 'w-8 h-8'
          }`}
          aria-label="Scroll categories left"
        >
          <ChevronLeft size={isScrolled ? 13 : 16} />
        </button>

        {/* Right Scroll Button (Desktop) */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-blue-600 hover:scale-105 transition-all z-10 cursor-pointer opacity-0 group-hover/stories:opacity-100 ${
            isScrolled ? 'w-6 h-6' : 'w-8 h-8'
          }`}
          aria-label="Scroll categories right"
        >
          <ChevronRight size={isScrolled ? 13 : 16} />
        </button>

        {/* Categories Carousel */}
        <div
          ref={scrollRef}
          className={`flex items-center overflow-x-auto no-scrollbar scroll-smooth px-1 transition-all duration-300 ${
            isScrolled ? 'gap-2 sm:gap-4' : 'gap-4 sm:gap-6'
          }`}
        >
          {/* Direct "All Deals" Item */}
          <Link
            to="/shop?sale=true"
            className={`flex items-center shrink-0 group/circle transition-all active:scale-95 ${
              isScrolled
                ? 'px-3 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold'
                : 'flex-col gap-1.5'
            }`}
          >
            {/* Logo container with smooth collapse wipe on scroll */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                isScrolled
                  ? 'max-h-0 max-w-0 opacity-0 scale-50 overflow-hidden pointer-events-none'
                  : 'max-h-16 max-w-16 opacity-100 scale-100'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-rose-200/80 bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all duration-200 group-hover/circle:scale-105 group-hover/circle:shadow-xs">
                <Flame size={20} className="transition-transform group-hover/circle:scale-110 fill-current text-rose-500" />
              </div>
            </div>

            <span
              className={`text-[11px] sm:text-xs font-semibold tracking-tight text-center truncate max-w-[76px] sm:max-w-[88px] transition-colors ${
                isScrolled ? 'text-rose-700' : 'text-slate-700 group-hover/circle:text-rose-600'
              }`}
            >
              All Deals
            </span>
          </Link>

          {/* Real Categories Loaded from Store */}
          {displayCategories.map((item) => {
            const isCurrentActive = location.pathname + location.search === item.link;
            const optimizedImage = item.image
              ? getOptimizedImageUrl(item.image, { width: 120, quality: 80 })
              : null;

            return (
              <Link
                key={item.id}
                to={item.link}
                className={`flex items-center shrink-0 group/circle transition-all active:scale-95 ${
                  isScrolled
                    ? `px-3 py-1 rounded-full text-xs font-semibold ${
                        isCurrentActive
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900'
                      }`
                    : 'flex-col gap-1.5'
                }`}
              >
                {/* Logo Container with wipe collapse animation */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isScrolled
                      ? 'max-h-0 max-w-0 opacity-0 scale-50 overflow-hidden pointer-events-none'
                      : 'max-h-16 max-w-16 opacity-100 scale-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center overflow-hidden transition-all duration-200 ${
                      isCurrentActive
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20 scale-105 shadow-xs'
                        : 'border-slate-200/90 bg-slate-50 hover:bg-white hover:border-blue-400 group-hover/circle:scale-105 group-hover/circle:shadow-xs'
                    }`}
                  >
                    {optimizedImage ? (
                      <img
                        src={optimizedImage}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover/circle:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Grid
                        size={20}
                        className="text-slate-600 group-hover/circle:text-blue-600 transition-colors"
                      />
                    )}
                  </div>
                </div>

                {/* Category Text Name */}
                <span
                  className={`text-[11px] sm:text-xs tracking-tight text-center truncate transition-colors ${
                    isScrolled
                      ? isCurrentActive
                        ? 'text-white font-bold'
                        : 'text-slate-700 group-hover/circle:text-blue-600 font-semibold'
                      : isCurrentActive
                      ? 'text-blue-600 font-bold max-w-[76px] sm:max-w-[88px]'
                      : 'text-slate-700 group-hover/circle:text-blue-600 font-semibold max-w-[76px] sm:max-w-[88px]'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
