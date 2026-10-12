import { useState, useEffect } from 'react';
import { StoreInfo } from '../types';
import { subscribeStores, getCachedStores } from '../services/catalogCache';

export function useStores() {
  const [stores, setStores] = useState<StoreInfo[]>(getCachedStores);
  const [loading, setLoading] = useState<boolean>(() => getCachedStores().length === 0);

  useEffect(() => {
    const unsubscribe = subscribeStores((updatedStores, isLoaded) => {
      setStores(updatedStores);
      if (isLoaded) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { stores, loading };
}
