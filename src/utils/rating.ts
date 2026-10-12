/**
 * Shared Product Rating & Review Utilities
 * Canonical source for rating calculations and formatting across all customer-facing views.
 */

/**
 * Formats a rating value to EXACTLY ONE decimal place.
 * Examples:
 *  - 4.8001605136436 -> "4.8"
 *  - 4.898992161254199 -> "4.9"
 *  - 5 -> "5.0"
 *  - 4 -> "4.0"
 *  - 3.666666666 -> "3.7"
 *  - 4.25 -> "4.3"
 *  - 4.75 -> "4.8"
 *  - 0 -> "0.0"
 */
export function formatRating(
  rating: number | string | null | undefined,
  fallback: string = '0.0'
): string {
  if (rating === null || rating === undefined) {
    return fallback;
  }
  const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  if (num <= 0) {
    return '0.0';
  }
  // Clamp between 0 and 5
  const clamped = Math.min(5, Math.max(0, num));
  return clamped.toFixed(1);
}

/**
 * Formats review count as a whole integer.
 * Examples:
 *  - 1246.000 -> 1246
 *  - "893" -> 893
 *  - null/undefined -> 0
 */
export function formatReviewCount(
  count: number | string | null | undefined
): number {
  if (count === null || count === undefined) {
    return 0;
  }
  const num = typeof count === 'number' ? count : parseInt(String(count), 10);
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  return Math.max(0, Math.round(num));
}

/**
 * Returns integer star count for rendering filled vs unfilled stars (0 to 5)
 */
export function getStarFloor(
  rating: number | string | null | undefined
): number {
  if (rating === null || rating === undefined) return 0;
  const num = typeof rating === 'number' ? rating : parseFloat(String(rating));
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.min(5, Math.max(0, Math.floor(num)));
}

export interface RatingAggregate {
  rating: number;          // numeric rating rounded to 1 decimal place (e.g. 4.8)
  reviewsCount: number;    // whole integer count (e.g. 1246)
  formattedRating: string; // string representation with 1 decimal place (e.g. "4.8")
  starCount: number;       // integer for star display (0..5)
  hasReviews: boolean;     // whether reviewsCount > 0
}

/**
 * Calculates average rating and count from an array of review records.
 * Uses real review records.
 */
export function calculateReviewsAggregate(
  reviews?: Array<{ rating?: number | string; [key: string]: any }> | null,
  fallbackProduct?: { rating?: number; reviewsCount?: number } | null
): RatingAggregate {
  if (Array.isArray(reviews) && reviews.length > 0) {
    const validRatings = reviews
      .map(r => (typeof r.rating === 'number' ? r.rating : parseFloat(String(r.rating || 0))))
      .filter(r => !isNaN(r) && r >= 1 && r <= 5);

    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / validRatings.length;
      // Round to 1 decimal place
      const rounded = Math.round(avg * 10) / 10;
      return {
        rating: rounded,
        reviewsCount: validRatings.length,
        formattedRating: avg.toFixed(1),
        starCount: Math.min(5, Math.floor(avg)),
        hasReviews: true
      };
    }
  }

  // Fallback to product stored fields if no reviews array passed
  const storedRating = fallbackProduct?.rating !== undefined ? Number(fallbackProduct.rating) : 0;
  const storedCount = fallbackProduct?.reviewsCount !== undefined ? formatReviewCount(fallbackProduct.reviewsCount) : 0;
  
  if (storedCount > 0 && storedRating > 0) {
    const validStored = Math.min(5, Math.max(0, storedRating));
    return {
      rating: Math.round(validStored * 10) / 10,
      reviewsCount: storedCount,
      formattedRating: validStored.toFixed(1),
      starCount: Math.min(5, Math.floor(validStored)),
      hasReviews: true
    };
  }

  return {
    rating: 0,
    reviewsCount: 0,
    formattedRating: '0.0',
    starCount: 0,
    hasReviews: false
  };
}

/**
 * Computes updated aggregate rating and reviews count after adding or modifying a review.
 */
export function computeUpdatedReviewAggregate(
  currentRating: number = 0,
  currentReviewsCount: number = 0,
  newReviewRating: number,
  existingReviewRating?: number
): { newRating: number; newCount: number } {
  const count = formatReviewCount(currentReviewsCount);
  const rating = Number(currentRating) || 0;
  const newRevRating = Math.min(5, Math.max(1, Number(newReviewRating) || 5));

  if (existingReviewRating !== undefined && existingReviewRating > 0) {
    // Editing an existing review
    const prevRating = Math.min(5, Math.max(1, Number(existingReviewRating)));
    const totalCount = Math.max(1, count);
    const oldTotal = rating * totalCount;
    const newTotal = oldTotal - prevRating + newRevRating;
    const computedAvg = Math.min(5, Math.max(1, newTotal / totalCount));
    const rounded = Math.round(computedAvg * 10) / 10;
    return {
      newRating: rounded,
      newCount: totalCount
    };
  } else {
    // Adding a new review
    const oldTotal = rating * count;
    const newTotal = oldTotal + newRevRating;
    const newCount = count + 1;
    const computedAvg = Math.min(5, Math.max(1, newTotal / newCount));
    const rounded = Math.round(computedAvg * 10) / 10;
    return {
      newRating: rounded,
      newCount
    };
  }
}
