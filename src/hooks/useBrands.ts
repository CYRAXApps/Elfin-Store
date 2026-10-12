import { useState, useEffect } from 'react';
import { Brand } from '../types';
import { subscribeBrands, getCachedBrands } from '../services/catalogCache';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>(getCachedBrands);
  const [loading, setLoading] = useState<boolean>(() => getCachedBrands().length === 0);

  useEffect(() => {
    const unsubscribe = subscribeBrands((updatedBrands, isLoaded) => {
      setBrands(updatedBrands);
      if (isLoaded) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { brands, loading };
}

