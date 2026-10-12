import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingBag, Trash2 } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../types';
import { ProductCard } from '../ProductCard';

interface RecentlyViewedSubViewProps {
  userId?: string;
}

export function RecentlyViewedSubView({ userId }: RecentlyViewedSubViewProps) {
  const { products } = useProducts();
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    let localIds: string[] = [];
    try {
      const stored = JSON.parse(localStorage.getItem('electro_recently_viewed') || '[]');
      if (Array.isArray(stored)) {
        localIds = stored;
      }
    } catch {
      localIds = [];
    }

    if (userId) {
      const userDocRef = doc(db, 'users', userId);
      getDoc(userDocRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const firestoreIds: string[] = Array.isArray(data.recentlyViewed) ? data.recentlyViewed : [];
          const merged = Array.from(new Set([...localIds, ...firestoreIds])).slice(0, 15);
          setRecentlyViewedIds(merged);
        } else {
          setRecentlyViewedIds(localIds);
        }
      }).catch(() => {
        setRecentlyViewedIds(localIds);
      });
    } else {
      setRecentlyViewedIds(localIds);
    }
  }, [userId]);

  const recentlyViewedProducts = useMemo(() => {
    if (recentlyViewedIds.length === 0 || products.length === 0) return [];
    const productMap = new Map(products.map(p => [p.id, p]));
    return recentlyViewedIds
      .map(id => productMap.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [recentlyViewedIds, products]);

  const handleClearHistory = async () => {
    try {
      localStorage.removeItem('electro_recently_viewed');
      setRecentlyViewedIds([]);
      if (userId) {
        await setDoc(doc(db, 'users', userId), { recentlyViewed: [] }, { merge: true });
      }
    } catch (e) {
      console.warn('Notice clearing history:', e);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
            <Eye size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recently Viewed Products
            </h2>
            <p className="text-slate-400 text-xs">
              {recentlyViewedProducts.length} {recentlyViewedProducts.length === 1 ? 'product' : 'products'} browsed recently
            </p>
          </div>
        </div>

        {recentlyViewedProducts.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 size={13} /> Clear History
          </button>
        )}
      </div>

      {recentlyViewedProducts.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Eye size={26} className="text-blue-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No recently viewed items</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4 leading-relaxed">
            As you browse products, items you view will appear here for easy comparison and quick access.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <ShoppingBag size={14} /> Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-[480px]:gap-3 sm:gap-4">
          {recentlyViewedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
