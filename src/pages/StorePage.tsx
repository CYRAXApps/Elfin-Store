import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, Search, Filter, SlidersHorizontal, MapPin, CheckCircle2, ArrowLeft, Package, Sparkles, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useStores } from '../hooks/useStores';
import { ProductCard } from '../components/ProductCard';
import { getCachedStore } from '../services/catalogCache';

export function StorePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const { stores, loading: storesLoading } = useStores();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Resolve store details
  const targetStoreId = storeId || 'main-store';
  const storeInfo = useMemo(() => {
    return getCachedStore(targetStoreId) || stores.find(s => s.storeId === targetStoreId);
  }, [targetStoreId, stores]);

  // Security check: If store not found or partner store is not ACTIVE
  const isStorePubliclyActive = useMemo(() => {
    if (targetStoreId === 'main-store') return true;
    if (!storeInfo) return false;
    return storeInfo.status === 'ACTIVE';
  }, [targetStoreId, storeInfo]);

  // Filter store products
  const storeProducts = useMemo(() => {
    if (!isStorePubliclyActive) return [];
    return products.filter(p => (p.storeId || 'main-store') === targetStoreId);
  }, [products, targetStoreId, isStorePubliclyActive]);

  // Categories present in this store's products
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    storeProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [storeProducts]);

  // Filtered & Sorted store products
  const filteredProducts = useMemo(() => {
    let result = storeProducts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [storeProducts, searchQuery, selectedCategory, sortBy]);

  // Store Unavailable State
  if (!storesLoading && (!storeInfo || !isStorePubliclyActive)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Store Unavailable</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          The partner store you are looking for (<code className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{targetStoreId}</code>) is currently inactive or does not exist.
        </p>
        <Link
          to="/shop"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
        >
          <ArrowLeft size={16} /> Return to Storefront
        </Link>
      </div>
    );
  }

  const storeDisplayName = storeInfo?.storeName || (targetStoreId === 'main-store' ? 'ELECTRO STORE' : targetStoreId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-slate-900">Shop</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate">{storeDisplayName}</span>
      </div>

      {/* Store Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl sm:text-3xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0">
              {storeDisplayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified Seller
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {storeProducts.length} Products
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{storeDisplayName}</h1>
              {storeInfo?.description && (
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl line-clamp-2">
                  {storeInfo.description}
                </p>
              )}
              {(storeInfo?.city || storeInfo?.state) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span>{[storeInfo?.city, storeInfo?.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center shrink-0 min-w-[140px]">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Seller Rating</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">4.9 ★</div>
            <span className="text-[10px] text-slate-400">Trusted Store</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search products in ${storeDisplayName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          >
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid / List */}
      {productsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-slate-100 rounded-2xl aspect-3/4 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Package size={40} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Products Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' 
              ? 'Try adjusting your search or category filters to find products from this store.'
              : `This store has no active products listed at the moment.`}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="text-xs text-slate-500 font-bold mb-3">
            Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} from {storeDisplayName}
          </div>
          {viewMode === 'list' ? (
            <div className="flex flex-col gap-3.5 sm:gap-4">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} layout="list" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} layout="grid" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
