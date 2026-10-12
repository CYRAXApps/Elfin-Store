import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '../types';
import { getCachedProduct, subscribeProducts, updateProductInCache } from '../services/catalogCache';

/**
 * Hook to load a single canonical product by ID.
 * Provides instant 0ms cached rendering and shares the global real-time catalog subscription,
 * eliminating duplicate Firestore connections on product navigation.
 */
export function useProduct(id?: string) {
  const initialCached = id ? getCachedProduct(id) : null;
  const [product, setProduct] = useState<Product | null>(() => initialCached || null);
  const [loading, setLoading] = useState<boolean>(() => !initialCached && Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const cached = getCachedProduct(id);
    if (cached) {
      setProduct(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    // Subscribe to shared catalog feed instead of opening duplicate Firestore listeners
    const unsubscribe = subscribeProducts((products, isLoaded) => {
      const found = products.find(p => p.id === id);
      if (found) {
        setProduct(found);
        setLoading(false);
      } else if (isLoaded) {
        // Fallback: check direct Firestore document once if not in standard catalog
        const docRef = doc(db, 'products', id);
        getDoc(docRef)
          .then((docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const resolvedProduct: Product = {
                id: docSnap.id,
                name: data.name || '',
                description: data.description || '',
                shortSpecification: data.shortSpecification || '',
                price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
                originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : Number(data.originalPrice) || 0,
                discountPercentage: typeof data.discountPercentage === 'number' ? data.discountPercentage : Number(data.discountPercentage) || 0,
                rating: data.rating !== undefined && data.rating !== null
                  ? Math.round((Number(data.rating) || 0) * 10) / 10 
                  : undefined,
                reviewsCount: data.reviewsCount !== undefined && data.reviewsCount !== null
                  ? Math.max(0, Math.round(Number(data.reviewsCount) || 0))
                  : undefined,
                category: data.category || '',
                brand: data.brand || '',
                image: data.image || '',
                images: Array.isArray(data.images) && data.images.length > 0 
                  ? data.images.filter((img: any) => typeof img === 'string' && img.trim()) 
                  : (data.image ? [data.image] : []),
                isBestSeller: Boolean(data.isBestSeller),
                isNewArrival: Boolean(data.isNewArrival),
                stock: typeof data.stock === 'number' ? data.stock : (data.stock !== undefined ? Number(data.stock) : undefined),
                inStock: data.inStock !== false && (data.stock === undefined || Number(data.stock) > 0),
                features: Array.isArray(data.features) ? data.features : [],
                specifications: typeof data.specifications === 'object' && data.specifications !== null ? data.specifications : {},
                sku: data.sku || undefined,
              };
              setProduct(resolvedProduct);
              updateProductInCache(resolvedProduct);
            } else {
              setProduct(null);
            }
            setLoading(false);
          })
          .catch((err) => {
            console.warn("Product doc lookup notice:", err.message || err);
            setProduct(null);
            setLoading(false);
          });
      }
    });

    return () => unsubscribe();
  }, [id]);

  return { product, loading, error };
}

