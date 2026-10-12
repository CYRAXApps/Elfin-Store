import type { Express, Request, Response } from 'express';
import { getDb, FieldValue } from './serverDb';

export interface AdminReviewItem {
  id: string; // doc ID in products/{productId}/reviews (usually userId)
  reviewId: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice?: number;
  productCurrentRating?: number;
  productCurrentReviewsCount?: number;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  rating: number;
  title: string;
  comment: string;
  reviewImage?: string | null;
  reviewImages?: string[];
  verifiedPurchase: boolean;
  orderId?: string | null;
  orderNumber?: string | null;
  orderDate?: string | null;
  orderTotal?: number | null;
  orderStatus?: string | null;
  status: 'approved' | 'rejected' | 'pending';
  createdAt: string;
  updatedAt: string;
}

const BASELINE_PRODUCTS: Record<string, { rating: number; reviewsCount: number }> = {
  p1: { rating: 4.8, reviewsCount: 1245 },
  p2: { rating: 4.9, reviewsCount: 892 },
  p3: { rating: 4.7, reviewsCount: 456 },
  p4: { rating: 4.8, reviewsCount: 2104 },
  p5: { rating: 4.7, reviewsCount: 843 },
  p6: { rating: 4.9, reviewsCount: 312 },
  p7: { rating: 4.2, reviewsCount: 15420 },
  p8: { rating: 4.6, reviewsCount: 680 }
};

/**
 * Canonical product rating recalculation
 * Formula: (baseline total + approved customer ratings) / total reviews count
 * Rounded to exactly 1 decimal place (e.g., 4.8, 4.9, 5.0)
 */
