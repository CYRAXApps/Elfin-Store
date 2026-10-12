import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Product, Category, Brand, StoreInfo } from '../types';
import { products as initialProducts, categories as initialCategories, brands as initialBrands } from '../data';

// Default Main Store record
const MAIN_STORE: StoreInfo = {
  storeId: 'main-store',
  storeName: 'ELECTRO STORE',
  status: 'ACTIVE',
  description: 'Official ELECTRO STORE Flagship',
  city: 'Kolkata',
  state: 'West Bengal'
};

// Global In-Memory Singletons
let productsCache: Product[] = [];
let categoriesCache: Category[] = initialCategories;
let brandsCache: Brand[] = initialBrands;
let bannersCache: any[] = [];
let rawProductsList: Product[] = [];
const couponCache = new Map<string, any>();

// Stores cache singleton
const storesMap = new Map<string, StoreInfo>();
storesMap.set('main-store', MAIN_STORE);
let storesLoaded = false;
let storesCache: StoreInfo[] = [MAIN_STORE];

let productsLoaded = false;
let categoriesLoaded = false;
let brandsLoaded = false;
let bannersLoaded = false;

// Product quick-lookup Map for 0ms lookup
const productMap = new Map<string, Product>();

// Subscriber sets
type Subscriber<T> = (data: T, isLoaded: boolean) => void;
const productSubscribers = new Set<Subscriber<Product[]>>();
const categorySubscribers = new Set<Subscriber<Category[]>>();
const brandSubscribers = new Set<Subscriber<Brand[]>>();
const bannerSubscribers = new Set<Subscriber<any[]>>();
const storeSubscribers = new Set<Subscriber<StoreInfo[]>>();

// Active unsubs
let unsubProducts: (() => void) | null = null;
let unsubCategories: (() => void) | null = null;
let unsubBrands: (() => void) | null = null;
let unsubBanners: (() => void) | null = null;
let unsubStores: (() => void) | null = null;

// Keep-alive timer ref
let productsTeardownTimer: NodeJS.Timeout | null = null;
let categoriesTeardownTimer: NodeJS.Timeout | null = null;
let brandsTeardownTimer: NodeJS.Timeout | null = null;
let bannersTeardownTimer: NodeJS.Timeout | null = null;
let storesTeardownTimer: NodeJS.Timeout | null = null;

const KEEP_ALIVE_MS = 60000; // Keep listener active for 60 seconds after last subscriber unmounts

function filterAndEnrichProducts() {
  productMap.clear();
  const validProducts: Product[] = [];

  rawProductsList.forEach(rawP => {
    // 1. Check product status (must be published, not draft/archived)
    if (rawP.status === 'draft' || rawP.status === 'archived' || rawP.isPublished === false) {
      return;
    }

    // 2. Determine store ownership
    const sId = rawP.storeId || 'main-store';
    const storeObj = storesMap.get(sId);

    // 3. Check active store status
    if (sId !== 'main-store' && storeObj && storeObj.status !== 'ACTIVE') {
      return; // Suppress products from non-ACTIVE partner stores
    }

    const storeName = storeObj?.storeName || (sId === 'main-store' ? 'ELECTRO STORE' : sId);

    const enrichedProd: Product = {
      ...rawP,
      storeId: sId,
      storeName
    };

    productMap.set(enrichedProd.id, enrichedProd);
    validProducts.push(enrichedProd);
  });

  productsCache = validProducts;
  productSubscribers.forEach(sub => sub(productsCache, productsLoaded));
}

function startStoresListener() {
  if (unsubStores) return;
  if (storesTeardownTimer) {
    clearTimeout(storesTeardownTimer);
    storesTeardownTimer = null;
  }

  try {
    unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      const activeList: StoreInfo[] = [MAIN_STORE];
      storesMap.clear();
      storesMap.set('main-store', MAIN_STORE);

      if (!snapshot.empty) {
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const sId = docSnap.id || data.storeId;
          if (sId) {
            const st: StoreInfo = {
              storeId: sId,
              storeName: data.storeName || data.name || sId,
              storeType: data.storeType || 'PARTNER',
              status: data.status || 'ACTIVE',
              description: data.description,
              logoUrl: data.logoUrl || data.logo,
              phone: data.phone,
              email: data.email,
              city: data.city,
              state: data.state,
              address: data.address,
              pincode: data.pincode
            };
            storesMap.set(sId, st);
            if (st.status === 'ACTIVE' && sId !== 'main-store') {
              activeList.push(st);
            }
          }
        });
      }
      storesCache = activeList;
      storesLoaded = true;

      // Re-evaluate product catalog with updated store statuses
      filterAndEnrichProducts();

      storeSubscribers.forEach(sub => sub(storesCache, storesLoaded));
    }, (error) => {
      console.warn('Stores sync notice:', error);
      storesLoaded = true;
      storeSubscribers.forEach(sub => sub(storesCache, storesLoaded));
    });
  } catch (e) {
    console.warn('Could not start stores listener:', e);
  }
}

