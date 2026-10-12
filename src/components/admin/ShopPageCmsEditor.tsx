import React from 'react';
import { ShoppingBag, Grid, SlidersHorizontal, Eye, Tag, Heart, Search, CheckSquare, Layers, Sparkles, Monitor, Tablet, Smartphone } from 'lucide-react';
import { SiteSettings } from '../../context/SiteSettingsContext';

interface ShopPageCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function ShopPageCmsEditor({ formState, setFormState }: ShopPageCmsEditorProps) {
  const shop = formState.shopPage || {
    productsPerPage: 12,
    defaultSorting: 'featured',
    availableSorting: {
      featured: true,
      newest: true,
      priceLow: true,
      priceHigh: true,
      rating: true,
      bestselling: true,
    },
    enableBrandFilter: true,
    enableCategoryFilter: true,
    enablePriceFilter: true,
    enableAvailabilityFilter: true,
    enableRatingFilter: true,
    enableSearch: true,
    gridColumns: 3,
    cardLayout: 'standard',
    paginationType: 'pagination',
    showBadges: true,
    showDiscountBadge: true,
    showNewBadge: true,
    showBestSellerBadge: true,
    showStockStatus: true,
    showRating: true,
    showWishlistBtn: true,
    showQuickView: true,
  };

  const updateShop = (updates: Partial<typeof shop>) => {
    setFormState(prev => ({
      ...prev,
      shopPage: {
        ...prev.shopPage,
        ...updates
      }
    }));
  };

  const updateSortOption = (key: string, enabled: boolean) => {
    setFormState(prev => ({
      ...prev,
      shopPage: {
        ...prev.shopPage,
        availableSorting: {
          ...(prev.shopPage.availableSorting || {
            featured: true,
            newest: true,
            priceLow: true,
            priceHigh: true,
            rating: true,
            bestselling: true,
          }),
          [key]: enabled
        }
      }
    }));
  };

