const fs = require('fs');
let content = fs.readFileSync('src/components/ProductReviewModal.tsx', 'utf8');

content = content.replace(
  "import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';",
  "import { doc, setDoc, serverTimestamp, updateDoc, increment, writeBatch } from 'firebase/firestore';"
);

// Replace the try block
const tryBlock = `    try {
      const batch = writeBatch(db);
      
      const userReviewRef = doc(db, 'users', userId, 'reviews', product.id);
      const productReviewRef = doc(db, 'products', product.id, 'reviews', userId);
      const productRef = doc(db, 'products', product.id);
      
      const reviewData = {
        userId,
        userName,
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || product.thumbnail || null,
        rating,
        title,
        comment,
        verifiedPurchase: true,
        createdAt: existingReview ? existingReview.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(userReviewRef, reviewData, { merge: true });
      batch.set(productReviewRef, reviewData, { merge: true });

      // Update product rating aggregate
      if (!existingReview) {
         // if new review, increment review count and update rating
         const oldTotal = (product.rating || 0) * (product.reviewsCount || 0);
         const newTotal = oldTotal + rating;
         const newCount = (product.reviewsCount || 0) + 1;
         const newRating = newTotal / newCount;
         
         batch.update(productRef, {
           reviewsCount: increment(1),
           rating: newRating
         });
      } else {
         // update existing review rating aggregate
         const oldTotal = (product.rating || 0) * (product.reviewsCount || 1);
         const newTotal = oldTotal - existingReview.rating + rating;
         const newRating = newTotal / (product.reviewsCount || 1);
         
         batch.update(productRef, {
           rating: newRating
         });
      }

      await batch.commit();

      onClose();`;

content = content.replace(
  /    try \{\s*const reviewRef = doc[\s\S]*?onClose\(\);\s*\}/,
  tryBlock
);

fs.writeFileSync('src/components/ProductReviewModal.tsx', content);
console.log('Patched ProductReviewModal to write to both places');
