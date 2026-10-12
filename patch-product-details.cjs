const fs = require('fs');

let content = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { useProduct } from '../hooks/useProduct';",
  "import { useProduct } from '../hooks/useProduct';\nimport { useAuth } from '../context/AuthContext';\nimport { db } from '../firebase';\nimport { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';\nimport { ProductReviewModal } from '../components/ProductReviewModal';"
);

// 2. Add state inside ProductDetails
content = content.replace(
  "  const touchDetailsStartRef = useRef<{ x: number; y: number; time: number } | null>(null);",
  "  const touchDetailsStartRef = useRef<{ x: number; y: number; time: number } | null>(null);\n  const { user } = useAuth();\n  const [isEligibleToReview, setIsEligibleToReview] = useState(false);\n  const [userExistingReview, setUserExistingReview] = useState<any>(null);\n  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);\n"
);

// 3. Add effect
const effectCode = `
  useEffect(() => {
    async function checkReviewEligibility() {
      if (!user || !id) {
        setIsEligibleToReview(false);
        setUserExistingReview(null);
        return;
      }
      try {
        // Check existing review
        const reviewRef = doc(db, 'users', user.uid, 'reviews', id);
        const reviewSnap = await getDoc(reviewRef);
        if (reviewSnap.exists()) {
           setIsEligibleToReview(true);
           setUserExistingReview({ id: reviewSnap.id, ...reviewSnap.data() });
           return;
        }

        // Check if user has a delivered order with this product
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid), where('status', '==', 'delivered'));
        const orderSnaps = await getDocs(q);
        
        let eligible = false;
        for (const doc of orderSnaps.docs) {
          const order = doc.data();
          if (order.items && order.items.some((item: any) => item.productId === id)) {
            eligible = true;
            break;
          }
        }
        setIsEligibleToReview(eligible);
        setUserExistingReview(null);
      } catch (err) {
        console.error('Error checking review eligibility:', err);
      }
    }
    checkReviewEligibility();
  }, [user, id, isReviewModalOpen]);
`;
content = content.replace(
  "  // Synchronously reset selected image index whenever route ID changes before rendering",
  effectCode + "\n  // Synchronously reset selected image index whenever route ID changes before rendering"
);

// 4. Update render for "Reviews" tab
const reviewTabContent = `
          {activeTab === 'reviews' && productSettings.showReviews !== false && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl flex-wrap">
                <div className="text-center pr-6 border-r border-slate-200">
                  <div className="text-3xl font-black text-slate-900">{product.rating ? product.rating.toFixed(1) : 4.5}</div>
                  <div className="flex text-amber-400 justify-center my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < Math.floor(product.rating || 4.5) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{product.reviewsCount || 0} reviews</div>
                </div>
                <div className="text-xs text-slate-600 flex-1">
                  <span className="font-bold text-slate-800">100% Verified Buyer Feedback</span>
                  <p className="text-slate-500 mt-0.5">Reviews are collected from verified customers who bought this item.</p>
                </div>
                {isEligibleToReview && (
                   <div className="w-full sm:w-auto">
                     <button
                       onClick={() => setIsReviewModalOpen(true)}
                       className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                     >
                       {userExistingReview ? 'Edit Review' : 'Write Review'}
                     </button>
                   </div>
                )}
              </div>
              
              {userExistingReview && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="font-bold text-slate-900 mb-4 text-sm">Your Review</h3>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} className={star <= userExistingReview.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"} />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Verified Purchase</span>
                    </div>
                    {userExistingReview.title && <h4 className="font-bold text-slate-900 text-sm mb-1">{userExistingReview.title}</h4>}
                    {userExistingReview.comment && <p className="text-sm text-slate-600">{userExistingReview.comment}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
`;

content = content.replace(
  /          \{activeTab === 'reviews' && productSettings\.showReviews !== false && \([\s\S]*?          \}\)/,
  reviewTabContent.trim()
);

// 5. Render Modal
content = content.replace(
  "      {/* Full-Screen Interactive Lightbox Viewer */}",
  `      {product && user && (
        <ProductReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={product}
          userId={user.uid}
          userName={user.displayName || 'Customer'}
          existingReview={userExistingReview}
        />
      )}
      {/* Full-Screen Interactive Lightbox Viewer */}`
);

fs.writeFileSync('src/pages/ProductDetails.tsx', content);
console.log('Patched ProductDetails.tsx');
