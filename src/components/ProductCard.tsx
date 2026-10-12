import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { Product } from '../types';
import { useShopActions, useIsInWishlist } from '../context/ShopContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { isProductInStock } from '../utils/stockUtils';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatRating, formatReviewCount } from '../utils/rating';
import { ProductRatingBadge } from './ProductRatingBadge';

export interface ProductCardProps {
  product: Product;
  key?: React.Key;
  onQuickView?: (product: Product) => void;
  layout?: 'grid' | 'list' | 'compact';
  onAddToCart?: (product: Product) => void;
  inCartQuantity?: number;
  isPosMode?: boolean;
  allowSellingOutOfStock?: boolean;
}

function ProductCardComponent({ 
  product, 
  onQuickView, 
  layout = 'grid',
  onAddToCart,
  inCartQuantity = 0,
  isPosMode = false,
  allowSellingOutOfStock = false
}: ProductCardProps) {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist } = useShopActions();
  const inWishlist = useIsInWishlist(product.id);
  const { settings } = useSiteSettings();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(product.image || '');

  React.useEffect(() => {
    setImgSrc(product.image || '');
    setImgLoaded(false);
    setImgError(false);
  }, [product.image]);

  const normalInStock = isProductInStock(product);
  const canSell = isPosMode ? (normalInStock || allowSellingOutOfStock) : normalInStock;
  const inStock = canSell;

  const handleActionClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isPosMode) {
      if (canSell && onAddToCart) {
        onAddToCart(product);
      }
    } else {
      if (normalInStock) {
        addToCart(product);
      }
    }
  };

  const shopSettings = settings.shopPage || {
    showBadges: true,
    showDiscountBadge: true,
    showNewBadge: true,
    showBestSellerBadge: true,
    showStockStatus: true,
    showRating: true,
    showWishlistBtn: true,
    showQuickView: true,
  };

  const hasOriginalPrice = Boolean(
    product.originalPrice && product.originalPrice > product.price
  );

  const rawVariants = (product as any).colors || (product as any).variants || [];
  const variantsList = Array.isArray(rawVariants) ? rawVariants : [];

  const getSwatchBg = (color: string): string => {
    const lower = color.toLowerCase();
    if (lower.includes('black') || lower.includes('dark') || lower.includes('midnight')) return '#1e293b';
    if (lower.includes('white') || lower.includes('starlight') || lower.includes('silver')) return '#f8fafc';
    if (lower.includes('blue') || lower.includes('pacific') || lower.includes('sierra')) return '#2563eb';
    if (lower.includes('gold') || lower.includes('yellow')) return '#eab308';
    if (lower.includes('titanium') || lower.includes('gray') || lower.includes('grey') || lower.includes('space')) return '#64748b';
    if (lower.includes('red') || lower.includes('rose')) return '#ef4444';
    if (lower.includes('green')) return '#10b981';
    if (lower.includes('purple')) return '#a855f7';
    return color.startsWith('#') ? color : '#cbd5e1';
  };

  const discountPercent = product.discountPercentage || 
    (hasOriginalPrice ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0);

  const cardStoreId = product.storeId || 'main-store';
  const cardStoreName = product.storeName || (cardStoreId === 'main-store' ? 'ELECTRO STORE' : (cardStoreId === 'store-a' ? 'Store A' : 'Partner Store'));

  // Dedicated POS Mode Renderings
  if (isPosMode) {
    const posImgSrc = getOptimizedImageUrl(imgSrc, { width: 240, quality: 80 });

    // 1. POS LIST VIEW (Ultra-dense row)
    if (layout === 'list') {
      return (
        <div
          onClick={handleActionClick}
          className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-150 cursor-pointer select-none active:scale-[0.99] gap-2.5 ${
            inCartQuantity > 0
              ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400 shadow-2xs'
              : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-slate-50/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0 p-0.5 relative">
              {imgError || !imgSrc ? (
                <span className="text-[8px] font-bold text-slate-400">NO IMG</span>
              ) : (
                <img
                  src={posImgSrc}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
                  {product.brand || product.category || 'Product'}
                </span>
                {product.barcode && (
                  <span className="text-[8.5px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                    {product.barcode}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-xs text-slate-900 truncate leading-snug">
                {product.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-right">
              <div className="text-xs font-black text-slate-900">
                ₹{(product.price || 0).toLocaleString('en-IN')}
              </div>
              <span className={`text-[9px] font-bold block ${
                normalInStock ? 'text-emerald-600' : allowSellingOutOfStock ? 'text-amber-600' : 'text-rose-500'
              }`}>
                {normalInStock ? `Stock: ${product.stock ?? 0}` : (allowSellingOutOfStock ? 'Backorder' : 'Out of Stock')}
              </span>
            </div>

            <button
              type="button"
              disabled={!canSell}
              onClick={handleActionClick}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                !canSell
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : inCartQuantity > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <ShoppingCart size={11} />
              <span>{inCartQuantity > 0 ? inCartQuantity : '+ Add'}</span>
            </button>
          </div>
        </div>
      );
    }

    // 2. POS COMPACT MICRO-TILES (Ultra high-density grid)
    if (layout === 'compact') {
      return (
        <div
          onClick={handleActionClick}
          className={`bg-white rounded-xl border transition-all duration-150 flex flex-col p-2 relative group overflow-hidden cursor-pointer select-none active:scale-[0.98] ${
            inCartQuantity > 0
              ? 'border-blue-500 ring-2 ring-blue-500/80 bg-blue-50/20 shadow-xs'
              : 'border-slate-200/90 hover:border-blue-400 hover:shadow-xs shadow-2xs'
          }`}
        >
          <div className="relative h-18 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden mb-1.5 p-1 border border-slate-100">
            {inCartQuantity > 0 && (
              <span className="absolute top-1 right-1 z-10 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                {inCartQuantity}
              </span>
            )}
            {imgError || !imgSrc ? (
              <span className="text-[8px] font-bold text-slate-400">NO IMG</span>
            ) : (
              <img
                src={posImgSrc}
                alt={product.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-150"
                onError={() => setImgError(true)}
              />
            )}
          </div>

          <div className="flex flex-col flex-1 justify-between gap-1">
            <div>
              <span className="text-[8.5px] font-bold text-slate-400 uppercase truncate block">
                {product.brand || product.category || 'Product'}
              </span>
              <h4 className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-1 truncate group-hover:text-blue-600 transition-colors">
                {product.name}
              </h4>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-xs font-black text-slate-900">
                ₹{(product.price || 0).toLocaleString('en-IN')}
              </span>
              <span className={`text-[8.5px] font-extrabold ${
                normalInStock ? 'text-emerald-600' : allowSellingOutOfStock ? 'text-amber-600' : 'text-rose-500'
              }`}>
                {normalInStock ? `${product.stock ?? 0} in stock` : (allowSellingOutOfStock ? 'Backorder' : '0 left')}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 3. POS STANDARD COMPACT GRID CARD (Default POS Mode: sleek, compact, fits many more products)
    return (
      <div
        onClick={handleActionClick}
        className={`bg-white rounded-xl border transition-all duration-150 flex flex-col h-full relative group overflow-hidden cursor-pointer select-none active:scale-[0.985] ${
          inCartQuantity > 0
            ? 'border-blue-500 ring-2 ring-blue-500/80 bg-blue-50/15 shadow-xs'
            : 'border-slate-200/90 hover:border-blue-400 hover:shadow-sm shadow-2xs'
        }`}
      >
        {/* Compact top image */}
        <div className="relative h-18 sm:h-20 md:h-22 bg-slate-50/90 flex items-center justify-center overflow-hidden shrink-0 border-b border-slate-100 p-1 sm:p-1.5">
          {/* In Cart Badge */}
          {inCartQuantity > 0 && (
            <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 bg-blue-600 text-white text-[8px] sm:text-[9.5px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
              <ShoppingCart size={9} className="hidden sm:inline" />
              <span>{inCartQuantity}</span>
            </div>
          )}

          {/* Stock badge */}
          <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10">
            <span className={`text-[7.5px] sm:text-[8.5px] font-extrabold px-1 sm:px-1.5 py-0.5 rounded shadow-2xs ${
              normalInStock 
                ? 'bg-emerald-100 text-emerald-800' 
                : allowSellingOutOfStock 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {normalInStock ? (product.stock != null ? `${product.stock}` : 'IN') : (allowSellingOutOfStock ? 'B/O' : 'OUT')}
            </span>
          </div>

          {imgError || !imgSrc ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-center">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">No Image</span>
            </div>
          ) : (
            <img
              src={posImgSrc}
              alt={product.name}
              loading="lazy"
              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Compact Info Body */}
        <div className="p-1.5 sm:p-2 md:p-2.5 flex flex-col flex-1 justify-between gap-1 bg-white">
          <div>
            <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">
              {product.brand || product.category || 'ELECTRO'}
            </div>
            <h3 className="font-bold text-[10.5px] sm:text-[11.5px] md:text-xs text-slate-900 leading-snug line-clamp-2 min-h-[1.75rem] group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-0.5">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs md:text-sm font-black text-slate-900 block truncate">
                ₹{(product.price || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleActionClick}
              disabled={!canSell}
              className={`p-1 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[9.5px] sm:text-[10.5px] font-bold flex items-center gap-0.5 transition-colors shrink-0 cursor-pointer ${
                !canSell
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : inCartQuantity > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <ShoppingCart size={10} />
              <span className="hidden sm:inline">{inCartQuantity > 0 ? `+${inCartQuantity}` : 'Add'}</span>
              <span className="sm:hidden">{inCartQuantity > 0 ? inCartQuantity : '+'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col sm:flex-row relative group overflow-hidden">
        {/* Product Image & Badges Container */}
        <div className="relative w-full sm:w-56 md:w-64 aspect-square sm:aspect-auto bg-slate-100 p-0 flex items-center justify-center overflow-hidden shrink-0">
          {/* Dynamic Badges */}
          {shopSettings.showBadges !== false && (
            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
              {shopSettings.showDiscountBadge !== false && discountPercent > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                  {discountPercent}% OFF
                </span>
              )}
              {shopSettings.showNewBadge !== false && product.isNewArrival && (
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                  NEW
                </span>
              )}
              {shopSettings.showBestSellerBadge !== false && product.isBestSeller && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                  HOT
                </span>
              )}
            </div>
          )}

          {/* Wishlist Button or POS in-cart badge */}
          {!isPosMode && shopSettings.showWishlistBtn !== false && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              <Heart size={15} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
            </button>
          )}

          {/* Rating Badge at Bottom-Left of Image */}
          {shopSettings.showRating !== false && (product.rating != null && Number(product.rating) > 0) && (
            <div 
              className="absolute bottom-2 left-2 z-20"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/product/${product.id}?tab=reviews#product-tabs-section`);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ProductRatingBadge 
                rating={product.rating} 
                reviewsCount={product.reviewsCount} 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/product/${product.id}?tab=reviews#product-tabs-section`);
                }}
                title="Click to view reviews"
              />
            </div>
          )}

          {isPosMode && inCartQuantity > 0 && (
            <div className="absolute top-2.5 right-2.5 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 pointer-events-none">
              <ShoppingCart size={11} />
              <span>{inCartQuantity} in cart</span>
            </div>
          )}

          {isPosMode ? (
            <div 
              onClick={handleActionClick}
              className="w-full h-full flex items-center justify-center relative p-0 min-h-[180px] cursor-pointer"
            >
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center rounded-none" />
              )}
              {(() => {
                const optSrc = getOptimizedImageUrl(imgSrc, { width: 360, quality: 80 });
                if (imgError || !imgSrc || !optSrc) {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No Image</span>
                    </div>
                  );
                }
                return (
                  <img
                    src={optSrc}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={360}
                    height={360}
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => {
                      if (product.images && product.images.length > 0 && imgSrc !== product.images[0]) {
                        setImgSrc(product.images[0]);
                      } else {
                        setImgError(true);
                      }
                    }}
                    className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                );
              })()}
            </div>
          ) : (
            <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center relative p-0 min-h-[180px]">
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center rounded-none" />
              )}
              {(() => {
                const optSrc = getOptimizedImageUrl(imgSrc, { width: 360, quality: 80 });
                if (imgError || !imgSrc || !optSrc) {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No Image</span>
                    </div>
                  );
                }
                return (
                  <img
                    src={optSrc}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={360}
                    height={360}
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => {
                      if (product.images && product.images.length > 0 && imgSrc !== product.images[0]) {
                        setImgSrc(product.images[0]);
                      } else {
                        setImgError(true);
                      }
                    }}
                    className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                );
              })()}
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex flex-col md:flex-row flex-1 justify-between gap-4 bg-white">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{product.brand || product.category || 'ELECTRO'}</span>
              <span>•</span>
              <span className="text-slate-600">{product.category}</span>
              {shopSettings.showStockStatus !== false && (
                <>
                  <span>•</span>
                  <span className={
                    normalInStock
                      ? 'text-emerald-600 font-extrabold'
                      : allowSellingOutOfStock
                      ? 'text-amber-600 font-extrabold'
                      : 'text-rose-500 font-extrabold'
                  }>
                    {normalInStock ? 'IN STOCK' : (allowSellingOutOfStock ? 'BACKORDER' : 'OUT OF STOCK')}
                  </span>
                </>
              )}
            </div>

            {isPosMode ? (
              <div onClick={handleActionClick} className="group/title block cursor-pointer">
                <h3 className="font-bold text-base sm:text-lg md:text-xl text-slate-900 group-hover/title:text-blue-600 transition-colors">
                  {product.name}
                </h3>
              </div>
            ) : (
              <Link to={`/product/${product.id}`} className="group/title block">
                <h3 className="font-bold text-base sm:text-lg md:text-xl text-slate-900 group-hover/title:text-blue-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
            )}

            {!isPosMode && (
              <div className="flex items-center gap-1 text-[10.5px] sm:text-xs font-medium text-slate-500 my-0.5">
                <span className="text-slate-400">Sold by</span>
                <Link
                  to={`/store/${cardStoreId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline truncate max-w-[130px]"
                >
                  {cardStoreName}
                </Link>
              </div>
            )}

            {product.description && (
              <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}

            {variantsList.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500">Colors:</span>
                {variantsList.map((v: string, i: number) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block"
                    style={{ backgroundColor: getSwatchBg(v) }}
                    title={v}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Actions Column */}
          <div className="md:w-56 shrink-0 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{(product.price || 0).toLocaleString('en-IN')}
              </div>
              {hasOriginalPrice && (
                <div className="text-xs text-slate-400 line-through">
                  ₹{(product.originalPrice || 0).toLocaleString('en-IN')}
                </div>
              )}
              {discountPercent > 0 && (
                <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                  Save ₹{Number(Number(product.originalPrice || product.price || 0) - Number(product.price || 0)).toLocaleString('en-IN')} ({discountPercent}% OFF)
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <button
                onClick={() => addToCart(product)}
                disabled={!inStock}
                data-action="add-to-cart"
                style={{ borderRadius: '12px' }}
                aria-label={`Add ${product.name} to cart`}
                className="add-to-cart-btn w-full bg-[#0066ff] hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-[12px] text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <ShoppingCart size={16} />
                <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>

              {shopSettings.showQuickView !== false && onQuickView && (
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  style={{ borderRadius: '12px' }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-[12px] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Quick View</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={isPosMode ? handleActionClick : undefined}
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs transition-all duration-200 flex flex-col h-full relative group overflow-hidden ${
        isPosMode 
          ? 'cursor-pointer hover:border-blue-400 hover:shadow-md select-none active:scale-[0.995]' 
          : 'hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Product Image & Badges Container */}
      <div className="relative aspect-square bg-slate-100 p-0 flex items-center justify-center overflow-hidden shrink-0">
        {/* Dynamic Badges */}
        {shopSettings.showBadges !== false && (
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
            {shopSettings.showDiscountBadge !== false && discountPercent > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                {discountPercent}% OFF
              </span>
            )}
            {shopSettings.showNewBadge !== false && product.isNewArrival && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                NEW
              </span>
            )}
            {shopSettings.showBestSellerBadge !== false && product.isBestSeller && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-2xs">
                HOT
              </span>
            )}
          </div>
        )}

        {/* Wishlist Button (Web mode only) */}
        {!isPosMode && shopSettings.showWishlistBtn !== false && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white active:scale-95 transition-all cursor-pointer"
          >
            <Heart size={15} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
          </button>
        )}

        {/* Rating Badge at Bottom-Left of Image */}
        {shopSettings.showRating !== false && (product.rating != null && Number(product.rating) > 0) && (
          <div 
            className="absolute bottom-2 left-2 z-20"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/product/${product.id}?tab=reviews#product-tabs-section`);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ProductRatingBadge 
              rating={product.rating} 
              reviewsCount={product.reviewsCount} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/product/${product.id}?tab=reviews#product-tabs-section`);
              }}
              title="Click to view reviews"
            />
          </div>
        )}

        {/* In-Cart Badge (POS mode only) */}
        {isPosMode && inCartQuantity > 0 && (
          <div className="absolute top-2.5 right-2.5 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 pointer-events-none">
            <ShoppingCart size={11} />
            <span>{inCartQuantity} in cart</span>
          </div>
        )}

        {/* Quick View Button Hover Overlay (Web mode only) */}
        {!isPosMode && shopSettings.showQuickView !== false && onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border border-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Eye size={13} className="text-blue-600" />
            <span>Quick View</span>
          </button>
        )}

        {isPosMode ? (
          <div className="w-full h-full flex items-center justify-center relative p-0">
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center rounded-none" />
            )}
            {(() => {
              const optSrc = getOptimizedImageUrl(imgSrc, { width: 440, quality: 80 });
              if (imgError || !imgSrc || !optSrc) {
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No Image</span>
                  </div>
                );
              }
              return (
                <img
                  src={optSrc}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={400}
                  referrerPolicy="no-referrer"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    if (product.images && product.images.length > 0 && imgSrc !== product.images[0]) {
                      setImgSrc(product.images[0]);
                    } else {
                      setImgError(true);
                    }
                  }}
                  className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              );
            })()}
          </div>
        ) : (
          <Link to={`/product/${product.id}`} className="w-full h-full flex items-center justify-center relative p-0">
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center rounded-none" />
            )}
            {(() => {
              const optSrc = getOptimizedImageUrl(imgSrc, { width: 440, quality: 80 });
              if (imgError || !imgSrc || !optSrc) {
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-2">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No Image</span>
                  </div>
                );
              }
              return (
                <img
                  src={optSrc}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={400}
                  referrerPolicy="no-referrer"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    if (product.images && product.images.length > 0 && imgSrc !== product.images[0]) {
                      setImgSrc(product.images[0]);
                    } else {
                      setImgError(true);
                    }
                  }}
                  className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              );
            })()}
          </Link>
        )}
      </div>

      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1 bg-white">
        {/* Brand / Category */}
        <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          <span className="truncate max-w-[100px] sm:max-w-[120px]">{product.brand || product.category || 'ELECTRO'}</span>
          {shopSettings.showStockStatus !== false && (
            <span className={
              normalInStock 
                ? 'text-emerald-600 text-[8px] sm:text-[10px] font-extrabold shrink-0' 
                : allowSellingOutOfStock
                ? 'text-amber-600 text-[8px] sm:text-[10px] font-extrabold shrink-0'
                : 'text-rose-500 text-[8px] sm:text-[10px] font-extrabold shrink-0'
            }>
              {normalInStock ? 'IN STOCK' : (allowSellingOutOfStock ? 'BACKORDER' : 'OUT OF STOCK')}
            </span>
          )}
        </div>

        {/* 1. Title */}
        {isPosMode ? (
          <div className="group/title block mb-0.5">
            <h3 className="font-bold text-xs sm:text-[14px] md:text-[15px] lg:text-base text-slate-900 leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover/title:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </div>
        ) : (
          <Link to={`/product/${product.id}`} className="group/title block mb-0.5">
            <h3 className="font-bold text-xs sm:text-[14px] md:text-[15px] lg:text-base text-slate-900 leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover/title:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>
        )}

        {/* Store Label */}
        {!isPosMode && (
          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-medium text-slate-500 mb-1">
            <span className="text-slate-400">Sold by</span>
            <Link
              to={`/store/${cardStoreId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline truncate max-w-[100px] sm:max-w-[120px]"
            >
              {cardStoreName}
            </Link>
          </div>
        )}

        {/* 3. Price & Action */}
        <div className="mt-auto pt-1.5 sm:pt-2 space-y-1.5 sm:space-y-2">
          <div className="flex items-baseline flex-wrap gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg font-black text-slate-900">
              ₹{(product.price || 0).toLocaleString('en-IN')}
            </span>
            {hasOriginalPrice && (
              <span className="text-[9px] sm:text-xs text-slate-400 line-through">
                ₹{(product.originalPrice || 0).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {variantsList.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 py-0.5">
              {variantsList.slice(0, 3).map((v: string, i: number) => (
                <span
                  key={i}
                  className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border border-slate-300 shadow-2xs inline-block"
                  style={{ backgroundColor: getSwatchBg(v) }}
                  title={v}
                />
              ))}
              {variantsList.length > 3 && (
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 ml-0.5">
                  +{variantsList.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="pt-0.5 sm:pt-1">
            <button
              type="button"
              onClick={handleActionClick}
              disabled={!canSell}
              data-action="add-to-cart"
              style={{ borderRadius: '12px' }}
              aria-label={`Add ${product.name} to cart`}
              className={`add-to-cart-btn w-full font-bold py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-[12px] text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                !canSell
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isPosMode && inCartQuantity > 0
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                  : 'bg-[#0066ff] hover:bg-blue-700 active:bg-blue-800 text-white'
              }`}
            >
              <ShoppingCart size={13} className="shrink-0" />
              <span className="truncate">
                {!canSell
                  ? 'Out of Stock'
                  : isPosMode
                  ? (inCartQuantity > 0 ? `Add Another (${inCartQuantity})` : 'Add to Cart')
                  : 'Add to Cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);