function startProductsListener() {
  if (unsubProducts) return;
  if (productsTeardownTimer) {
    clearTimeout(productsTeardownTimer);
    productsTeardownTimer = null;
  }

  // Ensure stores listener is started so we have store status context
  startStoresListener();

  try {
    unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        rawProductsList = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const stock = typeof data.stock === 'number' ? data.stock : (data.stock !== undefined ? Number(data.stock) : undefined);
          const inStock = data.inStock !== false && (stock === undefined || stock > 0);
          const rawRating = data.rating !== undefined && data.rating !== null ? Number(data.rating) : undefined;
          const rating = rawRating !== undefined && !isNaN(rawRating) ? Math.round(rawRating * 10) / 10 : undefined;
          const reviewsCount = data.reviewsCount !== undefined && data.reviewsCount !== null ? Math.max(0, Math.round(Number(data.reviewsCount) || 0)) : undefined;

          const prod: Product = {
            id: docSnap.id,
            ...data,
            stock,
            inStock,
            ...(rating !== undefined ? { rating } : {}),
            ...(reviewsCount !== undefined ? { reviewsCount } : {})
          } as Product;
          return prod;
        });
        productsLoaded = true;
      } else {
        // If Firestore products collection is empty on a new project, default to initial product catalog
        rawProductsList = initialProducts;
        productsLoaded = true;
      }
      filterAndEnrichProducts();
    }, (error) => {
      console.warn('Products sync notice:', (error as any)?.message || error);
      if (!productsLoaded) {
        rawProductsList = initialProducts;
        productsLoaded = true;
      }
      filterAndEnrichProducts();
    });
  } catch (e) {
    console.warn('Could not start products listener:', e);
  }
}

function startCategoriesListener() {
  if (unsubCategories) return;
  if (categoriesTeardownTimer) {
    clearTimeout(categoriesTeardownTimer);
    categoriesTeardownTimer = null;
  }

  try {
    unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (!snapshot.empty) {
        categoriesCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        categoriesLoaded = true;
      } else {
        categoriesCache = initialCategories;
        categoriesLoaded = true;
      }
      categorySubscribers.forEach(sub => sub(categoriesCache, categoriesLoaded));
    }, (error) => {
      console.warn('Categories sync notice:', error);
      if (!categoriesLoaded) {
        categoriesCache = initialCategories;
        categoriesLoaded = true;
      }
      categorySubscribers.forEach(sub => sub(categoriesCache, categoriesLoaded));
    });
  } catch (e) {
    console.warn('Could not start categories listener:', e);
  }
}

function startBrandsListener() {
  if (unsubBrands) return;
  if (brandsTeardownTimer) {
    clearTimeout(brandsTeardownTimer);
    brandsTeardownTimer = null;
  }

  try {
    unsubBrands = onSnapshot(collection(db, 'brands'), (snapshot) => {
      if (!snapshot.empty) {
        brandsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand));
        brandsLoaded = true;
      } else {
        brandsCache = initialBrands;
        brandsLoaded = true;
      }
      brandSubscribers.forEach(sub => sub(brandsCache, brandsLoaded));
    }, (error) => {
      console.warn('Brands sync notice:', error);
      if (!brandsLoaded) {
        brandsCache = initialBrands;
        brandsLoaded = true;
      }
      brandSubscribers.forEach(sub => sub(brandsCache, brandsLoaded));
    });
  } catch (e) {
    console.warn('Could not start brands listener:', e);
  }
}

function startBannersListener() {
  if (unsubBanners) return;
  if (bannersTeardownTimer) {
    clearTimeout(bannersTeardownTimer);
    bannersTeardownTimer = null;
  }

  try {
    unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      bannersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bannersLoaded = true;
      bannerSubscribers.forEach(sub => sub(bannersCache, bannersLoaded));
    }, (error) => {
      console.warn('Banners sync notice:', error);
      bannersLoaded = true;
      bannerSubscribers.forEach(sub => sub(bannersCache, bannersLoaded));
    });
  } catch (e) {
    console.warn('Could not start banners listener:', e);
  }
}

/**
 * Subscribe to the shared Products feed.
 * Callback is invoked synchronously on subscribe with current cache.
 */
export function subscribeProducts(callback: (products: Product[], isLoaded: boolean) => void): () => void {
  productSubscribers.add(callback);
  // Synchronously deliver current in-memory cache
  callback(productsCache, productsLoaded);

  startProductsListener();

  return () => {
    productSubscribers.delete(callback);
    if (productSubscribers.size === 0) {
      if (productsTeardownTimer) clearTimeout(productsTeardownTimer);
      productsTeardownTimer = setTimeout(() => {
        if (productSubscribers.size === 0 && unsubProducts) {
          unsubProducts();
          unsubProducts = null;
        }
      }, KEEP_ALIVE_MS);
    }
  };
}

