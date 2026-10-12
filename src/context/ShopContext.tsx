import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore, ReactNode } from 'react';
import { Product, CartItem } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { isProductInStock, getProductAvailableStock } from '../utils/stockUtils';
import { getCachedProduct } from '../services/catalogCache';

// --- External Synchronous Stores for Zero-Cost Granular Re-renders ---

class CartCountStore {
  private count = 0;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.count;

  setCount = (newCount: number) => {
    if (this.count === newCount) return;
    this.count = newCount;
    this.listeners.forEach(l => l());
  };
}

export const cartCountStore = new CartCountStore();

class WishlistStore {
  private ids = new Set<string>();
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  setItems = (items: Product[]) => {
    const newIds = new Set(items.map(p => p.id));
    if (newIds.size === this.ids.size) {
      let isSame = true;
      for (const id of newIds) {
        if (!this.ids.has(id)) {
          isSame = false;
          break;
        }
      }
      if (isSame) return;
    }
    this.ids = newIds;
    this.listeners.forEach(l => l());
  };

  isInWishlist = (productId: string): boolean => {
    return this.ids.has(productId);
  };
}

export const wishlistStore = new WishlistStore();

// --- Context Definitions ---

export interface ShopActionsType {
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  addToWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeOutOfStockItems: () => Promise<void>;
}

export interface CartStateType {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
}

export interface WishlistStateType {
  wishlist: Product[];
  wishlistCount: number;
}

export interface ShopContextType extends ShopActionsType {
  cart: CartItem[];
  wishlist: Product[];
  cartTotal: number;
}

