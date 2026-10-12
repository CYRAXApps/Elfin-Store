import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Product, Order } from '../../types';
import { useProducts } from '../../hooks/useProducts';

export function DashboardWidgets({ 
  orders,
  onNavigateView 
}: { 
  orders: Order[],
  onNavigateView: (view: string) => void 
}) {
  const { products } = useProducts();
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('electro_recently_viewed') || '[]');
      if (Array.isArray(stored)) {
        setRecentlyViewedIds(stored.slice(0, 8));
      }
    } catch {}
  }, []);

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [recentlyViewedIds, products]);

  const unratedItems = useMemo(() => {
    const delivered = (orders || []).flatMap(o => {
      // Look for delivered orders
      if (o && o.status === 'delivered' && Array.isArray(o.items)) {
        return o.items.map(item => ({ ...item, orderId: o.id, date: o.updatedAt || o.createdAt || Date.now() }));
      }
      return [];
    });
    return delivered.slice(0, 6);
  }, [orders]);

  const formatDate = (ts: any) => {
    if (!ts) return 'Recently';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Recently Viewed Stores */}
      {recentlyViewedProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">Recently Viewed Stores</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            {recentlyViewedProducts.map((p, i) => (
              <Link to={`/product/${p.id}`} key={p.id} className="shrink-0 w-[90px] snap-start flex flex-col gap-2 group">
                <div className="w-[90px] h-[90px] rounded-2xl bg-slate-100 border border-slate-200/50 overflow-hidden relative">
                  <img src={p.images?.[0] || p.thumbnail} alt={p.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform" />
                  {i === 0 && (
                     <div className="absolute bottom-1 right-1 bg-gradient-to-br from-amber-300 to-amber-500 text-[8px] font-bold text-slate-900 px-1.5 py-1 rounded shadow-sm text-center leading-none">
                       BRAND<br/>AUTHORIZED
                     </div>
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 truncate text-center">{p.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ratings & Reviews */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Ratings & Reviews</h2>
          <button onClick={() => onNavigateView('reviews')} className="text-xs text-center font-bold text-blue-600 hover:text-blue-700">View all</button>
        </div>
        
        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          {unratedItems.length > 0 ? unratedItems.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="shrink-0 w-[260px] sm:w-[280px] snap-start border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white shadow-xs">
              <div className="p-3 sm:p-4 flex items-center gap-3 border-b border-slate-100">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{item.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Delivered on {formatDate(item.date)}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50/50 py-3 flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Rate this product</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Link key={i} to={`/product/${item.productId}?tab=reviews`} className="text-slate-300 hover:text-amber-400 transition-colors">
                      <Star size={24} strokeWidth={1.5} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-sm text-slate-500 py-4">No recent deliveries waiting for review.</div>
          )}
        </div>
      </div>
    </div>
  );
}
