import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  User, 
  Package, 
  ShoppingBag, 
  ShieldCheck, 
  Calendar, 
  ExternalLink, 
  Maximize2,
  Copy,
  Check
} from 'lucide-react';
import { AdminReviewItem } from '../../../types';

interface ReviewDetailsModalProps {
  review: AdminReviewItem;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (review: AdminReviewItem) => Promise<void>;
  onReject: (review: AdminReviewItem) => Promise<void>;
  onOpenDelete: (review: AdminReviewItem) => void;
  onOpenEdit: (review: AdminReviewItem) => void;
  onNavigateProduct?: (productId: string) => void;
  onNavigateCustomer?: (customerId: string) => void;
  isActionLoading?: boolean;
}

export function ReviewDetailsModal({
  review,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onOpenDelete,
  onOpenEdit,
  onNavigateProduct,
  onNavigateCustomer,
  isActionLoading = false
}: ReviewDetailsModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const imagesList = review.reviewImages && review.reviewImages.length > 0 
    ? review.reviewImages 
    : review.reviewImage ? [review.reviewImage] : [];

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Star size={20} className="fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">Review Details</h3>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    review.status === 'approved' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : review.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {review.status === 'approved' && <CheckCircle2 size={12} />}
                    {review.status === 'rejected' && <XCircle size={12} />}
                    {review.status === 'pending' && <AlertCircle size={12} />}
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span>ID: {review.id}</span>
                  <button 
                    onClick={() => copyToClipboard(review.id)}
                    className="hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    title="Copy Review ID"
                  >
                    {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
            
            {/* Rating & Review Content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={18} 
                        className={star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} 
                      />
                    ))}
                  </div>
                  <span className="font-black text-slate-900 text-base">{Number(review.rating).toFixed(1)} / 5.0</span>
                </div>

                {review.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    Verified Purchase
                  </span>
                )}
              </div>

              {review.title && (
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">{review.title}</h4>
              )}

              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {review.comment || <span className="italic text-slate-400">No written comment provided by customer. Star rating only.</span>}
              </p>

              {/* Uploaded Customer Photos */}
              {imagesList.length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Customer Photos ({imagesList.length})
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {imagesList.map((imgUrl, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs hover:border-blue-400 transition-all"
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Review photo ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grid of Product & Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Product Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={13} />
                    Product Information
                  </span>
                  {onNavigateProduct && (
                    <button
                      onClick={() => onNavigateProduct(review.productId)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View in Catalog</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {review.productImage ? (
                      <img src={review.productImage} alt={review.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{review.productName}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {review.productId}</p>
                    {review.productPrice !== undefined && (
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        ₹{Number(review.productPrice).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={13} />
                    Customer Information
                  </span>
                  {onNavigateCustomer && (
                    <button
                      onClick={() => onNavigateCustomer(review.userId)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Customer Profile</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                    {(review.userName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{review.userName || 'Customer'}</p>
                    {review.userEmail && (
                      <p className="text-xs text-slate-600 truncate mt-0.5">{review.userEmail}</p>
                    )}
                    {review.userPhone && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{review.userPhone}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {review.userId}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Order Information if Available */}
            {review.orderId && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag size={13} />
                    Delivered Purchase Reference
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    {review.orderStatus ? review.orderStatus.toUpperCase() : 'DELIVERED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Order ID</span>
                    <span className="font-mono font-bold text-slate-800">{review.orderNumber || review.orderId}</span>
                  </div>
                  {review.orderDate && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Order Date</span>
                      <span className="text-slate-700">
                        {new Date(review.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {review.orderTotal !== undefined && review.orderTotal !== null && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Order Total</span>
                      <span className="font-semibold text-slate-800">
                        ₹{Number(review.orderTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer with Admin Actions */}
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenDelete(review)}
                disabled={isActionLoading}
                className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
              
              <button
                onClick={() => onOpenEdit(review)}
                disabled={isActionLoading}
                className="px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {review.status !== 'rejected' && (
                <button
                  onClick={() => onReject(review)}
                  disabled={isActionLoading}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>
              )}

              {review.status !== 'approved' && (
                <button
                  onClick={() => onApprove(review)}
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="High resolution review preview" 
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" 
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 rounded-full cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