const ShopActionsContext = createContext<ShopActionsType | undefined>(undefined);
const CartStateContext = createContext<CartStateType | undefined>(undefined);
const WishlistStateContext = createContext<WishlistStateType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('electrostore_guest_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { user } = useAuth();
  const userId = user?.uid;

  // Stable references for all mutable state to guarantee action callbacks never re-allocate
  const cartRef = useRef<CartItem[]>(cart);
  const wishlistRef = useRef<Product[]>(wishlist);
  const userIdRef = useRef<string | undefined>(userId);

  useEffect(() => {
    cartRef.current = cart;
    const totalCount = cart.reduce((t, i) => t + i.quantity, 0);
    cartCountStore.setCount(totalCount);
  }, [cart]);

  useEffect(() => {
    wishlistRef.current = wishlist;
    wishlistStore.setItems(wishlist);
  }, [wishlist]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Firestore background listeners
  useEffect(() => {
    if (!userId) {
      setCart([]);
      try {
        const saved = localStorage.getItem('electrostore_guest_wishlist');
        const list = saved ? JSON.parse(saved) : [];
        setWishlist(list);
        wishlistStore.setItems(list);
      } catch {
        setWishlist([]);
        wishlistStore.setItems([]);
      }
      return;
    }

    const cartCollectionRef = collection(db, 'users', userId, 'cart');
    const unsubscribeCart = onSnapshot(cartCollectionRef, async (snapshot) => {
      try {
        const itemPromises = snapshot.docs.map(async (document) => {
          const data = document.data();
          const cached = getCachedProduct(data.productId);
          if (cached) {
            return { product: cached, quantity: data.quantity } as CartItem;
          }
          try {
            const pSnap = await getDoc(doc(db, 'products', data.productId));
            if (pSnap.exists()) {
              const pData = pSnap.data();
              const stock = typeof pData.stock === 'number' ? pData.stock : (pData.stock !== undefined ? Number(pData.stock) : undefined);
              const inStock = pData.inStock !== false && (stock === undefined || stock > 0);
              return {
                product: {
                  id: pSnap.id,
                  ...pData,
                  stock,
                  inStock
                } as Product,
                quantity: data.quantity
              } as CartItem;
            }
          } catch (e) {
            console.warn("Notice fetching cart product:", e);
          }
          return null;
        });
        const resolved = (await Promise.all(itemPromises)).filter((i): i is CartItem => Boolean(i));
        setCart(resolved);
      } catch (e) {
        console.warn("Notice parsing cart snapshot:", e);
      }
    }, (error) => console.warn("Notice fetching cart:", error?.message || error));

    const wishlistCollectionRef = collection(db, 'users', userId, 'wishlist');
    const unsubscribeWishlist = onSnapshot(wishlistCollectionRef, async (snapshot) => {
      try {
        const itemPromises = snapshot.docs.map(async (document) => {
          const pId = document.data().productId;
          const cached = getCachedProduct(pId);
          if (cached) {
            return cached;
          }
          try {
            const pSnap = await getDoc(doc(db, 'products', pId)).catch(() => null);
            if (pSnap && pSnap.exists()) {
              const pData = pSnap.data();
              const stock = typeof pData.stock === 'number' ? pData.stock : (pData.stock !== undefined ? Number(pData.stock) : undefined);
              const inStock = pData.inStock !== false && (stock === undefined || stock > 0);
              return {
                id: pSnap.id,
                ...pData,
                stock,
                inStock
              } as Product;
            }
          } catch (e) {
            console.warn("Notice fetching wishlist product:", e);
          }
          return null;
        });
        const resolved = (await Promise.all(itemPromises)).filter((p): p is Product => Boolean(p));
        setWishlist(resolved);
      } catch (e) {
        console.warn("Notice parsing wishlist snapshot:", e);
      }
    }, (error) => console.warn("Notice fetching wishlist:", error?.message || error));

    return () => {
      unsubscribeCart();
      unsubscribeWishlist();
    };
  }, [userId]);

  // STABLE ACTION HANDLERS (Dependencies are [] to never cause consumer re-renders)
  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    if (!isProductInStock(product)) {
      alert(`"${product.name}" is currently out of stock and cannot be added to cart.`);
      return;
    }

    const available = getProductAvailableStock(product);
    const currentCart = cartRef.current;
    const existing = currentCart.find(item => item.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (available !== Infinity && currentQtyInCart + quantity > available) {
      const canAdd = available - currentQtyInCart;
      if (canAdd <= 0) {
        alert(`Cannot add more. You already have all available units (${available}) of "${product.name}" in your cart.`);
        return;
      }
      alert(`Only ${available} units available in stock. Adding remaining ${canAdd} unit(s) to your cart.`);
      quantity = canAdd;
    }

    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setCart(prev => {
        const itemExists = prev.find(item => item.product.id === product.id);
        if (itemExists) {
          return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { product, quantity }];
      });
      return;
    }

    const itemRef = doc(db, 'users', currentUserId, 'cart', product.id);
    
    if (existing) {
      await setDoc(itemRef, {
        productId: product.id,
        quantity: existing.quantity + quantity,
        addedAt: serverTimestamp()
      });
    } else {
      await setDoc(itemRef, {
        productId: product.id,
        quantity,
        addedAt: serverTimestamp()
      });
    }
  }, []);

  const removeFromCart = useCallback(async (productId: string) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    await deleteDoc(doc(db, 'users', currentUserId, 'cart', productId));
  }, []);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity < 1) return;

    const currentCart = cartRef.current;
    const existing = currentCart.find(item => item.product.id === productId);
    if (existing) {
      const available = getProductAvailableStock(existing.product);
      if (available !== Infinity && quantity > available) {
        alert(`Only ${available} units of "${existing.product.name}" are available in stock.`);
        quantity = Math.max(1, available);
      }
    }

    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
      return;
    }
    await setDoc(doc(db, 'users', currentUserId, 'cart', productId), {
      productId,
      quantity,
      addedAt: serverTimestamp()
    });
  }, []);

  const removeOutOfStockItems = useCallback(async () => {
    const currentCart = cartRef.current;
    const outOfStockIds = currentCart
      .filter(item => !isProductInStock(item.product) || getProductAvailableStock(item.product) <= 0)
      .map(item => item.product.id);

    if (outOfStockIds.length === 0) return;

    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setCart(prev => prev.filter(item => !outOfStockIds.includes(item.product.id)));
      return;
    }

    for (const id of outOfStockIds) {
      try {
        await deleteDoc(doc(db, 'users', currentUserId, 'cart', id));
      } catch (e) {
        console.error("Error removing out of stock item:", e);
      }
    }
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistStore.isInWishlist(productId);
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) {
      setWishlist(prev => {
        const next = prev.some(p => p.id === product.id)
          ? prev.filter(p => p.id !== product.id)
          : [...prev, product];
        try {
          localStorage.setItem('electrostore_guest_wishlist', JSON.stringify(next));
        } catch (_) {}
        return next;
      });
      return;
    }
    
    const currentWishlist = wishlistRef.current;
    const exists = currentWishlist.some(p => p.id === product.id);
    const itemRef = doc(db, 'users', currentUserId, 'wishlist', product.id);
    
    // Optimistic UI update so heart flips without 1ms of delay
    setWishlist(prev => exists ? prev.filter(p => p.id !== product.id) : [...prev, product]);

    try {
      if (exists) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, {
          productId: product.id,
          addedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Error updating wishlist in Firestore:", e);
      setWishlist(prev => exists ? [...prev, product] : prev.filter(p => p.id !== product.id));
    }
  }, []);

  const addToWishlist = useCallback(async (product: Product) => {
    if (!wishlistStore.isInWishlist(product.id)) {
      await toggleWishlist(product);
    }
  }, [toggleWishlist]);

  // Compute cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [cart]);

  // Stable Actions Value (Never changes)
  const actionsValue = useMemo<ShopActionsType>(() => ({
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleWishlist,
    addToWishlist,
    isInWishlist,
    removeOutOfStockItems,
  }), [addToCart, removeFromCart, updateQuantity, toggleWishlist, addToWishlist, isInWishlist, removeOutOfStockItems]);

  // Cart State Value
  const cartStateValue = useMemo<CartStateType>(() => ({
    cart,
    cartTotal,
    cartCount: cart.reduce((t, i) => t + i.quantity, 0),
  }), [cart, cartTotal]);

  // Wishlist State Value
  const wishlistStateValue = useMemo<WishlistStateType>(() => ({
    wishlist,
    wishlistCount: wishlist.length,
  }), [wishlist]);

  return (
    <ShopActionsContext.Provider value={actionsValue}>
      <CartStateContext.Provider value={cartStateValue}>
        <WishlistStateContext.Provider value={wishlistStateValue}>
          {children}
        </WishlistStateContext.Provider>
      </CartStateContext.Provider>
    </ShopActionsContext.Provider>
  );
}

