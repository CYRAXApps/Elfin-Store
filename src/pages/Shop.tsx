import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronDown, Search, X, Star, ShoppingCart, Zap, Heart, Check, ImageIcon, LayoutGrid, List, Smartphone, Laptop, Headphones, Watch, Cpu, Gamepad2, Tv, Camera } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductRatingBadge } from '../components/ProductRatingBadge';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useBrands } from '../hooks/useBrands';
import { useStores } from '../hooks/useStores';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useShopActions } from '../context/ShopContext';
import { Product } from '../types';
import { formatRating, formatReviewCount, getStarFloor } from '../utils/rating';

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewQty, setQuickViewQty] = useState(1);
  const [quickViewImage, setQuickViewImage] = useState<string | null>(null);

  const { products } = useProducts();
  const { categories } = useCategories();
  const { brands } = useBrands();
  const { stores } = useStores();
  const { settings } = useSiteSettings();
  const { addToCart, toggleWishlist, isInWishlist } = useShopActions();
  const navigate = useNavigate();

  const shopSettings = settings.shopPage;

  const defaultSort = shopSettings.defaultSorting || 'featured';
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedBrand = searchParams.get('brand') || 'all';
  const selectedStore = searchParams.get('store') || 'all';
  const sort = searchParams.get('sort') || defaultSort;
  const searchQuery = searchParams.get('q') || '';
  const priceRange = searchParams.get('price') || 'all';
  const minRating = Number(searchParams.get('rating') || 0);
  const inStockOnly = searchParams.get('inStock') === 'true';
  const onSaleOnly = searchParams.get('sale') === 'true';
  const currentPage = Number(searchParams.get('page') || 1);

  // View Mode: grid or list
  const viewModeParam = searchParams.get('view');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (viewModeParam === 'list' || viewModeParam === 'grid') return viewModeParam;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('electro_view_mode') : null;
      if (saved === 'list' || saved === 'grid') return saved;
    } catch (e) {}
    return 'grid';
  });

  useEffect(() => {
    if (viewModeParam === 'list' || viewModeParam === 'grid') {
      setViewMode(viewModeParam);
    }
  }, [viewModeParam]);

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('electro_view_mode', mode);
    } catch (e) {}
    const newParams = new URLSearchParams(searchParams);
    if (mode === 'grid') {
      newParams.delete('view');
    } else {
      newParams.set('view', mode);
    }
    setSearchParams(newParams);
  };

  // Local responsive search state with debounce to prevent sluggish typing
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Load more count state for 'loadMore' pagination
  const [visibleCount, setVisibleCount] = useState(shopSettings.productsPerPage || 12);

  // Update visible count when settings change
  useEffect(() => {
    setVisibleCount(shopSettings.productsPerPage || 12);
  }, [shopSettings.productsPerPage]);

  const setParam = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '' || value === '0' || value === 'false') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset page to 1 on filter changes
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Debounced sync for localSearch -> URL param 'q'
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setParam('q', localSearch);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch, searchQuery, setParam]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.isPublished !== false);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.brand && p.brand.toLowerCase().includes(q)) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedBrand !== 'all') {
      result = result.filter(p => p.brand === selectedBrand);
    }

    if (selectedStore !== 'all') {
      result = result.filter(p => (p.storeId || 'main-store') === selectedStore);
    }
    
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      result = result.filter(p => p.price >= min && (max ? p.price <= max : true));
    }

    if (minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= minRating);
    }

    if (inStockOnly) {
      result = result.filter(p => p.inStock);
    }

    if (onSaleOnly) {
      result = result.filter(p => (p.discountPercentage || 0) > 0 || (p.originalPrice && p.originalPrice > p.price));
    }

    switch (sort) {
      case 'price-low':
      case 'price-low-high':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
      case 'price-high-low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case 'bestselling':
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      default:
        // featured
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return result;
  }, [products, searchQuery, selectedCategory, selectedBrand, priceRange, minRating, inStockOnly, onSaleOnly, sort]);

  // Pagination calculations
  const perPage = shopSettings.productsPerPage || 12;
  const totalPages = Math.ceil(filteredProducts.length / perPage) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedProducts = useMemo(() => {
    if (shopSettings.paginationType === 'pagination') {
      const start = (validPage - 1) * perPage;
      return filteredProducts.slice(start, start + perPage);
    } else if (shopSettings.paginationType === 'loadMore' || shopSettings.paginationType === 'infinite') {
      return filteredProducts.slice(0, visibleCount);
    }
    return filteredProducts;
  }, [filteredProducts, shopSettings.paginationType, validPage, perPage, visibleCount]);

  // Infinite Scroll Observer
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (shopSettings.paginationType !== 'infinite') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
          setVisibleCount(prev => Math.min(prev + perPage, filteredProducts.length));
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [shopSettings.paginationType, visibleCount, filteredProducts.length, perPage]);

  // Dynamic responsive grid column class based on screen sizes:
  // - 2 to 3-Column for mobile (2 columns on standard phones, 3 columns on >=480px)
  // - 3 to 4-Column for tablet (3 columns on sm >=640px, 4 columns on md >=768px)
  // - 4 to 5-Column for desktop (4 columns on lg >=1024px, 5 columns on xl >=1280px)
  const gridColClass = useMemo(() => {
    const mobileCols = shopSettings.gridColumnsMobile;
    const tabletCols = shopSettings.gridColumnsTablet;
    const desktopCols = shopSettings.gridColumnsDesktop || shopSettings.gridColumns;

    // Mobile: 2 to 3 columns (default) or single column if explicitly set to 1
    const mClass = mobileCols === 1 
      ? 'grid-cols-1 min-[480px]:grid-cols-2' 
      : 'grid-cols-2 min-[480px]:grid-cols-3';

    // Tablet: 3 to 4 columns (default) or 2 columns if explicitly set
    const tClass = tabletCols === 2 
      ? 'sm:grid-cols-2 md:grid-cols-3' 
      : tabletCols === 3 
      ? 'sm:grid-cols-3 md:grid-cols-3' 
      : 'sm:grid-cols-3 md:grid-cols-4';

    // Desktop: 4 to 5 columns (default) or custom if specified
    const dClass = desktopCols === 2 
      ? 'lg:grid-cols-2 xl:grid-cols-2' 
      : desktopCols === 3 
      ? 'lg:grid-cols-3 xl:grid-cols-3' 
      : desktopCols === 6 
      ? 'lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
      : 'lg:grid-cols-4 xl:grid-cols-5';

    return `${mClass} ${tClass} ${dClass}`;
  }, [shopSettings.gridColumnsMobile, shopSettings.gridColumnsTablet, shopSettings.gridColumnsDesktop, shopSettings.gridColumns]);

  // Available sorting options
  const avSorting = shopSettings.availableSorting || {
    featured: true,
    newest: true,
    priceLowHigh: true,
    priceHighLow: true,
    rating: true,
    bestselling: true,
  };

  const handleOpenQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    setQuickViewQty(1);
    setQuickViewImage(product.image || null);
  }, []);

  // Helper to render icon based on category name if image is missing
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('phone') || name.includes('mobile')) return <Smartphone size={22} className="text-blue-600" />;
    if (name.includes('laptop') || name.includes('macbook') || name.includes('computer')) return <Laptop size={22} className="text-blue-600" />;
    if (name.includes('audio') || name.includes('headphone') || name.includes('bud') || name.includes('speaker')) return <Headphones size={22} className="text-blue-600" />;
    if (name.includes('watch') || name.includes('wearable')) return <Watch size={22} className="text-blue-600" />;
    if (name.includes('gaming') || name.includes('gear') || name.includes('console')) return <Gamepad2 size={22} className="text-blue-600" />;
    if (name.includes('tv') || name.includes('screen') || name.includes('display')) return <Tv size={22} className="text-blue-600" />;
    if (name.includes('camera') || name.includes('photo')) return <Camera size={22} className="text-blue-600" />;
    if (name.includes('access') || name.includes('cable') || name.includes('charger')) return <Cpu size={22} className="text-blue-600" />;
    return <ImageIcon size={22} className="text-blue-600" />;
  };

  // Active categories from existing database/system
  const activeCategories = useMemo(() => {
    return categories.filter(c => c.active !== false);
  }, [categories]);

  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-7xl pt-4 pb-6 sm:pb-8">
      {/* 1. Breadcrumb & Page Title */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <nav className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              {selectedCategory !== 'all' ? selectedCategory : 'Shop Catalog'}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {selectedCategory !== 'all' ? selectedCategory : 'All Products'}
          </h1>
        </div>

        {/* Search Bar if enabled in CMS */}
        {shopSettings.enableSearch !== false && (
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search catalog..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 shadow-2xs"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setParam('q', '');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Horizontal Category Navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 pt-1 scroll-smooth hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          {/* "All Categories" option */}
          <button
            onClick={() => setParam('category', 'all')}
            className={`group shrink-0 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-50 border-blue-600 shadow-xs ring-1 ring-blue-600 text-blue-700'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 shadow-2xs'
            }`}
          >
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
            }`}>
              <LayoutGrid size={18} />
            </div>
            <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
              All Categories
            </span>
          </button>

          {/* Database Categories */}
          {activeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setParam('category', cat.name)}
                className={`group shrink-0 flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 shadow-xs ring-1 ring-blue-600 text-blue-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 shadow-2xs'
                }`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 overflow-hidden transition-colors ${
                  isSelected
                    ? 'bg-blue-100'
                    : 'bg-slate-100 group-hover:bg-slate-200/70'
                }`}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        // Fallback to icon placeholder if image fails to load
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-blue-600 font-bold text-xs">#</span>';
                        }
                      }}
                    />
                  ) : (
                    getCategoryIcon(cat.name)
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle & Sort */}
        <div className="lg:hidden flex flex-wrap justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-2xs border border-slate-200 gap-2">
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase cursor-pointer"
          >
            <Filter size={16} className="text-blue-600" />
            Filters
          </button>

          {/* Mobile View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => handleToggleViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => handleToggleViewMode('list')}
              aria-label="List view"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List size={15} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <select 
              value={sort} 
              onChange={(e) => setParam('sort', e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-700 outline-none cursor-pointer"
            >
              {avSorting.featured !== false && <option value="featured">Featured</option>}
              {avSorting.newest !== false && <option value="newest">Newest</option>}
              {avSorting.priceLowHigh !== false && <option value="price-low">Price: Low-High</option>}
              {avSorting.priceHighLow !== false && <option value="price-high">Price: High-Low</option>}
              {avSorting.rating !== false && <option value="rating">Top Rated</option>}
              {avSorting.bestselling !== false && <option value="bestselling">Best Sellers</option>}
            </select>
          </div>
        </div>

        {/* Sidebar Filters */}
        <aside className={`w-full lg:w-64 shrink-0 space-y-6 ${isMobileFilterOpen ? 'block bg-white p-6 rounded-2xl border border-slate-200 shadow-lg' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Refine By</span>
            {(selectedCategory !== 'all' || selectedBrand !== 'all' || priceRange !== 'all' || minRating > 0 || inStockOnly || onSaleOnly || searchQuery) && (
              <button
                onClick={() => setSearchParams({})}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. Category Filter */}
          {shopSettings.enableCategoryFilter !== false && (
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <ul className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                <li>
                  <button 
                    onClick={() => setParam('category', 'all')}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      selectedCategory === 'all' 
                        ? 'bg-blue-50 text-blue-600 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Categories</span>
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => setParam('category', cat.name)}
                      className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        selectedCategory === cat.name 
                          ? 'bg-blue-50 text-blue-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Brand Filter */}
          {shopSettings.enableBrandFilter !== false && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
                Brands
              </h3>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                <li>
                  <button 
                    onClick={() => setParam('brand', 'all')}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      selectedBrand === 'all' 
                        ? 'bg-blue-50 text-blue-600 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Brands</span>
                  </button>
                </li>
                {brands.map(brand => (
                  <li key={brand.id}>
                    <button 
                      onClick={() => setParam('brand', brand.name)}
                      className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                        selectedBrand === brand.name 
                          ? 'bg-blue-50 text-blue-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{brand.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2b. Store / Seller Filter */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
              Store / Seller
            </h3>
            <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              <li>
                <button 
                  onClick={() => setParam('store', 'all')}
                  className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    selectedStore === 'all' 
                      ? 'bg-blue-50 text-blue-600 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Stores</span>
                </button>
              </li>
              {stores.map(st => (
                <li key={st.storeId}>
                  <button 
                    onClick={() => setParam('store', st.storeId)}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      selectedStore === st.storeId 
                        ? 'bg-blue-50 text-blue-600 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{st.storeName}</span>
                    {st.storeId === 'main-store' && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">Official</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Price Filter */}
          {shopSettings.enablePriceFilter !== false && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
                Price Range
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: 'All Prices', value: 'all' },
                  { label: 'Under ₹2,000', value: '0-2000' },
                  { label: '₹2,000 - ₹10,000', value: '2000-10000' },
                  { label: '₹10,000 - ₹30,000', value: '10000-30000' },
                  { label: '₹30,000 - ₹75,000', value: '30000-75000' },
                  { label: 'Over ₹75,000', value: '75000-999999' },
                ].map(range => (
                  <button 
                    key={range.value}
                    onClick={() => setParam('price', range.value)}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                      priceRange === range.value 
                        ? 'bg-blue-50 text-blue-600 font-bold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Rating Filter */}
          {shopSettings.enableRatingFilter !== false && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">
                Customer Rating
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: '4★ & above', value: '4' },
                  { label: '3★ & above', value: '3' },
                  { label: 'All Ratings', value: '0' },
                ].map(r => (
                  <button
                    key={r.value}
                    onClick={() => setParam('rating', r.value)}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      minRating.toString() === r.value
                        ? 'bg-blue-50 text-blue-600 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Availability & Special Offers */}
          {shopSettings.enableAvailabilityFilter !== false && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                Availability & Offers
              </h3>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={inStockOnly}
                  onChange={(e) => setParam('inStock', e.target.checked ? 'true' : 'false')}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300" 
                />
                <span className="text-xs text-slate-700 font-medium">In Stock Only</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={onSaleOnly}
                  onChange={(e) => setParam('sale', e.target.checked ? 'true' : 'false')}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300" 
                />
                <span className="text-xs text-slate-700 font-medium">On Sale / Discounted</span>
              </label>
            </div>
          )}
        </aside>

        {/* Product Grid & Controls */}
        <div className="flex-grow">
          {/* Desktop Toolbar */}
          <div className="hidden lg:flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-2xs border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                Products
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found)
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => handleToggleViewMode('grid')}
                  title="Grid View"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => handleToggleViewMode('list')}
                  title="List View"
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List size={14} />
                  <span>List</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Sort by:</span>
                <div className="relative">
                  <select 
                    value={sort}
                    onChange={(e) => setParam('sort', e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 py-1.5 pl-3 pr-8 rounded-lg outline-none focus:border-blue-500 text-xs font-bold cursor-pointer"
                  >
                    {avSorting.featured !== false && <option value="featured">Featured First</option>}
                    {avSorting.newest !== false && <option value="newest">Newest Arrivals</option>}
                    {avSorting.priceLowHigh !== false && <option value="price-low">Price: Low to High</option>}
                    {avSorting.priceHighLow !== false && <option value="price-high">Price: High to Low</option>}
                    {avSorting.rating !== false && <option value="rating">Highest Rated</option>}
                    {avSorting.bestselling !== false && <option value="bestselling">Best Sellers</option>}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid / List */}
          {displayedProducts.length > 0 ? (
            viewMode === 'list' ? (
              <div className="flex flex-col gap-3.5 sm:gap-4">
                {displayedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    layout="list"
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            ) : (
              <div className={`grid ${gridColClass} gap-2.5 min-[480px]:gap-3 sm:gap-4 lg:gap-5`}>
                {displayedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    layout="grid"
                    onQuickView={handleOpenQuickView}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs flex flex-col items-center">
              <Filter size={44} className="text-slate-300 mb-3" />
              <h3 className="text-lg font-black text-slate-900 mb-1">No products match your filters</h3>
              <p className="text-slate-500 text-xs mb-5">Try resetting search filters or expanding your price range.</p>
              <button 
                onClick={() => setSearchParams({})}
                className="bg-slate-950 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredProducts.length > perPage && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4">
              {/* Standard Page Numbers Pagination */}
              {shopSettings.paginationType === 'pagination' && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={validPage <= 1}
                    onClick={() => setParam('page', (validPage - 1).toString())}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setParam('page', pageNum.toString())}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          validPage === pageNum
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={validPage >= totalPages}
                    onClick={() => setParam('page', (validPage + 1).toString())}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Load More Button */}
              {shopSettings.paginationType === 'loadMore' && visibleCount < filteredProducts.length && (
                <div className="text-center">
                  <button
                    onClick={() => setVisibleCount(prev => Math.min(prev + perPage, filteredProducts.length))}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Load More Products
                  </button>
                </div>
              )}

              {/* Infinite Scroll Sentinel */}
              {shopSettings.paginationType === 'infinite' && (
                <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
                  {visibleCount < filteredProducts.length ? 'Loading more products...' : 'All products loaded.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="grid md:grid-cols-2 gap-6 items-start mt-2">
              {/* Product Image */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  {quickViewImage ? (
                    <img
                      src={quickViewImage}
                      alt={quickViewProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-400" />
                  )}

                  {quickViewProduct.rating != null && Number(quickViewProduct.rating) > 0 && (
                    <div 
                      className="absolute bottom-2 left-2 z-20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewProduct(null);
                        navigate(`/product/${quickViewProduct.id}?tab=reviews#product-tabs-section`);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <ProductRatingBadge 
                        rating={quickViewProduct.rating} 
                        reviewsCount={quickViewProduct.reviewsCount} 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(null);
                          navigate(`/product/${quickViewProduct.id}?tab=reviews#product-tabs-section`);
                        }}
                        title="Click to view reviews"
                      />
                    </div>
                  )}
                </div>

                {quickViewProduct.images && quickViewProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {quickViewProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuickViewImage(img)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${quickViewImage === img ? 'border-blue-600' : 'border-slate-200'}`}
                      >
                        <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                  {quickViewProduct.brand || quickViewProduct.category}
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
                  {quickViewProduct.name}
                </h2>

                <div className="flex items-center gap-2 mb-3">
                  {formatReviewCount(quickViewProduct.reviewsCount) > 0 ? (
                    <span className="text-xs text-slate-500 font-medium">{formatReviewCount(quickViewProduct.reviewsCount)} verified reviews</span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No reviews yet</span>
                  )}
                  {quickViewProduct.inStock ? (
                    <span className="ml-auto text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">IN STOCK</span>
                  ) : (
                    <span className="ml-auto text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded">OUT OF STOCK</span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{Number(quickViewProduct.price || 0).toLocaleString('en-IN')}
                  </span>
                  {Boolean(quickViewProduct.originalPrice && quickViewProduct.originalPrice > quickViewProduct.price) && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{Number(quickViewProduct.originalPrice || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 mb-5 leading-relaxed">
                  {quickViewProduct.description}
                </p>

                {/* Quantity & Actions */}
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => setQuickViewQty(Math.max(1, quickViewQty - 1))}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        -
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-slate-900">{quickViewQty}</span>
                      <button
                        onClick={() => setQuickViewQty(quickViewQty + 1)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => toggleWishlist(quickViewProduct)}
                      className={`p-2 rounded-lg border flex items-center justify-center ${
                        isInWishlist(quickViewProduct.id)
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-slate-200 text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Heart size={16} className={isInWishlist(quickViewProduct.id) ? "fill-current" : ""} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        addToCart(quickViewProduct, quickViewQty);
                        setQuickViewProduct(null);
                      }}
                      disabled={!quickViewProduct.inStock}
                      data-action="add-to-cart"
                      style={{ borderRadius: '12px' }}
                      className="add-to-cart-btn bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-[12px] text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <ShoppingCart size={14} /> Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        addToCart(quickViewProduct, quickViewQty);
                        setQuickViewProduct(null);
                        navigate('/checkout');
                      }}
                      disabled={!quickViewProduct.inStock}
                      style={{ borderRadius: '12px' }}
                      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-[12px] text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Zap size={14} /> Buy Now
                    </button>
                  </div>

                  <Link
                    to={`/product/${quickViewProduct.id}`}
                    onClick={() => setQuickViewProduct(null)}
                    className="block text-center text-xs font-bold text-blue-600 hover:text-blue-700 pt-1"
                  >
                    View Full Product Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

