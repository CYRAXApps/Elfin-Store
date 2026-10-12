import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { db, auth } from '../firebase';
import { extractAndUploadBase64Assets } from '../utils/assetUploader';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { PosSettings, defaultPosSettings } from '../types';
import type { DeliveryCoverageConfig } from '../services/indiaGeographicData';

export type { PosSettings, DeliveryCoverageConfig };
export { defaultPosSettings };

export interface TrustBenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  link?: string;
  enabled: boolean;
  order: number;
}

export interface HeroSlideItem {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText: string;
  buttonUrl: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  active: boolean;
  order: number;
}

export interface QuickCategoryItem {
  id: string;
  title: string;
  icon?: string;
  image?: string;
  link: string;
  enabled: boolean;
  order: number;
  displayStyle?: 'grid' | 'slider' | 'tiles';
}

export interface PopularCategoryItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  link: string;
  count?: string;
  enabled: boolean;
  order?: number;
}

export interface DealsConfig {
  title?: string;
  subtitle?: string;
  card1Badge?: string;
  card1Title?: string;
  card1Subtitle?: string;
  card1ButtonText?: string;
  card1ButtonUrl?: string;
  card1Image?: string;
  card2Badge?: string;
  card2Title?: string;
  card2Subtitle?: string;
  card2ButtonText?: string;
  card2ButtonUrl?: string;
  card2Image?: string;
}

export interface FlashSaleConfig {
  badgeText?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  discountPercent?: string;
  discountLabel?: string;
  image?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  avatar?: string;
  enabled: boolean;
  order: number;
}

export interface NewsletterConfig {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  placeholderText?: string;
  disclaimerText?: string;
}

export interface CustomContentConfig {
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  bgStyle?: string;
  image?: string;
}

export interface BrandsConfig {
  title?: string;
  subtitle?: string;
  customBrands?: Array<{ id: string; name: string; logo?: string; link?: string; enabled: boolean }>;
}

export interface ProductSectionConfig {
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
  mode?: 'manual' | 'popular' | 'newest' | 'category';
  selectedProductIds?: string[];
  selectedCategory?: string;
}

export interface HeroConfig {
  topPaddingDesktop?: number; // Top padding for all screens other than mobile (tablets, laptops, desktops). Default: 16px
  topPaddingMobile?: number;  // Top padding for mobile screens (<640px). Default: 0px
  autoplayInterval?: number;
}

export interface LogoSizes {
  desktopHeaderWidth: number; // default: 180 (px)
  mobileHeaderWidth: number;  // default: 150 (px)
  adminPanelWidth: number;    // default: 140 (px)
  footerWidth: number;        // default: 160 (px)
}

export interface SiteSettings {
  general: {
    storeName: string;
    shortStoreName: string;
    tagline: string;
    storeDescription: string;
    storeLogoUrl: string;
    faviconUrl: string;
    storeEmail: string;
    supportEmail: string;
    phone: string;
    whatsappNumber: string;
    businessAddress: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    businessHours: string;
    storeStatus: 'active' | 'maintenance' | 'closed';
    defaultLanguage: string;
    currency: string;
    currencySymbol: string;
    enableCountryCodeSelector?: boolean;
    logo?: string;
    favicon?: string;
    upiId?: string;
  };
  branding: {
    primaryLogo: string;
    mobileLogo: string;
    favicon: string;
    appIcon: string;
    loginLogo: string;
    adminLogo: string;
    emailLogo: string;
    brandName: string;
    brandTagline: string;
    logoSizes?: LogoSizes;
  };
  header: {
    headerVisible?: boolean;
    enabled?: boolean;
    announcementBar: {
      enabled: boolean;
      text: string;
      link: string;
      linkText: string;
      bgStyle: string;
      startDate?: string;
      endDate?: string;
    };
    logoVisible: boolean;
    searchVisible: boolean;
    accountVisible: boolean;
    wishlistVisible: boolean;
    cartVisible: boolean;
    navVisible: boolean;
    stickyHeader: boolean;
    mobileHeaderBehavior: 'fixed' | 'scroll';
    navItems: Array<{
      id: string;
      label: string;
      url: string;
      internalRoute?: string;
      externalUrl?: string;
      enabled: boolean;
      order: number;
      visibility?: 'all' | 'desktop' | 'mobile';
      showOnDesktop?: boolean;
      showOnMobile?: boolean;
      target?: '_self' | '_blank';
      badge?: string;
      subItems?: Array<{
        id: string;
        label: string;
        url: string;
        enabled?: boolean;
      }>;
    }>;
    mobileBottomNav?: {
      enabled: boolean;
      items: Array<{
        id: string;
        label: string;
        icon: string;
        url: string;
        enabled: boolean;
        order: number;
      }>;
    };
  };

