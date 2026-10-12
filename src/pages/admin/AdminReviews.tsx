import React, { useState, useEffect, useMemo } from 'react';
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Edit3, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  ChevronRight, 
  ExternalLink, 
  Package, 
  User, 
  ShieldCheck, 
  ShoppingBag, 
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Clock,
  ArrowUpDown,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { AdminReviewItem } from '../../types';
import { ReviewDetailsModal } from './reviews/ReviewDetailsModal';
import { ReviewDeleteModal } from './reviews/ReviewDeleteModal';
import { ReviewEditModal } from './reviews/ReviewEditModal';

export interface AdminReviewsProps {
  onNavigateTab?: (tab: string, params?: any) => void;
}

export function AdminReviews({ onNavigateTab }: AdminReviewsProps) {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all'); // 'all' | '5' | '4' | '3' | '2' | '1'
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'last7' | 'last30'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_desc' | 'rating_asc'>('newest');

  // Modals state
  const [selectedReviewForDetails, setSelectedReviewForDetails] = useState<AdminReviewItem | null>(null);
  const [selectedReviewForDelete, setSelectedReviewForDelete] = useState<AdminReviewItem | null>(null);
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState<AdminReviewItem | null>(null);

  // Fetch reviews from backend
  const fetchReviews = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);

      const res = await fetch('/api/admin/reviews');
      const data = await res.json();

      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      } else {
        console.warn('Failed to load reviews data:', data);
      }
    } catch (err: any) {
      console.error('Error loading admin reviews:', err);
      showFeedback('error', 'Failed to load reviews from server.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Admin Actions
  const handleApprove = async (review: AdminReviewItem) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/reviews/${review.productId}/${review.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id && r.productId === review.productId
              ? { ...r, status: 'approved', updatedAt: new Date().toISOString() }
              : r
          )
        );
        if (selectedReviewForDetails && selectedReviewForDetails.id === review.id) {
          setSelectedReviewForDetails((prev) => prev ? { ...prev, status: 'approved' } : null);
        }
        showFeedback('success', `Review approved! Store rating updated to ${data.newRating} (${data.newCount} reviews).`);
      } else {
        showFeedback('error', data.error || 'Failed to approve review.');
      }
    } catch (err: any) {
      console.error('Approve review error:', err);
      showFeedback('error', err?.message || 'Error updating review status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (review: AdminReviewItem) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/reviews/${review.productId}/${review.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id && r.productId === review.productId
              ? { ...r, status: 'rejected', updatedAt: new Date().toISOString() }
              : r
          )
        );
        if (selectedReviewForDetails && selectedReviewForDetails.id === review.id) {
          setSelectedReviewForDetails((prev) => prev ? { ...prev, status: 'rejected' } : null);
        }
        showFeedback('success', `Review rejected and hidden from storefront. Product rating recalculated to ${data.newRating}.`);
      } else {
        showFeedback('error', data.error || 'Failed to reject review.');
      }
    } catch (err: any) {
      console.error('Reject review error:', err);
      showFeedback('error', err?.message || 'Error updating review status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async (review: AdminReviewItem) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/reviews/${review.productId}/${review.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => !(r.id === review.id && r.productId === review.productId)));
        setSelectedReviewForDelete(null);
        if (selectedReviewForDetails?.id === review.id) {
          setSelectedReviewForDetails(null);
        }
        showFeedback('success', `Review deleted permanently. Product rating updated to ${data.newRating} (${data.newCount} reviews).`);
      } else {
        showFeedback('error', data.error || 'Failed to delete review.');
      }
    } catch (err: any) {
      console.error('Delete review error:', err);
      showFeedback('error', err?.message || 'Error deleting review.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSave = async (updatedData: { rating: number; title: string; comment: string; status: 'approved' | 'rejected' | 'pending' }) => {
    if (!selectedReviewForEdit) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/reviews/${selectedReviewForEdit.productId}/${selectedReviewForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === selectedReviewForEdit.id && r.productId === selectedReviewForEdit.productId
              ? { ...r, ...updatedData, updatedAt: new Date().toISOString() }
              : r
          )
        );
        if (selectedReviewForDetails?.id === selectedReviewForEdit.id) {
          setSelectedReviewForDetails((prev) => prev ? { ...prev, ...updatedData } : null);
        }
        setSelectedReviewForEdit(null);
        showFeedback('success', `Review successfully updated! Canonical rating synchronized to ${data.newRating}.`);
      } else {
        showFeedback('error', data.error || 'Failed to save review changes.');
      }
    } catch (err: any) {
      console.error('Edit review error:', err);
      showFeedback('error', err?.message || 'Error saving review.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const rejected = reviews.filter((r) => r.status === 'rejected').length;

    const validApprovedRatings = reviews
      .filter((r) => r.status === 'approved')
      .map((r) => Number(r.rating) || 0)
      .filter((r) => r > 0);

    const avgRating = validApprovedRatings.length > 0
      ? (validApprovedRatings.reduce((a, b) => a + b, 0) / validApprovedRatings.length).toFixed(1)
      : '0.0';

    return { total, approved, pending, rejected, avgRating };
  }, [reviews]);

  // Filtering and Sorting
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // Status filter
      if (statusFilter !== 'all' && rev.status !== statusFilter) {
        return false;
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        const targetRating = Number(ratingFilter);
        if (Math.round(rev.rating) !== targetRating) return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const revTime = new Date(rev.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today' && now - revTime > oneDay) return false;
        if (dateFilter === 'last7' && now - revTime > 7 * oneDay) return false;
        if (dateFilter === 'last30' && now - revTime > 30 * oneDay) return false;
      }

      // Search query (product, customer name, email, review title, comment)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProduct = rev.productName.toLowerCase().includes(q) || rev.productId.toLowerCase().includes(q);
        const matchesCustomer = 
          rev.userName.toLowerCase().includes(q) || 
          (rev.userEmail && rev.userEmail.toLowerCase().includes(q)) ||
          rev.userId.toLowerCase().includes(q);
        const matchesContent = 
          (rev.title && rev.title.toLowerCase().includes(q)) || 
          (rev.comment && rev.comment.toLowerCase().includes(q));

        if (!matchesProduct && !matchesCustomer && !matchesContent) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'rating_desc') {
        return b.rating - a.rating;
      }
      if (sortBy === 'rating_asc') {
        return a.rating - b.rating;
      }
      return 0;
    });
  }, [reviews, statusFilter, ratingFilter, dateFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reviews & Ratings Management
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Moderate authentic customer reviews, verify purchase records, and keep store ratings synchronized.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchReviews(true)}
            disabled={isRefreshing || loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {feedbackMessage && (
        <div 
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedbackMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Reviews */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Total Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Star size={16} className="fill-blue-600 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-[11px] text-slate-500 font-medium">submitted</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Average Store Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={16} className="fill-amber-400 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.avgRating}</span>
            <span className="text-[11px] text-amber-600 font-bold">/ 5.0</span>
          </div>
        </div>

        {/* Approved Reviews */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Approved & Visible</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{metrics.approved}</span>
            <span className="text-[11px] text-slate-500 font-medium">live on store</span>
          </div>
        </div>

        {/* Pending & Rejected */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Needs Attention</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${metrics.pending > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {metrics.pending}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">pending • {metrics.rejected} rejected</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Reviews', count: metrics.total },
              { id: 'pending', label: 'Pending Moderation', count: metrics.pending },
              { id: 'approved', label: 'Approved', count: metrics.approved },
              { id: 'rejected', label: 'Rejected', count: metrics.rejected }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[38px] ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  statusFilter === tab.id 
                    ? 'bg-blue-700 text-white' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-800">{filteredReviews.length}</strong> of {reviews.length}
          </div>
        </div>

        {/* Search & Select Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Text Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, customer, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[38px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Rating Filter Dropdown */}
          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              aria-label="Filter by rating"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[38px] cursor-pointer appearance-none"
            >
              <option value="all">All Ratings (1 - 5 Stars)</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars only</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars only</option>
              <option value="3">⭐⭐⭐ 3 Stars only</option>
              <option value="2">⭐⭐ 2 Stars only</option>
              <option value="1">⭐ 1 Star only</option>
            </select>
            <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              aria-label="Filter by date range"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[38px] cursor-pointer appearance-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today only</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
            </select>
            <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort reviews by"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white min-h-[38px] cursor-pointer appearance-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="rating_desc">Sort: Highest Rating</option>
              <option value="rating_asc">Sort: Lowest Rating</option>
            </select>
            <ArrowUpDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Active Filter Clear Tag */}
        {(searchQuery || ratingFilter !== 'all' || dateFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400">Active filters:</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('all');
                setDateFilter('all');
                setStatusFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Reviews Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Loader2 size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-sm">Loading reviews from database...</p>
          <p className="text-slate-400 text-xs mt-1">Retrieving product reviews and verified purchase records.</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Star size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No reviews match your filters</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto mt-1 leading-relaxed">
            {reviews.length === 0 
              ? 'No customer reviews exist in the database yet. When customers submit reviews on the storefront, they will immediately appear here.'
              : 'Try adjusting your search criteria or resetting filters to see other reviews.'}
          </p>
          {reviews.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('all');
                setDateFilter('all');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Review ID</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Review Content</th>
                    <th className="py-3 px-4">Verified</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReviews.map((rev) => (
                    <tr 
                      key={`${rev.productId}_${rev.id}`} 
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReviewForDetails(rev)}
                    >
                      {/* Review ID */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {rev.id.length > 12 ? `${rev.id.substring(0, 10)}...` : rev.id}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {rev.productImage ? (
                              <img src={rev.productImage} alt={rev.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Package size={14} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p 
                              onClick={() => {
                                if (onNavigateTab) onNavigateTab('products', { productId: rev.productId });
                              }}
                              className="font-bold text-slate-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                              title={rev.productName}
                            >
                              {rev.productName}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {rev.productId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 max-w-[180px]" onClick={(e) => e.stopPropagation()}>
                        <div 
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab('customers', { customerId: rev.userId });
                          }}
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {(rev.userName || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{rev.userName}</p>
                            {rev.userEmail && (
                              <p className="text-[10px] text-slate-400 truncate">{rev.userEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                              />
                            ))}
                          </div>
                          <span className="font-black text-slate-800 text-[11px]">
                            {Number(rev.rating).toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* Review Content */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            {rev.title && (
                              <p className="font-bold text-slate-900 text-xs truncate mb-0.5">{rev.title}</p>
                            )}
                            <p className="text-slate-500 text-[11px] line-clamp-2">
                              {rev.comment || <span className="italic text-slate-400">Rating only</span>}
                            </p>
                          </div>
                          {rev.reviewImage && (
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0" title="Review photo attached">
                              <img src={rev.reviewImage} alt="Review" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Verified Purchase */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rev.verifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck size={11} className="text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          rev.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rev.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rev.status === 'approved' && <CheckCircle2 size={12} />}
                          {rev.status === 'rejected' && <XCircle size={12} />}
                          {rev.status === 'pending' && <AlertCircle size={12} />}
                          {rev.status.charAt(0).toUpperCase() + rev.status.slice(1)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {rev.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(rev)}
                              disabled={actionLoading}
                              title="Approve Review"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}

                          {rev.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(rev)}
                              disabled={actionLoading}
                              title="Reject Review"
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedReviewForDetails(rev)}
                            title="View Full Details"
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => setSelectedReviewForEdit(rev)}
                            title="Edit Review"
                            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => setSelectedReviewForDelete(rev)}
                            disabled={actionLoading}
                            title="Delete Review"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {filteredReviews.map((rev) => (
              <div
                key={`${rev.productId}_${rev.id}`}
                onClick={() => setSelectedReviewForDetails(rev)}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 cursor-pointer"
              >
                {/* Product & Status Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {rev.productImage ? (
                        <img src={rev.productImage} alt={rev.productName} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-slate-400 m-auto mt-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{rev.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {rev.productId}</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    rev.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : rev.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {rev.status.charAt(0).toUpperCase() + rev.status.slice(1)}
                  </span>
                </div>

                {/* Rating & Verified */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{Number(rev.rating).toFixed(1)}</span>
                  </div>

                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck size={11} />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Comment & Image */}
                <div>
                  {rev.title && <h4 className="font-bold text-slate-900 text-xs mb-0.5">{rev.title}</h4>}
                  <p className="text-slate-600 text-xs line-clamp-2">
                    {rev.comment || <span className="italic text-slate-400">Rating only</span>}
                  </p>
                </div>

                {rev.reviewImage && (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                    <img src={rev.reviewImage} alt="Review" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Customer & Date */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{rev.userName}</span>
                  </div>
                  <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Touch Actions */}
                <div 
                  className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(rev)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 min-h-[44px]"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve</span>
                    </button>
                  )}

                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleReject(rev)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 min-h-[44px]"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedReviewForDetails(rev)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors min-h-[44px]"
                  >
                    View
                  </button>

                  <button
                    onClick={() => setSelectedReviewForDelete(rev)}
                    disabled={actionLoading}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Review Details Modal */}
      {selectedReviewForDetails && (
        <ReviewDetailsModal
          review={selectedReviewForDetails}
          isOpen={Boolean(selectedReviewForDetails)}
          onClose={() => setSelectedReviewForDetails(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onOpenDelete={(r) => setSelectedReviewForDelete(r)}
          onOpenEdit={(r) => setSelectedReviewForEdit(r)}
          onNavigateProduct={(prodId) => {
            setSelectedReviewForDetails(null);
            if (onNavigateTab) onNavigateTab('products', { productId: prodId });
          }}
          onNavigateCustomer={(custId) => {
            setSelectedReviewForDetails(null);
            if (onNavigateTab) onNavigateTab('customers', { customerId: custId });
          }}
          isActionLoading={actionLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedReviewForDelete && (
        <ReviewDeleteModal
          review={selectedReviewForDelete}
          isOpen={Boolean(selectedReviewForDelete)}
          onClose={() => setSelectedReviewForDelete(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={actionLoading}
        />
      )}

      {/* Edit Review Modal */}
      {selectedReviewForEdit && (
        <ReviewEditModal
          review={selectedReviewForEdit}
          isOpen={Boolean(selectedReviewForEdit)}
          onClose={() => setSelectedReviewForEdit(null)}
          onSave={handleEditSave}
          isLoading={actionLoading}
        />
      )}

    </div>
  );
}
