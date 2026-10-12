const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');

// Add state for productReviews
content = content.replace(
  "  const [userExistingReview, setUserExistingReview] = useState<any>(null);",
  "  const [userExistingReview, setUserExistingReview] = useState<any>(null);\n  const [productReviews, setProductReviews] = useState<any[]>([]);"
);

// Add fetch logic for productReviews
const effectCode = `
  useEffect(() => {
    async function fetchProductReviews() {
      if (!id) return;
      try {
        const q = query(collection(db, 'products', id, 'reviews'));
        const snap = await getDocs(q);
        const revs: any[] = [];
        snap.forEach(d => {
          revs.push({ id: d.id, ...d.data() });
        });
        revs.sort((a, b) => {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
           return timeB - timeA;
        });
        setProductReviews(revs);
      } catch (err) {
        console.error('Error fetching product reviews:', err);
      }
    }
    fetchProductReviews();
  }, [id, isReviewModalOpen]);
`;

content = content.replace(
  "  // Synchronously reset selected image index whenever route ID changes before rendering",
  effectCode + "\n  // Synchronously reset selected image index whenever route ID changes before rendering"
);

// Display productReviews
const renderReviews = `
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 text-sm">Customer Reviews ({productReviews.length})</h3>
                {productReviews.length === 0 ? (
                  <p className="text-sm text-slate-500">No reviews yet. Be the first to review this product!</p>
                ) : (
                  <div className="space-y-4">
                    {productReviews.map(rev => (
                      <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {(rev.userName || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{rev.userName || 'Customer'}</p>
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} size={10} className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"} />
                                ))}
                              </div>
                            </div>
                          </div>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Verified Purchase</span>
                          )}
                        </div>
                        {rev.title && <h4 className="font-bold text-slate-900 text-sm mb-1">{rev.title}</h4>}
                        {rev.comment && <p className="text-sm text-slate-600">{rev.comment}</p>}
                        {rev.createdAt && (
                          <p className="text-[10px] text-slate-400 mt-2">
                            {new Date(rev.createdAt.toMillis ? rev.createdAt.toMillis() : rev.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
`;

content = content.replace(
  /              \{userExistingReview && \([\s\S]*?              \}\)/,
  renderReviews.trim()
);

fs.writeFileSync('src/pages/ProductDetails.tsx', content);
console.log('Patched ProductDetails.tsx to show all reviews');
