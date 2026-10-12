import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/ShopContext';
import { ProductCard } from '../components/ProductCard';
import { AccountLayout } from '../components/account/AccountLayout';

export function Wishlist() {
  const { wishlist } = useWishlist();

  return (
    <AccountLayout activeView="wishlist" title="Wishlist">
      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-8 sm:p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
            <Heart size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">Your wishlist is empty</h2>
          <p className="text-slate-500 text-xs mb-6 max-w-sm leading-relaxed">Save items you like to your wishlist. Review them anytime and easily move them to the cart.</p>
          <Link to="/shop" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs">
            Start Shopping <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-rose-500 fill-rose-500" />
              <h1 className="text-base font-bold text-slate-900 tracking-tight">My Wishlist</h1>
            </div>
            <span className="text-xs text-slate-500 font-medium">{wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}</span>
          </div>

          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {wishlist.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