export async function recalculateProductRating(productId: string): Promise<{ newRating: number; newCount: number }> {
  const db = getDb();
  const productRef = db.collection('products').doc(productId);
  const productSnap = await productRef.get();
  const pData = productSnap.exists ? productSnap.data() : {};

  // Baseline catalog ratings
  const baseline = BASELINE_PRODUCTS[productId] || {
    rating: Number(pData?.rating) || 4.8,
    reviewsCount: Number(pData?.reviewsCount) || 0
  };

  const reviewsCol = productRef.collection('reviews');
  const snap = await reviewsCol.get();

  const approvedRatings: number[] = [];
  snap.docs.forEach((d: any) => {
    const data = d.data();
    // Exclude rejected and pending reviews from public score; include approved
    if (data?.status === 'approved' || (!data?.status && data?.status !== 'rejected' && data?.status !== 'pending')) {
      const r = typeof data?.rating === 'number' ? data.rating : parseFloat(String(data?.rating || 0));
      if (!isNaN(r) && r >= 1 && r <= 5) {
        approvedRatings.push(r);
      }
    }
  });

  let newRating = baseline.rating;
  const newCount = approvedRatings.length;
  if (newCount > 0) {
    const sum = approvedRatings.reduce((acc, curr) => acc + curr, 0);
    newRating = Math.round((sum / newCount) * 10) / 10;
  }

  // Update product in Firestore
  try {
    await productRef.set({
      rating: newRating,
      reviewsCount: newCount,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err: any) {
    console.warn(`[Reviews] Could not update product ${productId}:`, err?.message);
  }

  return { newRating, newCount };
}

export function registerReviewsRoutes(app: Express) {
  /**
   * GET /api/admin/reviews
   * Retrieves all customer reviews across all products,
   * enriched with product details, customer info, and genuine delivered order references.
   */
  app.get('/api/admin/reviews', async (req: Request, res: Response) => {
    try {
      const db = getDb();

      // 1. Fetch all products to map product data and iterate their reviews
      const productsSnap = await db.collection('products').get();
      const productMap = new Map<string, any>();
      productsSnap.docs.forEach((d: any) => {
        productMap.set(d.id, { id: d.id, ...d.data() });
      });

      // 2. Fetch all users to enrich user details
      const usersSnap = await db.collection('users').get();
      const userMap = new Map<string, any>();
      usersSnap.docs.forEach((d: any) => {
        userMap.set(d.id, { id: d.id, ...d.data() });
      });

      // 3. Fetch orders to cross-reference verified delivered purchases
      let ordersList: any[] = [];
      try {
        const ordersSnap = await db.collection('orders').get();
        ordersList = ordersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      } catch (oErr) {
        console.warn('[Reviews] Notice reading orders collection:', oErr);
      }

      const allReviews: AdminReviewItem[] = [];

      // 4. Iterate over each product and collect reviews
      for (const [productId, prodData] of productMap.entries()) {
        try {
          const reviewsSnap = await db.collection('products').doc(productId).collection('reviews').get();
          
          reviewsSnap.docs.forEach((docSnap: any) => {
            const rData = docSnap.data() || {};
            const userId = rData.userId || docSnap.id;
            const userData = userMap.get(userId) || {};

            // Determine if verified purchase from real orders
            let isVerifiedPurchase = Boolean(rData.verifiedPurchase);
            let matchedOrder = null;

            if (rData.orderId) {
              matchedOrder = ordersList.find((o) => o.id === rData.orderId || o.orderNumber === rData.orderId);
              if (matchedOrder) {
                isVerifiedPurchase = true;
              }
            } else if (!isVerifiedPurchase && userId) {
              // Search user orders containing this productId with status delivered/completed
              matchedOrder = ordersList.find(
                (o) =>
                  (o.userId === userId || o.customerId === userId || o.customerEmail === (rData.userEmail || userData.email)) &&
                  (o.items || []).some((item: any) => item.id === productId || item.productId === productId) &&
                  (o.status === 'delivered' || o.status === 'completed')
              );
              if (matchedOrder) {
                isVerifiedPurchase = true;
              }
            }

            allReviews.push({
              id: docSnap.id,
              reviewId: docSnap.id,
              productId: productId,
              productName: prodData.name || prodData.title || `Product #${productId}`,
              productImage: prodData.image || (Array.isArray(prodData.images) ? prodData.images[0] : '') || '',
              productPrice: prodData.price,
              productCurrentRating: prodData.rating,
              productCurrentReviewsCount: prodData.reviewsCount,
              userId: userId,
              userName: rData.userName || userData.displayName || userData.name || 'Verified Customer',
              userEmail: rData.userEmail || userData.email || '',
              userPhone: rData.userPhone || userData.phoneNumber || userData.phone || '',
              rating: typeof rData.rating === 'number' ? rData.rating : Number(rData.rating) || 5,
              title: rData.title || '',
              comment: rData.comment || rData.review || '',
              reviewImage: rData.reviewImage || (Array.isArray(rData.reviewImages) ? rData.reviewImages[0] : null) || null,
              reviewImages: Array.isArray(rData.reviewImages) ? rData.reviewImages : (rData.reviewImage ? [rData.reviewImage] : []),
              verifiedPurchase: isVerifiedPurchase,
              orderId: rData.orderId || (matchedOrder ? matchedOrder.id : null),
              orderNumber: rData.orderNumber || (matchedOrder ? (matchedOrder.orderNumber || matchedOrder.id) : null),
              orderDate: rData.orderDate || (matchedOrder ? (matchedOrder.createdAt || matchedOrder.date) : null),
              orderTotal: rData.orderTotal || (matchedOrder ? (matchedOrder.total || matchedOrder.amount) : null),
              orderStatus: rData.orderStatus || (matchedOrder ? matchedOrder.status : null),
              status: rData.status === 'rejected' ? 'rejected' : (rData.status === 'pending' ? 'pending' : 'approved'),
              createdAt: rData.createdAt ? (typeof rData.createdAt === 'object' && rData.createdAt.toDate ? rData.createdAt.toDate().toISOString() : String(rData.createdAt)) : new Date().toISOString(),
              updatedAt: rData.updatedAt ? (typeof rData.updatedAt === 'object' && rData.updatedAt.toDate ? rData.updatedAt.toDate().toISOString() : String(rData.updatedAt)) : new Date().toISOString()
            });
          });
        } catch (prodRevErr) {
          console.warn(`[Reviews] Notice reading reviews for product ${productId}:`, prodRevErr);
        }
      }

      // Sort reviews descending by creation time
      allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(allReviews);
    } catch (err: any) {
      console.error('[Reviews API Error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to fetch reviews' });
    }
  });

  /**
   * POST /api/admin/reviews/:productId/:reviewId/status
   * Updates status to 'approved' | 'rejected' | 'pending'
   * Recalculates product's canonical rating and reviews count immediately
   */
  app.post('/api/admin/reviews/:productId/:reviewId/status', async (req: Request, res: Response) => {
    try {
      const { productId, reviewId } = req.params;
      const { status } = req.body;

      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Valid status required: approved, rejected, or pending' });
      }

      const db = getDb();
      const productRevRef = db.collection('products').doc(productId).collection('reviews').doc(reviewId);
      const productRevSnap = await productRevRef.get();
      if (!productRevSnap.exists) {
        return res.status(404).json({ error: 'Review not found under product' });
      }

      const revData = productRevSnap.data() || {};
      const userId = revData.userId || reviewId;

      await productRevRef.set({
        status,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Sync user subcollection review if it exists
      try {
        const userRevRef = db.collection('users').doc(userId).collection('reviews').doc(productId);
        const userRevSnap = await userRevRef.get();
        if (userRevSnap.exists) {
          await userRevRef.set({
            status,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (userRevErr) {
        console.warn(`[Reviews] Could not sync user review for ${userId}:`, userRevErr);
      }

      // Canonical rating recalculation
      const { newRating, newCount } = await recalculateProductRating(productId);

      res.json({
        success: true,
        productId,
        reviewId,
        status,
        newRating,
        newCount,
        message: `Review marked as ${status}. Product rating updated to ${newRating} (${newCount} reviews).`
      });
    } catch (err: any) {
      console.error('[Reviews Status Error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to update review status' });
    }
  });

  /**
   * PUT /api/admin/reviews/:productId/:reviewId
   * Allows editing review rating, title, and comment
   */
  app.put('/api/admin/reviews/:productId/:reviewId', async (req: Request, res: Response) => {
    try {
      const { productId, reviewId } = req.params;
      const { rating, title, comment, status } = req.body;

      const db = getDb();
      const productRevRef = db.collection('products').doc(productId).collection('reviews').doc(reviewId);
      const productRevSnap = await productRevRef.get();
      if (!productRevSnap.exists) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const revData = productRevSnap.data() || {};
      const userId = revData.userId || reviewId;

      const updatePayload: any = {
        updatedAt: new Date().toISOString()
      };
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        updatePayload.rating = Math.round(rating);
      }
      if (typeof title === 'string') {
        updatePayload.title = title;
      }
      if (typeof comment === 'string') {
        updatePayload.comment = comment;
      }
      if (status && ['approved', 'rejected', 'pending'].includes(status)) {
        updatePayload.status = status;
      }

      await productRevRef.set(updatePayload, { merge: true });

      // Sync user review
      try {
        const userRevRef = db.collection('users').doc(userId).collection('reviews').doc(productId);
        const userRevSnap = await userRevRef.get();
        if (userRevSnap.exists) {
          await userRevRef.set(updatePayload, { merge: true });
        }
      } catch (uErr) {
        console.warn(`[Reviews] User review sync failed:`, uErr);
      }

      // Canonical rating recalculation
      const { newRating, newCount } = await recalculateProductRating(productId);

      res.json({
        success: true,
        productId,
        reviewId,
        newRating,
        newCount,
        message: 'Review successfully updated and rating synchronized.'
      });
    } catch (err: any) {
      console.error('[Reviews Update Error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to update review' });
    }
  });

  /**
   * DELETE /api/admin/reviews/:productId/:reviewId
   * Permanently deletes review and updates product's canonical rating
   */
  app.delete('/api/admin/reviews/:productId/:reviewId', async (req: Request, res: Response) => {
    try {
      const { productId, reviewId } = req.params;
      const db = getDb();

      const productRevRef = db.collection('products').doc(productId).collection('reviews').doc(reviewId);
      const productRevSnap = await productRevRef.get();
      
      let userId = reviewId;
      if (productRevSnap.exists) {
        userId = productRevSnap.data()?.userId || reviewId;
        await productRevRef.delete();
      }

      // Also delete from user reviews
      try {
        const userRevRef = db.collection('users').doc(userId).collection('reviews').doc(productId);
        const userRevSnap = await userRevRef.get();
        if (userRevSnap.exists) {
          await userRevRef.delete();
        }
      } catch (uErr) {
        console.warn(`[Reviews] Could not delete user review for ${userId}:`, uErr);
      }

      // Canonical rating recalculation
      const { newRating, newCount } = await recalculateProductRating(productId);

      res.json({
        success: true,
        productId,
        reviewId,
        newRating,
        newCount,
        message: `Review deleted. Product rating updated to ${newRating} (${newCount} reviews).`
      });
    } catch (err: any) {
      console.error('[Reviews Delete Error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to delete review' });
    }
  });
}
