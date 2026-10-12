import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Edit, Trash2, Plus, X, Tag, Calendar, CheckCircle2, AlertCircle, 
  Search, Eye, EyeOff, Clock, Copy, Check, Percent, IndianRupee
} from 'lucide-react';

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate?: string;
  expiresAt?: string;
  usageLimit?: number;
  timesUsed?: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export function getCouponStatus(coupon: CouponItem): CouponStatus {
  if (coupon.isActive === false) return 'disabled';
  const now = new Date();
  if (coupon.startDate) {
    const start = new Date(coupon.startDate);
    if (!isNaN(start.getTime()) && start > now) {
      return 'scheduled';
    }
  }
  if (coupon.expiresAt) {
    const end = new Date(coupon.expiresAt);
    if (!isNaN(end.getTime()) && end < now) {
      return 'expired';
    }
  }
  if (coupon.usageLimit && (coupon.timesUsed || 0) >= coupon.usageLimit) {
    return 'expired';
  }
  return 'active';
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: '',
    expiresAt: '',
    usageLimit: 0,
    description: '',
    isActive: true
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, 'coupons')));
      const list: CouponItem[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CouponItem));
      
      // If Firestore is empty, seed standard starter coupons
      if (list.length === 0) {
        const defaults: CouponItem[] = [
          {
            id: 'WELCOME10',
            code: 'WELCOME10',
            discountType: 'percentage',
            discountValue: 10,
            minPurchase: 500,
            maxDiscount: 1000,
            description: '10% welcome discount on orders over ₹500',
            isActive: true,
            timesUsed: 12
          },
          {
            id: 'ELECTRO10',
            code: 'ELECTRO10',
            discountType: 'percentage',
            discountValue: 10,
            minPurchase: 0,
            maxDiscount: 500,
            description: 'Storewide 10% instant discount',
            isActive: true,
            timesUsed: 45
          },
          {
            id: 'SAVE20',
            code: 'SAVE20',
            discountType: 'percentage',
            discountValue: 20,
            minPurchase: 2000,
            maxDiscount: 2000,
            description: '20% off on bulk orders above ₹2,000',
            isActive: true,
            timesUsed: 8
          },
          {
            id: 'FESTIVE500',
            code: 'FESTIVE500',
            discountType: 'fixed',
            discountValue: 500,
            minPurchase: 3000,
            description: 'Flat ₹500 discount on cart total above ₹3,000',
            isActive: true,
            timesUsed: 23
          }
        ];
        
        for (const def of defaults) {
          await setDoc(doc(db, 'coupons', def.code), def);
        }
        setCoupons(defaults);
      } else {
        setCoupons(list);
      }
    } catch (error) {
      console.error("Error fetching coupons", error);
      showFeedback('error', 'Failed to load coupons from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenModal = (coupon?: CouponItem) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue || 0,
        minPurchase: coupon.minPurchase || 0,
        maxDiscount: coupon.maxDiscount || 0,
        startDate: coupon.startDate || '',
        expiresAt: coupon.expiresAt || '',
        usageLimit: coupon.usageLimit || 0,
        description: coupon.description || '',
        isActive: coupon.isActive !== false
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        maxDiscount: 0,
        startDate: '',
        expiresAt: '',
        usageLimit: 0,
        description: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      showFeedback('error', 'Coupon code cannot be empty.');
      return;
    }

    try {
      const data = {
        code: cleanCode,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        minPurchase: Number(formData.minPurchase) || 0,
        maxDiscount: Number(formData.maxDiscount) || 0,
        startDate: formData.startDate || null,
        expiresAt: formData.expiresAt || null,
        usageLimit: Number(formData.usageLimit) || null,
        description: formData.description.trim(),
        isActive: formData.isActive
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), data);
        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...data } as CouponItem : c));
        showFeedback('success', `Coupon ${cleanCode} updated successfully.`);
      } else {
        await setDoc(doc(db, 'coupons', cleanCode), {
          ...data,
          timesUsed: 0,
          createdAt: new Date().toISOString()
        });
        setCoupons(prev => [...prev, { id: cleanCode, ...data, timesUsed: 0 } as CouponItem]);
        showFeedback('success', `Coupon ${cleanCode} created successfully.`);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving coupon", error);
      showFeedback('error', 'Failed to save coupon code.');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(prev => prev.filter(c => c.id !== id));
      setDeleteConfirmId(null);
      showFeedback('success', `Coupon ${code} removed.`);
    } catch (error) {
      console.error("Error deleting coupon", error);
      showFeedback('error', 'Failed to delete coupon.');
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      const updatedStatus = !coupon.isActive;
      await updateDoc(doc(db, 'coupons', coupon.id), {
        isActive: updatedStatus
      });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: updatedStatus } : c));
      showFeedback('success', `Coupon ${coupon.code} is now ${updatedStatus ? 'Active' : 'Disabled'}.`);
    } catch (error) {
      console.error("Error toggling coupon status", error);
      showFeedback('error', 'Failed to toggle status.');
    }
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: coupons.length, active: 0, scheduled: 0, expired: 0 };
    coupons.forEach(c => {
      const status = getCouponStatus(c);
      if (status === 'active') counts.active++;
      else if (status === 'scheduled') counts.scheduled++;
      else if (status === 'expired') counts.expired++;
    });
    return counts;
  }, [coupons]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      // Status filter
      if (statusFilter !== 'all') {
        const status = getCouponStatus(coupon);
        if (statusFilter === 'active' && status !== 'active') return false;
        if (statusFilter === 'scheduled' && status !== 'scheduled') return false;
        if (statusFilter === 'expired' && status !== 'expired') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = coupon.code.toLowerCase().includes(q);
        const descMatch = coupon.description?.toLowerCase().includes(q);
        if (!codeMatch && !descMatch) return false;
      }

      return true;
    });
  }, [coupons, statusFilter, searchQuery]);

  return (
    <div className="space-y-6" id="admin-coupons-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="text-blue-600" size={22} /> Coupons & Discounts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure discount codes, percentage cuts, flat rate deductions, and cart spending limits.
          </p>
        </div>
        <button
          id="btn-create-coupon"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Create Coupon Code
        </button>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all shadow-xs ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              id="filter-all-coupons"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Coupons
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {statusCounts.all}
              </span>
            </button>

            <button
              id="filter-active-coupons"
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'active' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {statusCounts.active}
              </span>
            </button>

            <button
              id="filter-scheduled-coupons"
              onClick={() => setStatusFilter('scheduled')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Scheduled
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'scheduled' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {statusCounts.scheduled}
              </span>
            </button>

            <button
              id="filter-expired-coupons"
              onClick={() => setStatusFilter('expired')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'expired'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Expired
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'expired' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {statusCounts.expired}
              </span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">Coupon Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Usage</th>
                <th className="p-4">Validity</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No coupons match the selected filter or search query.'
                      : 'No coupon codes created yet. Click "Create Coupon Code" above to add one.'}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map(coupon => {
                  const status = getCouponStatus(coupon);

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Coupon Code */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(coupon.code)}
                            className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {coupon.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{coupon.description}</p>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="p-4">
                        {coupon.discountType === 'percentage' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-black">
                              <Percent size={12} /> {coupon.discountValue}% OFF
                            </span>
                            {coupon.maxDiscount ? (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Max cap: ₹{coupon.maxDiscount.toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-0.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-black">
                              ₹{coupon.discountValue} FLAT OFF
                            </span>
                          </div>
                        )}
                        {coupon.minPurchase ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Min spend: ₹{coupon.minPurchase.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">No min spend</div>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="p-4 text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {coupon.timesUsed || 0} used
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {coupon.usageLimit ? `Limit: ${coupon.usageLimit} uses` : 'Unlimited usage'}
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="p-4 text-slate-600">
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar size={12} className="text-slate-400 shrink-0" />
                            <span>Valid until {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px]">Never expires</span>
                        )}
                        {coupon.startDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Starts: {new Date(coupon.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Active
                          </span>
                        )}
                        {status === 'scheduled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                            <Clock size={11} /> Scheduled
                          </span>
                        )}
                        {status === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Expired
                          </span>
                        )}
                        {status === 'disabled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(coupon)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              coupon.isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            title={coupon.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                          >
                            {coupon.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenModal(coupon)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete with Confirm */}
                          {deleteConfirmId === coupon.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                              <button
                                onClick={() => handleDelete(coupon.id, coupon.code)}
                                className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 text-slate-600 text-[10px] hover:text-slate-900 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(coupon.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Tag className="text-blue-600" size={20} />
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FLASH30, FESTIVE500"
                  disabled={!!editingCoupon}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider uppercase focus:bg-white focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Cart Deduction (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimum Cart Spend (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minPurchase}
                    onChange={e => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                    placeholder="0 (No minimum)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {formData.discountType === 'percentage' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscount}
                      onChange={e => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                      placeholder="0 (No limit)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      placeholder="0 (Unlimited)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Public Customer Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 15% off all gaming accessories this weekend"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
                <span className="text-xs font-bold text-slate-700">
                  {formData.isActive ? 'Active and Redeemable at Checkout' : 'Disabled (Paused)'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
