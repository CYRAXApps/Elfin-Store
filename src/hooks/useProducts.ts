import { useState, useEffect } from 'react';
import { Product } from '../types';
import { subscribeProducts, getCachedProducts } from '../services/catalogCache';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(getCachedProducts);
  const [loading, setLoading] = useState<boolean>(() => getCachedProducts().length === 0);

  useEffect(() => {
    const unsubscribe = subscribeProducts((updatedProducts, isLoaded) => {
      setProducts(updatedProducts);
      if (isLoaded) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { products, loading };
}