// --- Granular Hooks ---

/**
 * Access only action methods (addToCart, toggleWishlist, etc.).
 * Guarantees zero re-renders when cart or wishlist states update.
 */
export function useShopActions(): ShopActionsType {
  const context = useContext(ShopActionsContext);
  if (!context) {
    throw new Error('useShopActions must be used within a ShopProvider');
  }
  return context;
}

/**
 * Access cart items and total. Only re-renders when cart changes.
 */
export function useCart(): CartStateType {
  const context = useContext(CartStateContext);
  if (!context) {
    throw new Error('useCart must be used within a ShopProvider');
  }
  return context;
}

/**
 * Access cart total amount directly.
 */
export function useCartTotal(): number {
  const { cartTotal } = useCart();
  return cartTotal;
}

/**
 * High-performance hook for badge counts. Re-renders only when the count changes.
 */
export function useCartCount(): number {
  return useSyncExternalStore(
    cartCountStore.subscribe,
    cartCountStore.getSnapshot,
    () => 0
  );
}

/**
 * Access wishlist items and count. Only re-renders when wishlist changes.
 */
export function useWishlist(): WishlistStateType {
  const context = useContext(WishlistStateContext);
  if (!context) {
    throw new Error('useWishlist must be used within a ShopProvider');
  }
  return context;
}

/**
 * Access wishlist count directly.
 */
export function useWishlistCount(): number {
  const { wishlistCount } = useWishlist();
  return wishlistCount;
}

/**
 * High-performance hook for wishlist status.
 * Re-renders ONLY the specific product card whose boolean flips.
 */
export function useIsInWishlist(productId: string): boolean {
  return useSyncExternalStore(
    wishlistStore.subscribe,
    () => wishlistStore.isInWishlist(productId),
    () => false
  );
}

/**
 * Comprehensive hook providing backwards compatibility for existing code.
 */
export function useShop(): ShopContextType {
  const actions = useShopActions();
  const { cart, cartTotal } = useCart();
  const { wishlist } = useWishlist();

  return useMemo(() => ({
    ...actions,
    cart,
    wishlist,
    cartTotal,
  }), [actions, cart, wishlist, cartTotal]);
}
