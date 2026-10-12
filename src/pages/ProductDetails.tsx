import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RotateCcw, Heart, Share2, ShoppingCart, Zap, ImageIcon, ChevronRight, Check, Maximize2, Plus, Minus, AlertCircle, MapPin } from 'lucide-react';
import { useShopActions, useIsInWishlist } from '../context/ShopContext';
import { useProducts } from '../hooks/useProducts';
import { useProduct } from '../hooks/useProduct';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ProductReviewModal } from '../components/ProductReviewModal';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLocation as useHyperlocalLocation } from '../context/LocationContext';
import { isPincodeServiceable } from '../services/indiaGeographicData';
import { ProductCard } from '../components/ProductCard';
import { ProductImageViewer } from '../components/ProductImageViewer';
import { ProductRatingBadge } from '../components/ProductRatingBadge';
import { Product } from '../types';
import { isProductInStock, getProductAvailableStock } from '../utils/stockUtils';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatRating, formatReviewCount, getStarFloor, calculateReviewsAggregate } from '../utils/rating';
import { getCachedStore } from '../services/catalogCache';

export function normalizeProductGallery(product?: Partial<Product> | null): string[] {
  if (!product) return [];
  const list: string[] = [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      if (typeof img === 'string' && img.trim()) {
        const trimmed = img.trim();
        if (!list.includes(trimmed)) {
          list.push(trimmed);
        }
      }
    }
  }

  if (typeof product.image === 'string' && product.image.trim()) {
    const primary = product.image.trim();
    if (!list.includes(primary)) {
      list.unshift(primary);
    }
  }

  return list;
}

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist } = useShopActions();
  const inWishlist = useIsInWishlist(id || '');
  
  // Single canonical product hook directly connected to Firestore document
  const { product, loading: productLoading } = useProduct(id);
  const { products } = useProducts();
  const { settings } = useSiteSettings();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'description');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentProductId, setCurrentProductId] = useState<string | undefined>(id);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchDetailsStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const { user } = useAuth();
  const [isEligibleToReview, setIsEligibleToReview] = useState(false);
  const [userExistingReview, setUserExistingReview] = useState<any>(null);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const scrollToReviews = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveTab('reviews');
    setTimeout(() => {
      const revSection = document.getElementById('product-tabs-section');
      if (revSection) {
        revSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'reviews' || window.location.hash === '#reviews' || window.location.hash === '#product-tabs-section') {
      setActiveTab('reviews');
      setTimeout(() => {
        const revSection = document.getElementById('product-tabs-section');
        if (revSection) {
          revSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [searchParams, id]);



  useEffect(() => {
    async function checkReviewEligibility() {
      if (!user || !id) {
        setIsEligibleToReview(false);
        setUserExistingReview(null);
        return;
      }
      try {
        // Check existing review
        const reviewRef = doc(db, 'users', user.uid, 'reviews', id);
        const reviewSnap = await getDoc(reviewRef);
        if (reviewSnap.exists()) {
           setIsEligibleToReview(true);
           setUserExistingReview({ id: reviewSnap.id, ...reviewSnap.data() });
           return;
        }

        // Check if user has a delivered order with this product
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const orderSnaps = await getDocs(q);
        
        let eligible = false;
        for (const orderDoc of orderSnaps.docs) {
          const order = orderDoc.data();
          const isDelivered = order.status === 'delivered' || order.fulfillmentStatus === 'delivered';
          if (isDelivered && Array.isArray(order.items)) {
            if (order.items.some((item: any) => item.productId === id || item.id === id)) {
              eligible = true;
              break;
            }
          }
        }
        setIsEligibleToReview(eligible);
        setUserExistingReview(null);
      } catch (err) {
        console.error('Error checking review eligibility:', err);
      }
    }
    checkReviewEligibility();
  }, [user, id, isReviewModalOpen]);


  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'products', id, 'reviews'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const revs: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        // Rejected reviews must not appear publicly
        if (data.status !== 'rejected') {
          revs.push({ id: d.id, ...data });
        }
      });
      revs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setProductReviews(revs);
    }, (err) => {
      console.error('Error fetching product reviews:', err);
    });

    return () => unsubscribe();
  }, [id, isReviewModalOpen]);

  // Synchronously reset selected image index whenever route ID changes before rendering
  if (currentProductId !== id) {
    setCurrentProductId(id);
    setSelectedImageIndex(0);
    setImgLoaded(false);
    setImgError(false);
    setIsZoomed(false);
    setQuantity(1);
    setSelectedVariant(null);
    setIsAddingToCart(false);
    setJustAddedToCart(false);
    setIsBuyingNow(false);
  }

  // Normalized product gallery image list in exact stored sequence
  const galleryImages = useMemo(() => {
    return normalizeProductGallery(product);
  }, [product?.id, product?.image, product?.images]);

  // Normalized rating aggregate computed canonically from verified reviews
  const ratingAgg = useMemo(() => {
    return calculateReviewsAggregate(productReviews, product);
  }, [productReviews, product?.rating, product?.reviewsCount]);

  // Main active display image (guaranteed stable across renders and background updates)
  const currentImage = useMemo(() => {
    if (galleryImages.length === 0) return '';
    return galleryImages[selectedImageIndex] || galleryImages[0] || '';
  }, [galleryImages, selectedImageIndex]);

  const productSettings = settings.productPage || {
    showZoom: true,
    showWishlist: true,
    showShare: true,
    showReviews: true,
    showRatings: true,
    showRelatedProducts: true,
    showRecommended: true,
    showRecentlyViewed: true,
    showStockInfo: true,
    showSku: true,
    showBrand: true,
    showSpecs: true,
    showDeliveryInfo: true,
    showReturnInfo: true,
    showWarrantyInfo: true,
    deliveryTitle: 'Free Express Delivery',
    deliveryText: 'On orders over ₹500',
    returnTitle: '7-Day Replacement',
    returnText: 'Hassle-free guarantee',
    warrantyTitle: 'Brand Warranty',
    warrantyText: '100% Genuine product',
  };

  const { location: deliveryLocation, openLocationModal } = useHyperlocalLocation();
  const pinCoverage = useMemo(() => {
    const pin = (deliveryLocation?.pincode || '').trim();
    if (!pin || pin.length !== 6) return null;
    return isPincodeServiceable(pin, settings.shipping?.deliveryCoverage);
  }, [deliveryLocation?.pincode, settings.shipping?.deliveryCoverage]);

  // Keep track of recently viewed products in localStorage
  useEffect(() => {
    if (product?.id) {
      try {
        const stored = JSON.parse(localStorage.getItem('electro_recently_viewed') || '[]');
        const filtered = stored.filter((itemId: string) => itemId !== product.id);
        const updated = [product.id, ...filtered].slice(0, 10);
        localStorage.setItem('electro_recently_viewed', JSON.stringify(updated));
      } catch (e) {}
    }
  }, [product?.id]);

  // Dynamic SEO Title & Schema.org Structured Data
  useEffect(() => {
    if (product) {
      const storeName = settings.general?.storeName || 'ELECTRO STORE';
      document.title = `${product.name} | ${storeName}`;
      
      const scriptId = 'product-jsonld';
      let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.image,
        "description": product.description,
        "sku": product.sku || `SKU-${product.id}`,
        "brand": {
          "@type": "Brand",
          "name": product.brand || storeName
        },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": settings.general?.currency || "INR",
          "price": product.price,
          "availability": isProductInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": ratingAgg.formattedRating,
          "reviewCount": ratingAgg.reviewsCount || 1
        }
      };

      scriptTag.text = JSON.stringify(structuredData);

      return () => {
        const tag = document.getElementById(scriptId);
        if (tag) tag.remove();
        document.title = `${storeName} - SMART TECH. BETTER LIFE.`;
      };
    }
  }, [product, settings.general?.storeName, settings.general?.currency]);

  // Related products (same category or brand)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
      .slice(0, 4);
  }, [product, products]);

  // Recently viewed products
  const recentlyViewedProducts = useMemo(() => {
    if (!product) return [];
    try {
      const stored = JSON.parse(localStorage.getItem('electro_recently_viewed') || '[]');
      return stored
        .filter((itemId: string) => itemId !== product.id)
        .map((itemId: string) => products.find(p => p.id === itemId))
        .filter((p: Product | undefined): p is Product => Boolean(p))
        .slice(0, 4);
    } catch {
      return [];
    }
  }, [product, products]);

  if (!product && productLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl pt-2 sm:pt-4 pb-8 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-0 mb-8 overflow-hidden grid md:grid-cols-2">
          <div className="aspect-square bg-slate-100 flex items-center justify-center">
            <ImageIcon className="text-slate-300 w-12 h-12" />
          </div>
          <div className="p-6 md:p-10 space-y-4">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-8 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-6 w-32 bg-slate-200 rounded"></div>
            <div className="h-20 w-full bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 pt-8 pb-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h2>
        <button onClick={() => navigate('/shop')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors">
          Return to Shop
        </button>
      </div>
    );
  }

  const inStock = isProductInStock(product);
  const availableStock = getProductAvailableStock(product);

  const rawVariants = (product as any)?.variants || (product as any)?.colors || (product as any)?.options || [];
  const variantsList: string[] = useMemo(() => {
    if (!Array.isArray(rawVariants)) return [];
    return rawVariants.filter((v: any) => typeof v === 'string' && v.trim().length > 0);
  }, [product]);

  const handleAddToCart = async () => {
    if (isAddingToCart || isBuyingNow) return;

    if (!inStock) {
      alert(`"${product.name}" is currently out of stock and cannot be added to cart.`);
      return;
    }

    if (variantsList.length > 0 && !selectedVariant) {
      const varEl = document.getElementById('variant-selection-section');
      if (varEl) {
        varEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert('Please select an option / variant before adding to cart.');
      return;
    }

    try {
      setIsAddingToCart(true);
      addToCart(product, quantity);
      setJustAddedToCart(true);
      setTimeout(() => {
        setJustAddedToCart(false);
      }, 2000);
    } catch (err) {
      console.error('Error adding product to cart:', err);
    } finally {
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 350);
    }
  };

  const handleBuyNow = async () => {
    if (isAddingToCart || isBuyingNow) return;

    if (!inStock) {
      alert(`"${product.name}" is currently out of stock and cannot be ordered.`);
      return;
    }

    if (variantsList.length > 0 && !selectedVariant) {
      const varEl = document.getElementById('variant-selection-section');
      if (varEl) {
        varEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert('Please select an option / variant before proceeding to Buy Now.');
      return;
    }

    try {
      setIsBuyingNow(true);
      addToCart(product, quantity);
      navigate('/checkout');
    } catch (err) {
      console.error('Error in Buy Now redirect:', err);
    } finally {
      setTimeout(() => {
        setIsBuyingNow(false);
      }, 500);
    }
  };

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
    setImgLoaded(false);
    setImgError(false);
  };

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const shareUrl = window.location.href;
    
    // Try Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || product.name,
          url: shareUrl,
        });
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        // If denied in iframe or error, fallback to clipboard
      }
    }

    // Fallback: Copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy product link:', err);
    }
  };

  const skuString = product.sku || `SKU-${product.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="container mx-auto px-2 sm:px-4 max-w-7xl pt-2 sm:pt-4 pb-44 sm:pb-48 md:pb-12">
      {/* Breadcrumb List */}
      <nav className="px-1 sm:px-0 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 pt-1 sm:pt-0 pb-2 sm:pb-0 mb-2 sm:mb-6 overflow-x-auto whitespace-nowrap scrollbar-none" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-blue-600 transition-colors shrink-0">Home</Link>
        <ChevronRight size={12} className="text-slate-400 shrink-0" />
        <Link to="/shop" className="hover:text-blue-600 transition-colors shrink-0">Shop</Link>
        <ChevronRight size={12} className="text-slate-400 shrink-0" />
        <span className="text-slate-900 font-semibold truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* Product Top Section */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/90 p-0 mb-4 sm:mb-8 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          
          {/* Images */}
          <div className="flex flex-col bg-white border-b md:border-b-0 md:border-r border-slate-100">
            <div className="relative w-full aspect-square bg-white overflow-hidden group/img">
              {/* Clickable Image Layer for Fullscreen Lightbox / Swipe / Zoom */}
              <div 
                onClick={() => currentImage && !imgError && setIsLightboxOpen(true)}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    const t = e.touches[0];
                    touchDetailsStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
                  }
                }}
                onTouchEnd={(e) => {
                  if (touchDetailsStartRef.current && e.changedTouches.length > 0) {
                    const t = e.changedTouches[0];
                    const diffX = t.clientX - touchDetailsStartRef.current.x;
                    const diffY = t.clientY - touchDetailsStartRef.current.y;
                    const diffTime = Date.now() - touchDetailsStartRef.current.time;

                    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) && diffTime < 600) {
                      if (galleryImages.length > 1) {
                        if (diffX > 0) {
                          handleImageSelect(selectedImageIndex > 0 ? selectedImageIndex - 1 : galleryImages.length - 1);
                        } else {
                          handleImageSelect(selectedImageIndex < galleryImages.length - 1 ? selectedImageIndex + 1 : 0);
                        }
                      }
                    } else if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
                      if (currentImage && !imgError) setIsLightboxOpen(true);
                    }
                  }
                  touchDetailsStartRef.current = null;
                }}
                onMouseEnter={() => productSettings.showZoom !== false && setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                className="w-full h-full flex items-center justify-center relative cursor-zoom-in touch-pan-y select-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (currentImage && !imgError) setIsLightboxOpen(true);
                  }
                }}
                aria-label="Click to enlarge image in full screen lightbox"
              >
                {!imgLoaded && !imgError && (
                  <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center" />
                )}
                {(() => {
                  const optCurrent = getOptimizedImageUrl(currentImage, { width: 900, quality: 85 });
                  if (imgError || !currentImage || !optCurrent) {
                    return (
                      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider opacity-70">Image preview unavailable</span>
                      </div>
                    );
                  }
                  return (
                    <>
                      <img 
                        key={currentImage}
                        src={optCurrent} 
                        alt={product.name} 
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        width={800}
                        height={800}
                        referrerPolicy="no-referrer"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                        className={`w-full h-full object-cover transition-transform duration-200 ${
                          isZoomed && productSettings.showZoom !== false ? 'scale-110' : 'scale-100'
                        }`} 
                      />

                      <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-medium backdrop-blur-xs pointer-events-none">
                        <Maximize2 size={14} />
                        <span className="hidden sm:inline text-[11px] font-bold">Fullscreen</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Bottom Left Rating Badge */}
              {productSettings.showRatings !== false && (
                <div 
                  className="absolute bottom-3.5 left-3.5 sm:bottom-4 sm:left-4 z-30"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ProductRatingBadge 
                    rating={ratingAgg.formattedRating} 
                    reviewsCount={ratingAgg.reviewsCount} 
                    size="xl" 
                    onClick={scrollToReviews}
                    title="Click to view customer reviews"
                  />
                </div>
              )}

              {/* Top Right Floating Action Buttons (Wishlist & Share) - Vertical View */}
              <div 
                className="absolute top-3 right-3 z-30 flex flex-col items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {productSettings.showWishlist !== false && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleWishlist(product);
                    }}
                    className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition-all cursor-pointer backdrop-blur-md active:scale-90 ${
                      inWishlist 
                        ? 'border-rose-300 bg-white text-rose-600 shadow-rose-100 ring-2 ring-rose-100' 
                        : 'border-slate-200/90 bg-white/95 hover:bg-white text-slate-700 hover:text-rose-600 hover:border-rose-200'
                    }`}
                    title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart size={19} className={inWishlist ? "fill-rose-500 text-rose-500" : ""} />
                  </button>
                )}

                {productSettings.showShare !== false && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleShare(e);
                    }}
                    className="w-10 h-10 rounded-full border border-slate-200/90 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-sm flex items-center justify-center transition-all cursor-pointer backdrop-blur-md active:scale-90 relative"
                    title="Share product link"
                    aria-label="Share product link"
                  >
                    {copiedLink ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
                    {copiedLink && (
                      <span className="absolute -bottom-7 right-0 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in duration-150">
                        Copied!
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
            {galleryImages.length > 1 && (
              <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar bg-white border-t border-slate-200/80">
                {galleryImages.map((img, idx) => {
                  const optThumb = getOptimizedImageUrl(img, { width: 140, quality: 75 });
                  if (!optThumb) return null;
                  const isSelected = selectedImageIndex === idx || currentImage === img;
                  return (
                    <button 
                      key={`${idx}-${img}`} 
                      type="button"
                      onClick={() => handleImageSelect(idx)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-slate-50 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <img 
                        src={optThumb} 
                        alt="" 
                        loading="lazy"
                        decoding="async"
                        width={64}
                        height={64}
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 gap-2">
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider truncate">
                {productSettings.showBrand !== false && <span>{product.brand}</span>}
                {productSettings.showBrand !== false && product.category && <span>•</span>}
                <span>{product.category}</span>
              </div>

              {productSettings.showStockInfo !== false && (
                inStock ? (
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                    IN STOCK
                  </span>
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">
                    OUT OF STOCK
                  </span>
                )
              )}
            </div>
            
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-black text-slate-900">₹{Number(product.price || 0).toLocaleString()}</span>
                {Boolean(product.discountPercentage && product.discountPercentage > 0) && (
                  <>
                    <span className="text-lg text-slate-400 line-through">₹{Number(product.originalPrice || 0).toLocaleString()}</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">{product.discountPercentage}% OFF</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Inclusive of all taxes & standard warranty</p>
            </div>

            {/* Compact Store Seller Info */}
            {(() => {
              const detailStoreId = product.storeId || 'main-store';
              const detailStoreInfo = getCachedStore(detailStoreId);
              const detailStoreName = detailStoreInfo?.storeName || product.storeName || (detailStoreId === 'main-store' ? 'ELECTRO STORE' : detailStoreId);
              return (
                <div className="mb-6 p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 bg-blue-600 text-white font-black text-sm rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                      {detailStoreName.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sold & Fulfilled By</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <Link
                        to={`/store/${detailStoreId}`}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors truncate block"
                      >
                        {detailStoreName}
                      </Link>
                      {(detailStoreInfo?.city || detailStoreInfo?.state) && (
                        <span className="text-[11px] text-slate-500 block truncate">
                          📍 {[detailStoreInfo?.city, detailStoreInfo?.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/store/${detailStoreId}`}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 text-xs font-bold rounded-xl shrink-0 transition-colors shadow-2xs"
                  >
                    Visit Store
                  </Link>
                </div>
              );
            })()}

            {product.features && product.features.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">Highlights</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.features?.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions & Quantity */}
            <div className="flex flex-col gap-4 mb-6 mt-auto">
              {inStock && (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
                    {availableStock !== Infinity && availableStock <= 5 && (
                      <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} /> Only {availableStock} left
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-l-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center font-bold text-xs text-slate-900 select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => (availableStock !== Infinity ? Math.min(availableStock, q + 1) : q + 1))}
                      disabled={availableStock !== Infinity && quantity >= availableStock}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-r-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Variant / Option Selector if available */}
              {variantsList.length > 0 && (
                <div id="variant-selection-section" className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      Select Option: <span className="text-rose-500">*</span>
                    </span>
                    {selectedVariant && (
                      <span className="text-xs font-bold text-blue-600">
                        {selectedVariant}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variantsList.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          selectedVariant === v
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Location Check (Step 4) */}
              <div 
                onClick={openLocationModal}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer group mb-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={15} className="text-blue-600 shrink-0" />
                  <div className="truncate">
                    {deliveryLocation?.pincode || deliveryLocation?.addressId ? (
                      <>
                        <span className="text-slate-500 font-medium">Deliver to: </span>
                        <strong className="text-slate-900">
                          {deliveryLocation.addressName ? `${deliveryLocation.addressName} (${deliveryLocation.city})` : (deliveryLocation.city || 'Selected Location')}
                        </strong>{' '}
                        <span className="font-mono text-slate-600 font-bold">({deliveryLocation.pincode})</span>
                        {pinCoverage?.serviceable ? (
                          <span className="text-emerald-700 font-bold block sm:inline sm:ml-2 text-[11px]">
                            ⚡ {pinCoverage.deliveryType} Delivery ({pinCoverage.transitDays}d)
                          </span>
                        ) : pinCoverage ? (
                          <span className="text-rose-600 font-bold block sm:inline sm:ml-2 text-[11px]">
                            ✕ Delivery Unavailable to {deliveryLocation.pincode}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold block sm:inline sm:ml-2 text-[11px]">
                            ⚠️ Invalid PIN code
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-bold text-slate-900">Choose Delivery Location</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-blue-600 group-hover:text-blue-700 px-2.5 py-1 bg-white border border-blue-200 rounded-lg shadow-2xs shrink-0 cursor-pointer"
                >
                  {deliveryLocation?.pincode || deliveryLocation?.addressId ? 'Change' : 'Select'}
                </button>
              </div>

              <div className="hidden md:grid grid-cols-2 gap-2 sm:gap-3">
                <button 
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock || isAddingToCart || isBuyingNow}
                  data-action="add-to-cart"
                  style={{ borderRadius: '12px' }}
                  className="add-to-cart-btn w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[12px] font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-xs cursor-pointer"
                >
                  {isAddingToCart ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding...</span>
                    </span>
                  ) : justAddedToCart ? (
                    <span className="flex items-center gap-1 text-emerald-100">
                      <Check size={16} /> Added!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart size={15} />
                      <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                    </span>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!inStock || isAddingToCart || isBuyingNow}
                  style={{ borderRadius: '12px' }}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[12px] font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-xs cursor-pointer"
                >
                  {isBuyingNow ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Zap size={15} className="fill-white text-white shrink-0" />
                      <span>{inStock ? 'Buy Now' : 'Currently Unavailable'}</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Features Guarantee Snippets */}
            {(productSettings.showDeliveryInfo !== false || productSettings.showReturnInfo !== false || productSettings.showWarrantyInfo !== false) && (
              <div className="grid grid-cols-3 gap-2 pt-6 border-t border-slate-100 text-center">
                {productSettings.showDeliveryInfo !== false && (
                  <div className="flex flex-col items-center">
                    <Truck size={18} className="text-blue-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700">{productSettings.deliveryTitle || 'Free Express Delivery'}</span>
                    <span className="text-[9px] text-slate-400">{productSettings.deliveryText || 'On orders > ₹500'}</span>
                  </div>
                )}
                {productSettings.showReturnInfo !== false && (
                  <div className="flex flex-col items-center border-x border-slate-100">
                    <RotateCcw size={18} className="text-blue-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700">{productSettings.returnTitle || '7-Day Replacement'}</span>
                    <span className="text-[9px] text-slate-400">{productSettings.returnText || 'Hassle-free guarantee'}</span>
                  </div>
                )}
                {productSettings.showWarrantyInfo !== false && (
                  <div className="flex flex-col items-center">
                    <ShieldCheck size={18} className="text-blue-600 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700">{productSettings.warrantyTitle || 'Brand Warranty'}</span>
                    <span className="text-[9px] text-slate-400">{productSettings.warrantyText || '100% Genuine product'}</span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Tabs */}
      <div id="product-tabs-section" className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden mb-6 sm:mb-12">
        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setActiveTab('description')}
            className={`whitespace-nowrap flex-1 sm:flex-initial text-center px-3 sm:px-6 py-3 sm:py-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'description' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/40' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Description
          </button>
          {productSettings.showSpecs !== false && (
            <button 
              onClick={() => setActiveTab('specifications')}
              className={`whitespace-nowrap flex-1 sm:flex-initial text-center px-3 sm:px-6 py-3 sm:py-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'specifications' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Specifications
            </button>
          )}
          {productSettings.showReviews !== false && (
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`whitespace-nowrap flex-1 sm:flex-initial text-center px-3 sm:px-6 py-3 sm:py-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'reviews' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40' 
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="sm:hidden">Reviews</span>
              <span className="hidden sm:inline">Customer Reviews</span>
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-600">
              <p>{product.description}</p>
            </div>
          )}
          {activeTab === 'specifications' && productSettings.showSpecs !== false && (
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
              {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex border-b border-slate-100 py-2.5 sm:py-3 text-xs">
                  <span className="w-1/3 font-bold text-slate-700">{key}</span>
                  <span className="w-2/3 text-slate-600">{value as string}</span>
                </div>
              ))}
              {!product.specifications && (
                <p className="text-xs text-slate-400">Standard specifications apply to this model.</p>
              )}
            </div>
          )}
          {activeTab === 'reviews' && productSettings.showReviews !== false && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl flex-wrap">
                <div className="text-center pr-6 border-r border-slate-200">
                  <div className="text-3xl font-black text-slate-900">{ratingAgg.formattedRating}</div>
                  <div className="flex text-amber-400 justify-center my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < ratingAgg.starCount ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{ratingAgg.reviewsCount} {ratingAgg.reviewsCount === 1 ? 'review' : 'reviews'}</div>
                </div>
                <div className="text-xs text-slate-600 flex-1">
                  <span className="font-bold text-slate-800">100% Verified Buyer Feedback</span>
                  <p className="text-slate-500 mt-0.5">Reviews are collected from verified customers who bought this item.</p>
                </div>
                {isEligibleToReview && (
                   <div className="w-full sm:w-auto">
                     <button
                       onClick={() => setIsReviewModalOpen(true)}
                       className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                     >
                       {userExistingReview ? 'Edit Review' : 'Write Review'}
                     </button>
                   </div>
                )}
              </div>
              
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 text-sm">Customer Reviews ({productReviews.length})</h3>
                {productReviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product!</p>
                ) : (
                  <div className="space-y-4">
                    {productReviews.map(rev => (
                      <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {(rev.userName || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{rev.userName || 'Customer'}</p>
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} size={10} className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"} />
                                ))}
                              </div>
                            </div>
                          </div>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Verified Purchase</span>
                          )}
                        </div>
                        {rev.title && <h4 className="font-bold text-slate-900 text-sm mb-1">{rev.title}</h4>}
                        {rev.comment && <p className="text-sm text-slate-600">{rev.comment}</p>}
                        {rev.reviewImage && (
                          <div className="mt-3 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200">
                            <img src={rev.reviewImage} alt="Review photo" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {rev.createdAt && (
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(rev.createdAt.toMillis ? rev.createdAt.toMillis() : rev.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {productSettings.showRelatedProducts !== false && relatedProducts.length > 0 && (
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Related Products</h2>
            <Link to={`/shop?category=${product.category}`} className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All Category →
            </Link>
          </div>
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-5">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      {productSettings.showRecentlyViewed !== false && recentlyViewedProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-5">
            {recentlyViewedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {product && user && (
        <ProductReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={product}
          userId={user.uid}
          userName={user.displayName || 'Customer'}
          existingReview={userExistingReview}
        />
      )}
      {/* FLOATING BOTTOM ACTION BAR (Stacked cleanly above Mobile Bottom Nav) */}
      <div 
        className="fixed left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 md:hidden"
        style={{ 
          bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))', 
          paddingTop: '0.625rem',
          paddingBottom: '0.625rem'
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Total Price Display */}
            <div className="flex flex-col min-w-0 pr-1 shrink-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Price</span>
              <span className="text-sm sm:text-base font-black text-slate-900 truncate">
                ₹{Number((product.price || 0) * quantity).toLocaleString()}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || isAddingToCart || isBuyingNow}
                style={{ borderRadius: '12px' }}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[12px] font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-xs cursor-pointer px-2"
              >
                {isAddingToCart ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Adding...</span>
                  </span>
                ) : justAddedToCart ? (
                  <span className="flex items-center gap-1 text-emerald-100">
                    <Check size={16} /> Added!
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart size={15} />
                    <span className="truncate">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!inStock || isAddingToCart || isBuyingNow}
                style={{ borderRadius: '12px' }}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[12px] font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-xs cursor-pointer px-2"
              >
                {isBuyingNow ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Redirecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap size={15} className="fill-white text-white shrink-0" />
                    <span className="truncate">{inStock ? 'Buy Now' : 'Unavailable'}</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Interactive Lightbox Viewer */}
      <ProductImageViewer
        isOpen={isLightboxOpen}
        images={galleryImages}
        initialIndex={selectedImageIndex}
        productName={product.name}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}

