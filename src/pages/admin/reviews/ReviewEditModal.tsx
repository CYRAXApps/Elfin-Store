import React, { useState } from 'react';
import { X, Star, Save, Loader2, AlertCircle } from 'lucide-react';
import { AdminReviewItem } from '../../../types';

interface ReviewEditModalProps {
  review: AdminReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReview: { rating: number; title: string; comment: string; status: 'approved' | 'rejected' | 'pending' }) => Promise<void>;
  isLoading: boolean;
}

export function ReviewEditModal({
  review,
  isOpen,
  onClose,
  onSave,
  isLoading
}: ReviewEditModalProps) {
  if (!isOpen || !review) return null;

  const [rating, setRating] = useState<number>(review.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState<string>(review.title || '');
  const [comment, setComment] = useState<string>(review.comment || '');
  const [status, setStatus] = useState<'approved' | 'rejected' | 'pending'>(review.status || 'approved');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ rating, title, comment, status });
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Edit Review</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Product: <span className="text-slate-700 font-semibold">{review.productName}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs sm:text-sm">
          {/* Star Rating Selection */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Rating Score</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star 
                    size={22} 
                    className={
                      star <= (hoverRating ?? rating) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'fill-slate-100 text-slate-200'
                    } 
                  />
                </button>
              ))}
              <span className="ml-2 font-bold text-slate-700 text-sm">{rating} / 5 Stars</span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Moderation Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Review Title / Summary</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent battery life and display"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Review Comment */}
          <div>
            <label className="block font-bold text-slate-700 text-xs mb-1.5">Review Comment</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write customer review text..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save & Synchronize</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
