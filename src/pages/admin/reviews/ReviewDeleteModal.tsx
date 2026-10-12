import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { AdminReviewItem } from '../../../types';

interface ReviewDeleteModalProps {
  review: AdminReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (review: AdminReviewItem) => Promise<void>;
  isLoading: boolean;
}

export function ReviewDeleteModal({
  review,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: ReviewDeleteModalProps) {
  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-base">Delete Review</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to permanently delete this review for{' '}
              <strong className="text-slate-800">{review.productName}</strong> by{' '}
              <strong className="text-slate-800">{review.userName}</strong>?
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Rating:</span>
            <span className="font-bold text-slate-800">{review.rating} / 5 Stars</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Review ID:</span>
            <span className="font-mono text-slate-700">{review.id}</span>
          </div>
          <p className="text-[11px] text-amber-700 font-semibold pt-1">
            This action will automatically recalculate the product rating and review count.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(review)}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            <span>Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