/**
 * Subscribe to the shared Categories feed.
 */
export function subscribeCategories(callback: (categories: Category[], isLoaded: boolean) => void): () => void {
  categorySubscribers.add(callback);
  callback(categoriesCache, categoriesLoaded);

  startCategoriesListener();

  return () => {
    categorySubscribers.delete(callback);
    if (categorySubscribers.size === 0) {
      if (categoriesTeardownTimer) clearTimeout(categoriesTeardownTimer);
      categoriesTeardownTimer = setTimeout(() => {
        if (categorySubscribers.size === 0 && unsubCategories) {
          unsubCategories();
          unsubCategories = null;
        }
      }, KEEP_ALIVE_MS);
    }
  };
}

/**
 * Subscribe to the shared Brands feed.
 */
export function subscribeBrands(callback: (brands: Brand[], isLoaded: boolean) => void): () => void {
  brandSubscribers.add(callback);
  callback(brandsCache, brandsLoaded);

  startBrandsListener();

  return () => {
    brandSubscribers.delete(callback);
    if (brandSubscribers.size === 0) {
      if (brandsTeardownTimer) clearTimeout(brandsTeardownTimer);
      brandsTeardownTimer = setTimeout(() => {
        if (brandSubscribers.size === 0 && unsubBrands) {
          unsubBrands();
          unsubBrands = null;
        }
      }, KEEP_ALIVE_MS);
    }
  };
}

/**
 * Get instantaneous cached product by ID (0ms latency, synchronous)
 */
export function getCachedProduct(id?: string): Product | undefined {
  if (!id) return undefined;
  if (productMap.has(id)) return productMap.get(id);
  const found = productsCache.find(p => p.id === id);
  if (found) {
    productMap.set(id, found);
    return found;
  }
  return initialProducts.find(p => p.id === id);
}

/**
 * Instantaneous read of cached products
 */
export function getCachedProducts(): Product[] {
  return productsCache;
}

/**
 * Instantaneous read of cached categories
 */
export function getCachedCategories(): Category[] {
  return categoriesCache;
}

/**
 * Instantaneous read of cached brands
 */
export function getCachedBrands(): Brand[] {
  return brandsCache;
}

/**
 * Update local cache optimistically
 */
export function updateProductInCache(product: Product): void {
  productMap.set(product.id, product);
  const idx = productsCache.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    productsCache[idx] = product;
  } else {
    productsCache.unshift(product);
  }
  productSubscribers.forEach(sub => sub([...productsCache], productsLoaded));
}

/**
 * Subscribe to the shared Banners feed.
 */
export function subscribeBanners(callback: (banners: any[], isLoaded: boolean) => void): () => void {
  bannerSubscribers.add(callback);
  callback(bannersCache, bannersLoaded);

  startBannersListener();

  return () => {
    bannerSubscribers.delete(callback);
    if (bannerSubscribers.size === 0) {
      if (bannersTeardownTimer) clearTimeout(bannersTeardownTimer);
      bannersTeardownTimer = setTimeout(() => {
        if (bannerSubscribers.size === 0 && unsubBanners) {
          unsubBanners();
          unsubBanners = null;
        }
      }, KEEP_ALIVE_MS);
    }
  };
}

/**
 * Instantaneous read of cached banners
 */
export function getCachedBanners(): any[] {
  return bannersCache;
}

/**
 * Coupon Memory Cache (prevents duplicate reads)
 */
export function getCachedCoupon(code: string): any | undefined {
  return couponCache.get(code.toUpperCase().trim());
}

export function setCachedCoupon(code: string, couponData: any): void {
  couponCache.set(code.toUpperCase().trim(), couponData);
}

/**
 * Subscribe to the shared Stores feed.
 */
export function subscribeStores(callback: (stores: StoreInfo[], isLoaded: boolean) => void): () => void {
  storeSubscribers.add(callback);
  callback(storesCache, storesLoaded);

  startStoresListener();

  return () => {
    storeSubscribers.delete(callback);
    if (storeSubscribers.size === 0) {
      if (storesTeardownTimer) clearTimeout(storesTeardownTimer);
      storesTeardownTimer = setTimeout(() => {
        if (storeSubscribers.size === 0 && unsubStores) {
          unsubStores();
          unsubStores = null;
        }
      }, KEEP_ALIVE_MS);
    }
  };
}

/**
 * Instantaneous read of active stores list
 */
export function getCachedStores(): StoreInfo[] {
  return storesCache;
}

/**
 * Instantaneous read of cached store details by storeId
 */
export function getCachedStore(storeId: string): StoreInfo | undefined {
  if (!storeId) return MAIN_STORE;
  return storesMap.get(storeId);
}
