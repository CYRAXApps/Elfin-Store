import React from 'react';
import { Package, Eye, Truck, RotateCcw, ShieldCheck, Heart, ShoppingCart, Zap, Star, Share2, Layers, Sparkles } from 'lucide-react';
import { SiteSettings } from '../../context/SiteSettingsContext';

interface ProductPageCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function ProductPageCmsEditor({ formState, setFormState }: ProductPageCmsEditorProps) {
  const p = formState.productPage || {
    showTitle: true,
    showPrice: true,
    showOriginalPrice: true,
    showDiscount: true,
    showZoom: true,
    showGallery: true,
    thumbnailsPosition: 'bottom',
    showWishlist: true,
    showShare: true,
    showReviews: true,
    showRatings: true,
    showRelatedProducts: true,
    relatedProductsTitle: 'Related Tech & Recommendations',
    relatedProductsLimit: 4,
    showRecommended: true,
    showRecentlyViewed: true,
    recentlyViewedTitle: 'Recently Viewed Products',
    showStockInfo: true,
    showSku: true,
    showBrand: true,
    showCategory: true,
    showSpecs: true,
    showDescription: true,
    showAddToCart: true,
    showBuyNow: true,
    showDeliveryInfo: true,
    showReturnInfo: true,
    showWarrantyInfo: true,
    deliveryInfoTitle: 'Free Express Delivery',
    deliveryInfoText: 'On orders > ₹500 across India',
    returnInfoTitle: '7-Day Replacement',
    returnInfoText: 'Hassle-free verified return',
    warrantyInfoTitle: 'Brand Warranty',
    warrantyInfoText: '100% genuine guaranteed',
  };

