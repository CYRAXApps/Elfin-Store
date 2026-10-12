import React, { useState, useRef } from 'react';
import { Star, X, Camera, Trash2 } from 'lucide-react';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product, OrderItem } from '../types';
import { computeUpdatedReviewAggregate } from '../utils/rating';
import { updateProductInCache } from '../services/catalogCache';

const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // fallback
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => resolve(file); // fallback
    };
    reader.onerror = () => resolve(file); // fallback
  });
};

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  userId: string;
  userName: string;
  existingReview?: any;
}

export function ProductReviewModal({ isOpen, onClose, product, userId, userName, existingReview }: ProductReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(existingReview?.reviewImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setReviewImageFile(file);
    setReviewImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const removeImage = () => {
    setReviewImageFile(null);
    setReviewImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (rating < 1 || rating > 5) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = existingReview?.reviewImage || null;
      
      if (reviewImageFile) {
        // Compress image before upload
        const compressedFile = await compressImage(reviewImageFile);
        const imageRef = ref(storage, `reviews/${product.id}/${userId}_${Date.now()}`);
        
        // Wrap uploadBytes with a timeout so it doesn't hang indefinitely on missing buckets/CORS 
        // which causes Firebase SDK to retry for 10 minutes thinking it's a network error.
        const uploadWithTimeout = () => {
          return new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Firebase Storage bucket not found. Review submission will work fully once your Student bucket is configured."));
            }, 5000); // 5 second timeout is sufficient
            
            uploadBytes(imageRef, compressedFile)
              .then((snapshot) => {
                clearTimeout(timeout);
                resolve(snapshot);
              })
              .catch((err) => {
                clearTimeout(timeout);
                reject(err);
              });
          });
        };
        
        const snapshot = await uploadWithTimeout();
        uploadedImageUrl = await getDownloadURL(snapshot.ref);
      } else if (!reviewImagePreview) {
        uploadedImageUrl = null;
      }

      const batch = writeBatch(db);
      
      const userReviewRef = doc(db, 'users', userId, 'reviews', product.id);
      const productReviewRef = doc(db, 'products', product.id, 'reviews', userId);
      const productRef = doc(db, 'products', product.id);
      
      const reviewData: any = {
        userId,
        userName,
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || product.image || null,
        rating,
        title,
        comment,
        verifiedPurchase: true,
        status: existingReview?.status || 'approved',
        createdAt: existingReview ? existingReview.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (uploadedImageUrl !== undefined) {
        reviewData.reviewImage = uploadedImageUrl;
      }

      batch.set(userReviewRef, reviewData, { merge: true });
      batch.set(productReviewRef, reviewData, { merge: true });

      // Update product rating aggregate using canonical calculation
      const { newRating, newCount } = computeUpdatedReviewAggregate(
        product.rating,
        product.reviewsCount,
        rating,
        existingReview?.rating
      );

      if (!existingReview) {
        batch.update(productRef, {
          reviewsCount: increment(1),
          rating: newRating
        });
      } else {
        batch.update(productRef, {
          rating: newRating
        });
      }

      await batch.commit();

      // Optimistically update memory catalog cache
      if (product.id) {
        updateProductInCache({
          ...product,
          rating: newRating,
          reviewsCount: newCount
        });
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{existingReview ? 'Edit Review' : 'Write a Review'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex gap-4 items-start mb-6">
            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
              <img src={product.images?.[0] || product.image} alt={product.name} className="w-full h-full object-cover mix-blend-multiply p-1" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{product.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{product.brand}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Overall Rating *</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Review Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summary of your experience"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm"
              maxLength={100}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Review Details (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike? What should other shoppers know before buying?"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors text-sm min-h-[120px] resize-y"
              maxLength={1000}
            />
            <div className="text-right text-[10px] text-slate-400 mt-1">
              {comment.length}/1000
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Add Photo (Optional)</label>
            {!reviewImagePreview ? (
              <div 
                className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center text-slate-500 hover:text-blue-600">
                  <Camera size={24} className="mb-1" />
                  <span className="text-xs font-semibold">Upload Image</span>
                </div>
              </div>
            ) : (
              <div className="relative inline-block w-24 h-24 rounded-xl border border-slate-200 overflow-hidden group">
                <img src={reviewImagePreview} alt="Review Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1.5 bg-white text-rose-600 hover:bg-rose-50 rounded-lg shadow-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg, image/png, image/webp"
              className="hidden" 
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
