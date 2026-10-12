import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../../context/ShopContext';
import { ProductCard } from '../ProductCard';

export function WishlistSubView() {
  const { wishlist } = useWishlist();

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
            <Heart size={18} className="fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              My Wishlist
            </h2>
            <p className="text-slate-400 text-xs">
              {wishlist.length} {wishlist.length === 1 ? 'saved item' : 'saved items'} in your collection
            </p>
          </div>
        </div>

        <Link
          to="/shop"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <ShoppingBag size={13} /> Explore Store
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Heart size={26} className="text-rose-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Your wishlist is empty</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4 leading-relaxed">
            Save gadgets and appliances you love by clicking the heart icon while browsing. Review them anytime and easily move them to your cart.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <ShoppingBag size={14} /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-[480px]:gap-3 sm:gap-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