  homepage: {
    sectionsOrder: string[];
    sections: Record<string, { id: string; title: string; enabled: boolean; order: number; config?: Record<string, any> }>;
    trustBenefits?: TrustBenefitItem[];
    heroSlides?: HeroSlideItem[];
    heroConfig?: HeroConfig;
    quickCategories?: QuickCategoryItem[];
    popularCategories?: PopularCategoryItem[];
    testimonials?: TestimonialItem[];
    customContent?: CustomContentConfig;
    dealsConfig?: DealsConfig;
    flashSaleConfig?: FlashSaleConfig;
    newsletterConfig?: NewsletterConfig;
    brandsConfig?: BrandsConfig;
    featuredProductsConfig?: ProductSectionConfig;
    bestSellersConfig?: ProductSectionConfig;
    newArrivalsConfig?: ProductSectionConfig;
    recentlyViewedConfig?: ProductSectionConfig;
  };
  heroBanners: Array<{
    id: string;
    desktopImage: string;
    mobileImage: string;
    heading: string;
    subtitle: string;
    buttonText: string;
    buttonUrl: string;
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;
    startDate?: string;
    endDate?: string;
    active: boolean;
    order: number;
  }>;
  shopPage: {
    productsPerPage: number;
    defaultSorting: string;
    availableSorting?: {
      featured?: boolean;
      newest?: boolean;
      priceLow?: boolean;
      priceHigh?: boolean;
      priceLowHigh?: boolean;
      priceHighLow?: boolean;
      rating?: boolean;
      bestselling?: boolean;
    };
    enableBrandFilter: boolean;
    enableCategoryFilter: boolean;
    enablePriceFilter: boolean;
    enableAvailabilityFilter: boolean;
    enableRatingFilter: boolean;
    enableSearch?: boolean;
    gridColumns: number;
    gridColumnsDesktop?: number;
    gridColumnsTablet?: number;
    gridColumnsMobile?: number;
    cardLayout: 'standard' | 'compact' | 'detailed';
    paginationType?: 'pagination' | 'infinite' | 'loadMore';
    showBadges?: boolean;
    showDiscountBadge: boolean;
    showNewBadge?: boolean;
    showBestSellerBadge?: boolean;
    showStockStatus: boolean;
    showRating: boolean;
    showWishlistBtn: boolean;
    showQuickView: boolean;
  };
  productPage: {
    showTitle?: boolean;
    showPrice?: boolean;
    showOriginalPrice?: boolean;
    showDiscount?: boolean;
    showZoom: boolean;
    showGallery?: boolean;
    thumbnailsPosition?: 'bottom' | 'left';
    showWishlist: boolean;
    showShare: boolean;
    showReviews: boolean;
    showRatings: boolean;
    showRelatedProducts: boolean;
    relatedProductsTitle?: string;
    relatedProductsLimit?: number;
    showRecommended: boolean;
    showRecentlyViewed: boolean;
    recentlyViewedTitle?: string;
    showStockInfo: boolean;
    showSku: boolean;
    showBrand: boolean;
    showCategory: boolean;
    showSpecs: boolean;
    showDescription?: boolean;
    showAddToCart?: boolean;
    showBuyNow?: boolean;
    showDeliveryInfo: boolean;
    showReturnInfo: boolean;
    showWarrantyInfo: boolean;
    deliveryInfoTitle?: string;
    deliveryInfoText?: string;
    deliveryTitle?: string;
    deliveryText?: string;
    returnInfoTitle?: string;
    returnInfoText?: string;
    returnTitle?: string;
    returnText?: string;
    warrantyInfoTitle?: string;
    warrantyInfoText?: string;
    warrantyTitle?: string;
    warrantyText?: string;
  };
  cartSettings: {
    cartTitle?: string;
    cartSubtitle?: string;
    emptyCartTitle?: string;
    emptyCartMessage?: string;
    continueShoppingText?: string;
    continueShoppingUrl?: string;
    checkoutButtonText?: string;
    enableQuantityControls?: boolean;
    enableRemoveItem?: boolean;
    enableCouponField: boolean;
    enableWishlistLink: boolean;
    showSavings: boolean;
    showEstimatedShipping: boolean;
    showStockWarning: boolean;
    showCartSummary?: boolean;
    minOrderAmount: number;
    minOrderMessage: string;
    freeShippingProgress: boolean;
    freeShippingThreshold: number;
    showCrossSells: boolean;
    crossSellsTitle?: string;
  };
  checkoutSettings: {
    checkoutTitle?: string;
    checkoutSubtitle?: string;
    guestCheckoutEnabled: boolean;
    loginRequired: boolean;
    couponFieldEnabled: boolean;
    couponPlaceholder?: string;
    shippingAddressFields: {
      landmarkRequired: boolean;
      phoneRequired: boolean;
      stateRequired?: boolean;
      cityRequired?: boolean;
    };
    showBillingAddress: boolean;
    sameAsShippingOption: boolean;
    showOrderNotes: boolean;
    termsAcceptanceRequired: boolean;
    termsText?: string;
    termsUrl?: string;
    showInvoiceInfo: boolean;
    showGstinField: boolean;
    showOrderSummary?: boolean;
    showItemImages?: boolean;
    showShippingOptions?: boolean;
    shippingSectionTitle?: string;
    showPaymentMethods?: boolean;
    razorpayTitle?: string;
    razorpayDescription?: string;
    placeOrderButtonText?: string;
    successTitle?: string;
    successSubtitle?: string;
    successMessage?: string;
    successButtonText?: string;
  };
  footer: {
    enabled?: boolean;
    showFooterLogo?: boolean;
    footerLogo?: string;
    customLogoUrl?: string;
    showAboutText?: boolean;
    aboutText: string;
    showAddress?: boolean;
    address: string;
    showPhone?: boolean;
    phone: string;
    showEmail?: boolean;
    email: string;
    showContactInfo?: boolean;
    showBusinessHours?: boolean;
    businessHours: string;
    columns: Array<{
      id: string;
      title: string;
      enabled?: boolean;
      order?: number;
      sortOrder?: number;
      links: Array<{ label: string; url: string }>;
    }>;
    showSocialIcons?: boolean;
    showSocialLinks?: boolean;
    socialLinks: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
      twitter?: string;
      linkedin?: string;
      whatsapp?: string;
    };
    showNewsletter?: boolean;
    newsletterTitle?: string;
    newsletterSubtitle?: string;
    newsletterButtonText?: string;
    newsletterPlaceholder?: string;
    showPaymentIcons: boolean;
    showPaymentBadges?: boolean;
    paymentBadges?: string[];
    showSecurityBadges?: boolean;
    securityBadges?: string[];
    securityBadgesText?: string;
    bottomLinks?: Array<{ label: string; url: string }>;
    copyrightText: string;
    copyrightYear: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textColor: string;
    backgroundColor: string;
    cardStyle: 'shadow-sm border' | 'border-2' | 'flat' | 'glass';
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    buttonRadius: 'sm' | 'md' | 'lg' | 'full';
    typographyScale: 'compact' | 'standard' | 'generous';
    headerStyle: 'light' | 'dark' | 'bordered' | 'clean' | 'modern' | 'compact';
    productCardStyle: 'standard' | 'bordered' | 'minimal' | 'modern';
    fontFamily?: string;
    colorScheme?: 'light' | 'dark' | 'system';
  };
  seo: {
    globalTitle: string;
    metaDescription: string;
    defaultKeywords: string;
    canonicalBaseUrl: string;
    defaultOgImage: string;
    defaultOgTitle?: string;
    defaultOgDescription?: string;
    robotsConfig: string;
    sitemapEnabled?: boolean;
    pageSeo: Record<string, {
      seoTitle: string;
      metaDescription: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      keywords?: string;
      canonicalUrl?: string;
      noIndex?: boolean;
    }>;
  };
  socialMedia: {
    facebookUrl: string;
    facebookEnabled?: boolean;
    instagramUrl: string;
    instagramEnabled?: boolean;
    youtubeUrl: string;
    youtubeEnabled?: boolean;
    xUrl: string;
    xEnabled?: boolean;
    linkedinUrl: string;
    linkedinEnabled?: boolean;
    whatsappUrl: string;
    whatsappEnabled?: boolean;
    pinterestUrl?: string;
    pinterestEnabled?: boolean;
    telegramUrl?: string;
    telegramEnabled?: boolean;
    showSocialIcons: boolean;
    showInHeader?: boolean;
    showInFooter?: boolean;
    showFloatingWhatsapp?: boolean;
  };
  contact: {
    businessName: string;
    legalEntityName?: string;
    address: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    country?: string;
    phone: string;
    whatsapp: string;
    email: string;
    supportEmail: string;
    salesEmail?: string;
    openingHours: string;
    holidayHours?: string;
    googleMapsUrl: string;
    showContactForm: boolean;
    gstin?: string;
    pan?: string;
  };
  policies: Record<string, {
    title: string;
    content: string;
    published: boolean;
    lastUpdated: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
  customPages: Array<{
    id: string;
    slug: string;
    title: string;
    content: string;
    published: boolean;
    seoTitle?: string;
    seoDescription?: string;
    updatedAt: string;
  }>;
  bannersAndPopups: Array<{
    id: string;
    type: 'banner' | 'popup' | 'strip';
    title: string;
    subtitle?: string;
    description: string;
    image?: string;
    buttonText?: string;
    url?: string;
    schedule?: { start?: string; end?: string };
    deviceTargeting: 'all' | 'desktop' | 'mobile';
    frequency: 'once_per_session' | 'always';
    active: boolean;
    order?: number;
    showCloseButton?: boolean;
    publishStatus?: 'published' | 'draft' | 'scheduled';
  }>;
  notifications: {
    enabled: boolean;
    orderConfirmation?: boolean;
    statusUpdates?: boolean;
    shippingUpdates?: boolean;
    deliveryUpdates?: boolean;
    customerAlerts?: boolean;
    senderEmail?: string;
    outOfStockMsg: string;
    lowStockMsg: string;
    freeShippingMsg: string;
    deliveryEstimateMsg: string;
    orderConfirmMsg: string;
    paymentSuccessMsg: string;
    paymentFailureMsg: string;
    maintenanceMsg: string;
    storeClosedMsg: string;
    showCloseButton?: boolean;
    displayTiming?: 'sticky' | '5s' | '8s' | '12s';
    targetPages?: {
      header: boolean;
      productPage: boolean;
      cart: boolean;
      checkout: boolean;
    };
    status?: 'active' | 'paused';
  };
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
    estimatedReturn: string;
    contactInfo: string;
    maintenanceImage: string;
    allowAdminBypass?: boolean;
    scheduleStart?: string;
    scheduleEnd?: string;
    autoActivateSchedule?: boolean;
  };
  regional: {
    country: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
    postalCodeFormat?: string;
    defaultState?: string;
    enableMultiCurrency?: boolean;
    availableCurrencies?: string[];
    weightUnit?: string;
    dimensionUnit?: string;
  };
  integrations: {
    razorpay: { enabled: boolean; status: string; mode: string; keyIdMasked?: string; lastVerified?: string };
    firebase: { enabled: boolean; status: string; db: string; auth: string; lastVerified?: string };
    analytics: { enabled: boolean; status: string; measurementId?: string; lastVerified?: string };
    searchSeo: { enabled: boolean; status: string; sitemapStatus: string; robotsStatus: string; lastVerified?: string };
    whatsapp: { enabled: boolean; status: string; businessNumber?: string };
    shipping: { enabled: boolean; status: string; provider: string };
  };
  advanced: {
    storeEnabled: boolean;
    customerRegistrationEnabled: boolean;
    guestCheckoutEnabled: boolean;
    reviewsEnabled: boolean;
    wishlistEnabled: boolean;
    searchEnabled: boolean;
    maintenanceMode: boolean;
    cacheTtlSeconds?: number;
    maxItemsPerOrder?: number;
    orderAutoCancelMinutes?: number;
    rateLimitEnabled?: boolean;
    enableDebugLogs?: boolean;
    featureFlags: Record<string, boolean>;
  };
  shipping: {
    shippingEnabled: boolean;
    defaultShippingCharge: number;
    freeShippingEnabled: boolean;
    freeShippingThreshold: number;
    deliveryAreas: string;
    deliveryCoverage?: DeliveryCoverageConfig;
    estimatedDeliveryDays: string;
    minDeliveryDays: number;
    maxDeliveryDays: number;
    shippingMethods: Array<{ id: string; name: string; charge: number; estimatedDays: string; enabled: boolean }>;
  };
  tax: {
    gstEnabled: boolean;
    gstin: string;
    taxRate: number;
    taxDisplay: 'exclusive' | 'inclusive' | 'both';
    invoicePrefix: string;
    invoiceNote: string;
  };
  payments: {
    onlinePaymentEnabled: boolean;
    codEnabled: boolean;
    codExtraCharge: number;
    paymentMethods: {
      upi: boolean;
      cards: boolean;
      netbanking: boolean;
      wallets: boolean;
    };
    environment: 'test' | 'live';
    razorpayKeyId?: string;
  };
  pos: PosSettings;
  updatedAt?: any;
  publishedAt?: any;
  updatedBy?: string;
  publishedBy?: string;
}

export const defaultTrustBenefits: TrustBenefitItem[] = [
  { id: 'tb-1', title: 'Free Shipping', description: 'On orders over ₹500', icon: 'Truck', link: '', enabled: true, order: 1 },
  { id: 'tb-2', title: 'Secure Payment', description: '100% secure checkout', icon: 'ShieldCheck', link: '', enabled: true, order: 2 },
  { id: 'tb-3', title: 'Easy Returns', description: '30 day return policy', icon: 'RotateCcw', link: '', enabled: true, order: 3 },
  { id: 'tb-4', title: '24/7 Support', description: 'Dedicated assistance', icon: 'Headphones', link: '', enabled: true, order: 4 },
];

export const defaultHeroConfig: HeroConfig = {
  topPaddingDesktop: 16, // Top padding for all screens other than mobile: 16px
  topPaddingMobile: 8,   // Mobile screens: 8px
  autoplayInterval: 6000,
};

export const defaultHeroSlides: HeroSlideItem[] = [
  {
    id: 'hero-1',
    badge: 'NEW ARRIVAL',
    title: 'MacBook Air M3',
    highlight: 'Supercharged.',
    description: "Lean. Mean. M3 machine. Experience the next generation of Apple silicon in the world's most popular laptop.",
    desktopImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    buttonText: 'SHOP NOW',
    buttonUrl: '/shop?category=Laptops',
    secondaryButtonText: 'VIEW ALL DEALS',
    secondaryButtonUrl: '/shop?sale=true',
    active: true,
    order: 1,
  },
  {
    id: 'hero-2',
    badge: 'EXCLUSIVE OFFER',
    title: 'Samsung Galaxy S24',
    highlight: 'Galaxy AI is here.',
    description: 'Unleash whole new levels of creativity, productivity and possibility with the new Galaxy S24 Ultra.',
    desktopImage: 'https://images.unsplash.com/photo-1707328131343-fc05504d60c2?w=1600&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1707328131343-fc05504d60c2?w=800&q=80',
    buttonText: 'SHOP SMARTPHONES',
    buttonUrl: '/shop?category=Smartphones',
    secondaryButtonText: 'EXPLORE OFFERS',
    secondaryButtonUrl: '/shop?sale=true',
    active: true,
    order: 2,
  },
  {
    id: 'hero-3',
    badge: 'BEST SELLER',
    title: 'Sony WH-1000XM5',
    highlight: 'Pure Silence.',
    description: 'Rewrite the rules for distraction-free listening. Industry-leading noise cancellation.',
    desktopImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=1600&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
    buttonText: 'GET YOURS',
    buttonUrl: '/shop?category=Audio',
    secondaryButtonText: 'SEE REVIEWS',
    secondaryButtonUrl: '/shop',
    active: true,
    order: 3,
  },
];

