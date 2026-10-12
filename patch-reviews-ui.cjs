const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetails.tsx', 'utf8');

const target = `          {activeTab === 'reviews' && productSettings.showReviews !== false && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
                <div className="text-center pr-6 border-r border-slate-200">
                  <div className="text-3xl font-black text-slate-900">{product.rating || 4.5}</div>
                  <div className="flex text-amber-400 justify-center my-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < Math.floor(product.rating || 4.5) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">{product.reviewsCount || 0} reviews</div>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">100% Verified Buyer Feedback</span>
                  <p className="text-slate-500 mt-0.5">Reviews are collected from verified customers who bought this item.</p>
                </div>
              </div>
            </div>
          )}`;

const replacement = `          {activeTab === 'reviews' && productSettings.showReviews !== false && (
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
            </div>
          )}`;

if (content.indexOf(target) !== -1) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/ProductDetails.tsx', content);
  console.log('Successfully applied reviews UI patch!');
} else {
  console.log('Target not found!');
}