  const availableSorting = shop.availableSorting || {
    featured: true,
    newest: true,
    priceLow: true,
    priceHigh: true,
    rating: true,
    bestselling: true,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="text-blue-600" size={20} />
          Shop Catalog & Product Grid CMS Control
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure product listing columns, pagination type, filter sidebar modules, default sorting, and product card feature toggles.
        </p>
      </div>

      {/* Grid Layout & Pagination Settings */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Grid size={15} className="text-blue-600" /> Responsive Grid Columns by Screen Size
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">Adapts automatically per device</span>
        </div>

        {/* Device Column Grid Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          {/* Desktop */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Monitor size={15} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900">Desktop Screens</label>
                <span className="text-[10px] text-slate-500">Laptop & Large Monitors (≥1024px)</span>
              </div>
            </div>
            <select
              value={shop.gridColumnsDesktop || shop.gridColumns || 4}
              onChange={(e) => updateShop({ 
                gridColumnsDesktop: Number(e.target.value),
                gridColumns: Number(e.target.value) 
              })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4 to 5 Columns (Auto: 4 on Laptops, 5 on Wide Displays - Default)</option>
              <option value={3}>3 Columns (Spacious / High Detail)</option>
              <option value={2}>2 Columns (Large Cards)</option>
              <option value={6}>6 Columns (Ultra Wide Displays)</option>
            </select>
          </div>

          {/* Tablet */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                <Tablet size={15} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900">Tablet Screens</label>
                <span className="text-[10px] text-slate-500">iPad & Tablets (640px – 1023px)</span>
              </div>
            </div>
            <select
              value={shop.gridColumnsTablet || 3}
              onChange={(e) => updateShop({ gridColumnsTablet: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 to 4 Columns (Auto: 3 on Small Tablets, 4 on Standard Tablets - Default)</option>
              <option value={2}>2 Columns (Comfortable Reading)</option>
            </select>
          </div>

          {/* Mobile */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                <Smartphone size={15} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900">Mobile Screens</label>
                <span className="text-[10px] text-slate-500">Smartphones (&lt;640px)</span>
              </div>
            </div>
            <select
              value={shop.gridColumnsMobile || 2}
              onChange={(e) => updateShop({ gridColumnsMobile: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 to 3 Columns (Auto: 2 on Phones, 3 on Large Phones - Default)</option>
              <option value={1}>1 Column (Full-Width Large Cards)</option>
            </select>
          </div>
        </div>

        {/* Pagination & Sorting controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Products Per Page</label>
            <select
              value={shop.productsPerPage || 12}
              onChange={(e) => updateShop({ productsPerPage: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 Products</option>
              <option value={8}>8 Products</option>
              <option value={12}>12 Products (Recommended)</option>
              <option value={16}>16 Products</option>
              <option value={24}>24 Products</option>
              <option value={36}>36 Products</option>
              <option value={48}>48 Products</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pagination / Loading Style</label>
            <select
              value={shop.paginationType || 'pagination'}
              onChange={(e) => updateShop({ paginationType: e.target.value as any })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pagination">Numbered Page Pagination (1, 2, 3...)</option>
              <option value="loadMore">"Load More Products" Button</option>
              <option value="infinite">Infinite Scroll on Scroll-to-Bottom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Default Initial Sort</label>
            <select
              value={shop.defaultSorting || 'featured'}
              onChange={(e) => updateShop({ defaultSorting: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Customer Ratings</option>
              <option value="bestselling">Best Selling</option>
            </select>
          </div>
        </div>
      </div>

      {/* Available Sorting Options */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-blue-600" /> Available Sorting Options for Customers
          </h3>
          <span className="text-[11px] text-slate-500">Check options customers can pick from the dropdown</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {[
            { key: 'featured', label: 'Featured' },
            { key: 'newest', label: 'Newest' },
            { key: 'priceLow', label: 'Price: Low-High' },
            { key: 'priceHigh', label: 'Price: High-Low' },
            { key: 'rating', label: 'Top Rated' },
            { key: 'bestselling', label: 'Best Selling' },
          ].map((s) => (
            <label
              key={s.key}
              className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                (availableSorting as any)[s.key] !== false
                  ? 'bg-blue-50/50 border-blue-200 text-blue-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
              }`}
            >
              <input
                type="checkbox"
                checked={(availableSorting as any)[s.key] !== false}
                onChange={(e) => updateSortOption(s.key, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <span className="text-xs">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter Sidebars & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Layers size={15} className="text-blue-600" /> Sidebar Filter Modules & Search
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'enableCategoryFilter', label: 'Category Filter Sidebar', desc: 'Allows filtering products by category' },
            { key: 'enableBrandFilter', label: 'Brand Filter Sidebar', desc: 'Allows filtering by brand (Apple, Samsung, Sony, etc.)' },
            { key: 'enablePriceFilter', label: 'Price Range Filter', desc: 'Allows filtering by preset price tiers in local currency' },
            { key: 'enableRatingFilter', label: 'Customer Rating Filter', desc: 'Filter products with 4+ stars and verified reviews' },
            { key: 'enableAvailabilityFilter', label: 'In-Stock / Availability Filter', desc: 'Allows filtering items in-stock only vs all products' },
            { key: 'enableSearch', label: 'Shop Search Input Bar', desc: 'Displays direct search filtering bar on top of the catalog' },
          ].map((item) => (
            <label
              key={item.key}
              className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                (shop as any)[item.key] !== false
                  ? 'bg-slate-50 border-slate-300 shadow-2xs'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="pr-3">
                <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean((shop as any)[item.key] !== false)}
                onChange={(e) => updateShop({ [item.key]: e.target.checked } as any)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Product Card Badges & Interactive Features */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Tag size={15} className="text-blue-600" /> Product Card Badges & Action Buttons
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'showBadges', label: 'Master Badges Toggle', desc: 'Global switch for product tag badges' },
            { key: 'showDiscountBadge', label: 'Discount % OFF Badge', desc: 'Shows percentage discount badge (e.g. 15% OFF)' },
            { key: 'showNewBadge', label: 'New Arrival Badge', desc: 'Shows "NEW" badge on recently launched products' },
            { key: 'showBestSellerBadge', label: 'Best Seller Badge', desc: 'Shows "BEST SELLER" badge on high volume items' },
            { key: 'showStockStatus', label: 'Stock Status Label', desc: 'Shows "IN STOCK" or "OUT OF STOCK" indicator' },
            { key: 'showRating', label: 'Star Ratings & Reviews', desc: 'Displays rating stars and verified review count' },
            { key: 'showWishlistBtn', label: 'Wishlist Heart Button', desc: 'Allows customer to save item to wishlist from card' },
            { key: 'showQuickView', label: 'Quick View Modal Button', desc: 'Enables instant preview modal without leaving page' },
          ].map((item) => (
            <label
              key={item.key}
              className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                (shop as any)[item.key] !== false
                  ? 'bg-slate-50 border-slate-300'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="pr-2">
                <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean((shop as any)[item.key] !== false)}
                onChange={(e) => updateShop({ [item.key]: e.target.checked } as any)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Live Preview of Shop Grid & Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Eye size={14} className="text-blue-400" /> Live Shop Card & Grid Preview
          </span>
          <span className="text-[11px] text-slate-400">Desktop {shop.gridColumns || 3} Columns Layout</span>
        </div>

        <div className="bg-slate-100 p-4 rounded-xl">
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${shop.gridColumns || 3} gap-4 max-w-2xl`}>
            {/* Sample Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col shadow-xs relative">
              {/* Badges */}
              {shop.showBadges !== false && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  {shop.showDiscountBadge !== false && (
                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      15% OFF
                    </span>
                  )}
                  {shop.showNewBadge !== false && (
                    <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  )}
                </div>
              )}

              {/* Wishlist Button */}
              {shop.showWishlistBtn !== false && (
                <button type="button" className="absolute top-4 right-4 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center border border-slate-200 text-slate-600">
                  <Heart size={13} />
                </button>
              )}

              <div className="aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400 text-xs font-bold">
                [Product Image]
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase">Apple</span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">MacBook Air M3 15-inch</h4>

              {shop.showRating !== false && (
                <div className="flex items-center gap-1 my-1 text-[11px] text-amber-500 font-bold">
                  <span>★ 4.9</span>
                  <span className="text-slate-400 text-[10px] font-normal">(128)</span>
                </div>
              )}

              <div className="mt-auto pt-2 flex items-baseline gap-2">
                <span className="text-sm font-black text-slate-900">₹1,14,900</span>
                <span className="text-[11px] text-slate-400 line-through">₹1,34,900</span>
              </div>

              {shop.showStockStatus !== false && (
                <span className="text-[10px] font-bold text-emerald-600 mt-1">● IN STOCK</span>
              )}

              {shop.showQuickView !== false && (
                <button type="button" className="mt-2 w-full py-1 text-[11px] font-bold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                  Quick View
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
