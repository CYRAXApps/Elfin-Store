import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, getDocs, deleteDoc, doc, setDoc, updateDoc, addDoc } from 'firebase/firestore';
import { 
  Edit, Trash2, Plus, X, Image as ImageIcon, Calendar, CheckCircle2, 
  AlertCircle, Eye, EyeOff, Smartphone, Monitor, Search, Filter,
  Tag, Clock, LayoutGrid, List, Sparkles, ArrowUpRight, Check, AlertTriangle
} from 'lucide-react';

export interface PromotionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText?: string;
  link?: string;
  position: 'hero' | 'middle' | 'bottom' | 'strip' | 'popup';
  displayOrder?: number;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'disabled';

export function getPromotionStatus(item: PromotionItem): PromotionStatus {
  if (item.isActive === false) return 'disabled';
  const now = new Date();
  if (item.startDate) {
    const start = new Date(item.startDate);
    if (!isNaN(start.getTime()) && start > now) {
      return 'scheduled';
    }
  }
  if (item.endDate) {
    const end = new Date(item.endDate);
    if (!isNaN(end.getTime()) && end < now) {
      return 'expired';
    }
  }
  return 'active';
}

const TYPE_CONFIG: Record<PromotionItem['position'], { label: string; bg: string; text: string; icon: string }> = {
  hero: { label: 'Hero Carousel', bg: 'bg-blue-50', text: 'text-blue-700', icon: '🖼️' },
  middle: { label: 'Promotional Campaign', bg: 'bg-purple-50', text: 'text-purple-700', icon: '🎯' },
  strip: { label: 'Announcement Strip', bg: 'bg-amber-50', text: 'text-amber-700', icon: '📢' },
  popup: { label: 'Promotional Popup', bg: 'bg-rose-50', text: 'text-rose-700', icon: '✨' },
  bottom: { label: 'Category Banner', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🏷️' }
};

export function AdminPromotions() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Controls
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    buttonText: 'Shop Now',
    link: '/shop',
    position: 'hero' as PromotionItem['position'],
    displayOrder: 1,
    desktopVisible: true,
    mobileVisible: true,
    startDate: '',
    endDate: '',
    isActive: true
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, 'banners')));
      const list: PromotionItem[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionItem));
      
      if (list.length === 0) {
        const defaults: PromotionItem[] = [
          {
            id: 'promo-hero-1',
            title: 'Next-Gen Wireless Noise Cancelling Headphones',
            subtitle: 'PREMIUM SOUND COLLECTION',
            description: 'Experience pure acoustic perfection with 40-hour ultra battery life and active noise cancelling.',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80',
            buttonText: 'Explore Headphones',
            link: '/shop?category=audio',
            position: 'hero',
            displayOrder: 1,
            desktopVisible: true,
            mobileVisible: true,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'promo-middle-1',
            title: 'Festive Electronics Mega Sale',
            subtitle: 'LIMITED TIME DISCOUNTS',
            description: 'Flat 20% instant bank cashback on high-performance laptops and flagship smart accessories.',
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80',
            buttonText: 'Shop Festive Deals',
            link: '/shop?tag=deals',
            position: 'middle',
            displayOrder: 2,
            desktopVisible: true,
            mobileVisible: true,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 'promo-strip-1',
            title: 'Free Express Shipping Across India on Orders Above ₹999!',
            subtitle: 'DELIVERY PERK',
            description: 'No promo code required at checkout.',
            image: '',
            buttonText: 'Order Now',
            link: '/shop',
            position: 'strip',
            displayOrder: 1,
            desktopVisible: true,
            mobileVisible: true,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];

        for (const item of defaults) {
          await setDoc(doc(db, 'banners', item.id), item);
        }
        setPromotions(defaults);
      } else {
        list.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
        setPromotions(list);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
      showFeedback('error', 'Failed to load promotions from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleOpenModal = (promo?: PromotionItem) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        title: promo.title || '',
        subtitle: promo.subtitle || '',
        description: promo.description || '',
        image: promo.image || '',
        buttonText: promo.buttonText || 'Shop Now',
        link: promo.link || '/shop',
        position: promo.position || 'hero',
        displayOrder: promo.displayOrder || 1,
        desktopVisible: promo.desktopVisible ?? true,
        mobileVisible: promo.mobileVisible ?? true,
        startDate: promo.startDate || '',
        endDate: promo.endDate || '',
        isActive: promo.isActive ?? true
      });
    } else {
      setEditingPromo(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80',
        buttonText: 'Shop Now',
        link: '/shop',
        position: 'hero',
        displayOrder: promotions.length + 1,
        desktopVisible: true,
        mobileVisible: true,
        startDate: '',
        endDate: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromo(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showFeedback('error', 'Promotion title is required');
      return;
    }

    try {
      const data = {
        ...formData,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        buttonText: formData.buttonText.trim(),
        link: formData.link.trim(),
        displayOrder: Number(formData.displayOrder) || 1,
        updatedAt: new Date().toISOString()
      };

      if (editingPromo) {
        await updateDoc(doc(db, 'banners', editingPromo.id), data);
        setPromotions(prev => prev.map(item => item.id === editingPromo.id ? { ...item, ...data } : item));
        showFeedback('success', `Promotion "${data.title}" updated successfully.`);
      } else {
        const newDoc = await addDoc(collection(db, 'banners'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        setPromotions(prev => [...prev, { id: newDoc.id, ...data }]);
        showFeedback('success', `New promotion "${data.title}" created successfully.`);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving promotion:", error);
      showFeedback('error', 'Failed to save promotion. Please try again.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      setPromotions(prev => prev.filter(item => item.id !== id));
      setDeleteConfirmId(null);
      showFeedback('success', `Promotion "${title}" was deleted.`);
    } catch (error) {
      console.error("Error deleting promotion:", error);
      showFeedback('error', 'Failed to delete promotion.');
    }
  };

  const handleToggleActive = async (item: PromotionItem) => {
    try {
      const newStatus = !item.isActive;
      await updateDoc(doc(db, 'banners', item.id), {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });
      setPromotions(prev => prev.map(p => p.id === item.id ? { ...p, isActive: newStatus } : p));
      showFeedback('success', `Promotion "${item.title}" is now ${newStatus ? 'Active' : 'Disabled'}.`);
    } catch (error) {
      console.error("Error toggling promotion status:", error);
      showFeedback('error', 'Failed to update status.');
    }
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: promotions.length, active: 0, scheduled: 0, expired: 0 };
    promotions.forEach(p => {
      const status = getPromotionStatus(p);
      if (status === 'active') counts.active++;
      else if (status === 'scheduled') counts.scheduled++;
      else if (status === 'expired') counts.expired++;
    });
    return counts;
  }, [promotions]);

  // Filtered promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter(p => {
      // Status filter
      if (statusFilter !== 'all') {
        const status = getPromotionStatus(p);
        if (statusFilter === 'active' && status !== 'active') return false;
        if (statusFilter === 'scheduled' && status !== 'scheduled') return false;
        if (statusFilter === 'expired' && status !== 'expired') return false;
      }

      // Type filter
      if (typeFilter !== 'all' && p.position !== typeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = p.title?.toLowerCase().includes(q);
        const subMatch = p.subtitle?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const linkMatch = p.link?.toLowerCase().includes(q);
        if (!titleMatch && !subMatch && !descMatch && !linkMatch) return false;
      }

      return true;
    });
  }, [promotions, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6" id="admin-promotions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="text-blue-600" size={22} /> Promotions & Banners
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage high-impact hero slides, promotional campaigns, announcement strips, and popups from one central place.
          </p>
        </div>
        <button
          id="btn-create-promotion"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Create Promotion
        </button>
      </div>

      {/* Feedback Alert */}
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

      {/* Tabs / Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              id="filter-all-promotions"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Promotions
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {statusCounts.all}
              </span>
            </button>

            <button
              id="filter-active-promotions"
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
              id="filter-scheduled-promotions"
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
              id="filter-expired-promotions"
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

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* Search and Type Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search promotion name, tagline, or destination link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Promotion Types</option>
              <option value="hero">Hero Carousel</option>
              <option value="middle">Promotional Campaign</option>
              <option value="strip">Announcement Strip</option>
              <option value="popup">Promotional Popup</option>
              <option value="bottom">Category Banner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Promotions Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          Loading promotions...
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Tag size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No promotions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No promotions match the current filter or search criteria.'
              : 'You have not configured any promotions or banners yet.'}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={14} /> Add First Promotion
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Name & Visual</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPromotions.map((promo) => {
                  const status = getPromotionStatus(promo);
                  const typeInfo = TYPE_CONFIG[promo.position] || TYPE_CONFIG.hero;

                  return (
                    <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Visual */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {promo.image ? (
                            <img
                              src={promo.image}
                              alt={promo.title}
                              className="w-14 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0 font-bold text-xs">
                              {typeInfo.icon}
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            {promo.subtitle && (
                              <span className="text-[10px] font-black tracking-wide text-blue-600 uppercase block truncate">
                                {promo.subtitle}
                              </span>
                            )}
                            <h4 className="font-bold text-slate-900 truncate" title={promo.title}>
                              {promo.title}
                            </h4>
                            {promo.link && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                <ArrowUpRight size={11} /> {promo.link}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${typeInfo.bg} ${typeInfo.text}`}>
                          <span>{typeInfo.icon}</span>
                          {typeInfo.label}
                        </span>
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

                      {/* Start Date */}
                      <td className="p-4 text-slate-600">
                        {promo.startDate ? (
                          <span className="font-mono text-[11px]">
                            {new Date(promo.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Immediate</span>
                        )}
                      </td>

                      {/* End Date */}
                      <td className="p-4 text-slate-600">
                        {promo.endDate ? (
                          <span className="font-mono text-[11px]">
                            {new Date(promo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Expiration</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Enable/Disable toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(promo)}
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              promo.isActive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                            title={promo.isActive ? 'Disable Promotion' : 'Enable Promotion'}
                          >
                            {promo.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenModal(promo)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Promotion"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete button with safety confirm */}
                          {deleteConfirmId === promo.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                              <button
                                onClick={() => handleDelete(promo.id, promo.title)}
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
                              onClick={() => setDeleteConfirmId(promo.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Promotion"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPromotions.map((promo) => {
            const status = getPromotionStatus(promo);
            const typeInfo = TYPE_CONFIG[promo.position] || TYPE_CONFIG.hero;

            return (
              <div
                key={promo.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Card Visual Header */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    {promo.image ? (
                      <img
                        src={promo.image}
                        alt={promo.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-sm">
                        {typeInfo.icon} {typeInfo.label}
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${typeInfo.bg} ${typeInfo.text}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      {status === 'active' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          Active
                        </span>
                      )}
                      {status === 'scheduled' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                          Scheduled
                        </span>
                      )}
                      {status === 'expired' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-600 text-white shadow-xs">
                          Expired
                        </span>
                      )}
                      {status === 'disabled' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700 text-white shadow-xs">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    {promo.subtitle && (
                      <span className="text-[10px] font-black tracking-wide text-blue-600 uppercase">
                        {promo.subtitle}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {promo.title}
                    </h4>
                    {promo.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {promo.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Order: #{promo.displayOrder || 1}</span>
                      <span>{promo.buttonText || 'Shop Now'} →</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(promo)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      promo.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {promo.isActive ? 'Active' : 'Disabled'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(promo)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(promo.id, promo.title)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Notice Box */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Storefront Promotion Synchronization:</strong>
          <p className="text-blue-800/90 mt-0.5">
            Active promotions tagged as <em>Hero Carousel</em> automatically feed into your live homepage hero slider. 
            To change static section arrangements, deals layout, or category tiles, navigate to <strong>Website → Homepage</strong>.
          </p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Tag className="text-blue-600" size={20} />
                {editingPromo ? 'Edit Promotion' : 'Create New Promotion'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Promotion Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Next-Gen Flagship Earbuds with 40h Playtime"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tagline / Eyebrow Text
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="e.g. FESTIVE TECH SALE • UP TO 40% OFF"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Type / Position */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Promotion Type & Placement *
                  </label>
                  <select
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
                  >
                    <option value="hero">Hero Carousel Slider</option>
                    <option value="middle">Promotional Campaign Banner</option>
                    <option value="strip">Announcement Strip (Top bar)</option>
                    <option value="popup">Promotional Modal Popup</option>
                    <option value="bottom">Category Banner</option>
                  </select>
                </div>

                {/* Image URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Banner Visual Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                  {formData.image && (
                    <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Button Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={e => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="e.g. Shop Headphones"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Destination Link
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    placeholder="e.g. /shop?category=audio"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Offer Details / Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the offer or product features..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Priority / Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 pt-6">
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
                    {formData.isActive ? 'Active on Storefront' : 'Disabled (Draft)'}
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
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
                  {editingPromo ? 'Update Promotion' : 'Publish Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
