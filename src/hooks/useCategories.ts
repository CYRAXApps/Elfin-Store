import { useState, useEffect } from 'react';
import { Category } from '../types';
import { subscribeCategories, getCachedCategories } from '../services/catalogCache';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(getCachedCategories);
  const [loading, setLoading] = useState<boolean>(() => getCachedCategories().length === 0);

  useEffect(() => {
    const unsubscribe = subscribeCategories((updatedCategories, isLoaded) => {
      setCategories(updatedCategories);
      if (isLoaded) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { categories, loading };
}

