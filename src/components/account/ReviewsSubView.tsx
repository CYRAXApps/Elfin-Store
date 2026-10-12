import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Package, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { UserReview } from '../../types';
import { formatRating, getStarFloor } from '../../utils/rating';

interface ReviewsSubViewProps {
  userId: string;
  onNavigateView?: (view: string, status?: string) => void;
}

export function ReviewsSubView({ userId, onNavigateView }: ReviewsSubViewProps) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userReviewsRef = collection(db, 'users', userId, 'reviews');
    const unsub = onSnapshot(userReviewsRef, (snapshot) => {
      const list: UserReview[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserReview));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return timeB - timeA;
      });
      setReviews(list);
      setLoading(false);
    }, (err) => {
      console.warn('Reviews fetch note:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
            <Star size={18} className="fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Reviews & Ratings
            </h2>
            <p className="text-slate-400 text-xs">
              {reviews.length} {reviews.length === 1 ? 'review submitted' : 'reviews submitted'} by you
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigateView) {
              onNavigateView('orders', 'delivered');
            } else {
              navigate('/account?view=orders&status=delivered');
            }
          }}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <Package size={13} /> Rate Delivered Items
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Loading your submitted reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Star size={26} className="text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No reviews submitted yet</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4 leading-relaxed">
            You haven't written any product reviews yet. Once your orders are delivered, you can rate products and share your experience with other shoppers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => {
                if (onNavigateView) {
                  onNavigateView('orders', 'delivered');
                } else {
                  navigate('/account?view=orders&status=delivered');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Package size={14} /> View Delivered Orders
            </button>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/30 flex flex-col sm:flex-row gap-3 items-start justify-between"
            >
              <div className="flex gap-3 items-start">
                {rev.productImage ? (
                  <img
                    src={rev.productImage}
                    alt={rev.productName || 'Product'}
                    className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 p-1 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Package size={18} />
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {rev.productName || 'Purchased Item'}
                  </h4>

                  {/* Stars */}
                  <div className="flex items-center gap-1 my-1">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 ml-1">
                      {formatRating(rev.rating)} / 5.0
                    </span>
                    {rev.verifiedPurchase && (
                      <span className="ml-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {rev.title && (
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">{rev.title}</p>
                  )}
                  {rev.comment && (
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{rev.comment}</p>
                  )}
                  {rev.reviewImage && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      <img src={rev.reviewImage} alt="Review photo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Reviewed on {formatTimeAgo(rev.createdAt)}
                  </p>
                </div>
              </div>

              {rev.productId && (
                <Link
                  to={`/product/${rev.productId}`}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0 mt-1 sm:mt-0"
                >
                  View Product <ChevronRight size={13} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