  const updateProductPage = (updates: Partial<typeof p>) => {
    setFormState(prev => ({
      ...prev,
      productPage: {
        ...prev.productPage,
        ...updates
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="text-blue-600" size={20} />
          Product Details Page CMS Control
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure product display components, price badges, action buttons, related products, specifications, and warranty guarantees.
        </p>
      </div>

      {/* 1. Core Product Info Toggles */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Layers size={15} className="text-blue-600" /> Core Product Information & Pricing Elements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'showTitle', label: 'Product Title', desc: 'Display product full model name' },
            { key: 'showBrand', label: 'Brand Name Badge', desc: 'Display manufacturer brand name' },
            { key: 'showCategory', label: 'Category Breadcrumb', desc: 'Display primary product category' },
            { key: 'showSku', label: 'SKU / Model Number', desc: 'Display product SKU / code' },
            { key: 'showPrice', label: 'Selling Price', desc: 'Display final discounted customer price' },
            { key: 'showOriginalPrice', label: 'Compare-at Original Price', desc: 'Display strikethrough MRP / original price' },
            { key: 'showDiscount', label: 'Discount % OFF Badge', desc: 'Display savings percentage badge' },
            { key: 'showRatings', label: 'Star Ratings', desc: 'Display average star score' },
            { key: 'showReviews', label: 'Customer Reviews Tab', desc: 'Display customer review tab & count' },
            { key: 'showStockInfo', label: 'Stock Status Badge', desc: 'Display IN STOCK / OUT OF STOCK badge' },
            { key: 'showDescription', label: 'Product Description', desc: 'Display detailed overview & features' },
            { key: 'showSpecs', label: 'Specifications Table', desc: 'Display technical attributes table' },
          ].map((item) => (
            <label
              key={item.key}
              className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                (p as any)[item.key] !== false
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
                checked={Boolean((p as any)[item.key] !== false)}
                onChange={(e) => updateProductPage({ [item.key]: e.target.checked } as any)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 2. Media & Gallery Settings */}
      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Eye size={15} className="text-blue-600" /> Image Gallery & Interactive Zoom
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between cursor-pointer">
            <div className="pr-2">
              <span className="text-xs font-bold text-slate-800 block">Product Gallery</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Enable multi-image thumbnail carousel</span>
            </div>
            <input
              type="checkbox"
              checked={p.showGallery !== false}
              onChange={(e) => updateProductPage({ showGallery: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
            />
          </label>

          <label className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between cursor-pointer">
            <div className="pr-2">
              <span className="text-xs font-bold text-slate-800 block">Image Hover Zoom</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">High-resolution zoom on mouse hover</span>
            </div>
            <input
              type="checkbox"
              checked={p.showZoom !== false}
              onChange={(e) => updateProductPage({ showZoom: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
            />
          </label>

          <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-800 block mb-1">Thumbnails Position</span>
            <select
              value={p.thumbnailsPosition || 'bottom'}
              onChange={(e) => updateProductPage({ thumbnailsPosition: e.target.value as any })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value="bottom">Below Main Image (Horizontal Row)</option>
              <option value="left">Left of Main Image (Vertical Column)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Interactive Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <ShoppingCart size={15} className="text-blue-600" /> Action Buttons & Engagement
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'showAddToCart', label: 'Add to Cart Button', desc: 'Standard shopping cart button' },
            { key: 'showBuyNow', label: 'Buy Now Button', desc: 'Direct 1-click checkout button' },
            { key: 'showWishlist', label: 'Wishlist Button', desc: 'Save to customer wishlist heart button' },
            { key: 'showShare', label: 'Social Share Button', desc: 'Share product link to WhatsApp & Social' },
          ].map((item) => (
            <label
              key={item.key}
              className={`p-3 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                (p as any)[item.key] !== false
                  ? 'bg-blue-50/40 border-blue-200'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="pr-2">
                <span className="text-xs font-bold text-slate-800 block">{item.label}</span>
                <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{item.desc}</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean((p as any)[item.key] !== false)}
                onChange={(e) => updateProductPage({ [item.key]: e.target.checked } as any)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 4. Related & Recently Viewed Sections */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Sparkles size={15} className="text-blue-600" /> Related Products & Cross-Sell Sections
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Related Products */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Related Products Section</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.showRelatedProducts !== false}
                  onChange={(e) => updateProductPage({ showRelatedProducts: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-blue-700">{p.showRelatedProducts !== false ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Section Heading Title</label>
              <input
                type="text"
                value={p.relatedProductsTitle || 'Related Tech & Recommendations'}
                onChange={(e) => updateProductPage({ relatedProductsTitle: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Products Limit</label>
              <select
                value={p.relatedProductsLimit || 4}
                onChange={(e) => updateProductPage({ relatedProductsLimit: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 Products</option>
                <option value={3}>3 Products</option>
                <option value={4}>4 Products</option>
                <option value={6}>6 Products</option>
                <option value={8}>8 Products</option>
              </select>
            </div>
          </div>

          {/* Recently Viewed */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Recently Viewed Section</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.showRecentlyViewed !== false}
                  onChange={(e) => updateProductPage({ showRecentlyViewed: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-blue-700">{p.showRecentlyViewed !== false ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Section Heading Title</label>
              <input
                type="text"
                value={p.recentlyViewedTitle || 'Recently Viewed Products'}
                onChange={(e) => updateProductPage({ recentlyViewedTitle: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Trust, Delivery & Warranty Information Boxes */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <ShieldCheck size={15} className="text-blue-600" /> Trust, Delivery & Warranty Snippets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Delivery */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Truck size={14} className="text-blue-600" /> Delivery Box
              </span>
              <input
                type="checkbox"
                checked={p.showDeliveryInfo !== false}
                onChange={(e) => updateProductPage({ showDeliveryInfo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
              <input
                type="text"
                value={p.deliveryInfoTitle ?? 'Free Express Delivery'}
                onChange={(e) => updateProductPage({ deliveryInfoTitle: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
              <input
                type="text"
                value={p.deliveryInfoText ?? 'On orders > ₹500 across India'}
                onChange={(e) => updateProductPage({ deliveryInfoText: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>
          </div>

          {/* Return */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCcw size={14} className="text-blue-600" /> Return Policy
              </span>
              <input
                type="checkbox"
                checked={p.showReturnInfo !== false}
                onChange={(e) => updateProductPage({ showReturnInfo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
              <input
                type="text"
                value={p.returnInfoTitle ?? '7-Day Replacement'}
                onChange={(e) => updateProductPage({ returnInfoTitle: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
              <input
                type="text"
                value={p.returnInfoText ?? 'Hassle-free verified return'}
                onChange={(e) => updateProductPage({ returnInfoText: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>
          </div>

          {/* Warranty */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" /> Warranty Box
              </span>
              <input
                type="checkbox"
                checked={p.showWarrantyInfo !== false}
                onChange={(e) => updateProductPage({ showWarrantyInfo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
              <input
                type="text"
                value={p.warrantyInfoTitle ?? 'Brand Warranty'}
                onChange={(e) => updateProductPage({ warrantyInfoTitle: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtitle</label>
              <input
                type="text"
                value={p.warrantyInfoText ?? '100% genuine guaranteed'}
                onChange={(e) => updateProductPage({ warrantyInfoText: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
