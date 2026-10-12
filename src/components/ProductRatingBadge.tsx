import React from 'react';
import { Star } from 'lucide-react';
import { formatRating } from '../utils/rating';

export interface ProductRatingBadgeProps {
  rating: number | string | null | undefined;
  reviewsCount?: number | string | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  title?: string;
}

export function ProductRatingBadge({
  rating,
  className = '',
  size = 'md',
  onClick,
  title
}: ProductRatingBadgeProps) {
  const numericRating = typeof rating === 'number' ? rating : parseFloat(String(rating || 0));
  if (isNaN(numericRating) || numericRating <= 0) {
    return null;
  }

  const formatted = formatRating(numericRating);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-0.5 text-[11px] sm:text-xs gap-1 sm:gap-1.5',
    lg: 'px-2.5 py-1 text-xs sm:text-sm gap-1.5',
    xl: 'px-3 sm:px-3.5 py-1 sm:py-1.5 text-sm sm:text-base gap-1.5 sm:gap-2 shadow-md'
  }[size];

  const starSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
    lg: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
    xl: 'w-4 h-4 sm:w-5 sm:h-5'
  }[size];

  const isInteractive = Boolean(onClick);

  const commonProps = {
    'data-component': 'product-rating-badge',
    'data-rating-badge': 'true',
    style: { borderRadius: '6px' },
    className: `product-rating-badge !rounded-[6px] rounded-[6px] inline-flex items-center bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-xs text-slate-900 font-extrabold select-none transition-all ${
      isInteractive
        ? 'cursor-pointer pointer-events-auto hover:bg-white hover:border-slate-300 hover:shadow-md hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40'
        : 'pointer-events-none'
    } ${sizeClasses} ${className}`,
    'aria-label': title || `Rating: ${formatted} out of 5 stars`,
    title: title || (isInteractive ? `Rated ${formatted}/5. Click to view customer reviews` : `Rated ${formatted}/5`)
  };

  const content = (
    <>
      <span className="font-black text-slate-900 tracking-tight leading-none">
        {formatted}
      </span>
      <Star
        className={`${starSizes} fill-emerald-600 text-emerald-600 shrink-0`}
        strokeWidth={1.5}
      />
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        {...commonProps}
      >
        {content}
      </button>
    );
  }

  return (
    <div {...commonProps}>
      {content}
    </div>
  );
}

export default ProductRatingBadge;
