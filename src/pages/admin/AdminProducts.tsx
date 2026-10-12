import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc, serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { 
  Edit, Trash2, Plus, X, Search, Filter, Copy, Check, Eye, EyeOff, 
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ArrowUpDown, SlidersHorizontal,
  RotateCcw, Tag, Package, Layers, ExternalLink, Zap, Edit3, Minus, History, MoreVertical
} from 'lucide-react';
import { Product } from '../../types';
import { ProductFormModal } from './products/ProductFormModal';
import { QuickEditModal } from './products/QuickEditModal';
import { QuickStockModal } from './products/QuickStockModal';
import { StockHistoryModal } from './products/StockHistoryModal';
import { BulkActionsBar } from './products/BulkActionsBar';
import { 
  getCachedProducts, 
  getCachedCategories, 
  getCachedBrands, 
  subscribeProducts, 
  subscribeCategories, 
  subscribeBrands 
} from '../../services/catalogCache';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export interface AdminProductsProps {
  initialOpenAddModal?: boolean;
  onModalHandled?: () => void;
  forcedStoreId?: string;
}

export function AdminProducts({ initialOpenAddModal, onModalHandled, forcedStoreId }: AdminProductsProps = {}) {
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ELECTRO STORE';
  const [products, setProducts] = useState<Product[]>(getCachedProducts);
  const [loading, setLoading] = useState<boolean>(() => getCachedProducts().length === 0);
  const [storeFilter, setStoreFilter] = useState<string>(forcedStoreId || 'all');
  const [storesList, setStoresList] = useState<{ storeId: string; storeName: string }[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Actions dropdown open per product ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [publishFilter, setPublishFilter] = useState('all'); // all, published, draft
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price_asc, price_desc, stock_asc, stock_desc, bestselling

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  const [categoriesList, setCategoriesList] = useState<string[]>(() => 
    getCachedCategories().map(c => c.name.trim()).filter(Boolean)
  );
  const [brandsList, setBrandsList] = useState<string[]>(() => 
    getCachedBrands().map(b => b.name.trim()).filter(Boolean)
  );

  useEffect(() => {
    const unsubProd = subscribeProducts((prods, isLoaded) => {
      setProducts(prods);
      if (isLoaded) setLoading(false);
    });

    const unsubCat = subscribeCategories((cats) => {
      setCategoriesList(cats.map(c => c.name.trim()).filter(Boolean));
    });

    const unsubBrand = subscribeBrands((brs) => {
      setBrandsList(brs.map(b => b.name.trim()).filter(Boolean));
    });

    return () => {
      unsubProd();
      unsubCat();
      unsubBrand();
    };
  }, []);

  useEffect(() => {
    fetch('/api/admin/stores')
      .then(res => res.ok ? res.json() : { stores: [] })
      .then(data => {
        if (Array.isArray(data.stores)) {
          setStoresList(data.stores.map((s: any) => ({ storeId: s.storeId, storeName: s.storeName })));
        }
      })
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setProducts([...getCachedProducts()]);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle external trigger to open add modal
  useEffect(() => {
    if (initialOpenAddModal) {
      handleOpenAddModal();
      if (onModalHandled) {
        onModalHandled();
      }
    }
  }, [initialOpenAddModal]);

  // Extract unique categories & brands
  const categories = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map(p => p.category?.trim()).filter(Boolean))) as string[];
    const set = new Set([...categoriesList, ...fromProducts]);
    return Array.from(set).sort();
  }, [products, categoriesList]);

  const brands = useMemo(() => {
    const fromProducts = Array.from(new Set(products.map(p => p.brand?.trim()).filter(Boolean))) as string[];
    const set = new Set([...brandsList, ...fromProducts]);
    return Array.from(set).sort();
  }, [products, brandsList]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.slice();

    // 0. Store Filter (Strict isolation when forcedStoreId is present)
    const activeStore = forcedStoreId || storeFilter;
    if (activeStore && activeStore !== 'all') {
      result = result.filter(p => (p.storeId || 'main-store') === activeStore);
    }

    // 1. Unified Search: Name, SKU, ID, Barcode, Brand, Category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const skuMatch = p.sku?.toLowerCase().includes(q);
        const idMatch = p.id?.toLowerCase().includes(q);
        const barcodeMatch = (p as any).barcode?.toLowerCase().includes(q);
        const brandMatch = p.brand?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        return nameMatch || skuMatch || idMatch || barcodeMatch || brandMatch || catMatch;
      });
    }

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category?.trim() === categoryFilter);
    }

    // 3. Brand Filter
    if (brandFilter !== 'all') {
      result = result.filter(p => p.brand?.trim() === brandFilter);
    }

    // 4. Stock Filter (All, In Stock, Low Stock, Out of Stock)
    if (stockFilter === 'in_stock') {
      result = result.filter(p => (p.stock !== undefined ? p.stock > 0 : p.inStock));
    } else if (stockFilter === 'low_stock') {
      result = result.filter(p => {
        const s = p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0);
        const threshold = p.lowStockThreshold || 5;
        return s > 0 && s <= threshold;
      });
    } else if (stockFilter === 'out_of_stock') {
      result = result.filter(p => (p.stock !== undefined ? p.stock <= 0 : !p.inStock));
    }

    // 5. Published / Draft Filter
    if (publishFilter === 'published') {
      result = result.filter(p => (p as any).isPublished !== false && p.status !== 'draft');
    } else if (publishFilter === 'draft') {
      result = result.filter(p => (p as any).isPublished === false || p.status === 'draft');
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const tA = (a as any).createdAt?.seconds || 0;
        const tB = (b as any).createdAt?.seconds || 0;
        return tB - tA;
      }
      if (sortBy === 'oldest') {
        const tA = (a as any).createdAt?.seconds || 0;
        const tB = (b as any).createdAt?.seconds || 0;
        return tA - tB;
      }
      if (sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price_desc') {
        return b.price - a.price;
      }
      if (sortBy === 'stock_asc') {
        const sA = a.stock !== undefined ? a.stock : (a.inStock ? 10 : 0);
        const sB = b.stock !== undefined ? b.stock : (b.inStock ? 10 : 0);
        return sA - sB;
      }
      if (sortBy === 'stock_desc') {
        const sA = a.stock !== undefined ? a.stock : (a.inStock ? 10 : 0);
        const sB = b.stock !== undefined ? b.stock : (b.inStock ? 10 : 0);
        return sB - sA;
      }
      if (sortBy === 'bestselling') {
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      }
      return 0;
    });

    return result;
  }, [products, searchQuery, categoryFilter, brandFilter, stockFilter, publishFilter, sortBy]);

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id!)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Open Full Add Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  };

  // Open Full Edit Modal
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  };

  // Open Quick Stock Modal
  const handleOpenQuickStock = (product: Product) => {
    setQuickStockProduct(product);
    setIsQuickStockOpen(true);
  };

  // Open Movement History Modal
  const handleOpenHistoryModal = (product?: Product) => {
    setHistoryProduct(product || null);
    setIsHistoryModalOpen(true);
  };

  // Open Quick Edit Modal (Price, Stock, Category)
  const handleOpenQuickEdit = (product: Product) => {
    setQuickEditProduct(product);
    setIsQuickEditOpen(true);
  };

  // 1-Click Publish / Unpublish Toggle
  const handleTogglePublish = async (product: Product) => {
    if (!product.id) return;
    const currentPublish = (product as any).isPublished !== false && product.status !== 'draft';
    const nextPublish = !currentPublish;

    try {
      setUpdatingId(product.id);
      await updateDoc(doc(db, 'products', product.id), {
        isPublished: nextPublish,
        status: nextPublish ? 'published' : 'draft',
        updatedAt: serverTimestamp(),
      });
      showNotification(`"${product.name}" is now ${nextPublish ? 'Published live' : 'saved as Draft'}.`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to update publish state");
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick Stock Step (+1 or -1) with server sync
  const handleQuickStockStep = async (product: Product, step: number) => {
    if (!product.id) return;
    const current = product.stock !== undefined ? product.stock : (product.inStock ? 10 : 0);
    const nextStock = Math.max(0, current + step);

    try {
      setUpdatingId(product.id);
      await updateDoc(doc(db, 'products', product.id), {
        stock: nextStock,
        inStock: nextStock > 0,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Stock updated: ${nextStock} units for ${product.name}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to update stock");
    } finally {
      setUpdatingId(null);
    }
  };

  // Save product from full modal
  const handleSaveProductModal = async (productPayload: Partial<Product>, isPublish: boolean) => {
    if (editingProduct && editingProduct.id) {
      // Update existing
      await updateDoc(doc(db, 'products', editingProduct.id), {
        ...productPayload,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Product "${productPayload.name}" updated successfully!`);
    } else {
      // Create new
      await addDoc(collection(db, 'products'), {
        ...productPayload,
        rating: 5.0,
        reviewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showNotification(`Product "${productPayload.name}" created successfully!`);
    }
    fetchProducts();
  };

  // Save from quick edit modal
  const handleSaveQuickEdit = async (id: string, updates: Partial<Product>) => {
    const targetId = id || quickEditProduct?.id;
    if (!targetId) return;
    await updateDoc(doc(db, 'products', targetId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    showNotification(`Updated product details`);
    fetchProducts();
  };

  // Duplicate product
  const handleDuplicateProduct = async (product: Product) => {
    try {
      const duplicateData: any = {
        ...product,
        storeId: forcedStoreId || product.storeId || 'main-store',
        name: `${product.name} (Copy)`,
        sku: `${product.sku || 'SKU'}-COPY-${Math.floor(100 + Math.random() * 900)}`,
        isPublished: false,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      delete duplicateData.id;

      await addDoc(collection(db, 'products'), duplicateData);
      showNotification(`Created a draft copy of "${product.name}"`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to duplicate product");
    }
  };

  // Delete product
  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'products', product.id!));
        showNotification(`Deleted "${product.name}".`);
        fetchProducts();
      } catch (err) {
        console.error(err);
        showError("Failed to delete product");
      }
    }
  };

  // Bulk Actions
  const handleBulkPublish = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'products', id), {
          isPublished: true,
          status: 'published',
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showNotification(`Published ${selectedIds.size} products!`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to bulk publish products");
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'products', id), {
          isPublished: false,
          status: 'draft',
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showNotification(`Unpublished ${selectedIds.size} products (set to Draft).`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to bulk unpublish products");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'products', id));
      });
      await batch.commit();
      showNotification(`Deleted ${selectedIds.size} products.`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to bulk delete products");
    }
  };

  const handleBulkCategoryChange = async (newCategory: string) => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'products', id), {
          category: newCategory,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showNotification(`Updated category for ${selectedIds.size} products to "${newCategory}".`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to update categories");
    }
  };

  const handleBulkStockUpdate = async (stockQuantity: number) => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'products', id), {
          stock: stockQuantity,
          inStock: stockQuantity > 0,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showNotification(`Stock set to ${stockQuantity} for ${selectedIds.size} products.`);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      console.error(err);
      showError("Failed to update bulk stock");
    }
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || brandFilter !== 'all' || stockFilter !== 'all' || publishFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setBrandFilter('all');
    setStockFilter('all');
    setPublishFilter('all');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Package className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="font-bold text-sm text-slate-700">Loading products catalog...</p>
        <p className="text-xs text-slate-400 mt-1">Please wait a moment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      {/* Top Filter & Actions Bar: [ Search products ] [ Category ] [ Brand ] [ Stock ] [ Status ] [ Add Product ] */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, SKU, product ID, or barcode..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Store Filter */}
            {forcedStoreId ? (
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Tag size={13} className="text-blue-600" />
                <span>Store: <code className="font-mono text-blue-600">{forcedStoreId}</code></span>
              </div>
            ) : (
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="px-3 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="all">All Stores</option>
                <option value="main-store">{storeName} (Main Store)</option>
                {storesList.map(s => (
                  <option key={s.storeId} value={s.storeId}>{s.storeName} ({s.storeId})</option>
                ))}
              </select>
            )}

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Brand */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Brands</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Stock */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock (&gt;0)</option>
              <option value="low_stock">Low Stock (≤5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Status */}
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="published">Active (Live)</option>
              <option value="draft">Draft (Hidden)</option>
            </select>

            {/* Add Product Button */}
            <button 
              type="button"
              onClick={handleOpenAddModal} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Secondary Bar: Count, Sort, Clear & Global Movement Logs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of {products.length} products
            </span>
            {selectedIds.size > 0 && (
              <span className="font-bold text-blue-600">({selectedIds.size} selected)</span>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Movement History Button */}
            <button
              type="button"
              onClick={() => handleOpenHistoryModal()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Audit trail of stock changes"
            >
              <History size={14} className="text-slate-500" />
              <span>Movement History</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-bold outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="stock_asc">Stock: Low to High</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="bestselling">Best Selling</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* No Products Found State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No products match your filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing active filters, or create a new product.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP TABLE VIEW (Visible on md and up) */}
      {filteredProducts.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                      onChange={handleToggleSelectAll}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id!);
                  const isPublished = (product as any).isPublished !== false && product.status !== 'draft';
                  const currentStock = product.stock !== undefined ? product.stock : (product.inStock ? 10 : 0);
                  const threshold = product.lowStockThreshold || 5;
                  const isOutOfStock = currentStock <= 0;
                  const isLowStock = currentStock > 0 && currentStock <= threshold;
                  const isMenuOpen = activeMenuId === product.id;

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(product.id!)}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* Product Name, SKU & Image */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                              />
                            ) : (
                              <Package size={20} className="text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-slate-900 line-clamp-1">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {product.sku || `SKU-${product.id?.slice(0, 6)}`}
                              </span>
                              {product.brand && (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {product.brand}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Price & Discount */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{Number(product.originalPrice || 0).toLocaleString('en-IN')}
                            </span>
                            {product.discountPercentage > 0 && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                {product.discountPercentage}% OFF
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Stock with 1-Click Quick Edit button */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {isOutOfStock ? '0 (Out)' : `${currentStock}`}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenQuickStock(product)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            title="Adjust stock quantity & reason"
                          >
                            Edit
                          </button>

                          {/* Quick Stepper */}
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleQuickStockStep(product, -1)}
                              disabled={updatingId === product.id || currentStock <= 0}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              title="Decrease stock by 1"
                            >
                              <Minus size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStockStep(product, 1)}
                              disabled={updatingId === product.id}
                              className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                              title="Increase stock by 1"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Store Status Toggle */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(product)}
                          disabled={updatingId === product.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={isPublished ? "Click to set as Draft" : "Click to Publish live"}
                        >
                          {isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{isPublished ? 'Active' : 'Draft'}</span>
                        </button>
                      </td>

                      {/* Actions: Edit, Stock, More */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 relative">
                          {/* Full Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit Product"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          {/* Quick Stock button */}
                          <button
                            type="button"
                            onClick={() => handleOpenQuickStock(product)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Quick Stock Adjust"
                          >
                            <SlidersHorizontal size={14} />
                          </button>

                          {/* More Options Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : product.id!);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="More Actions"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {isMenuOpen && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleOpenHistoryModal(product);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <History size={14} className="text-blue-600" />
                                  <span>Movement History</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleOpenQuickEdit(product);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 size={14} className="text-slate-500" />
                                  <span>Quick Price/Category</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDuplicateProduct(product);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy size={14} className="text-slate-500" />
                                  <span>Duplicate Product</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleTogglePublish(product);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  {isPublished ? <EyeOff size={14} className="text-slate-500" /> : <Eye size={14} className="text-emerald-600" />}
                                  <span>{isPublished ? 'Set to Draft' : 'Publish Live'}</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDeleteProduct(product);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete Product</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOBILE & TABLET CARD VIEW (Visible on small screens) */}
      {filteredProducts.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.has(product.id!);
            const isPublished = (product as any).isPublished !== false && product.status !== 'draft';
            const currentStock = product.stock !== undefined ? product.stock : (product.inStock ? 10 : 0);
            const threshold = product.lowStockThreshold || 5;
            const isOutOfStock = currentStock <= 0;
            const isLowStock = currentStock > 0 && currentStock <= threshold;

            return (
              <div 
                key={product.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-2xs ${
                  isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelectOne(product.id!)}
                    className="mt-1 rounded text-blue-600 cursor-pointer"
                  />

                  {/* Thumbnail Image */}
                  <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt="" 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => e.currentTarget.style.display = 'none'} 
                      />
                    ) : (
                      <Package size={22} className="text-slate-300" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2">
                        {product.name}
                      </h4>
                      {/* Status Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(product)}
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isPublished
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                        <span>{isPublished ? 'Active' : 'Draft'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        {product.sku || `SKU-${product.id?.slice(0, 6)}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {product.category || 'General'}
                      </span>
                    </div>

                    {/* Price and Stock Row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-sm font-black text-slate-900">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[10px] text-slate-400 line-through ml-1.5">
                            ₹{Number(product.originalPrice || 0).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Stock Badge & Quick Edit */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStock(product)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock ? 'bg-rose-100 text-rose-700' : isLowStock ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${currentStock} in stock`}
                        </button>
                        <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleQuickStockStep(product, -1)}
                            disabled={currentStock <= 0}
                            className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20"
                          >
                            <Minus size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStockStep(product, 1)}
                            className="p-1 text-slate-500 hover:text-slate-900"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenHistoryModal(product)}
                        className="px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1"
                        title="Movement History"
                      >
                        <History size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickStock(product)}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1"
                      >
                        <SlidersHorizontal size={12} /> Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(product)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkPublish={handleBulkPublish}
        onBulkUnpublish={handleBulkUnpublish}
        onBulkDelete={handleBulkDelete}
        onBulkCategoryChange={handleBulkCategoryChange}
        onBulkStockUpdate={handleBulkStockUpdate}
        existingCategories={categories.length > 0 ? categories : ['Audio', 'Smartphones', 'Wearables', 'Laptops']}
      />

      {/* Unified Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProductModal}
        editingProduct={editingProduct}
        existingCategories={categories.length > 0 ? categories : ['Audio', 'Smartphones', 'Wearables', 'Laptops', 'Gaming', 'Accessories']}
        existingBrands={brands.length > 0 ? brands : ['Apple', 'Sony', 'Samsung', 'Bose', 'Dell', 'Logitech']}
        forcedStoreId={forcedStoreId}
        availableStores={storesList}
      />

      {/* Quick Stock Modal with Audit Reasons */}
      <QuickStockModal
        isOpen={isQuickStockOpen}
        product={quickStockProduct}
        onClose={() => setIsQuickStockOpen(false)}
        onSuccess={() => {
          fetchProducts();
          showNotification(`Stock updated successfully.`);
        }}
      />

      {/* Lightweight Quick Edit Modal (Price / Brand / Category) */}
      <QuickEditModal
        isOpen={isQuickEditOpen}
        onClose={() => setIsQuickEditOpen(false)}
        onSave={handleSaveQuickEdit}
        product={quickEditProduct}
        existingCategories={categories.length > 0 ? categories : ['Audio', 'Smartphones', 'Wearables', 'Laptops']}
        existingBrands={brands.length > 0 ? brands : ['Apple', 'Sony', 'Samsung', 'Bose']}
      />

      {/* Stock Movement History Modal */}
      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        product={historyProduct}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
}