export const defaultQuickCategories: QuickCategoryItem[] = [
  { id: 'qc-1', title: 'Smartphones', icon: 'Smartphone', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80', link: '/shop?category=Smartphones', enabled: true, order: 1 },
  { id: 'qc-2', title: 'Laptops', icon: 'Laptop', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80', link: '/shop?category=Laptops', enabled: true, order: 2 },
  { id: 'qc-3', title: 'Audio & Buds', icon: 'Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', link: '/shop?category=Audio', enabled: true, order: 3 },
  { id: 'qc-4', title: 'Smartwatches', icon: 'Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80', link: '/shop?category=Wearables', enabled: true, order: 4 },
  { id: 'qc-5', title: 'Accessories', icon: 'Cpu', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&q=80', link: '/shop?category=Accessories', enabled: true, order: 5 },
  { id: 'qc-6', title: 'Gaming Gear', icon: 'Gamepad2', image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=300&q=80', link: '/shop?category=Gaming', enabled: true, order: 6 },
];

export const defaultPopularCategories: PopularCategoryItem[] = [
  { id: 'pop-1', title: 'Flagship Phones', subtitle: '5G Smartphones & Accessories', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', link: '/shop?category=Smartphones', count: '14+ Models', enabled: true, order: 1 },
  { id: 'pop-2', title: 'Workstation Laptops', subtitle: 'MacBook, ThinkPad & ROG', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80', link: '/shop?category=Laptops', count: '18+ Models', enabled: true, order: 2 },
  { id: 'pop-3', title: 'Studio Audio & ANC', subtitle: 'Noise Cancelling & Hi-Res', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', link: '/shop?category=Audio', count: '24+ Models', enabled: true, order: 3 },
  { id: 'pop-4', title: 'Smart Wearables', subtitle: 'Fitness Trackers & GPS Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', link: '/shop?category=Wearables', count: '10+ Models', enabled: true, order: 4 },
];

export const defaultTestimonials: TestimonialItem[] = [];

export const defaultDealsConfig: DealsConfig = {
  title: 'Upgrade Your Workspace.',
  subtitle: 'Up to 20% off on premium laptops and professional accessories.',
  card1Badge: 'Limited Time Offer',
  card1Title: 'Upgrade Your Workspace.',
  card1Subtitle: 'Up to 20% off on premium laptops and professional accessories.',
  card1ButtonText: 'Shop Laptops',
  card1ButtonUrl: '/shop?category=Laptops',
  card1Image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80',
  card2Badge: 'New Generation',
  card2Title: 'Smart Living Starts Here.',
  card2Subtitle: 'Make your home smarter with the latest connected devices.',
  card2ButtonText: 'Shop Smart Devices',
  card2ButtonUrl: '/shop?category=Smartphones',
  card2Image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=600&q=80',
};

export const defaultFlashSaleConfig: FlashSaleConfig = {
  badgeText: 'Flash Sale Ends in 05:23:41',
  title: 'Massive Discounts on Audio.',
  description: "Don't miss out on these exclusive limited-time offers on top tier headphones and earbuds.",
  buttonText: 'VIEW ALL DEALS',
  buttonUrl: '/shop?sale=true',
  discountPercent: '14%',
  discountLabel: 'OFF',
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
};

export const defaultNewsletterConfig: NewsletterConfig = {
  title: 'Stay Ahead of the Curve.',
  subtitle: 'Join our newsletter to get updates about new product launches, exclusive deals, and tech news.',
  description: 'By subscribing, you agree to our Terms of Service and Privacy Policy.',
  buttonText: 'SUBSCRIBE',
  placeholderText: 'Enter your email address...',
  disclaimerText: 'By subscribing, you agree to our Terms of Service and Privacy Policy.',
};

export const defaultCustomContent: CustomContentConfig = {
  title: 'Certified Authenticity & Warranty Protection',
  subtitle: 'Every device sold at Electro Store comes direct from authorized brand distributors.',
  content: 'We offer genuine GST tax invoices on every order, hassle-free 30-day replacements, and authorized service center brand warranty valid across all Indian states and cities.',
  buttonText: 'Learn More About Us',
  buttonUrl: '/about',
  bgStyle: 'bg-slate-900 text-white',
  image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
};

export const defaultBrandsConfig: BrandsConfig = {
  title: 'Trusted by Top Global Brands',
  subtitle: 'Authorized retailer for official brand warranties & genuine accessories',
  customBrands: [
    { id: 'b1', name: 'Apple', enabled: true },
    { id: 'b2', name: 'Samsung', enabled: true },
    { id: 'b3', name: 'Sony', enabled: true },
    { id: 'b4', name: 'Dell', enabled: true },
    { id: 'b5', name: 'Lenovo', enabled: true },
    { id: 'b6', name: 'HP', enabled: true },
    { id: 'b7', name: 'Asus', enabled: true },
  ],
};

export const defaultFeaturedProductsConfig: ProductSectionConfig = {
  title: 'Top Rated Products',
  subtitle: 'Hand-picked flagship electronics with exceptional customer ratings',
  limit: 4,
  showViewAll: true,
};

export const defaultBestSellersConfig: ProductSectionConfig = {
  title: 'Trending Now',
  subtitle: 'Most popular and highest volume purchases this week',
  limit: 4,
  showViewAll: true,
};

export const defaultNewArrivalsConfig: ProductSectionConfig = {
  title: 'New Arrivals',
  subtitle: 'Fresh tech releases, newly unboxed and in stock',
  limit: 4,
  showViewAll: true,
};

export const defaultRecentlyViewedConfig: ProductSectionConfig = {
  title: 'Recently Viewed',
  subtitle: 'Jump back to products you inspected recently',
  limit: 4,
  showViewAll: false,
};

export const defaultSiteSettings: SiteSettings = {
  general: {
    storeName: 'ELECTRO STORE',
    shortStoreName: 'ELECTRO',
    tagline: 'Your trusted destination for genuine electronics & gadgets',
    storeDescription: 'Shop laptops, smartphones, headphones, and smart home tech at Electro Store with certified brand warranty, GST invoice & express delivery across India.',
    storeLogoUrl: '/assets/logo.svg',
    faviconUrl: '/assets/favicon.svg',
    storeEmail: '',
    supportEmail: '',
    phone: '',
    whatsappNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    businessHours: '',
    storeStatus: 'active',
    defaultLanguage: 'English (en-IN)',
    currency: 'INR',
    currencySymbol: '₹',
    enableCountryCodeSelector: false,
  },
  branding: {
    primaryLogo: '/assets/logo.svg',
    mobileLogo: '/assets/favicon.svg',
    favicon: '/assets/favicon.svg',
    appIcon: '/assets/favicon.svg',
    loginLogo: '/assets/logo.svg',
    adminLogo: '/assets/logo.svg',
    emailLogo: '/assets/logo.svg',
    brandName: 'ELECTRO STORE',
    brandTagline: 'Next-Gen Electronics & Smart Tech',
    logoSizes: {
      desktopHeaderWidth: 180,
      mobileHeaderWidth: 150,
      adminPanelWidth: 140,
      footerWidth: 160,
    },
  },
  header: {
    headerVisible: true,
    enabled: true,
    announcementBar: {
      enabled: true,
      text: 'Free Express Delivery on orders over ₹500! Use code WELCOME10 for 10% Off.',
      link: '/shop',
      linkText: 'Shop Now',
      bgStyle: 'bg-slate-900 text-white',
    },
    logoVisible: true,
    searchVisible: true,
    accountVisible: true,
    wishlistVisible: true,
    cartVisible: true,
    navVisible: true,
    stickyHeader: true,
    mobileHeaderBehavior: 'fixed',
    navItems: [
      { id: 'home', label: 'Home', url: '/', internalRoute: '/', enabled: true, order: 1, visibility: 'all', showOnDesktop: true, showOnMobile: true },
      { id: 'shop', label: 'Shop All', url: '/shop', internalRoute: '/shop', enabled: true, order: 2, visibility: 'all', showOnDesktop: true, showOnMobile: true },
      { id: 'deals', label: 'Top Deals', url: '/shop?sale=true', internalRoute: '/shop?sale=true', enabled: true, order: 3, visibility: 'all', showOnDesktop: true, showOnMobile: true },
      { id: 'new', label: 'New Arrivals', url: '/shop?new=true', internalRoute: '/shop?new=true', enabled: true, order: 4, visibility: 'all', showOnDesktop: true, showOnMobile: true },
      { id: 'categories', label: 'Categories', url: '/shop?category=all', internalRoute: '/shop?category=all', enabled: true, order: 5, visibility: 'all', showOnDesktop: true, showOnMobile: true },
      { id: 'support', label: 'Support & Returns', url: '/support', internalRoute: '/support', enabled: true, order: 6, visibility: 'all', showOnDesktop: true, showOnMobile: true },
    ],
    mobileBottomNav: {
      enabled: true,
      items: [
        { id: 'home', label: 'Home', icon: 'Home', url: '/', enabled: true, order: 1 },
        { id: 'categories', label: 'Categories', icon: 'Grid', url: '/shop?category=all', enabled: true, order: 2 },
        { id: 'cart', label: 'Cart', icon: 'ShoppingCart', url: '/cart', enabled: true, order: 3 },
        { id: 'account', label: 'Account', icon: 'User', url: '/account', enabled: true, order: 4 },
      ],
    },
  },
  homepage: {
    sectionsOrder: [
      'hero',
      'trust_section',
      'quick_categories',
      'deals',
      'featured',
      'best_sellers',
      'new_arrivals',
      'popular_categories',
      'flash_sale',
      'brands',
      'testimonials',
      'recently_viewed',
      'custom_content',
      'newsletter'
    ],
    sections: {
      hero: { id: 'hero', title: 'Hero Carousel Slider', enabled: true, order: 1 },
      trust_section: { id: 'trust_section', title: 'Trust & Benefits Highlights', enabled: true, order: 2 },
      quick_categories: { id: 'quick_categories', title: 'Quick Category Icons Bar', enabled: true, order: 3 },
      deals: { id: 'deals', title: 'Flash Deals & Discounts', enabled: true, order: 4 },
      featured: { id: 'featured', title: 'Top Rated Products', enabled: true, order: 5 },
      best_sellers: { id: 'best_sellers', title: 'Trending Now', enabled: true, order: 6 },
      new_arrivals: { id: 'new_arrivals', title: 'New Arrivals Showcase', enabled: true, order: 7 },
      popular_categories: { id: 'popular_categories', title: 'Popular Category Grid', enabled: true, order: 8 },
      flash_sale: { id: 'flash_sale', title: 'Promotional Flash Sale Banner', enabled: true, order: 9 },
      brands: { id: 'brands', title: 'Trusted by Top Global Brands', enabled: true, order: 10 },
      testimonials: { id: 'testimonials', title: 'Customer Reviews & Testimonials', enabled: true, order: 11 },
      recently_viewed: { id: 'recently_viewed', title: 'Recently Viewed Products', enabled: true, order: 12 },
      custom_content: { id: 'custom_content', title: 'Custom Brand & Warranty Content', enabled: true, order: 13 },
      newsletter: { id: 'newsletter', title: 'Newsletter & Promo Signup', enabled: false, order: 14 },
    },
    trustBenefits: defaultTrustBenefits,
    heroSlides: defaultHeroSlides,
    heroConfig: defaultHeroConfig,
    quickCategories: defaultQuickCategories,
    popularCategories: defaultPopularCategories,
    testimonials: defaultTestimonials,
    customContent: defaultCustomContent,
    dealsConfig: defaultDealsConfig,
    flashSaleConfig: defaultFlashSaleConfig,
    newsletterConfig: defaultNewsletterConfig,
    brandsConfig: defaultBrandsConfig,
    featuredProductsConfig: defaultFeaturedProductsConfig,
    bestSellersConfig: defaultBestSellersConfig,
    newArrivalsConfig: defaultNewArrivalsConfig,
    recentlyViewedConfig: defaultRecentlyViewedConfig,
  },
  heroBanners: [
    {
      id: 'banner-1',
      desktopImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
      heading: 'Next-Gen Smartphones & 5G Tech',
      subtitle: 'Instant ₹3,000 Cashback with HDFC & ICICI Cards + Free Wireless Earbuds',
      buttonText: 'Shop Smartphones',
      buttonUrl: '/shop?category=Smartphones',
      secondaryButtonText: 'Explore Offers',
      secondaryButtonUrl: '/shop?sale=true',
      active: true,
      order: 1,
    },
    {
      id: 'banner-2',
      desktopImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1600&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      heading: 'Ultra-Performance Laptops & Workstations',
      subtitle: 'Powered by M3 & Intel Core Ultra processors with official GST Input Tax Credit',
      buttonText: 'Explore Laptops',
      buttonUrl: '/shop?category=Laptops',
      active: true,
      order: 2,
    }
  ],
  shopPage: {
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
    gridColumns: 4,
    gridColumnsDesktop: 4,
    gridColumnsTablet: 3,
    gridColumnsMobile: 2,
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
  },
  productPage: {
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
  },
  cartSettings: {
    cartTitle: 'Shopping Cart',
    cartSubtitle: 'Review items in your cart, apply coupons, and proceed to secure checkout.',
    emptyCartTitle: 'Your cart is empty',
    emptyCartMessage: "Looks like you haven't added anything to your cart yet.",
    continueShoppingText: 'Continue Shopping',
    continueShoppingUrl: '/shop',
    checkoutButtonText: 'PROCEED TO CHECKOUT',
    enableQuantityControls: true,
    enableRemoveItem: true,
    enableCouponField: true,
    enableWishlistLink: true,
    showSavings: true,
    showEstimatedShipping: true,
    showStockWarning: true,
    showCartSummary: true,
    minOrderAmount: 0,
    minOrderMessage: 'Minimum order total is ₹0.',
    freeShippingProgress: true,
    freeShippingThreshold: 500,
    showCrossSells: true,
    crossSellsTitle: 'You May Also Like',
  },
  checkoutSettings: {
    checkoutTitle: 'Secure Checkout',
    checkoutSubtitle: 'Review shipping destination, delivery method, and payment summary.',
    guestCheckoutEnabled: true,
    loginRequired: false,
    couponFieldEnabled: true,
    couponPlaceholder: 'Enter coupon code',
    shippingAddressFields: {
      landmarkRequired: false,
      phoneRequired: true,
      stateRequired: true,
      cityRequired: true,
    },
    showBillingAddress: true,
    sameAsShippingOption: true,
    showOrderNotes: true,
    termsAcceptanceRequired: true,
    termsText: "I agree to the Terms of Service and Privacy Policy.",
    termsUrl: '/terms',
    showInvoiceInfo: true,
    showGstinField: true,
    showOrderSummary: true,
    showItemImages: true,
    showShippingOptions: true,
    shippingSectionTitle: 'Delivery & Shipping Speed',
    showPaymentMethods: true,
    razorpayTitle: 'Razorpay Secure Gateway',
    razorpayDescription: 'Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets',
    placeOrderButtonText: 'PAY VIA RAZORPAY',
    successTitle: 'Thank You for Your Order!',
    successSubtitle: 'Order Confirmed & Payment Verified',
    successMessage: "Your payment was successfully processed. We've dispatched your order confirmation and official GST tax invoice.",
    successButtonText: 'Track Order Status',
  },
  footer: {
    showFooterLogo: true,
    customLogoUrl: '',
    showAboutText: true,
    aboutText: '',
    showAddress: true,
    address: '',
    showPhone: true,
    phone: '',
    showEmail: true,
    email: '',
    showBusinessHours: true,
    businessHours: '',
    columns: [
      {
        id: 'shop-col',
        title: 'Shop Catalog',
        enabled: true,
        order: 1,
        links: [
          { label: 'Smartphones', url: '/shop?category=Smartphones' },
          { label: 'Laptops & PCs', url: '/shop?category=Laptops' },
          { label: 'Audio & Headphones', url: '/shop?category=Audio' },
          { label: 'Smart Watches', url: '/shop?category=Smart%20Watches' },
          { label: 'Special Offers', url: '/shop?sale=true' },
        ],
      },
      {
        id: 'support-col',
        title: 'Customer Care',
        enabled: true,
        order: 2,
        links: [
          { label: '24/7 Help Center', url: '/support' },
          { label: 'Track Your Order', url: '/orders' },
          { label: 'Returns & Refunds', url: '/support?tab=returns' },
          { label: 'Rewards & Store Credit', url: '/rewards' },
          { label: 'GST Invoices', url: '/terms' },
        ],
      },
      {
        id: 'company-col',
        title: 'Company',
        enabled: true,
        order: 3,
        links: [
          { label: 'About Us', url: '/about' },
          { label: 'Contact Us', url: '/contact' },
          { label: 'Privacy Policy', url: '/privacy' },
          { label: 'Terms of Service', url: '/terms' },
          { label: 'Shipping Policy', url: '/shipping-policy' },
        ],
      },
    ],
    showSocialIcons: true,
    socialLinks: {
      facebook: '',
      instagram: '',
      youtube: '',
      twitter: '',
      linkedin: '',
      whatsapp: '',
    },
    showNewsletter: true,
    newsletterTitle: 'Stay in the loop with tech releases',
    newsletterSubtitle: 'Subscribe to get secret deals, firmware updates, and promo codes.',
    newsletterButtonText: 'Subscribe',
    newsletterPlaceholder: 'Enter your email address...',
    showPaymentIcons: true,
    showSecurityBadges: true,
    securityBadgesText: '100% Genuine Products • 256-Bit SSL Encrypted • Authorized Brand Warranties',
    copyrightText: 'ELECTRO STORE. All rights reserved.',
    copyrightYear: new Date().getFullYear().toString(),
  },
  theme: {
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    accentColor: '#ef4444',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    cardStyle: 'shadow-sm border',
    borderRadius: 'md',
    buttonRadius: 'md',
    typographyScale: 'standard',
    headerStyle: 'light',
    productCardStyle: 'standard',
    fontFamily: 'Inter',
    colorScheme: 'light',
  },
  seo: {
    globalTitle: 'ELECTRO STORE — Laptops, Smartphones & Electronics',
    metaDescription: 'Shop genuine laptops, smartphones, headphones and electronics with official brand warranty, GST invoice, and express delivery.',
    defaultKeywords: 'electro store, laptops, smartphones, audio, gaming, electronics online',
    canonicalBaseUrl: '',
    defaultOgImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    defaultOgTitle: 'ELECTRO STORE — SMART TECH. BETTER LIFE.',
    defaultOgDescription: 'Explore genuine electronics, laptops, smartphones, and accessories with free shipping across India.',
    robotsConfig: 'index, follow',
    sitemapEnabled: true,
    pageSeo: {
      home: { seoTitle: 'ELECTRO STORE — Premium Electronics & Smart Tech', metaDescription: 'Discover the latest laptops, smartphones, headphones, and home gadgets at Electro Store.', keywords: 'electronics, laptops, gadgets', canonicalUrl: '/', noIndex: false },
      shop: { seoTitle: 'Shop Laptops, Phones & Tech Catalog | ELECTRO STORE', metaDescription: 'Browse our full catalog of certified laptops, smartphones, gaming gear, and accessories.', keywords: 'shop laptops, buy phones', canonicalUrl: '/shop', noIndex: false },
      categories: { seoTitle: 'Electronics Categories | ELECTRO STORE', metaDescription: 'Explore electronics categorized by laptops, smartphones, audio, smart home and gaming.', keywords: 'categories, audio, mobile', canonicalUrl: '/categories', noIndex: false },
      brands: { seoTitle: 'Authorized Brands | ELECTRO STORE', metaDescription: 'Shop authorized products from Apple, Samsung, Sony, Dell, Lenovo, HP, Asus and more.', keywords: 'authorized brands, apple, samsung', canonicalUrl: '/brands', noIndex: false },
      products: { seoTitle: 'Product Details | ELECTRO STORE', metaDescription: 'Read specifications, customer reviews, warranty details and order with GST invoice.', keywords: 'product specs, reviews', canonicalUrl: '/product', noIndex: false },
    },
  },
  socialMedia: {
    facebookUrl: '',
    facebookEnabled: false,
    instagramUrl: '',
    instagramEnabled: false,
    youtubeUrl: '',
    youtubeEnabled: false,
    xUrl: '',
    xEnabled: false,
    linkedinUrl: '',
    linkedinEnabled: false,
    whatsappUrl: '',
    whatsappEnabled: false,
    pinterestUrl: '',
    pinterestEnabled: false,
    telegramUrl: '',
    telegramEnabled: false,
    showSocialIcons: true,
    showInHeader: true,
    showInFooter: true,
    showFloatingWhatsapp: false,
  },
  contact: {
    businessName: '',
    legalEntityName: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    whatsapp: '',
    email: '',
    supportEmail: '',
    salesEmail: '',
    openingHours: '',
    holidayHours: '',
    googleMapsUrl: '',
    showContactForm: true,
    gstin: '',
    pan: '',
  },
  policies: {
    shipping: {
      title: 'Shipping Policy',
      content: `### Shipping & Delivery Guidelines\n\nWe deliver across all serviceable PIN codes in India through top courier partners (BlueDart, Delhivery, Expressbees).\n\n- **Standard Delivery:** 3 - 5 Business Days.\n- **Express Delivery:** 1 - 2 Business Days in metro cities.\n- **Free Shipping:** Applicable on all orders above ₹500.\n- **Tracking:** Once shipped, tracking details are sent via SMS and Email and accessible under My Orders.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Shipping & Delivery Policy | ELECTRO STORE',
      seoDescription: 'Learn about our delivery timelines, free shipping thresholds, and tracking processes.',
    },
    return: {
      title: 'Return Policy',
      content: `### Returns & Replacement Policy\n\nWe offer a **7-Day Replacement Guarantee** for defective, damaged, or incorrect items.\n\n- Items must be returned in original packaging with all manuals, accessories, and warranty cards intact.\n- Return requests can be initiated directly under your Account > Support & Returns section.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Return & Replacement Policy | ELECTRO STORE',
      seoDescription: 'Read our 7-day return policy and process for initiating replacement requests.',
    },
    refund: {
      title: 'Refund Policy',
      content: `### Refund Guidelines\n\nRefunds for returned or cancelled orders are processed to the original payment method (Razorpay / Bank Account / Store Credit) within **3 to 5 business days** post quality inspection.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Refund Policy | ELECTRO STORE',
      seoDescription: 'Information on refund processing times and store credit options.',
    },
    cancellation: {
      title: 'Cancellation Policy',
      content: `### Order Cancellation\n\nOrders can be cancelled free of charge prior to dispatch. Once shipped, cancellations can be processed as returns upon delivery.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Cancellation Policy | ELECTRO STORE',
      seoDescription: 'Guidelines on cancelling orders before shipment.',
    },
    warranty: {
      title: 'Warranty Policy',
      content: `### Brand Warranty Coverage\n\nAll products sold on Electro Store come with **100% Genuine Brand Warranty** honored by official service centers across India. Tax invoices provided serve as valid proof of purchase for warranty claims.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Warranty Coverage Policy | ELECTRO STORE',
      seoDescription: 'Details on brand warranty proof of purchase and service center claims.',
    },
    privacy: {
      title: 'Privacy Policy',
      content: `### Privacy & Data Protection\n\nYour data privacy is strictly protected. We encrypt user transactions and never sell customer data to third-party advertisers.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Privacy Policy | ELECTRO STORE',
      seoDescription: 'How Electro Store collects, protects, and handles customer data.',
    },
    terms: {
      title: 'Terms & Conditions',
      content: `### Terms of Service\n\nBy accessing Electro Store, you agree to comply with our store guidelines, pricing terms, GST invoice policies, and acceptable website usage standards.`,
      published: true,
      lastUpdated: '2026-09-01',
      seoTitle: 'Terms & Conditions | ELECTRO STORE',
      seoDescription: 'Read our terms of service and store user agreement.',
    },
  },
  customPages: [
    {
      id: 'about-us',
      slug: 'about',
      title: 'About Electro Store',
      content: 'Electro Store is a premier electronics retailer delivering genuine laptops, smartphones, audio systems, and smart home appliances with official brand warranty and GST invoices across India.',
      published: true,
      seoTitle: 'About Us | ELECTRO STORE',
      seoDescription: 'Learn about Electro Store mission, brand authorizations and commitment to authentic technology.',
      updatedAt: '2026-09-01',
    },
    {
      id: 'contact-us',
      slug: 'contact',
      title: 'Contact Corporate Office',
      content: 'Reach our corporate team for bulk orders, GST billing queries, brand partnerships, or general support.',
      published: true,
      seoTitle: 'Contact Us | ELECTRO STORE',
      seoDescription: 'Get in touch with Electro Store support and sales team.',
      updatedAt: '2026-09-01',
    },
  ],
  bannersAndPopups: [
    {
      id: 'popup-welcome',
      type: 'strip',
      title: 'Welcome Offer',
      subtitle: 'Festive season discount',
      description: 'Get ₹500 Instant Store Credit on your first purchase! Use Code: WELCOME500',
      buttonText: 'Claim Offer',
      url: '/shop',
      deviceTargeting: 'all',
      frequency: 'once_per_session',
      active: true,
      order: 1,
      showCloseButton: true,
      publishStatus: 'published',
    },
  ],
  notifications: {
    enabled: true,
    orderConfirmation: true,
    statusUpdates: true,
    shippingUpdates: true,
    deliveryUpdates: true,
    customerAlerts: true,
    senderEmail: '',
    outOfStockMsg: 'This item is currently out of stock. Subscribe for restock alerts.',
    lowStockMsg: 'Hurry! Only a few units left in stock.',
    freeShippingMsg: 'Add ₹{remaining} more to unlock FREE Express Shipping!',
    deliveryEstimateMsg: 'Estimated delivery within 3-5 business days.',
    orderConfirmMsg: 'Thank you for your order! Your invoice and tracking details have been generated.',
    paymentSuccessMsg: 'Payment captured successfully via Razorpay.',
    paymentFailureMsg: 'Payment was not completed. Please try again or choose an alternate payment method.',
    maintenanceMsg: 'We are performing scheduled store upgrades. We will be back shortly!',
    storeClosedMsg: 'The store is currently closed for new orders. Please check back during business hours.',
    showCloseButton: true,
    displayTiming: '8s',
    targetPages: {
      header: true,
      productPage: true,
      cart: true,
      checkout: true,
    },
    status: 'active',
  },
  maintenance: {
    enabled: false,
    title: 'Scheduled System Upgrade',
    message: 'We are upgrading our servers and catalog to bring you a faster shopping experience. We will be back online shortly!',
    estimatedReturn: 'Back online today by 6:00 PM IST',
    contactInfo: '',
    maintenanceImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
    allowAdminBypass: true,
    scheduleStart: '',
    scheduleEnd: '',
    autoActivateSchedule: false,
  },
  regional: {
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN',
    postalCodeFormat: '^[1-9][0-9]{5}$',
    defaultState: 'Karnataka',
    enableMultiCurrency: false,
    availableCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
    weightUnit: 'kg',
    dimensionUnit: 'cm',
  },
  integrations: {
    razorpay: { enabled: true, status: 'Test Mode', mode: 'Test Sandbox', keyIdMasked: '', lastVerified: 'Test Mode' },
    firebase: { enabled: true, status: 'Configured', db: 'Cloud Firestore', auth: 'Firebase Google Auth', lastVerified: 'Configured' },
    analytics: { enabled: false, status: 'Not Configured', measurementId: '', lastVerified: 'Not Configured' },
    searchSeo: { enabled: true, status: 'Ready', sitemapStatus: 'XML Sitemap Ready', robotsStatus: 'Robots.txt Ready', lastVerified: 'Ready' },
    whatsapp: { enabled: false, status: 'Not Configured', businessNumber: '' },
    shipping: { enabled: true, status: 'Active', provider: 'Pan-India Serviceable PIN Codes' },
  },
  advanced: {
    storeEnabled: true,
    customerRegistrationEnabled: true,
    guestCheckoutEnabled: true,
    reviewsEnabled: true,
    wishlistEnabled: true,
    searchEnabled: true,
    maintenanceMode: false,
    cacheTtlSeconds: 300,
    maxItemsPerOrder: 50,
    orderAutoCancelMinutes: 60,
    rateLimitEnabled: true,
    enableDebugLogs: false,
    featureFlags: {
      loyaltyProgram: true,
      giftCards: true,
      instantStoreCredit: true,
      gstInvoicing: true,
      fastCheckout: true,
      abandonedCartRecovery: true,
    },
  },
  shipping: {
    shippingEnabled: true,
    defaultShippingCharge: 50,
    freeShippingEnabled: true,
    freeShippingThreshold: 500,
    deliveryAreas: 'All Serviceable PIN Codes across India (20,000+ PINs)',
    deliveryCoverage: {
      mode: 'all_except_excluded',
      coveredStates: ['West Bengal', 'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Gujarat'],
      coveredDistricts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Bengaluru Urban', 'Mumbai Suburban', 'Pune', 'New Delhi', 'South Delhi', 'Chennai', 'Hyderabad'],
      coveredSubDivisions: [],
      activePincodes: [],
      excludedPincodes: [],
      pincodeRules: {},
      lastUpdated: new Date().toISOString(),
      notes: 'Automated PIN code coverage engine configured by State -> District -> Sub-divisions.'
    },
    estimatedDeliveryDays: '3 - 5 Business Days',
    minDeliveryDays: 3,
    maxDeliveryDays: 5,
    shippingMethods: [
      { id: 'standard', name: 'Standard Express Delivery', charge: 50, estimatedDays: '3 - 5 Business Days', enabled: true },
      { id: 'free', name: 'Free Standard Delivery', charge: 0, estimatedDays: '3 - 5 Business Days', enabled: true },
    ],
  },
  tax: {
    gstEnabled: true,
    gstin: '',
    taxRate: 18,
    taxDisplay: 'exclusive',
    invoicePrefix: 'EST-2026-',
    invoiceNote: 'Authorized computer-generated tax invoice. 100% Genuine brand warranty valid across India.',
  },
  payments: {
    onlinePaymentEnabled: true,
    codEnabled: true,
    codExtraCharge: 0,
    paymentMethods: {
      upi: true,
      cards: true,
      netbanking: true,
      wallets: true,
    },
    environment: 'test',
    razorpayKeyId: '',
  },
  pos: defaultPosSettings,
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  adminSettings: SiteSettings;
  liveSettings: SiteSettings;
  draftSettings: SiteSettings | null;
  hasUnpublishedDraft: boolean;
  isPreviewMode: boolean;
  setIsPreviewMode: (val: boolean) => void;
  loading: boolean;
  isConfigLoaded: boolean;
  error: string | null;
  saveDraft: (updated: SiteSettings, adminEmail?: string) => Promise<void>;
  publishSettings: (updated?: SiteSettings, adminEmail?: string) => Promise<void>;
  revertDraft: (adminEmail?: string) => Promise<void>;
  resetCmsToDefaults: (adminEmail?: string) => Promise<void>;
  resetStoreSettingsToDefaults: (adminEmail?: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  updatePosSettings: (newPosSettings: Partial<PosSettings>, adminEmail?: string) => Promise<void>;
}

// Deep merge function to ensure no missing properties break components
export const mergeWithDefaults = (source: any): SiteSettings => {
  if (!source) return defaultSiteSettings;

  const rawGeneral = source.general || {};
  const rawBranding = source.branding || {};
  const rawContact = source.contact || {};
  const rawRegional = source.regional || {};

  // Harmonize store name & branding
  let effectiveStoreName = '';
  if (rawGeneral.storeName && typeof rawGeneral.storeName === 'string' && rawGeneral.storeName.trim()) {
    effectiveStoreName = rawGeneral.storeName.trim();
  } else if (rawBranding.brandName && typeof rawBranding.brandName === 'string' && rawBranding.brandName.trim()) {
    effectiveStoreName = rawBranding.brandName.trim();
  } else if (rawContact.businessName && typeof rawContact.businessName === 'string' && rawContact.businessName.trim()) {
    effectiveStoreName = rawContact.businessName.trim();
  } else {
    effectiveStoreName = defaultSiteSettings.general.storeName || 'ELECTRO STORE';
  }

  const storeName = effectiveStoreName;
  const brandName = effectiveStoreName;
  const shortStoreName = rawGeneral.shortStoreName || (storeName ? storeName.split(' ')[0] : defaultSiteSettings.general.shortStoreName);
  
  // Harmonize logos & favicons across all variants
  const hasCustomPrimary = rawBranding.primaryLogo && rawBranding.primaryLogo.trim() !== '' && rawBranding.primaryLogo !== '/assets/logo.svg';
  const hasCustomGeneral = rawGeneral.storeLogoUrl && rawGeneral.storeLogoUrl.trim() !== '' && rawGeneral.storeLogoUrl !== '/assets/logo.svg';

  let effectiveLogo = defaultSiteSettings.branding.primaryLogo;
  if (hasCustomPrimary) {
    effectiveLogo = rawBranding.primaryLogo.trim();
  } else if (hasCustomGeneral) {
    effectiveLogo = rawGeneral.storeLogoUrl.trim();
  } else if (rawBranding.primaryLogo && rawBranding.primaryLogo.trim() !== '') {
    effectiveLogo = rawBranding.primaryLogo.trim();
  } else if (rawGeneral.storeLogoUrl && rawGeneral.storeLogoUrl.trim() !== '') {
    effectiveLogo = rawGeneral.storeLogoUrl.trim();
  }

  const primaryLogo = effectiveLogo;
  const storeLogoUrl = effectiveLogo;
  const adminLogo = (rawBranding.adminLogo && rawBranding.adminLogo.trim() !== '' && rawBranding.adminLogo !== '/assets/logo.svg')
    ? rawBranding.adminLogo.trim()
    : effectiveLogo;
  const loginLogo = (rawBranding.loginLogo && rawBranding.loginLogo.trim() !== '' && rawBranding.loginLogo !== '/assets/logo.svg')
    ? rawBranding.loginLogo.trim()
    : effectiveLogo;
  const emailLogo = (rawBranding.emailLogo && rawBranding.emailLogo.trim() !== '' && rawBranding.emailLogo !== '/assets/logo.svg')
    ? rawBranding.emailLogo.trim()
    : effectiveLogo;
  const mobileLogo = (rawBranding.mobileLogo && rawBranding.mobileLogo.trim() !== '')
    ? rawBranding.mobileLogo.trim()
    : defaultSiteSettings.branding.mobileLogo;

  const effectiveFavicon = (rawBranding.favicon && rawBranding.favicon !== '/assets/favicon.svg' 
    ? rawBranding.favicon 
    : (rawGeneral.faviconUrl || rawBranding.favicon || defaultSiteSettings.branding.favicon)
  ).trim();
  const favicon = effectiveFavicon;
  const faviconUrl = effectiveFavicon;

  // Harmonize contact info
  const phone = rawGeneral.phone || rawContact.phone || rawContact.primaryPhone || defaultSiteSettings.general.phone;
  const storeEmail = rawGeneral.storeEmail || rawContact.email || defaultSiteSettings.general.storeEmail;
  const supportEmail = rawGeneral.supportEmail || rawContact.supportEmail || storeEmail;
  const whatsappNumber = rawGeneral.whatsappNumber || rawContact.whatsapp || defaultSiteSettings.general.whatsappNumber;
  const businessAddress = rawGeneral.businessAddress || rawContact.address || rawContact.streetAddress || defaultSiteSettings.general.businessAddress;
  const businessHours = rawGeneral.businessHours || rawContact.openingHours || rawContact.workingHours || source.footer?.businessHours || defaultSiteSettings.general.businessHours;

  // Harmonize regional & currency
  const currency = rawGeneral.currency || rawRegional.currency || defaultSiteSettings.general.currency;
  const currencySymbol = rawGeneral.currencySymbol || rawRegional.currencySymbol || defaultSiteSettings.general.currencySymbol;
  const country = rawGeneral.country || rawContact.country || rawRegional.country || defaultSiteSettings.general.country;
  const state = rawGeneral.state || rawContact.state || defaultSiteSettings.general.state;
  const pincode = rawGeneral.pincode || rawContact.pincode || defaultSiteSettings.general.pincode;
  const city = rawGeneral.city || rawContact.city || defaultSiteSettings.general.city;

  const general = {
    ...defaultSiteSettings.general,
    ...rawGeneral,
    storeName,
    shortStoreName,
    storeLogoUrl,
    faviconUrl,
    phone,
    storeEmail,
    supportEmail,
    whatsappNumber,
    businessAddress,
    businessHours,
    currency,
    currencySymbol,
    country,
    state,
    pincode,
    city,
  };

  const rawLogoSizes = rawBranding?.logoSizes || {};
  const logoSizes = {
    desktopHeaderWidth: (typeof rawLogoSizes.desktopHeaderWidth === 'number' && rawLogoSizes.desktopHeaderWidth > 0)
      ? rawLogoSizes.desktopHeaderWidth
      : (Number(rawLogoSizes.desktopHeaderWidth) > 0 ? Number(rawLogoSizes.desktopHeaderWidth) : (defaultSiteSettings.branding.logoSizes?.desktopHeaderWidth || 180)),
    mobileHeaderWidth: (typeof rawLogoSizes.mobileHeaderWidth === 'number' && rawLogoSizes.mobileHeaderWidth > 0)
      ? rawLogoSizes.mobileHeaderWidth
      : (Number(rawLogoSizes.mobileHeaderWidth) > 0 ? Number(rawLogoSizes.mobileHeaderWidth) : (defaultSiteSettings.branding.logoSizes?.mobileHeaderWidth || 150)),
    adminPanelWidth: (typeof rawLogoSizes.adminPanelWidth === 'number' && rawLogoSizes.adminPanelWidth > 0)
      ? rawLogoSizes.adminPanelWidth
      : (Number(rawLogoSizes.adminPanelWidth) > 0 ? Number(rawLogoSizes.adminPanelWidth) : (defaultSiteSettings.branding.logoSizes?.adminPanelWidth || 140)),
    footerWidth: (typeof rawLogoSizes.footerWidth === 'number' && rawLogoSizes.footerWidth > 0)
      ? rawLogoSizes.footerWidth
      : (Number(rawLogoSizes.footerWidth) > 0 ? Number(rawLogoSizes.footerWidth) : (defaultSiteSettings.branding.logoSizes?.footerWidth || 160)),
  };

  const branding = {
    ...defaultSiteSettings.branding,
    ...rawBranding,
    brandName,
    primaryLogo,
    adminLogo,
    loginLogo,
    emailLogo,
    mobileLogo,
    favicon,
    logoSizes,
  };

  const contact = {
    ...defaultSiteSettings.contact,
    ...rawContact,
    businessName: rawContact.businessName || storeName,
    phone,
    whatsapp: whatsappNumber,
    email: storeEmail,
    supportEmail,
    address: businessAddress,
    city,
    state,
    pincode,
    country,
    openingHours: businessHours,
  };

  const regional = {
    ...defaultSiteSettings.regional,
    ...rawRegional,
    currency,
    currencySymbol,
    country,
  };

  return {
    general,
    branding,
    contact,
    regional,
    header: {
      ...defaultSiteSettings.header,
      ...(source.header || {}),
      headerVisible: source.header?.headerVisible !== undefined ? source.header.headerVisible : (source.header?.enabled !== undefined ? source.header.enabled : defaultSiteSettings.header.headerVisible),
      announcementBar: { ...defaultSiteSettings.header.announcementBar, ...(source.header?.announcementBar || {}) },
      navItems: Array.isArray(source.header?.navItems) ? source.header.navItems : defaultSiteSettings.header.navItems,
      mobileBottomNav: {
        ...defaultSiteSettings.header.mobileBottomNav,
        ...(source.header?.mobileBottomNav || {}),
        items: Array.isArray(source.header?.mobileBottomNav?.items)
          ? source.header.mobileBottomNav.items
          : (defaultSiteSettings.header.mobileBottomNav?.items || []),
      },
    },
    homepage: {
      sectionsOrder: Array.isArray(source.homepage?.sectionsOrder) && source.homepage.sectionsOrder.length > 0
        ? source.homepage.sectionsOrder
        : defaultSiteSettings.homepage.sectionsOrder,
      sections: { ...defaultSiteSettings.homepage.sections, ...(source.homepage?.sections || {}) },
      trustBenefits: Array.isArray(source.homepage?.trustBenefits)
        ? source.homepage.trustBenefits
        : defaultSiteSettings.homepage.trustBenefits,
      heroSlides: Array.isArray(source.homepage?.heroSlides)
        ? source.homepage.heroSlides
        : defaultSiteSettings.homepage.heroSlides,
      heroConfig: { ...defaultSiteSettings.homepage.heroConfig, ...(source.homepage?.heroConfig || {}) },
      quickCategories: Array.isArray(source.homepage?.quickCategories)
        ? source.homepage.quickCategories
        : defaultSiteSettings.homepage.quickCategories,
      popularCategories: Array.isArray(source.homepage?.popularCategories)
        ? source.homepage.popularCategories
        : defaultSiteSettings.homepage.popularCategories,
      testimonials: Array.isArray(source.homepage?.testimonials)
        ? source.homepage.testimonials
        : defaultSiteSettings.homepage.testimonials,
      customContent: { ...defaultSiteSettings.homepage.customContent, ...(source.homepage?.customContent || {}) },
      dealsConfig: { ...defaultSiteSettings.homepage.dealsConfig, ...(source.homepage?.dealsConfig || {}) },
      flashSaleConfig: { ...defaultSiteSettings.homepage.flashSaleConfig, ...(source.homepage?.flashSaleConfig || {}) },
      newsletterConfig: { ...defaultSiteSettings.homepage.newsletterConfig, ...(source.homepage?.newsletterConfig || {}) },
      brandsConfig: { ...defaultSiteSettings.homepage.brandsConfig, ...(source.homepage?.brandsConfig || {}) },
      featuredProductsConfig: { ...defaultSiteSettings.homepage.featuredProductsConfig, ...(source.homepage?.featuredProductsConfig || {}) },
      bestSellersConfig: { ...defaultSiteSettings.homepage.bestSellersConfig, ...(source.homepage?.bestSellersConfig || {}) },
      newArrivalsConfig: { ...defaultSiteSettings.homepage.newArrivalsConfig, ...(source.homepage?.newArrivalsConfig || {}) },
      recentlyViewedConfig: { ...defaultSiteSettings.homepage.recentlyViewedConfig, ...(source.homepage?.recentlyViewedConfig || {}) },
    },
    heroBanners: Array.isArray(source.heroBanners) ? source.heroBanners : defaultSiteSettings.heroBanners,
    shopPage: { ...defaultSiteSettings.shopPage, ...(source.shopPage || {}) },
    productPage: { ...defaultSiteSettings.productPage, ...(source.productPage || {}) },
    cartSettings: { ...defaultSiteSettings.cartSettings, ...(source.cartSettings || {}) },
    checkoutSettings: {
      ...defaultSiteSettings.checkoutSettings,
      ...(source.checkoutSettings || {}),
      shippingAddressFields: { ...defaultSiteSettings.checkoutSettings.shippingAddressFields, ...(source.checkoutSettings?.shippingAddressFields || {}) },
    },
    footer: {
      ...defaultSiteSettings.footer,
      ...(source.footer || {}),
      columns: Array.isArray(source.footer?.columns) ? source.footer.columns : defaultSiteSettings.footer.columns,
      socialLinks: { ...defaultSiteSettings.footer.socialLinks, ...(source.footer?.socialLinks || {}) },
    },
    theme: { ...defaultSiteSettings.theme, ...(source.theme || {}) },
    seo: {
      ...defaultSiteSettings.seo,
      ...(source.seo || {}),
      pageSeo: { ...defaultSiteSettings.seo.pageSeo, ...(source.seo?.pageSeo || {}) },
    },
    socialMedia: { ...defaultSiteSettings.socialMedia, ...(source.socialMedia || {}) },
    policies: { ...defaultSiteSettings.policies, ...(source.policies || {}) },
    customPages: Array.isArray(source.customPages) ? source.customPages : defaultSiteSettings.customPages,
    bannersAndPopups: Array.isArray(source.bannersAndPopups) ? source.bannersAndPopups : defaultSiteSettings.bannersAndPopups,
    notifications: {
      ...defaultSiteSettings.notifications,
      ...(source.notifications || {}),
      targetPages: { ...defaultSiteSettings.notifications.targetPages, ...(source.notifications?.targetPages || {}) },
    },
    maintenance: { ...defaultSiteSettings.maintenance, ...(source.maintenance || {}) },
    integrations: {
      razorpay: { ...defaultSiteSettings.integrations.razorpay, ...(source.integrations?.razorpay || {}) },
      firebase: { ...defaultSiteSettings.integrations.firebase, ...(source.integrations?.firebase || {}) },
      analytics: { ...defaultSiteSettings.integrations.analytics, ...(source.integrations?.analytics || {}) },
      searchSeo: { ...defaultSiteSettings.integrations.searchSeo, ...(source.integrations?.searchSeo || {}) },
      whatsapp: { ...defaultSiteSettings.integrations.whatsapp, ...(source.integrations?.whatsapp || {}) },
      shipping: { ...defaultSiteSettings.integrations.shipping, ...(source.integrations?.shipping || {}) },
    },
    advanced: {
      ...defaultSiteSettings.advanced,
      ...(source.advanced || {}),
      featureFlags: { ...defaultSiteSettings.advanced.featureFlags, ...(source.advanced?.featureFlags || {}) },
    },
    shipping: {
      ...defaultSiteSettings.shipping,
      ...(source.shipping || {}),
      shippingMethods: Array.isArray(source.shipping?.shippingMethods)
        ? source.shipping.shippingMethods
        : defaultSiteSettings.shipping.shippingMethods,
    },
    tax: {
      ...defaultSiteSettings.tax,
      ...(source.tax || {}),
      gstEnabled: source.tax?.gstEnabled !== undefined
        ? Boolean(source.tax.gstEnabled)
        : (source.gstEnabled !== undefined ? Boolean(source.gstEnabled) : defaultSiteSettings.tax.gstEnabled),
    },
    payments: {
      ...defaultSiteSettings.payments,
      ...(source.payments || {}),
      paymentMethods: { ...defaultSiteSettings.payments.paymentMethods, ...(source.payments?.paymentMethods || {}) },
    },
    pos: {
      ...defaultPosSettings,
      ...(source.pos || {}),
    },
  };
};

const STOREFRONT_CONFIG_CACHE_KEY = 'electro_published_site_settings_v2';

interface PersistedSiteConfig {
  data: SiteSettings;
  publishedAtMs?: number;
  cachedAtMs: number;
}

function getTimestampMs(ts: any): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts?.toMillis === 'function') return ts.toMillis();
  if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function getPersistedTimestampMs(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STOREFRONT_CONFIG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.publishedAtMs || 0;
    }
  } catch (e) {}
  return 0;
}

function getPersistedPublishedConfig(): SiteSettings {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STOREFRONT_CONFIG_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const rawData = ('data' in parsed && parsed.data) ? parsed.data : parsed;
          if (rawData && typeof rawData === 'object') {
            return mergeWithDefaults(rawData);
          }
        }
      }
    } catch (e) {
      console.warn('Unable to parse persisted storefront config cache:', e);
    }
  }
  return defaultSiteSettings;
}

function persistPublishedConfig(config: SiteSettings, publishedAt?: any) {
  if (typeof window === 'undefined') return;
  try {
    let publishedAtMs = getTimestampMs(publishedAt);
    if (!publishedAtMs) {
      publishedAtMs = Date.now();
    }
    const payload: PersistedSiteConfig = {
      data: config,
      publishedAtMs,
      cachedAtMs: Date.now(),
    };
    localStorage.setItem(STOREFRONT_CONFIG_CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Unable to persist storefront config cache:', e);
  }
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  // Synchronously initialize state with the persisted published config for immediate rendering
  const [settings, setSettings] = useState<SiteSettings>(getPersistedPublishedConfig);
  const [draftSettings, setDraftSettings] = useState<SiteSettings | null>(null);
  const [hasUnpublishedDraft, setHasUnpublishedDraft] = useState(false);
  const [isPreviewMode, setIsPreviewModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('preview') === 'true') return true;
      if (sessionStorage.getItem('electro_preview_mode') === 'true') return true;
    }
    return false;
  });
  const [loading, setLoading] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setIsPreviewMode = (val: boolean) => {
    setIsPreviewModeState(val);
    if (typeof window !== 'undefined') {
      if (val) {
        sessionStorage.setItem('electro_preview_mode', 'true');
        const url = new URL(window.location.href);
        url.searchParams.set('preview', 'true');
        window.history.replaceState({}, '', url.toString());
      } else {
        sessionStorage.removeItem('electro_preview_mode');
        try { localStorage.removeItem('electro_preview_mode'); } catch (e) {}
        const url = new URL(window.location.href);
        url.searchParams.delete('preview');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  const loadSettings = async () => {
    try {
      setError(null);
      let loadedPublished = false;

      // 1. Try client Firestore
      try {
        const [pubSnap, draftSnap] = await Promise.race([
          Promise.all([
            getDoc(doc(db, 'siteSettings', 'config')),
            getDoc(doc(db, 'siteSettings', 'draft'))
          ]),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Firestore timeout')), 3000))
        ]);

        if (pubSnap && pubSnap.exists() && pubSnap.data()) {
          const snapData = pubSnap.data();
          const incomingPublishedAt = snapData.publishedAt;
          const merged = mergeWithDefaults(snapData);
          setSettings((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
            return merged;
          });
          persistPublishedConfig(merged, incomingPublishedAt || Date.now());
          loadedPublished = true;
        }

        if (draftSnap && draftSnap.exists() && draftSnap.data()) {
          setDraftSettings(mergeWithDefaults(draftSnap.data()));
          setHasUnpublishedDraft(true);
        } else {
          setDraftSettings(null);
          setHasUnpublishedDraft(false);
        }
      } catch (clientErr) {
        // Client Firestore unavailable/offline
      }

      // 2. Authoritative server API fallback for published settings
      if (!loadedPublished) {
        try {
          const res = await fetch('/api/site-settings/public');
          if (res.ok) {
            const data = await res.json();
            if (data?.settings) {
              const merged = mergeWithDefaults(data.settings);
              setSettings((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
                return merged;
              });
              persistPublishedConfig(merged, data.settings.publishedAt || Date.now());
            }
          }
        } catch (serverErr) {
          // Server endpoint unreachable
        }
      }
    } catch (err: any) {
      console.warn('Background sync for site settings encountered transient error:', err);
    }
  };

  useEffect(() => {
    // Actively query authoritative settings on mount
    loadSettings();

    // Listen to real-time updates on siteSettings/config silently in the background
    const unsubPub = onSnapshot(
      doc(db, 'siteSettings', 'config'),
      (snap) => {
        if (snap.exists() && snap.data()) {
          const snapData = snap.data();
          const incomingPublishedAt = snapData.publishedAt;
          const merged = mergeWithDefaults(snapData);
          setSettings((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
            return merged;
          });
          persistPublishedConfig(merged, incomingPublishedAt || Date.now());
        }
      },
      (err) => {
        console.warn('Realtime config background listener:', err);
      }
    );

    const unsubDraft = onSnapshot(
      doc(db, 'siteSettings', 'draft'),
      (snap) => {
        if (snap.exists() && snap.data()) {
          setDraftSettings(mergeWithDefaults(snap.data()));
          setHasUnpublishedDraft(true);
        } else {
          setDraftSettings(null);
          setHasUnpublishedDraft(false);
        }
      },
      (err) => {
        console.warn('Realtime draft background listener:', err);
      }
    );

    return () => {
      unsubPub();
      unsubDraft();
    };
  }, []);

  // Sync document title and favicon dynamically
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const currentGeneral = (isPreviewMode && draftSettings) ? draftSettings.general : settings.general;
      const currentBranding = (isPreviewMode && draftSettings) ? draftSettings.branding : settings.branding;
      if (currentGeneral?.storeName) {
        const baseTitle = currentGeneral.storeName;
        const tagline = currentGeneral.tagline ? ` - ${currentGeneral.tagline}` : '';
        document.title = `${baseTitle}${tagline}`;
      }
      if (currentBranding?.favicon || currentGeneral?.faviconUrl) {
        const favUrl = currentBranding?.favicon || currentGeneral?.faviconUrl;
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = favUrl;
      }
    }
  }, [settings, draftSettings, isPreviewMode]);

  const saveDraft = async (updated: SiteSettings, adminEmail = 'admin') => {
    const merged = mergeWithDefaults(updated);

    try {
      // Ensure any embedded base64 assets are stored as clean URLs
      const cleanDraft = await extractAndUploadBase64Assets(merged);

      await Promise.race([
        setDoc(doc(db, 'siteSettings', 'draft'), {
          ...cleanDraft,
          updatedAt: serverTimestamp(),
          updatedBy: adminEmail,
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore connection timeout')), 4000))
      ]);

      // Server backup sync
      fetch('/api/admin/site-settings/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: cleanDraft, adminEmail })
      }).catch(() => null);

      setDraftSettings(cleanDraft);
      setHasUnpublishedDraft(true);

      // Record Audit Log
      addDoc(collection(db, 'siteSettingsHistory'), {
        adminEmail,
        admin: adminEmail,
        action: 'Draft Saved',
        module: 'Website Control',
        summary: 'Saved unpublished changes to draft configuration',
        timestamp: serverTimestamp(),
      }).catch(() => null);
    } catch (e: any) {
      console.warn('Could not persist draft to database:', e);
      throw e;
    }
  };

  const publishSettings = async (updated?: SiteSettings, adminEmail = 'admin') => {
    const toPublish = mergeWithDefaults(updated || draftSettings || settings);
    const nowMs = Date.now();

    // 1. Validate configuration before publishing
    if (!toPublish || typeof toPublish !== 'object') {
      throw new Error('Validation error: Settings payload is missing or invalid.');
    }
    if (!toPublish.general?.storeName || !toPublish.general.storeName.trim()) {
      throw new Error('Validation error: Store name is required before publishing.');
    }

    // 2. Extract and upload any embedded base64 assets to avoid bloating settings payload
    const cleanPayload = await extractAndUploadBase64Assets(toPublish);

    // 3. Authoritative server API publish
    const token = auth?.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    const res = await fetch('/api/admin/site-settings/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ settings: cleanPayload, adminEmail })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errorMsg = errJson.error || `Publishing failed with server HTTP status ${res.status}`;
      throw new Error(errorMsg);
    }

    const publishResult = await res.json();
    if (!publishResult.success) {
      throw new Error(publishResult.error || 'Server rejected publishing operation.');
    }

    const confirmedSettings = publishResult.settings || cleanPayload;

    // 4. Update published state only after backend confirms success
    deleteDoc(doc(db, 'siteSettings', 'draft')).catch(() => null);
    persistPublishedConfig(confirmedSettings, nowMs);
    setSettings(confirmedSettings);
    setDraftSettings(null);
    setHasUnpublishedDraft(false);
  };

  const revertDraft = async (adminEmail = 'admin') => {
    try {
      await deleteDoc(doc(db, 'siteSettings', 'draft'));
    } catch (e) {
      console.error("Error reverting draft:", e);
    }
    setDraftSettings(null);
    setHasUnpublishedDraft(false);

    // Record Audit Log
    try {
      await addDoc(collection(db, 'siteSettingsHistory'), {
        adminEmail,
        admin: adminEmail,
        action: 'Draft Reverted',
        module: 'Website Control',
        summary: 'Reverted draft back to live published configuration',
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not record history log:', e);
    }
  };

  const resetCmsToDefaults = async (adminEmail = 'admin') => {
    const cleanDefaults = mergeWithDefaults(defaultSiteSettings);
    const nowMs = Date.now();

    // 1. Overwrite published config in Firestore
    await setDoc(doc(db, 'siteSettings', 'config'), {
      ...cleanDefaults,
      publishedAt: serverTimestamp(),
      publishedBy: adminEmail,
    });

    // 2. Remove draft config in Firestore if present
    try {
      await deleteDoc(doc(db, 'siteSettings', 'draft'));
    } catch (e) {
      console.warn('Draft cleanup error:', e);
    }

    // 3. Synchronize legacy settings documents
    try {
      await Promise.all([
        setDoc(doc(db, 'settings', 'business'), {
          storeName: cleanDefaults.general.storeName,
          businessName: cleanDefaults.contact.businessName || cleanDefaults.general.storeName,
          businessAddress: cleanDefaults.general.businessAddress,
          city: cleanDefaults.general.city,
          state: cleanDefaults.general.state,
          pincode: cleanDefaults.general.pincode,
          country: cleanDefaults.general.country,
          businessPhone: cleanDefaults.general.phone,
          supportPhone: cleanDefaults.general.phone,
          businessEmail: cleanDefaults.general.storeEmail,
          supportEmail: cleanDefaults.general.supportEmail,
          gstin: cleanDefaults.tax?.gstin || cleanDefaults.contact?.gstin || '',
          pan: cleanDefaults.contact?.pan || '',
          defaultGSTRate: cleanDefaults.tax?.taxRate ?? 18,
          gstEnabled: cleanDefaults.tax?.gstEnabled !== false,
          currencySymbol: cleanDefaults.general.currencySymbol || '₹',
          currencyCode: cleanDefaults.general.currency || 'INR',
          currency: cleanDefaults.general.currency || 'INR',
          maintenanceMode: false,
          storeStatus: 'active',
          storeTagline: cleanDefaults.general.tagline,
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(db, 'settings', 'shipping'), {
          shippingEnabled: cleanDefaults.shipping?.shippingEnabled !== false,
          defaultShippingCharge: cleanDefaults.shipping?.defaultShippingCharge ?? 50,
          freeShippingEnabled: cleanDefaults.shipping?.freeShippingEnabled !== false,
          freeShippingThreshold: cleanDefaults.shipping?.freeShippingThreshold ?? 500,
          minDeliveryDays: cleanDefaults.shipping?.minDeliveryDays ?? 3,
          maxDeliveryDays: cleanDefaults.shipping?.maxDeliveryDays ?? 5,
          deliveryAreas: cleanDefaults.shipping?.deliveryAreas ?? 'All Serviceable PIN Codes across India',
          deliveryCoverage: cleanDefaults.shipping?.deliveryCoverage ?? null,
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(doc(db, 'settings', 'payments'), {
          enableCOD: cleanDefaults.payments?.codEnabled !== false,
          enableUPI: cleanDefaults.payments?.paymentMethods?.upi !== false,
          enableCards: cleanDefaults.payments?.paymentMethods?.cards !== false,
          enableNetBanking: cleanDefaults.payments?.paymentMethods?.netbanking !== false,
          enableRazorpay: cleanDefaults.payments?.onlinePaymentEnabled !== false,
          codEnabled: cleanDefaults.payments?.codEnabled !== false,
          codExtraCharge: cleanDefaults.payments?.codExtraCharge || 0,
          environment: cleanDefaults.payments?.environment || 'test',
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        cleanDefaults.pos ? setDoc(doc(db, 'settings', 'pos'), {
          ...cleanDefaults.pos,
          updatedAt: serverTimestamp(),
        }, { merge: true }) : Promise.resolve(),
      ]);
    } catch (e) {
      console.warn('Syncing legacy settings during reset encountered error:', e);
    }

    // 4. Clear local caches
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STOREFRONT_CONFIG_CACHE_KEY);
        sessionStorage.removeItem('electro_preview_mode');
        localStorage.removeItem('electro_preview_mode');
      } catch (e) {}
    }

    // 5. Update memory state
    persistPublishedConfig(cleanDefaults, nowMs);
    setSettings(cleanDefaults);
    setDraftSettings(null);
    setHasUnpublishedDraft(false);
    setIsPreviewModeState(false);

    // Record audit log
    try {
      await addDoc(collection(db, 'siteSettingsHistory'), {
        adminEmail,
        admin: adminEmail,
        action: 'CMS & Store Settings Reset to Defaults',
        module: 'Website Control & Store Settings',
        summary: 'Reset all Website Control & Store Settings configuration to application default state',
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not record history log:', e);
    }
  };

  const resetStoreSettingsToDefaults = async (adminEmail = 'admin') => {
    const cleanDefaults = mergeWithDefaults(defaultSiteSettings);
    const updatedSettings: SiteSettings = {
      ...settings,
      general: { ...cleanDefaults.general },
      contact: { ...cleanDefaults.contact },
      shipping: { ...cleanDefaults.shipping },
      tax: { ...cleanDefaults.tax },
      payments: { ...cleanDefaults.payments },
      pos: { ...cleanDefaults.pos },
      notifications: { ...cleanDefaults.notifications },
      maintenance: { ...cleanDefaults.maintenance },
    };

    await publishSettings(updatedSettings, adminEmail);

    try {
      await addDoc(collection(db, 'siteSettingsHistory'), {
        adminEmail,
        admin: adminEmail,
        action: 'Store Settings Reset to Defaults',
        module: 'Store Settings',
        summary: 'Reset Store Information, Shipping, Tax, Payments, and POS settings to defaults',
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not record history log:', e);
    }
  };

  const updatePosSettings = async (newPosSettings: Partial<PosSettings>, adminEmail = 'admin') => {
    const updatedPos: PosSettings = {
      ...(settings.pos || defaultPosSettings),
      ...newPosSettings,
    };
    const updatedSettings: SiteSettings = {
      ...settings,
      pos: updatedPos,
    };

    // 1. Immediately persist to server POS API endpoint (admin authority)
    try {
      await fetch('/api/admin/pos/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posSettings: updatedPos, adminEmail })
      });
    } catch (e) {
      console.warn('POS endpoint sync note:', e);
    }

    // 2. Publish updated settings to local cache and Firestore
    await publishSettings(updatedSettings, adminEmail);
  };

  const activeSettings = (isPreviewMode && draftSettings) ? draftSettings : settings;
  const adminSettings = draftSettings || settings;

  const contextValue = useMemo(() => ({
    settings: activeSettings,
    adminSettings,
    liveSettings: settings,
    draftSettings,
    hasUnpublishedDraft,
    isPreviewMode,
    setIsPreviewMode,
    loading,
    isConfigLoaded,
    error,
    saveDraft,
    publishSettings,
    revertDraft,
    resetCmsToDefaults,
    resetStoreSettingsToDefaults,
    refreshSettings: loadSettings,
    updatePosSettings,
  }), [activeSettings, adminSettings, settings, draftSettings, hasUnpublishedDraft, isPreviewMode, loading, isConfigLoaded, error]);

  return (
    <SiteSettingsContext.Provider value={contextValue}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}
