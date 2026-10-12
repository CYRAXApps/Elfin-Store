import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Clock, Sparkles, ChevronRight, Star } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../types';

interface HeaderSearchAutocompleteProps {
  isMobile?: boolean;
  onSearchSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

const TRENDING_SEARCHES = [
  'iPhone 16 Pro Max',
  'Noise Cancelling Headphones',
  'MacBook Pro M3',
  'Smart OLED 4K TV',
  'Gaming Laptop RTX 4070',
  'Wireless Earbuds Pro',
];

const CATEGORIES_LIST = [
  { label: 'All', value: 'all' },
  { label: 'Phones', value: 'Smartphones' },
  { label: 'Laptops', value: 'Laptops' },
  { label: 'Audio', value: 'Audio' },
  { label: 'Watches', value: 'Smart Watches' },
  { label: 'Accessories', value: 'Accessories' },
];

export function HeaderSearchAutocomplete({
  isMobile = false,
  onSearchSubmit,
  placeholder = 'Search products, brands, models...',
  className = '',
}: HeaderSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('electro_recent_searches');
      return saved ? JSON.parse(saved) : ['iPhone', 'MacBook', 'Earbuds'];
    } catch {
      return ['iPhone', 'MacBook', 'Earbuds'];
    }
  });

  const { products } = useProducts();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('electro_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem('electro_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('electro_recent_searches');
    } catch {}
  };

  const filteredProducts = React.useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    return products
      .filter((product) => {
        if (selectedCategory !== 'all') {
          const prodCat = (product.category || '').toLowerCase();
          if (!prodCat.includes(selectedCategory.toLowerCase())) {
            return false;
          }
        }
        const titleMatch = (product.name || '').toLowerCase().includes(cleanQuery);
        const descMatch = (product.description || '').toLowerCase().includes(cleanQuery);
        const brandMatch = (product.brand || '').toLowerCase().includes(cleanQuery);
        const catMatch = (product.category || '').toLowerCase().includes(cleanQuery);
        return titleMatch || descMatch || brandMatch || catMatch;
      })
      .slice(0, 5);
  }, [products, query, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = (searchTerm: string, categoryOverride?: string) => {
    const cat = categoryOverride !== undefined ? categoryOverride : selectedCategory;
    const trimmed = searchTerm.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      let url = `/shop?q=${encodeURIComponent(trimmed)}`;
      if (cat !== 'all') {
        url += `&category=${encodeURIComponent(cat)}`;
      }
      navigate(url);
    } else if (cat !== 'all') {
      navigate(`/shop?category=${encodeURIComponent(cat)}`);
    } else {
      navigate('/shop');
    }
    setIsOpen(false);
    if (onSearchSubmit) onSearchSubmit();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
      navigate(`/product/${filteredProducts[selectedIndex].id}`);
      setIsOpen(false);
      if (onSearchSubmit) onSearchSubmit();
    } else {
      executeSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Sleek Search Input */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-center w-full bg-slate-100 hover:bg-slate-100/90 focus-within:bg-white rounded-xl border border-transparent focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15 transition-all duration-200 ${
          isOpen ? 'bg-white border-blue-600 ring-2 ring-blue-600/15 shadow-sm' : ''
        }`}
      >
        {/* Category filter */}
        {!isMobile && (
          <div className="relative shrink-0 pl-3 pr-1 py-1 border-r border-slate-200/80">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (query.trim()) setIsOpen(true);
              }}
              className="appearance-none bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-4 hover:text-blue-600"
            >
              {CATEGORIES_LIST.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 pointer-events-none">▼</span>
          </div>
        )}

        {/* Input text */}
        <div className="relative flex-1 flex items-center pl-3">
          <Search size={16} className="text-slate-400 shrink-0 mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none font-medium truncate"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 mr-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action button */}
        <button
          type="submit"
          className="px-3 sm:px-4 py-2 sm:py-2.5 text-blue-600 hover:text-blue-700 font-bold text-xs shrink-0 cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in duration-100 max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
          
          {/* Live matches */}
          {query.trim().length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Products</span>
                <span>{filteredProducts.length} results</span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="space-y-1">
                  {filteredProducts.map((prod, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          saveRecentSearch(prod.name);
                          navigate(`/product/${prod.id}`);
                          setIsOpen(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/60 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          {prod.images?.[0] || prod.image ? (
                            <img
                              src={prod.images?.[0] || prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Sparkles size={16} className="text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                            {prod.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="font-bold text-blue-600">
                              ₹{Number(prod.price).toLocaleString('en-IN')}
                            </span>
                            {prod.rating && (
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                                <Star size={10} className="fill-current" /> {prod.rating}
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-slate-500">
                  No direct matches for "{query}".
                </div>
              )}

              <button
                type="button"
                onClick={() => executeSearch(query)}
                className="w-full mt-2 py-1.5 text-center text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                View all results for "{query}" &rarr;
              </button>
            </div>
          )}

          {/* Recent */}
          {recentSearches.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Recent
                </span>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer lowercase"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      executeSearch(term);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <span className="truncate max-w-[130px]">{term}</span>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(term, e)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          <div className="p-3 bg-slate-50/50">
            <div className="flex items-center gap-1 px-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <TrendingUp size={11} className="text-blue-600" /> Trending
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SEARCHES.map((trend) => (
                <button
                  key={trend}
                  type="button"
                  onClick={() => {
                    setQuery(trend);
                    executeSearch(trend);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-400 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Sparkles size={10} className="text-amber-500" />
                  <span>{trend}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
